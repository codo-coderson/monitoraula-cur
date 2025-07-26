import { DateUtils } from '../utils/date.js';
import { AuthService } from '../services/auth.js';

export class Header {
  constructor(container) {
    this.container = container;
    this.updateInterval = null;
  }

  render() {
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
        <button 
          id="btnLogout"
          style="
            padding: 0.5rem 1rem;
            background: none;
            border: 1px solid #dc3545;
            color: #dc3545;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
          "
        >
          Cerrar Sesión
        </button>
      </div>
    `;

    // Eventos
    document.getElementById('btnLogout').onclick = async () => {
      try {
        await AuthService.logout();
        window.dispatchEvent(new CustomEvent('navegacion', { 
          detail: { vista: 'login' }
        }));
      } catch (error) {
        alert('Error al cerrar sesión: ' + error.message);
      }
    };

    this.startUpdating();
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