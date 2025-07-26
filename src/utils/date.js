import { DatabaseService } from '../services/database.js';

export const DateUtils = {
  getFechaHoy() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy.toISOString().split('T')[0];
  },

  formatearFecha(fecha) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dia = dias[fecha.getDay()];
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const yy = String(fecha.getFullYear()).slice(-2);
    return `${dia} ${dd}/${mm}/${yy}`;
  },

  formatearHora(date = new Date()) {
    const pad = n => (n < 10 ? '0' + n : n);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  },

  /**
   * Calcula la media de salidas de un alumno SOLO sobre los días en los que hubo al menos una salida en toda la BD
   * @param {object} registrosAlumno - Registros del alumno (por fecha)
   * @returns {number}
   */
  calcularMediaSalidas(registrosAlumno) {
    // Obtener todos los registros de todas las clases y alumnos
    const registrosGlobal = DatabaseService ? DatabaseService : null;
    if (!registrosGlobal || !DatabaseService.isLoaded()) return 0;
    const registrosBD = DatabaseService.getClases().flatMap(clase => {
      const alumnos = DatabaseService.getAlumnosPorClase(clase);
      return Object.keys(alumnos).map(alumnoId => DatabaseService.getRegistrosWC(clase, alumnoId));
    });
    // Set de fechas con al menos una salida en toda la BD
    const diasLectivos = new Set();
    registrosBD.forEach(registros => {
      Object.entries(registros).forEach(([fecha, reg]) => {
        if (reg.salidas && reg.salidas.length > 0) {
          diasLectivos.add(fecha);
        }
      });
    });
    if (diasLectivos.size === 0) return 0;
    // Calcular total de salidas del alumno
    let totalSalidas = 0;
    Object.entries(registrosAlumno).forEach(([fecha, reg]) => {
      if (diasLectivos.has(fecha)) {
        totalSalidas += (reg.salidas?.length || 0);
      }
    });
    // Media = total salidas / días lectivos
    return totalSalidas / diasLectivos.size;
  }
}; 