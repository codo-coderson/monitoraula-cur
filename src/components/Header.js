import { DateUtils } from '../utils/date.js';
import { AuthService } from '../services/auth.js';

export class Header {
  constructor(container) {
    this.container = container;
    this.updateInterval = null;
  }

  render() {
    const user = AuthService.getCurrentUser();
    const userIdentifier = user ? user.email.split('@')[0] : 'Usuario';
    const isAdmin = AuthService.isAdmin;

    this.container.innerHTML = `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        height: 100%;
      ">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div id="fecha"></div>
          <div id="hora"></div>
        </div>
        
        <div style="position: relative;">
          <button 
            id="userMenuBtn"
            style="
              padding: 0.5rem 1rem;
              background: none;
              border: 1px solid #0044cc;
              color: #0044cc;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.9rem;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            "
          >
            ${userIdentifier}
            <span style="font-size: 0.7rem;">▼</span>
          </button>
          
          <div 
            id="userMenu" 
            style="
              display: none;
              position: absolute;
              top: 100%;
              right: 0;
              background: white;
              border: 1px solid #ddd;
              border-radius: 4px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              min-width: 180px;
              z-index: 1000;
              margin-top: 2px;
            "
          >
            ${isAdmin ? `
              <div 
                class="menu-item" 
                data-action="visitasWC"
                style="
                  padding: 0.7rem 1rem;
                  cursor: pointer;
                  border-bottom: 1px solid #eee;
                  transition: background 0.2s;
                "
              >
                📊 Visitas al WC
              </div>
              <div 
                class="menu-item" 
                data-action="cargaAlumnos"
                style="
                  padding: 0.7rem 1rem;
                  cursor: pointer;
                  border-bottom: 1px solid #eee;
                  transition: background 0.2s;
                "
              >
                📁 Carga de Alumnos
              </div>
              <div 
                class="menu-item" 
                data-action="borrarBD"
                style="
                  padding: 0.7rem 1rem;
                  cursor: pointer;
                  border-bottom: 1px solid #eee;
                  transition: background 0.2s;
                  color: #dc3545;
                "
              >
                🗑️ Borrar Base de Datos
              </div>
            ` : ''}
            <div 
              class="menu-item" 
              data-action="logout"
              style="
                padding: 0.7rem 1rem;
                cursor: pointer;
                transition: background 0.2s;
                color: #dc3545;
              "
            >
              🚪 Cerrar Sesión
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupMenuEvents();
    this.startUpdating();
  }

  setupMenuEvents() {
    const menuBtn = document.getElementById('userMenuBtn');
    const menu = document.getElementById('userMenu');

    // Toggle menú
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    };

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    // Hover effects para items del menú
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f8f9fa';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });

      // Acciones del menú
      item.onclick = async (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        menu.style.display = 'none';

        switch (action) {
          case 'visitasWC':
            // Ir a la primera clase disponible o la última visitada
            const clases = await import('../services/database.js').then(m => m.DatabaseService.getClases());
            const clase = AuthService.lastVisitedClass && clases.includes(AuthService.lastVisitedClass)
              ? AuthService.lastVisitedClass 
              : (clases.length > 0 ? clases[0] : null);
            
            if (clase) {
              window.dispatchEvent(new CustomEvent('navegacion', { 
                detail: { vista: 'clase', params: { clase } }
              }));
            } else {
              alert('No hay clases disponibles');
            }
            break;
          
          case 'cargaAlumnos':
            window.dispatchEvent(new CustomEvent('navegacion', { 
              detail: { vista: 'carga' }
            }));
            break;
          
          case 'borrarBD':
            if (confirm('⚠️ ATENCIÓN: Esto BORRARÁ TODA la base de datos. ¿Está seguro?')) {
              if (confirm('Esta acción NO se puede deshacer. ¿Confirma que desea borrar TODOS los datos?')) {
                try {
                  const { DatabaseService } = await import('../services/database.js');
                  await DatabaseService.borrarBaseDeDatos();
                  alert('Base de datos borrada correctamente.');
                  window.location.reload();
                } catch (error) {
                  alert('Error al borrar la base de datos: ' + error.message);
                }
              }
            }
            break;
          
          case 'logout':
            try {
              await AuthService.logout();
              window.dispatchEvent(new CustomEvent('navegacion', { 
                detail: { vista: 'login' }
              }));
            } catch (error) {
              alert('Error al cerrar sesión: ' + error.message);
            }
            break;
        }
      };
    });
  }

  updateDateTime() {
    const fechaElement = this.container.querySelector('#fecha');
    const horaElement = this.container.querySelector('#hora');
    
    if (fechaElement && horaElement) {
      const now = new Date();
      fechaElement.textContent = DateUtils.formatearFecha(now);
      horaElement.textContent = DateUtils.formatearHora(now);
    }
  }

  startUpdating() {
    this.updateDateTime();
    this.updateInterval = setInterval(() => this.updateDateTime(), 1000);
  }

  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
} 