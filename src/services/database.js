import { ref, set, update, remove, onValue, get, query, orderByKey, startAt, endAt } from 'firebase/database';
import { db } from '../config/firebase';

// Constantes
const MAX_CLASES = 15;
const MAX_ALUMNOS_POR_CLASE = 40;
const DIAS_MANTENER_REGISTROS = 30;

// Caché global en RAM
const cache = {
  clases: [],
  alumnos: {},
  registros: {},
  loaded: false,
};

let unsubscribe = null;

export const DatabaseService = {
  // Suscripción global a toda la base de datos relevante
  subscribeAll(onUpdate) {
    if (unsubscribe) unsubscribe();
    console.log('🔍 DatabaseService: Iniciando suscripción global...');
    
    const mainRef = ref(db);
    unsubscribe = onValue(mainRef, (snapshot) => {
      console.log('🔍 DatabaseService: Datos recibidos de Firebase');
      const data = snapshot.val() || {};
      
      // Validar y limpiar datos
      cache.clases = this.validarClases(data.clases || []);
      cache.alumnos = this.validarAlumnos(data.alumnos || {});
      cache.registros = this.limpiarRegistrosAntiguos(data.registros || {});
      cache.loaded = true;
      
      console.log('🔍 DatabaseService: Caché actualizado:', {
        clases: cache.clases,
        numAlumnos: Object.keys(cache.alumnos).length,
        numRegistros: Object.keys(cache.registros).length,
        loaded: cache.loaded
      });
      
      if (onUpdate) onUpdate();
    }, (error) => {
      console.error('❌ DatabaseService: Error en suscripción:', error);
    });
  },

  // Validaciones
  validarClases(clases) {
    // Limitar número de clases y validar formato
    return clases
      .slice(0, MAX_CLASES)
      .filter(clase => /^\d°\s*(ESO|BACH)\s+[A-Z]$/i.test(clase));
  },

  validarAlumnos(alumnos) {
    const alumnosValidados = {};
    for (const [clase, alumnosClase] of Object.entries(alumnos)) {
      // Validar que la clase existe
      if (!cache.clases.includes(clase)) continue;
      
      // Limitar alumnos por clase
      const alumnosArray = Object.entries(alumnosClase)
        .slice(0, MAX_ALUMNOS_POR_CLASE)
        .map(([id, data]) => [id, { nombre: data.nombre || id }]);
      
      if (alumnosArray.length > 0) {
        alumnosValidados[clase] = Object.fromEntries(alumnosArray);
      }
    }
    return alumnosValidados;
  },

  limpiarRegistrosAntiguos(registros) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - DIAS_MANTENER_REGISTROS);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const registrosLimpios = {};
    for (const [clase, registrosClase] of Object.entries(registros)) {
      if (!cache.clases.includes(clase)) continue;
      
      registrosLimpios[clase] = {};
      for (const [alumno, registrosAlumno] of Object.entries(registrosClase)) {
        if (!cache.alumnos[clase]?.[alumno]) continue;
        
        const registrosFiltrados = Object.entries(registrosAlumno)
          .filter(([fecha]) => fecha >= fechaLimiteStr)
          .reduce((acc, [fecha, datos]) => {
            acc[fecha] = datos;
            return acc;
          }, {});
          
        if (Object.keys(registrosFiltrados).length > 0) {
          registrosLimpios[clase][alumno] = registrosFiltrados;
        }
      }
    }
    return registrosLimpios;
  },

  unsubscribeAll() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
  },

  // Métodos para obtener datos de la caché
  getClases() {
    console.log('🔍 DatabaseService.getClases() retornando:', cache.clases);
    return cache.clases;
  },
  getAlumnosPorClase(clase) {
    console.log('🔍 DatabaseService.getAlumnosPorClase():', clase, '→', cache.alumnos[clase] || {});
    return cache.alumnos[clase] || {};
  },
  getRegistrosWC(clase, alumnoId) {
    return (cache.registros[clase] && cache.registros[clase][alumnoId]) || {};
  },
  isLoaded() {
    console.log('🔍 DatabaseService.isLoaded():', cache.loaded);
    return cache.loaded;
  },

  // Nuevo método para verificar si realmente hay datos
  hasRealData() {
    const hasClases = cache.clases && cache.clases.length > 0;
    const hasAlumnos = cache.alumnos && Object.keys(cache.alumnos).length > 0;
    console.log('🔍 DatabaseService.hasRealData():', { 
      loaded: cache.loaded, 
      hasClases, 
      hasAlumnos,
      totalClases: cache.clases?.length || 0,
      totalAlumnos: Object.keys(cache.alumnos || {}).length
    });
    return cache.loaded && hasClases && hasAlumnos;
  },

  // Método para esperar hasta que haya datos reales
  waitForRealData(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkData = () => {
        const elapsed = Date.now() - startTime;
        console.log(`🔍 Esperando datos reales... ${elapsed}ms`);
        
        if (this.hasRealData()) {
          console.log('✅ Datos reales disponibles');
          return resolve();
        }
        
        if (elapsed >= timeoutMs) {
          console.warn('⚠️ Timeout esperando datos reales');
          return reject(new Error('Timeout esperando datos'));
        }
        
        setTimeout(checkData, 200);
      };
      
      checkData();
    });
  },

  // Escrituras con validación
  async setAlumno(clase, alumnoId, data) {
    await set(ref(db, `alumnos/${clase}/${alumnoId}`), data);
  },
  async setRegistroWC(clase, alumnoId, fecha, data) {
    // Validar fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error('Formato de fecha inválido');
    }
    
    // Validar que no es una fecha futura
    const fechaActual = new Date().toISOString().split('T')[0];
    if (fecha > fechaActual) {
      throw new Error('No se pueden registrar salidas futuras');
    }

    // Validar clase y alumno
    if (!cache.clases.includes(clase)) {
      throw new Error('Clase no válida');
    }
    if (!cache.alumnos[clase]?.[alumnoId]) {
      throw new Error('Alumno no válido');
    }

    await set(ref(db, `registros/${clase}/${alumnoId}/${fecha}`), {
      ...data,
      hora: data.hora || new Date().toLocaleTimeString(),
      timestamp: Date.now()
    });
  },
  async cargarAlumnosDesdeExcel(data) {
    const updates = {};
    const clases = new Set();

    // Validar datos antes de la carga
    for (const row of data) {
      const { Alumno: nombre, Curso: clase } = row;
      if (!nombre || !clase || !this.validarClases([clase]).length) continue;
      
      clases.add(clase);
      if (clases.size > MAX_CLASES) {
        throw new Error(`Máximo ${MAX_CLASES} clases permitidas`);
      }

      const alumnoId = nombre.replace(/\s+/g, '_').replace(/[,./\\(){}[\]]/g, '');
      const alumnosEnClase = Object.keys(updates).filter(key => 
        key.startsWith(`alumnos/${clase}/`)).length;
      
      if (alumnosEnClase >= MAX_ALUMNOS_POR_CLASE) {
        console.warn(`Clase ${clase} ha alcanzado el límite de ${MAX_ALUMNOS_POR_CLASE} alumnos`);
        continue;
      }

      updates[`alumnos/${clase}/${alumnoId}`] = { nombre };
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db), {
        'clases': Array.from(clases),
        ...updates
      });
    }
  },
  async borrarBaseDeDatos() {
    await remove(ref(db));
  },
}; 