import { ref, set, update, remove, onValue, get } from 'firebase/database';
import { db } from '../config/firebase';

// Caché global en RAM
const cache = {
  clases: [],
  alumnos: {},
  registros: {},
  loaded: false,
};

let unsubscribers = [];

export const DatabaseService = {
  // Suscripción global a toda la base de datos relevante
  subscribeAll(onUpdate, onInitialLoad) {
    this.unsubscribeAll();
    console.log('🔍 DatabaseService: Iniciando suscripciones optimizadas...');
    
    const nodes = ['clases', 'alumnos', 'registros'];
    const initialLoads = nodes.map(node => new Promise(resolve => {
      const nodeRef = ref(db, `/${node}`);
      const unsubscribe = onValue(nodeRef, (snapshot) => {
        console.log(`🔍 DatabaseService: Datos recibidos para /${node}`);
        cache[node] = snapshot.val() || (node === 'clases' ? [] : {});
        if(onUpdate) onUpdate();
        resolve();
      }, (error) => {
        console.error(`❌ DatabaseService: Error en /${node}:`, error);
        resolve(); // Resolve anyway to not block the app
      });
      unsubscribers.push(unsubscribe);
    }));

    Promise.all(initialLoads).then(() => {
      const firstLoad = !cache.loaded;
      cache.loaded = true;
      if (firstLoad && onInitialLoad) {
        console.log('✅ DatabaseService: Carga inicial de todos los nodos completada.');
        onInitialLoad();
      }
    });
  },

  unsubscribeAll() {
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];
    // Reset cache state
    Object.assign(cache, {
      clases: [],
      alumnos: {},
      registros: {},
      loaded: false,
    });
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
    const updates = {};
    updates['/alumnos'] = null;
    updates['/clases'] = null;
    updates['/registros'] = null;
    await update(ref(db), updates);
  },

  // Obtener todos los días lectivos (días con al menos una salida en cualquier clase)
  getDiasLectivos() {
    const diasLectivos = new Set();
    
    // Recorrer todas las clases y alumnos
    Object.values(cache.registros || {}).forEach(clase => {
      Object.values(clase || {}).forEach(alumno => {
        Object.entries(alumno || {}).forEach(([fecha, registro]) => {
          if (registro?.salidas?.length > 0) {
            diasLectivos.add(fecha);
          }
        });
      });
    });

    // Convertir a array y ordenar
    return Array.from(diasLectivos).sort();
  },

  // Obtener los últimos N días lectivos
  getUltimosNDiasLectivos(n = 30) {
    const diasLectivos = this.getDiasLectivos();
    return diasLectivos.slice(-n);
  },

  // Obtener registros de un alumno para días específicos
  getRegistrosAlumnoPorDias(clase, alumnoId, dias) {
    const registrosAlumno = cache.registros[clase]?.[alumnoId] || {};
    return dias.map(fecha => ({
      fecha,
      salidas: (registrosAlumno[fecha]?.salidas || []).length
    }));
  },

  // Calcular media considerando todos los días lectivos
  calcularMediaSalidasAlumno(clase, alumnoId) {
    const diasLectivos = this.getUltimosNDiasLectivos();
    if (diasLectivos.length === 0) return 0;

    const registrosAlumno = cache.registros[clase]?.[alumnoId] || {};
    const totalSalidas = diasLectivos.reduce((total, fecha) => {
      return total + (registrosAlumno[fecha]?.salidas?.length || 0);
    }, 0);

    return totalSalidas / diasLectivos.length;
  }
}; 