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

  formatearFechaCorta(fecha) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dia = dias[fecha.getDay()];
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia} ${dd}/${mm}`;
  },

  getFechaHoy() {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
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
    const fechas = Object.keys(registros).sort();
    if (fechas.length === 0) return 0;

    // Tomar solo los últimos 30 días con registros
    const ultimasFechas = fechas.slice(-30);
    const totalSalidas = ultimasFechas.reduce((total, fecha) => {
      return total + (registros[fecha]?.salidas?.length || 0);
    }, 0);

    return totalSalidas / ultimasFechas.length;
  },

  addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  formatDateHeader(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const diaSemana = dias[date.getDay()];
    const diaMes = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();

    return `${diaSemana}, ${diaMes} de ${mes} de ${anio}`;
  }
}; 