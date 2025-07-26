import { DatabaseService } from '../services/database.js';
import { AlumnoCard } from '../components/AlumnoCard.js';

export class ClaseView {
  constructor(container) {
    this.container = container;
    this.alumnoCards = new Map();
  }

  async render(clase) {
    try {
      console.log('🔄 Renderizando vista de clase:', clase);
      
      // Contenedor principal
      this.container.innerHTML = `
        <div style="
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
        ">
          <div id="alumnos-container"></div>
        </div>
      `;

      // Usar la caché global
      const alumnos = DatabaseService.getAlumnosPorClase(clase);
      const alumnosContainer = document.getElementById('alumnos-container');
      
      if (!Object.keys(alumnos).length) {
        alumnosContainer.innerHTML = `
          <div style="
            text-align: center;
            padding: 2rem;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">
            <p style="margin: 0; color: #666;">No hay alumnos en esta clase.</p>
            <button 
              id="btnCarga"
              style="
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: #0044cc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              "
            >
              Cargar Alumnos
            </button>
          </div>
        `;

        document.getElementById('btnCarga').onclick = () => {
          window.dispatchEvent(new CustomEvent('navegacion', { 
            detail: { vista: 'carga' } 
          }));
        };
        return;
      }
      
      for (const [alumnoId, data] of Object.entries(alumnos)) {
        const cardContainer = document.createElement('div');
        alumnosContainer.appendChild(cardContainer);
        
        const card = new AlumnoCard(cardContainer, clase, alumnoId, data.nombre);
        await card.render();
        this.alumnoCards.set(alumnoId, card);
      }

      console.log('✅ Vista de clase renderizada');
    } catch (error) {
      console.error('❌ Error al renderizar vista de clase:', error);
      this.mostrarError('Error al cargar la clase');
    }
  }

  limpiarCards() {
    for (const card of this.alumnoCards.values()) {
      card.destruir();
    }
    this.alumnoCards.clear();
  }

  mostrarError(mensaje) {
    this.container.innerHTML = `
      <div style="
        max-width: 600px;
        margin: 2rem auto;
        padding: 1rem;
        background: #fff;
        border: 1px solid #dc3545;
        border-radius: 8px;
        color: #dc3545;
        text-align: center;
      ">
        <h2 style="margin: 0 0 1rem 0;">⚠️ Error</h2>
        <p style="margin: 0;">${mensaje}</p>
      </div>
    `;
  }
} 