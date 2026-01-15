import './styles/main.css';
import { Header } from './components/Header.js';
import { TabsNav } from './components/TabsNav.js';
import { MenuView } from './views/MenuView.js';
import { ClaseView } from './views/ClaseView.js';
import { CargaAlumnosView } from './views/CargaAlumnosView.js';
import { LoginView } from './views/LoginView.js';
import { InformeView } from './views/InformeView.js';
import { AdminBDView } from './views/AdminBDView.js';
import { LoadingComponent } from './components/Loading.js';
import { DatabaseService } from './services/database.js';
import { AuthService } from './services/auth.js';
import { FontSizeService } from './utils/fontsize.js';
import { CleanupService } from './services/cleanup.js';
import { StatusOverlay } from './components/StatusOverlay.js';

class App {
  constructor() {
    console.log('🚀 Iniciando aplicación...');

    // Inicializar tamaño de fuente
    FontSizeService.init();

    // Escuchar eventos de cambio de tamaño de fuente
    window.addEventListener('font-size-change', (event) => {
      if (event.detail === 'increase') {
        FontSizeService.increase();
      } else if (event.detail === 'decrease') {
        FontSizeService.decrease();
      }
    });

    // Inicializar Overlay de Estado
    this.statusOverlay = new StatusOverlay(document.body);
    this.isOffline = false;

    // Monitorizar Conexión
    DatabaseService.monitorConnection((isConnected) => {
      this.isOffline = !isConnected;
      if (!isConnected) {
        console.warn('❌ SIN CONEXIÓN: Bloqueando interfaz');
        this.statusOverlay.show('offline');
      } else {
        console.log('✅ RECONECTADO: Restaurando interfaz');
        // Solo ocultar si no hay problemas de autenticación O si estamos en login
        if (AuthService.isAuthenticated() || (this.currentView === this.views.login)) {
          this.statusOverlay.hide();
        }
      }
    });

    // Monitorizar Autenticación (evita "falsa carga")
    AuthService.subscribeToAuthChanges((user) => {
      if (!user) {
        console.warn('⚠️ CAMBIO DE ESTADO: Usuario desconectado');
        // Solo mostrar overlay si ya estamos en una vista protegida (evitar mostrar en login inicial)
        if (this.initialNavigationDone && this.currentView !== this.views.login) {
          this.statusOverlay.show('auth');
        }
      } else {
        console.log('✅ CAMBIO DE ESTADO: Usuario conectado');
        if (!this.isOffline) {
          this.statusOverlay.hide();
        }
      }
    });

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
        <!-- Controles globales de tamaño de fuente -->
        <div id="font-size-controls" style="display:none; position:fixed; bottom:1rem; right:1rem; z-index:1100; display:flex; flex-direction:column; gap:0.5rem;">
          <button data-action="increase" style="width:40px;height:40px;border-radius:50%;background:var(--primary-color);color:#fff;border:none;cursor:pointer;font-size:var(--font-size-lg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);" title="Aumentar tamaño de letra">A+</button>
          <button data-action="decrease" style="width:40px;height:40px;border-radius:50%;background:var(--primary-color);color:#fff;border:none;cursor:pointer;font-size:var(--font-size-base);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);" title="Reducir tamaño de letra">A-</button>
        </div>
      `;

      this.mainContainer = document.getElementById('main-content');
      this.header = new Header(document.getElementById('header'));
      this.loadingComponent = new LoadingComponent(this.mainContainer);

      this.initialNavigationDone = false;

      console.log('✅ Header y Loading creados');

      // Inicializar vistas
      this.views = {
        login: new LoginView(this.mainContainer),
        menu: new MenuView(this.mainContainer),
        clase: new ClaseView(this.mainContainer),
        carga: new CargaAlumnosView(this.mainContainer),
        informe: new InformeView(this.mainContainer),
        adminbd: new AdminBDView(this.mainContainer)
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
    this.header.render();

    // Show loading while checking authentication
    this.loadingComponent.render('Verificando sesión...');

    // Set a timeout to prevent infinite loading (3 seconds max)
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Timeout alcanzado, redirigiendo a login...');
      this.initialNavigationDone = true;
      this.navegarA('login');
    }, 3000);

    try {
      // Initialize auth service with a Promise.race to enforce timeout
      const authInitPromise = AuthService.init();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 2800)
      );

      try {
        await Promise.race([authInitPromise, timeoutPromise]);
      } catch (timeoutError) {
        console.warn('⏱️ Auth initialization timeout:', timeoutError);
        clearTimeout(timeoutId);
        this.initialNavigationDone = true;
        this.navegarA('login');
        return;
      }

      clearTimeout(timeoutId); // Clear the timeout if auth succeeds

      if (AuthService.isAuthenticated()) {
        console.log('✅ Usuario autenticado:', AuthService.getCurrentUser()?.email);

        // Update loading message
        this.loadingComponent.render('Cargando datos...');

        // Load database data with timeout
        const dataLoadPromise = DatabaseService.loadInitialData();
        const dataTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Data load timeout')), 5000)
        );

        try {
          await Promise.race([dataLoadPromise, dataTimeoutPromise]);
        } catch (dataError) {
          console.error('❌ Error cargando datos:', dataError);
          // If data load fails, still try to navigate but show a warning
          alert('Hubo un problema cargando los datos. Algunos elementos podrían no estar disponibles.');
        }

        // Ensure we have valid data before proceeding
        const clases = DatabaseService.getClases();
        console.log('📚 Clases disponibles:', clases);

        this.initialNavigationDone = true;

        // Navigate to the appropriate view
        this.navegarDirecto();
      } else {
        console.log('ℹ️ No hay usuario autenticado, mostrando login');
        // If not authenticated, show login screen
        this.initialNavigationDone = true;
        this.navegarA('login');
      }
    } catch (error) {
      console.error('❌ Error durante inicialización:', error);
      clearTimeout(timeoutId);
      // On any error, show login screen
      this.initialNavigationDone = true;
      this.navegarA('login');
    }
  }

  // Navega a la vista principal una vez que los datos están listos
  navegarDirecto() {
    // Subscribe to data updates
    const onDataUpdate = () => {
      if (this.currentView) {
        if (this.currentView === this.views.clase) {
          this.currentView.render(this.currentClase);
        } else {
          this.currentView.render();
        }
        if (this.tabsNav) {
          this.tabsNav.clases = DatabaseService.getClases();
          this.tabsNav.render();
        }
      }
    };
    DatabaseService.subscribeToUpdates(onDataUpdate);

    // Refresh header with user info
    this.header.refresh();

    // Clean up old records
    try {
      CleanupService.limpiarRegistrosAntiguos();
    } catch (cleanupError) {
      console.warn('⚠️ Error en limpieza de registros:', cleanupError);
    }

    const clases = DatabaseService.getClases();
    console.log('🎯 Navegando directo, clases disponibles:', clases);

    if (clases && clases.length > 0) {
      // Determine initial class to show
      const claseInicial = (AuthService.lastVisitedClass && clases.includes(AuthService.lastVisitedClass))
        ? AuthService.lastVisitedClass
        : clases[0];

      console.log('📍 Navegando a clase inicial:', claseInicial);
      this.navegarA('clase', { clase: claseInicial });
    } else {
      console.warn('⚠️ No hay clases disponibles');
      if (AuthService.isAdmin) {
        console.log('👤 Usuario es admin, navegando a carga de alumnos');
        this.navegarA('carga');
      } else {
        alert('La base de datos de alumnos está vacía. Contacta con un administrador.');
        AuthService.logout();
        this.navegarA('login');
      }
    }
  }

  navegarA(vista, params = {}) {
    try {
      // Check authentication for protected views
      if (!AuthService.isAuthenticated() && vista !== 'login') {
        console.log('⚠️ Usuario no autenticado, redirigiendo a login');
        vista = 'login';
        params = {};
      }

      // Restrict adminbd view to specific user
      if (vista === 'adminbd') {
        const user = AuthService.getCurrentUser();
        const allowed = user?.email === 'salvador.fernandez@salesianas.org';
        if (!allowed) {
          console.warn('Acceso denegado a Administración BD');
          vista = 'clase';
        }
      }

      const header = document.getElementById('header');
      const tabsNav = document.getElementById('tabs-nav');

      // Handle UI visibility based on view
      if (vista === 'login') {
        header.style.display = 'none';
        tabsNav.style.display = 'none';
      } else {
        header.style.display = 'block';

        // Update header to show current user
        this.header.refresh();

        if (vista === 'clase') {
          const clases = DatabaseService.getClases();
          if (clases && clases.length > 0) {
            if (!this.tabsNav) {
              this.tabsNav = new TabsNav(
                tabsNav,
                clases,
                params.clase,
                (clase) => this.navegarA('clase', { clase })
              );
            }
            this.tabsNav.claseActual = params.clase;
            this.tabsNav.render();
            tabsNav.style.display = 'block';

            // Save last visited class
            if (params.clase) {
              AuthService.updateLastVisitedClass(params.clase);
            }
          } else {
            tabsNav.style.display = 'none';
          }
        } else {
          tabsNav.style.display = 'none';
        }
      }

      this.currentClase = params.clase;
      this.mainContainer.innerHTML = '';
      this.currentView = this.views[vista];

      if (!this.currentView) throw new Error(`Vista "${vista}" no encontrada`);

      // Render the view with appropriate parameters
      if (vista === 'clase') {
        this.currentView.render(params.clase);
      } else if (vista === 'informe') {
        this.currentView.render(params.clase, params.alumnoId);
      } else {
        this.currentView.render();
      }

      // Show/hide font size controls
      const controls = document.getElementById('font-size-controls');
      if (['login', 'carga'].includes(vista)) {
        controls.style.display = 'none';
      } else {
        controls.style.display = 'flex';
      }

      // Initialize font size control listeners (only once)
      if (!this._fontSizeControlsInit) {
        this._fontSizeControlsInit = true;
        controls.addEventListener('click', (e) => {
          const btn = e.target.closest('button[data-action]');
          if (!btn) return;
          const action = btn.getAttribute('data-action');
          window.dispatchEvent(new CustomEvent('font-size-change', { detail: action }));
        });
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
        <button onclick="window.location.reload()" style="
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Recargar página</button>
      </div>
    `;
  }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM cargado, iniciando app...');
  new App();
});
