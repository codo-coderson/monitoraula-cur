import './styles/main.css';
import { Header } from './components/Header.js';
import { TabsNav } from './components/TabsNav.js';
import { MenuView } from './views/MenuView.js';
import { ClaseView } from './views/ClaseView.js';
import { CargaAlumnosView } from './views/CargaAlumnosView.js';
import { LoginView } from './views/LoginView.js';
import { InformeView } from './views/InformeView.js';
import { LoadingComponent } from './components/Loading.js';
import { DatabaseService } from './services/database.js';
import { AuthService } from './services/auth.js';
import { FontSizeService } from './utils/fontsize.js';
import { CleanupService } from './services/cleanup.js';

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
      this.loadingComponent = new LoadingComponent(this.mainContainer);

      this.authReady = false;
      this.dataReady = false;
      this.initialNavigationDone = false;

      console.log('✅ Header y Loading creados');
      
      // Inicializar vistas
      this.views = {
        login: new LoginView(this.mainContainer),
        menu: new MenuView(this.mainContainer),
        clase: new ClaseView(this.mainContainer),
        carga: new CargaAlumnosView(this.mainContainer),
        informe: new InformeView(this.mainContainer)
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
    this.loadingComponent.render('Iniciando...');

    const onDataUpdate = () => {
      if (this.initialNavigationDone && this.currentView) {
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

    const onInitialData = () => {
      console.log('✅ Datos iniciales listos.');
      this.dataReady = true;
      this.tryInitialNavigation();
    };

    DatabaseService.subscribeAll(onDataUpdate, onInitialData);

    await AuthService.init();
    console.log('✅ Autenticación lista.');
    this.authReady = true;
    this.tryInitialNavigation();
  }

  tryInitialNavigation() {
    if (this.initialNavigationDone || !this.authReady || !this.dataReady) {
      return;
    }

    this.initialNavigationDone = true;
    console.log('🚀 Auth y Datos listos. Realizando navegación inicial...');

    if (!AuthService.isAuthenticated()) {
      this.navegarA('login');
      return;
    }

    this.header.refresh();
    CleanupService.limpiarRegistrosAntiguos();

    const clases = DatabaseService.getClases();
    if (clases && clases.length > 0) {
      const claseInicial = (AuthService.lastVisitedClass && clases.includes(AuthService.lastVisitedClass))
        ? AuthService.lastVisitedClass
        : clases[0];
      this.navegarA('clase', { clase: claseInicial });
    } else {
      this.navegarA('carga');
    }
  }

  navegarA(vista, params = {}) {
    try {
      if (!this.initialNavigationDone && vista !== 'login') {
        this.loadingComponent.render('Cargando...');
        return;
      }

      if (!AuthService.isAuthenticated() && vista !== 'login') {
        vista = 'login';
        params = {};
      }

      const header = document.getElementById('header');
      const tabsNav = document.getElementById('tabs-nav');

      if (vista === 'login') {
        header.style.display = 'none';
        tabsNav.style.display = 'none';
      } else {
        header.style.display = 'block';
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

      if (vista === 'clase') {
        this.currentView.render(params.clase);
      } else if (vista === 'informe') {
        this.currentView.render(params.clase, params.alumnoId);
      } else {
        this.currentView.render();
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
