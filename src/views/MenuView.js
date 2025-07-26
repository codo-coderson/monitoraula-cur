import { DatabaseService } from '../services/database.js';
import { AuthService } from '../services/auth.js';

export class MenuView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    try {
      console.log('🔄 MenuView: Redirigiendo todos los usuarios a Visitas al WC...');

      // TODOS los usuarios van directamente a "Visitas al WC" (vista clase)
      const clases = DatabaseService.getClases();
      const clase = (AuthService.lastVisitedClass && clases.includes(AuthService.lastVisitedClass))
        ? AuthService.lastVisitedClass 
        : (clases.length > 0 ? clases[0] : null);
      
      console.log('🔍 MenuView: Determinando clase:', {
        lastVisitedClass: AuthService.lastVisitedClass,
        clases: clases,
        claseSeleccionada: clase
      });
      
      if (clase) {
        console.log('✅ MenuView: Navegando a clase:', clase);
        window.dispatchEvent(new CustomEvent('navegacion', { 
          detail: { vista: 'clase', params: { clase } }
        }));
      } else {
        console.error('❌ MenuView: No se pudo determinar clase');
        this.mostrarError('No hay clases disponibles. Por favor, carga los datos primero.');
      }
    } catch (error) {
      console.error('❌ Error al renderizar menú:', error);
      this.mostrarError('Error al cargar las clases');
    }
  }

  mostrarError(mensaje) {
    this.container.innerHTML = `
      <div style="
        text-align: center;
        padding: 2rem;
        color: #dc3545;
      ">
        <h3>⚠️ ${mensaje}</h3>
        <button 
          onclick="window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'carga' } }))"
          style="
            margin-top: 1rem;
            padding: 0.7rem 1.2rem;
            background: #0044cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          Cargar Datos
        </button>
      </div>
    `;
  }
} 