import { DatabaseService } from '../services/database.js';

export const DateUtils = {
  formatearFecha(fecha) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dia = dias[fecha.getDay()];
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const yy = String(fecha.getFullYear()).slice(-2);
    return `${dia} ${dd}/${mm}/${yy}`;
  },

  getDiaSemanaCorto(fecha) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[fecha.getDay()];
  },

  getFechaHoy() {
    const fecha = new Date();
    return fecha.toISOString().split('T')[0];
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
  calcularMediaSalidas(registros) {
    const fechas = Object.keys(registros);
    if (fechas.length === 0) return 0;

    const totalSalidas = fechas.reduce((total, fecha) => {
      return total + (registros[fecha].salidas?.length || 0);
    }, 0);

    return totalSalidas / fechas.length;
  }
}; 