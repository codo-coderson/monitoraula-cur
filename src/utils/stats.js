import { DateUtils } from './date.js';

export const StatsUtils = {
  procesarDatosGrafico(registros) {
    // Obtener todas las fechas con registros
    const fechas = Object.keys(registros)
      .sort()
      .reverse()
      .slice(0, 30); // Últimos 30 días

    // Procesar datos para cada fecha
    return fechas.map(fecha => {
      const registro = registros[fecha] || { salidas: [] };
      const numSalidas = registro.salidas?.length || 0;
      const fechaObj = new Date(fecha);
      const fechaFormateada = `${DateUtils.getDiaSemanaCorto(fechaObj)} ${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;

      return {
        fecha: fechaFormateada,
        numSalidas,
        fechaOriginal: fecha
      };
    });
  }
}; 