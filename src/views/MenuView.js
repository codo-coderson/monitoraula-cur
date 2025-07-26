import { DatabaseService } from '../services/database.js';
import { AuthService } from '../services/auth.js';

export class MenuView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    try {
      console.log('🔄 Renderizando menú...');

      // Si el usuario no es admin, redirigir a la vista de clase
      if (!AuthService.isAdmin) {
        const clases = await DatabaseService.getClases();
        const clase = AuthService.lastVisitedClass || (clases.length > 0 ? clases[0] : null);
        
        if (clase) {
          window.dispatchEvent(new CustomEvent('navegacion', { 
            detail: { vista: 'clase', params: { clase } }
          }));
        } else {
          this.mostrarError('No hay clases disponibles');
        }
        return;
      }

      const clases = await DatabaseService.getClases();
      console.log('✅ Clases cargadas:', clases);
      
      this.container.innerHTML = `
        <div style="
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        ">
          <button 
            id="btnVisitas"
            class="menu-btn"
            style="
              padding: 1rem;
              background: #0044cc;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 1.1rem;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              transition: background-color 0.2s;
            "
          >
            <span>🚽</span> Visitas al WC
          </button>

          <button 
            id="btnCarga"
            class="menu-btn"
            style="
              padding: 1rem;
              background: #fff;
              border: 1px solid #ccc;
              border-radius: 8px;
              cursor: pointer;
              font-size: 1.1rem;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              transition: all 0.2s;
            "
          >
            <span>📥</span> Carga de Alumnos
          </button>

          <button 
            id="btnBorrar"
            class="menu-btn"
            style="
              padding: 1rem;
              background: #fff;
              border: 1px solid #dc3545;
              color: #dc3545;
              border-radius: 8px;
              cursor: pointer;
              font-size: 1.1rem;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              transition: all 0.2s;
            "
          >
            <span>🗑️</span> Borrar Base de Datos
          </button>
        </div>
      `;

      // Eventos
      document.getElementById('btnVisitas').onclick = () => {
        if (clases.length === 0) {
          alert('No hay datos cargados en la base de datos. Por favor, carga los datos primero.');
          return;
        }
        window.dispatchEvent(new CustomEvent('navegacion', { 
          detail: { vista: 'clase', params: { clase: clases[0] } }
        }));
      };

      document.getElementById('btnCarga').onclick = () => {
        window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'carga' } }));
      };

      document.getElementById('btnBorrar').onclick = async () => {
        if (confirm('ATENCIÓN: Esto BORRARÁ TODA la base de datos. ¿Desea continuar?')) {
          try {
            this.mostrarLoading('Borrando base de datos...');
            await DatabaseService.borrarBaseDeDatos();
            this.ocultarLoading();
            window.location.reload();
          } catch (error) {
            console.error('❌ Error al borrar base de datos:', error);
            this.ocultarLoading();
            alert('Error al borrar la base de datos: ' + error.message);
          }
        }
      };

      // Efectos hover
      const menuBtns = document.querySelectorAll('.menu-btn');
      menuBtns.forEach(btn => {
        btn.onmouseover = () => {
          if (btn.id === 'btnVisitas') {
            btn.style.backgroundColor = '#003399';
          } else if (btn.id === 'btnBorrar') {
            btn.style.backgroundColor = '#dc3545';
            btn.style.color = '#fff';
          } else {
            btn.style.backgroundColor = '#f5f5f5';
          }
        };

        btn.onmouseout = () => {
          if (btn.id === 'btnVisitas') {
            btn.style.backgroundColor = '#0044cc';
          } else if (btn.id === 'btnBorrar') {
            btn.style.backgroundColor = '#fff';
            btn.style.color = '#dc3545';
          } else {
            btn.style.backgroundColor = '#fff';
          }
        };
      });

      console.log('✅ Menú renderizado');
    } catch (error) {
      console.error('❌ Error al renderizar menú:', error);
      this.mostrarError('Error al cargar el menú principal');
    }
  }

  mostrarError(mensaje) {
    this.container.innerHTML = `
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

  mostrarLoading(mensaje) {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
    `;
    box.innerHTML = `
      <div style="margin-bottom: 1rem;">${mensaje}</div>
      <div class="spinner"></div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  ocultarLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }
} 