import { ref, set, update, remove, onValue, get } from 'firebase/database';
import { db } from '../config/firebase';

// Caché global en RAM
const cache = {
  clases: [],
  alumnos: {},
  registros: {},
  loaded: false,
  currentMonth: null
};

let unsubscribe = null;
let unsubscribeRegistros = null;

export const DatabaseService = {
  // Suscripción global a toda la base de datos relevante
  subscribeAll(onUpdate) {
    if (unsubscribe) unsubscribe();
    if (unsubscribeRegistros) unsubscribeRegistros();
    
    console.log('🔍 DatabaseService: Iniciando suscripción global...');
    
    // Suscribirse a clases y alumnos (datos estáticos)
    const mainRef = ref(db, '/');
    unsubscribe = onValue(mainRef, (snapshot) => {
      console.log('🔍 DatabaseService: Datos recibidos de Firebase');
      const data = snapshot.val() || {};
      
      cache.clases = data.clases || [];
      cache.alumnos = data.alumnos || {};
      cache.loaded = true;
      
      console.log('🔍 DatabaseService: Caché actualizado:', {
        clases: cache.clases,
        numAlumnos: Object.keys(cache.alumnos).length,
        loaded: cache.loaded
      });
      
      // Suscribirse a los registros del mes actual
      this.subscribeToCurrentMonth();
      
      if (onUpdate) onUpdate();
    }, (error) => {
      console.error('❌ DatabaseService: Error en suscripción:', error);
    });
  },

  // Suscribirse solo a los registros del mes actual
  subscribeToCurrentMonth() {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    if (cache.currentMonth === monthKey) return;
    cache.currentMonth = monthKey;
    
    if (unsubscribeRegistros) unsubscribeRegistros();
    
    const registrosRef = ref(db, `registros/${monthKey}`);
    unsubscribeRegistros = onValue(registrosRef, (snapshot) => {
      const data = snapshot.val() || {};
      cache.registros[monthKey] = data;
      
      console.log('🔍 DatabaseService: Registros del mes actualizados:', {
        mes: monthKey,
        numRegistros: Object.keys(data).length
      });
    });
  },

  unsubscribeAll() {
    if (unsubscribe) unsubscribe();
    if (unsubscribeRegistros) unsubscribeRegistros();
    unsubscribe = null;
    unsubscribeRegistros = null;
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
    const monthKey = cache.currentMonth;
    return (cache.registros[monthKey]?.[clase]?.[alumnoId]) || {};
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

  // Validaciones
  validateRegistroWC(fecha, data) {
    // Validar formato de fecha
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      throw new Error('Fecha inválida');
    }

    // Validar que la fecha no sea futura
    if (fechaObj > new Date()) {
      throw new Error('No se pueden registrar salidas futuras');
    }

    // Validar datos requeridos
    if (!data.hora || !data.usuario) {
      throw new Error('Faltan datos requeridos (hora, usuario)');
    }

    // Validar formato de hora (HH:mm)
    if (!/^\d{2}:\d{2}$/.test(data.hora)) {
      throw new Error('Formato de hora inválido');
    }

    return {
      fecha: fecha,
      monthKey: `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}`,
      data: data
    };
  },

  // Escrituras optimizadas
  async setRegistroWC(clase, alumnoId, fecha, data) {
    try {
      // Validar datos
      const { monthKey, data: validatedData } = this.validateRegistroWC(fecha, data);

      // Verificar límites
      const registrosHoy = await get(ref(db, `registros/${monthKey}/${clase}/${alumnoId}`));
      const numRegistros = registrosHoy.exists() ? Object.keys(registrosHoy.val()).length : 0;
      
      if (numRegistros >= 10) {
        throw new Error('Se ha alcanzado el límite de registros diarios');
      }

      // Guardar registro
      await set(ref(db, `registros/${monthKey}/${clase}/${alumnoId}/${fecha}`), validatedData);

      console.log('✅ Registro guardado:', {
        clase,
        alumnoId,
        fecha,
        monthKey
      });
    } catch (error) {
      console.error('❌ Error al guardar registro:', error);
      throw error;
    }
  },
  async cargarAlumnosDesdeExcel(data) {
    try {
      const updates = {};
      const clases = new Set();
      
      // Validar límites
      if (data.length > 600) { // 15 clases * 40 alumnos
        throw new Error('Se ha excedido el límite de alumnos');
      }

      data.forEach(row => {
        const { Alumno: nombre, Curso: clase } = row;
        if (!nombre || !clase) return;
        
        // Validar formato de clase
        if (!/^\d°\s*(ESO|BACH)\s+[A-Z]$/i.test(clase)) {
          throw new Error(`Formato de clase inválido: ${clase}`);
        }
        
        clases.add(clase);
        
        // Validar límite de alumnos por clase
        const alumnosEnClase = Object.keys(cache.alumnos[clase] || {}).length;
        if (alumnosEnClase >= 40) {
          throw new Error(`La clase ${clase} ha alcanzado el límite de 40 alumnos`);
        }
        
        const alumnoId = nombre.replace(/\s+/g, '_').replace(/[,."']/g, '');
        updates[`alumnos/${clase}/${alumnoId}`] = { nombre };
      });

      // Validar límite de clases
      if (clases.size > 15) {
        throw new Error('Se ha excedido el límite de 15 clases');
      }

      await update(ref(db), {
        'clases': Array.from(clases),
        ...updates
      });

      console.log('✅ Alumnos cargados:', {
        numClases: clases.size,
        numAlumnos: Object.keys(updates).length
      });
    } catch (error) {
      console.error('❌ Error al cargar alumnos:', error);
      throw error;
    }
  },
  async borrarBaseDeDatos() {
    await remove(ref(db));
  },
}; 