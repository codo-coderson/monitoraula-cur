import { ref, set, update, remove, onValue, get } from 'firebase/database';
import { db } from '../config/firebase';

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
      console.log('🔍 DatabaseService: Datos completos:', data);
      
      cache.clases = data.clases || [];
      cache.alumnos = data.alumnos || {};
      cache.registros = data.registros || {};
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

  // Escrituras
  async setAlumno(clase, alumnoId, data) {
    await set(ref(db, `alumnos/${clase}/${alumnoId}`), data);
  },
  async setRegistroWC(clase, alumnoId, fecha, data) {
    await set(ref(db, `registros/${clase}/${alumnoId}/${fecha}`), data);
  },
  async cargarAlumnosDesdeExcel(data) {
    const updates = {};
    const clases = new Set();
    data.forEach(row => {
      const { Alumno: nombre, Curso: clase } = row;
      if (!nombre || !clase) return;
      clases.add(clase);
      const alumnoId = nombre.replace(/\s+/g, '_').replace(/,/g, '');
      updates[`alumnos/${clase}/${alumnoId}`] = { nombre };
    });
    await update(ref(db), {
      'clases': Array.from(clases),
      ...updates
    });
  },
  async borrarBaseDeDatos() {
    await remove(ref(db));
  },
}; 