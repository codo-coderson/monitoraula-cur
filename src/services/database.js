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
let initialLoadPromise = null;

export const DatabaseService = {
  monitorConnection(onStatusChange) {
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => {
      const isConnected = snap.val() === true;
      console.log(`📡 Estado de conexión: ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
      if (onStatusChange) onStatusChange(isConnected);
    });
  },

  loadInitialData() {
    if (initialLoadPromise) return initialLoadPromise;

    initialLoadPromise = new Promise((resolve, reject) => {
      this.unsubscribeAll();
      console.log('🔍 DatabaseService: Iniciando carga inicial de datos...');

      const nodes = ['clases', 'alumnos', 'registros'];
      const initialLoads = nodes.map(node => new Promise((nodeResolve, nodeReject) => {
        const nodeRef = ref(db, `/${node}`);
        const unsubscribe = onValue(nodeRef, (snapshot) => {
          console.log(`🔍 DatabaseService: Datos recibidos para /${node}`);
          cache[node] = snapshot.val() || (node === 'clases' ? [] : {});
          nodeResolve();
        }, (error) => {
          console.error(`❌ DatabaseService: Error en /${node}:`, error);
          nodeReject(error);
        });
        unsubscribers.push(unsubscribe);
      }));

      Promise.all(initialLoads).then(() => {
        cache.loaded = true;
        console.log('✅ DatabaseService: Carga inicial de todos los nodos completada.');
        resolve();
      }).catch(error => {
        console.error('❌ DatabaseService: Falló una de las cargas iniciales.');
        reject(error);
      });
    });

    return initialLoadPromise;
  },

  subscribeToUpdates(onUpdate) {
    // This assumes loadInitialData has already been called and populated the unsubscribers array
    const nodes = ['clases', 'alumnos', 'registros'];
    nodes.forEach(node => {
      const nodeRef = ref(db, `/${node}`);
      const unsubscribe = onValue(nodeRef, (snapshot) => {
        console.log(`🔄 DatabaseService: Actualización recibida para /${node}`);
        cache[node] = snapshot.val() || (node === 'clases' ? [] : {});
        if (onUpdate) onUpdate();
      });
      unsubscribers.push(unsubscribe);
    });
  },

  unsubscribeAll() {
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];
    initialLoadPromise = null;
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
  },

  // Obtener estadísticas de actividad por usuario
  getUserActivityStats(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const stats = {};
    const allKnownUsers = new Set();

    // Recorrer toda la estructura de registros
    const registrosGlobales = cache.registros || {};

    // Primera pasada: Recolectar estadísticas y todos los usuarios conocidos
    Object.values(registrosGlobales).forEach(claseData => {
      Object.values(claseData || {}).forEach(alumnoData => {
        Object.entries(alumnoData || {}).forEach(([fechaStr, registro]) => {

          // Recolectar usuarios de este día (history check)
          (registro.salidas || []).forEach(salida => {
            if (salida.usuario) allKnownUsers.add(salida.usuario);
          });

          // Verificar si la fecha está en rango para el conteo
          const fecha = new Date(fechaStr);
          if (fecha >= start && fecha <= end) {
            (registro.salidas || []).forEach(salida => {
              const userEmail = salida.usuario;
              if (!userEmail) return;

              if (!stats[userEmail]) {
                stats[userEmail] = {
                  email: userEmail,
                  total: 0,
                  byDate: {}
                };
              }

              // Incrementar total
              stats[userEmail].total++;

              // Incrementar por día
              if (!stats[userEmail].byDate[fechaStr]) {
                stats[userEmail].byDate[fechaStr] = 0;
              }
              stats[userEmail].byDate[fechaStr]++;
            });
          }
        });
      });
    });

    // Segunda pasada: Asegurar que todos los usuarios conocidos estén en la lista
    allKnownUsers.forEach(email => {
      if (!stats[email]) {
        stats[email] = {
          email: email,
          total: 0,
          byDate: {}
        };
      }
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }
};