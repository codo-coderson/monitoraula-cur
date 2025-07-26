import { DateUtils } from '../utils/date.js';
import { DatabaseService } from '../services/database.js';

export class InformeView {
  constructor(container) {
    this.container = container;
  }

  async render(clase, alumnoId) {
    const alumno = DatabaseService.getAlumnosPorClase(clase)[alumnoId];
    const diasLectivos = DatabaseService.getUltimosNDiasLectivos();
    const registros = DatabaseService.getRegistrosAlumnoPorDias(clase, alumnoId, diasLectivos);

    this.container.innerHTML = `
      <div style="
        max-width: 100%;
        margin: 0 auto;
        padding: 1rem;
        position: relative;
      ">
        <h2 style="
          margin: 0 0 1.5rem 0;
          font-size: var(--font-size-lg);
          color: var(--gray-800);
          font-weight: 600;
        ">Informe de ${alumno.nombre}</h2>
        
        <div id="grafico-container" style="
          width: 100%;
          margin-bottom: 2rem;
        ">
          ${this.generarGrafico(registros)}
        </div>

        <!-- Espacio para el botón flotante -->
        <div style="height: calc(var(--alumno-card-height, 120px));"></div>

        <!-- Botón Volver -->
        <button
          onclick="window.dispatchEvent(new CustomEvent('navegacion', {detail: {vista: 'clase', params: {clase: '${clase}'}}}))"
          style="
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            padding: 0.75rem 1.25rem;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: var(--font-size-base);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 1000;
          "
        >
          <span>🔙</span> Volver
        </button>
      </div>
    `;
  }

  generarGrafico(registros) {
    const maxSalidas = Math.max(...registros.map(d => d.salidas), 5); // Mínimo 5 para escala
    const barWidth = '90%'; // Ancho de las barras
    const colors = ['#e3f2fd', '#bbdefb']; // Colores alternos suaves

    return `
      <div style="
        width: 100%;
        font-size: var(--font-size-sm);
      ">
        ${registros.map((dia, index) => {
          const porcentaje = (dia.salidas / maxSalidas) * 100;
          const fecha = new Date(dia.fecha);
          const fechaFormateada = DateUtils.formatearFechaCorta(fecha);
          
          return `
            <div style="
              display: flex;
              align-items: center;
              margin-bottom: 0.5rem;
              gap: 1rem;
            ">
              <div style="
                width: 5rem;
                text-align: right;
                color: var(--gray-600);
                flex-shrink: 0;
              ">${fechaFormateada}</div>
              
              <div style="
                flex-grow: 1;
                height: 1.5rem;
                display: flex;
                align-items: center;
              ">
                ${dia.salidas > 0 ? `
                  <div style="
                    width: ${porcentaje}%;
                    max-width: ${barWidth};
                    height: 1.5rem;
                    background: ${colors[index % 2]};
                    border: 1px solid ${colors[1]};
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                    padding: 0 0.5rem;
                    transition: all 0.2s;
                  ">
                    ${dia.salidas}
                  </div>
                ` : '0'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
} 