import './styles/main.css';
import { Header } from './components/Header.js';
import { TabsNav } from './components/TabsNav.js';
import { MenuView } from './views/MenuView.js';
import { ClaseView } from './views/ClaseView.js';
import { CargaAlumnosView } from './views/CargaAlumnosView.js';
import { LoginView } from './views/LoginView.js';
import { DatabaseService } from './services/database.js';
import { AuthService } from './services/auth.js';
import { FontSizeService } from './utils/fontsize.js';

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

      // Escuchar eventos de login exitoso
      window.addEventListener('user-logged-in', async () => {
        console.log('🔄 Usuario logueado - iniciando navegación...');
        
        // Refrescar header para mostrar el usuario correcto
        this.header.refresh();

        // Esperar a que haya datos reales disponibles
        console.log('🔄 Esperando datos reales de Firebase...');
        try {
          await DatabaseService.waitForRealData(10000); // 10 segundos máximo
        } catch (error) {
          console.error('❌ Error esperando datos reales:', error);
        }

        // Cargar clases y determinar navegación inicial
        const clases = DatabaseService.getClases();
        if (clases && clases.length > 0) {
          // Asegurar que el contenedor de pestañas esté visible y configurado
          const tabsContainer = document.getElementById('tabs-nav');
          if (tabsContainer) {
            console.log('🔄 Inicializando pestañas post-login...');
            tabsContainer.style.display = 'block';
            
            // Crear nueva instancia de TabsNav si no existe
            if (!this.tabsNav) {
              this.tabsNav = new TabsNav(
                tabsContainer,
                clases,
                clases[0],
                (clase) => this.navegarA('clase', { clase })
              );
            } else {
              // Actualizar clases en TabsNav existente
              this.tabsNav.clases = clases;
            }
            
            // Determinar clase inicial
            const claseInicial = (AuthService.lastVisitedClass && clases.includes(AuthService.lastVisitedClass)) 
              ? AuthService.lastVisitedClass 
              : clases[0];

            // Actualizar clase actual en TabsNav
            this.tabsNav.claseActual = claseInicial;
            this.tabsNav.render();

            console.log('🔍 Navegación post-login:', {
              lastVisitedClass: AuthService.lastVisitedClass,
              clases: clases,
              claseInicial: claseInicial,
              tabsContainerVisible: tabsContainer.style.display,
              tabsNavExists: !!this.tabsNav
            });

            // Verificar que las pestañas se renderizaron
            setTimeout(() => {
              const tabElements = tabsContainer.querySelectorAll('.tab');
              console.log('🔍 Verificación pestañas post-login:', {
                numTabs: tabElements.length,
                containerVisible: tabsContainer.style.display,
                innerHTML: tabsContainer.innerHTML.length
              });
            }, 100);

            if (claseInicial) {
              await this.navegarA('clase', { clase: claseInicial });
            } else {
              console.error('❌ No se pudo determinar clase inicial');
              await this.navegarA('carga');
            }
          } else {
            console.error('❌ No se encontró el contenedor de pestañas');
            await this.navegarA('carga');
          }
        } else {
          await this.navegarA('carga');
        }
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

      // Suscribirse globalmente a la base de datos ANTES de la autenticación
      console.log('🔄 Iniciando suscripción a base de datos...');
      DatabaseService.subscribeAll(() => {
        console.log('🔄 Base de datos actualizada - refrescando vistas');
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

      // Inicializar autenticación
      await AuthService.init();
      
      // Si no hay usuario autenticado, mostrar login
      if (!AuthService.isAuthenticated()) {
        await this.navegarA('login');
        return;
      }

      // Refrescar header después del login para mostrar el usuario correcto
      console.log('🔄 Refrescando header tras autenticación...');
      this.header.refresh();

             // La suscripción ya se hizo arriba - eliminar código duplicado

      // Esperar a que haya datos reales disponibles
      console.log('🔄 Esperando datos reales de Firebase...');
      try {
        await DatabaseService.waitForRealData(10000); // 10 segundos máximo
      } catch (error) {
        console.error('❌ Error esperando datos reales:', error);
        // Continuar para mostrar la interfaz aunque no haya datos
      }

      // Cargar clases y renderizar pestañas
      const clases = DatabaseService.getClases();
      console.log('🔍 Main.js: Estado final de clases:', {
        clases: clases,
        length: clases?.length,
        isLoaded: DatabaseService.isLoaded()
      });
      
      if (clases && clases.length > 0) {
        // Asegurar que el contenedor de pestañas esté visible
        const tabsContainer = document.getElementById('tabs-nav');
        if (tabsContainer) {
          tabsContainer.style.display = 'block';
          
          this.tabsNav = new TabsNav(
            tabsContainer,
            clases,
            clases[0],
            (clase) => this.navegarA('clase', { clase })
          );
          this.tabsNav.render();
          console.log('✅ Pestañas renderizadas con', clases.length, 'clases');
          
          // Verificar que las pestañas se renderizaron correctamente
          setTimeout(() => {
            const tabElements = tabsContainer.querySelectorAll('.tab');
            console.log('🔍 Verificación pestañas:', {
              tabsContainer: !!tabsContainer,
              containerVisible: tabsContainer.style.display,
              numTabs: tabElements.length,
              innerHTML: tabsContainer.innerHTML.length > 0
            });
          }, 100);
        } else {
          console.error('❌ No se encontró el contenedor de pestañas');
        }

        // TODOS los usuarios van por defecto a "Visitas al WC" (vista clase)
        // Determinar clase inicial (última visitada o primera disponible)
        const claseInicial = (AuthService.lastVisitedClass && clases.includes(AuthService.lastVisitedClass)) 
          ? AuthService.lastVisitedClass 
          : clases[0];

        console.log('🔍 Navegación inicial:', {
          lastVisitedClass: AuthService.lastVisitedClass,
          clases: clases,
          claseInicial: claseInicial
        });

        if (claseInicial) {
          await this.navegarA('clase', { clase: claseInicial });
        } else {
          console.error('❌ No se pudo determinar clase inicial');
          await this.navegarA('carga');
        }
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
