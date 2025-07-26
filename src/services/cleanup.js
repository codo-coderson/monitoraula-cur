import { ref, get, remove, query, orderByKey } from 'firebase/database';
import { db } from '../config/firebase.js';

const DIAS_A_MANTENER = 40;

export const CleanupService = {
  async limpiarRegistrosAntiguos() {
    try {
      console.log('🧹 Iniciando limpieza de registros antiguos...');
      
      // Obtener todos los registros
      const registrosRef = ref(db, 'registros');
      const snapshot = await get(registrosRef);
      const registros = snapshot.val() || {};

      // Obtener fechas únicas de todos los registros
      const fechasUnicas = new Set();
      Object.values(registros).forEach(clase => {
        Object.values(clase).forEach(alumno => {
          Object.keys(alumno).forEach(fecha => fechasUnicas.add(fecha));
        });
      });

      // Ordenar fechas de más reciente a más antigua
      const fechasOrdenadas = Array.from(fechasUnicas).sort().reverse();

      // Encontrar la fecha límite (mantener solo los últimos 40 días con registros)
      const fechaLimite = fechasOrdenadas[DIAS_A_MANTENER - 1] || '';

      if (!fechaLimite) {
        console.log('✅ No hay suficientes días para limpiar');
        return;
      }

      console.log('🔍 Limpieza:', {
        totalDias: fechasOrdenadas.length,
        diasAMantener: DIAS_A_MANTENER,
        fechaLimite: fechaLimite
      });

      // Eliminar registros anteriores a la fecha límite
      for (const [clase, alumnosClase] of Object.entries(registros)) {
        for (const [alumno, registrosAlumno] of Object.entries(alumnosClase)) {
          for (const fecha of Object.keys(registrosAlumno)) {
            if (fecha < fechaLimite) {
              await remove(ref(db, `registros/${clase}/${alumno}/${fecha}`));
              console.log(`🗑️ Eliminado registro: ${clase}/${alumno}/${fecha}`);
            }
          }
        }
      }

      console.log('✅ Limpieza completada');
    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
    }
  }
}; 