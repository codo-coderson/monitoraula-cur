import { AlumnoCard } from '../components/AlumnoCard.js';
import { DatabaseService } from '../services/database.js';
import { AuthService } from '../services/auth.js';
import { RolesService } from '../services/roles.js';
import { FontSizeService } from '../utils/fontsize.js';

export class ClaseView {
  constructor(container) {
    this.container = container;
    this.alumnoCards = new Map();
  }

  async render(clase) {
    try {
      console.log('🔄 ClaseView: Renderizando clase:', clase);

      this.container.innerHTML = `
        <div style="
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
          position: relative;
        ">
          <h2 style="
            margin: 0 0 1.5rem 0;
            font-size: var(--font-size-lg);
            color: var(--gray-800);
            font-weight: 600;
          ">Clase: ${this.formatearClase(clase)}</h2>
          <div id="alumnos-container"></div>
          <!-- Espacio inferior para no tapar contenido con controles globales -->
          <div style="height: 4rem;"></div>
        </div>
      `;

      // Usar la caché global
      const alumnos = DatabaseService.getAlumnosPorClase(clase);
      const alumnosContainer = document.getElementById('alumnos-container');
      
      console.log('🔍 ClaseView: Alumnos encontrados:', {
        clase: clase,
        alumnos: alumnos,
        numAlumnos: Object.keys(alumnos).length,
        isLoaded: DatabaseService.isLoaded()
      });
      
      if (!Object.keys(alumnos).length) {
        // Verificar si el usuario es admin para mostrar el botón
        const user = AuthService.getCurrentUser();
        const isAdmin = user ? await RolesService.isAdmin(user.uid) : false;
        
        console.log('⚠️ No hay alumnos en la clase', clase, '- usuario admin:', isAdmin);
        
        alumnosContainer.innerHTML = `
          <div style="
            text-align: center;
            padding: 2rem;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">
            <p style="margin: 0; color: #666;">No hay alumnos en esta clase.</p>
            ${isAdmin ? `
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
            ` : `
              <p style="margin-top: 1rem; color: #999; font-size: 0.9rem;">
                Contacta con el administrador para cargar los datos.
              </p>
            `}
          </div>
        `;

        // Solo agregar evento si es admin
        if (isAdmin) {
          const btnCarga = document.getElementById('btnCarga');
          if (btnCarga) {
            btnCarga.onclick = () => {
              window.dispatchEvent(new CustomEvent('navegacion', { 
                detail: { vista: 'carga' } 
              }));
            };
          }
        }
        return;
      }
      
      console.log('✅ ClaseView: Renderizando', Object.keys(alumnos).length, 'alumnos');
      
      for (const [alumnoId, data] of Object.entries(alumnos)) {
        const cardContainer = document.createElement('div');
        alumnosContainer.appendChild(cardContainer);
        
        const card = new AlumnoCard(cardContainer, clase, alumnoId, data.nombre);
        await card.render();
        this.alumnoCards.set(alumnoId, card);
      }
    } catch (error) {
      console.error('❌ Error al renderizar clase:', error);
      this.container.innerHTML = `
        <div class="error-message">
          Error al cargar la clase: ${error.message}
        </div>
      `;
    }
  }

  updateAlumno(alumnoId) {
    const card = this.alumnoCards.get(alumnoId);
    if (card) {
      card.actualizarTarjeta();
    }
  }

  formatearClase(clase) {
    // Usar el mismo formato que TabsNav
    const match = clase?.match(/(\d)º\s*(ESO|BACH)\s+([A-Z])/i);
    if (match) {
      const [, numero, nivel, letra] = match;
      return nivel.toUpperCase() === 'BACH' ? `${numero}b${letra}` : `${numero}${letra}`;
    }
    return clase || '';
  }
} 