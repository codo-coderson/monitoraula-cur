import { DatabaseService } from '../services/database.js';
import { StatsUtils } from '../utils/stats.js';

export class InformeAlumnoView {
  constructor(container) {
    this.container = container;
  }

  async render(clase, alumnoId, nombre) {
    const registros = DatabaseService.getRegistrosWC(clase, alumnoId);
    const datos = StatsUtils.procesarDatosGrafico(registros);
    const maxSalidas = Math.max(...datos.map(d => d.numSalidas), 6); // Mínimo 6 para escala

    this.container.innerHTML = `
      <div style="
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
        position: relative;
      ">
        <h2 style="
          margin: 0 0 0.5rem 0;
          font-size: var(--font-size-lg);
          color: var(--gray-800);
        ">${nombre}</h2>
        <p style="
          margin: 0 0 2rem 0;
          color: var(--gray-600);
          font-size: var(--font-size-base);
        ">${clase}</p>

        <div style="
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 1.5rem;
          margin-bottom: 3rem;
        ">
          ${datos.map((dato, index) => `
            <div style="
              display: flex;
              align-items: center;
              gap: 1rem;
              margin-bottom: 0.75rem;
              height: 24px;
            ">
              <div style="
                width: 80px;
                font-size: var(--font-size-sm);
                color: var(--gray-600);
                flex-shrink: 0;
              ">${dato.fecha}</div>
              <div style="
                flex-grow: 1;
                height: 16px;
                display: flex;
                align-items: center;
              ">
                ${dato.numSalidas > 0 ? `
                  <div style="
                    width: ${(dato.numSalidas / maxSalidas) * 100}%;
                    height: 12px;
                    background: ${index % 2 === 0 ? '#e3f2fd' : '#bbdefb'};
                    border-radius: 6px;
                    position: relative;
                    transition: all 0.2s;
                  ">
                    <span style="
                      position: absolute;
                      left: 8px;
                      top: 50%;
                      transform: translateY(-50%);
                      font-size: var(--font-size-sm);
                      color: var(--gray-700);
                    ">${dato.numSalidas}</span>
                  </div>
                ` : `
                  <span style="
                    font-size: var(--font-size-sm);
                    color: var(--gray-500);
                  ">0</span>
                `}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Espacio para el botón flotante -->
        <div style="height: 100px;"></div>

        <!-- Botón flotante de volver -->
        <button
          onclick="window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'clase', params: { clase: '${clase}' } } }))"
          style="
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-lg);
            z-index: 1000;
          "
          title="Volver a la clase"
        >←</button>
      </div>
    `;
  }
} 