import { AlumnoCard } from '../components/AlumnoCard.js';
import { DatabaseService } from '../services/database.js';
import { AuthService } from '../services/auth.js';
import { RolesService } from '../services/roles.js';

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
        ">
          <div id="alumnos-container"></div>
        </div>
      `;

      // Esperar a que los datos estén cargados
      console.log('🔄 ClaseView: Esperando datos para clase', clase);
      try {
        await DatabaseService.waitForRealData(5000); // 5 segundos para ClaseView
      } catch (error) {
        console.warn('⚠️ ClaseView: Timeout esperando datos, continuando...', error);
      }

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
        const isAdmin = user ? RolesService.isAdmin(user.email) : false;
        
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
      console.error('❌ Error al renderizar ClaseView:', error);
      this.container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #dc3545;">
          <h3>⚠️ Error al cargar la clase</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  async waitForData() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30; // 3 segundos máximo
      
      const checkData = () => {
        attempts++;
        console.log(`🔍 ClaseView: Esperando datos... Intento ${attempts}/${maxAttempts}, loaded: ${DatabaseService.isLoaded()}`);
        
        if (DatabaseService.isLoaded()) {
          console.log('✅ ClaseView: Datos cargados');
          return resolve();
        }
        
        if (attempts >= maxAttempts) {
          console.warn('⚠️ ClaseView: Timeout esperando datos - continuando');
          return resolve();
        }
        
        setTimeout(checkData, 100);
      };
      
      checkData();
    });
  }

  updateAlumno(alumnoId) {
    const card = this.alumnoCards.get(alumnoId);
    if (card) {
      card.actualizarTarjeta();
    }
  }
} 