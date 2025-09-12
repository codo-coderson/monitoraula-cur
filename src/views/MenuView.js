import { DatabaseService } from '../services/database.js';
import { AuthService } from '../services/auth.js';

export class MenuView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    try {
      // Check if user is admin
      const isAdmin = AuthService.isAdmin;
      console.log('🔍 MenuView: Usuario es admin?', isAdmin);

      if (isAdmin) {
        // Show admin menu
        this.renderAdminMenu();
      } else {
        // Regular users go directly to "Visitas al WC"
        console.log('🔄 MenuView: Usuario normal, redirigiendo a Visitas al WC...');
        this.redirectToClase();
      }
    } catch (error) {
      console.error('❌ Error al renderizar menú:', error);
      this.mostrarError('Error al cargar el menú');
    }
  }

  renderAdminMenu() {
    console.log('📋 MenuView: Mostrando menú de administrador');
    this.container.innerHTML = `
      <div style="
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
      ">
        <h2 style="margin-bottom: 2rem;">Panel de Administración</h2>
        
        <div style="
          display: flex;
          flex-direction: column;
          gap: 1rem;
        ">
          <button 
            onclick="window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'carga' } }))"
            style="
              padding: 1rem;
              background: #0044cc;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 1.1rem;
            "
          >
            📥 Cargar Alumnos
          </button>

          <button 
            onclick="window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'clase' } }))"
            style="
              padding: 1rem;
              background: #28a745;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 1.1rem;
            "
          >
            🚽 Gestionar Visitas al WC
          </button>

          ${AuthService.getCurrentUser()?.email === 'salvador.fernandez@salesianas.org' ? `
            <button 
              onclick="window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'adminbd' } }))"
              style="
                padding: 1rem;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.1rem;
              "
            >
              ⚙️ Administración BD
            </button>
          ` : ''}

          <button 
            onclick="AuthService.logout().then(() => window.location.reload())"
            style="
              padding: 1rem;
              background: #6c757d;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-size: 1.1rem;
              margin-top: 1rem;
            "
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    `;
  }

  async redirectToClase() {
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
      this.mostrarError('No hay clases disponibles. Por favor, contacta con un administrador.');
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
        ${AuthService.isAdmin ? `
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
        ` : ''}
      </div>
    `;
  }
}