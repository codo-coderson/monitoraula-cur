import './styles/main.css';
import { Header } from './components/Header.js';
import { TabsNav } from './components/TabsNav.js';
import { MenuView } from './views/MenuView.js';
import { ClaseView } from './views/ClaseView.js';
import { CargaAlumnosView } from './views/CargaAlumnosView.js';
import { LoginView } from './views/LoginView.js';
import { DatabaseService } from './services/database.js';
import { AuthService } from './services/auth.js';

class App {
  constructor() {
    console.log('🚀 Iniciando aplicación...');
    
    this.container = document.getElementById('app');
    if (!this.container) {
      console.error('❌ No se encontró el contenedor #app');
      return;
    }
    
    console.log('✅ Contenedor encontrado');
    
    try {
      // Crear estructura básica
      this.container.innerHTML = `
        <div id="header"></div>
        <div id="tabs-nav"></div>
        <main id="main-content"></main>
      `;

      this.mainContainer = document.getElementById('main-content');
      this.header = new Header(document.getElementById('header'));
      console.log('✅ Header creado');
      
      // Inicializar vistas
      this.views = {
        login: new LoginView(this.mainContainer),
        menu: new MenuView(this.mainContainer),
        clase: new ClaseView(this.mainContainer),
        carga: new CargaAlumnosView(this.mainContainer)
      };
      console.log('✅ Vistas inicializadas');

      // Escuchar eventos de navegación
      window.addEventListener('navegacion', (event) => {
        const { vista, params } = event.detail;
        console.log('🔄 Navegando a:', vista, params);
        this.navegarA(vista, params);
      });

      // Iniciar la aplicación
      this.iniciar();
    } catch (error) {
      console.error('❌ Error al inicializar la aplicación:', error);
      this.mostrarError('Error al inicializar la aplicación');
    }
  }

  async iniciar() {
    try {
      console.log('🎬 Iniciando renderizado...');
      
      // Renderizar header
      this.header.render();
      console.log('✅ Header renderizado');

      // Inicializar autenticación
      await AuthService.init();
      
      // Si no hay usuario autenticado, mostrar login
      if (!AuthService.isAuthenticated()) {
        await this.navegarA('login');
        return;
      }

      // Suscribirse globalmente a la base de datos
      DatabaseService.subscribeAll(() => {
        // Cuando se actualiza la BD, refrescar la vista actual
        if (this.currentView && typeof this.currentView.render === 'function') {
          if (this.currentView === this.views.clase) {
            // Mantener la clase actual
            this.currentView.render(this.currentClase);
          } else {
            this.currentView.render();
          }
        }
        // Actualizar pestañas
        if (this.tabsNav) {
          this.tabsNav.clases = DatabaseService.getClases();
          this.tabsNav.render();
        }
      });

      // Esperar a que la caché esté cargada
      const waitForCache = () => new Promise(resolve => {
        if (DatabaseService.isLoaded()) return resolve();
        const interval = setInterval(() => {
          if (DatabaseService.isLoaded()) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
      await waitForCache();

      // Cargar clases y renderizar pestañas
      const clases = DatabaseService.getClases();
      if (clases && clases.length > 0) {
        this.tabsNav = new TabsNav(
          document.getElementById('tabs-nav'),
          clases,
          clases[0],
          (clase) => this.navegarA('clase', { clase })
        );
        this.tabsNav.render();
        console.log('✅ Pestañas renderizadas');

        // TODOS los usuarios van por defecto a "Visitas al WC" (vista clase)
        // Determinar clase inicial (última visitada o primera disponible)
        const claseInicial = AuthService.lastVisitedClass && clases.includes(AuthService.lastVisitedClass) 
          ? AuthService.lastVisitedClass 
          : clases[0];

        await this.navegarA('clase', { clase: claseInicial });
      } else {
        // Si no hay clases, mostrar el menú de carga
        await this.navegarA('carga');
      }
      
      console.log('✅ Aplicación iniciada');
    } catch (error) {
      console.error('❌ Error al iniciar la aplicación:', error);
      this.mostrarError('Error al iniciar la aplicación');
    }
  }

  async navegarA(vista, params = {}) {
    try {
      console.log(`🔄 Navegando a ${vista}...`);

      // Si no está autenticado y no es la vista de login, redirigir al login
      if (!AuthService.isAuthenticated() && vista !== 'login') {
        vista = 'login';
        params = {};
      }
      
      // Mostrar/ocultar elementos según la vista
      const header = document.getElementById('header');
      const tabsNav = document.getElementById('tabs-nav');
      
      if (vista === 'login') {
        header.style.display = 'none';
        tabsNav.style.display = 'none';
      } else {
        header.style.display = 'block';
        tabsNav.style.display = vista === 'clase' ? 'block' : 'none';
      }
      
      // Actualizar pestaña activa si es una vista de clase
      if (vista === 'clase' && this.tabsNav) {
        this.tabsNav.claseActual = params.clase;
        this.tabsNav.render();
        this.currentClase = params.clase;
      }

      // Limpiar contenedor
      this.mainContainer.innerHTML = '';

      // Renderizar nueva vista
      this.currentView = this.views[vista];
      if (!this.currentView) {
        throw new Error(`Vista "${vista}" no encontrada`);
      }

      if (vista === 'clase') {
        await this.currentView.render(params.clase);
      } else {
        await this.currentView.render();
      }
      
      console.log(`✅ Vista ${vista} renderizada`);
    } catch (error) {
      console.error(`❌ Error al navegar a ${vista}:`, error);
      this.mostrarError(`Error al cargar la vista ${vista}`);
    }
  }

  mostrarError(mensaje) {
    this.mainContainer.innerHTML = `
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

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM cargado, iniciando app...');
  new App();
});
