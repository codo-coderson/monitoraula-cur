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
    const mainRef = ref(db);
    unsubscribe = onValue(mainRef, (snapshot) => {
      const data = snapshot.val() || {};
      cache.clases = data.clases || [];
      cache.alumnos = data.alumnos || {};
      cache.registros = data.registros || {};
      cache.loaded = true;
      if (onUpdate) onUpdate();
    });
  },

  unsubscribeAll() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
  },

  // Métodos para obtener datos de la caché
  getClases() {
    return cache.clases;
  },
  getAlumnosPorClase(clase) {
    return cache.alumnos[clase] || {};
  },
  getRegistrosWC(clase, alumnoId) {
    return (cache.registros[clase] && cache.registros[clase][alumnoId]) || {};
  },
  isLoaded() {
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
    await remove(ref(db));
  },
}; 