import { DatabaseService } from '../services/database.js';
import { ExcelUtils } from '../utils/excel.js';

export class CargaAlumnosView {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <div style="max-width: 600px; margin: 0 auto;">
        <h2 style="margin-bottom: 2rem;">⚙️ Carga de Alumnos</h2>
        
        <div style="
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        ">
          <h3 style="margin-top: 0; margin-bottom: 1rem;">Instrucciones</h3>
          <p>El archivo Excel debe tener las siguientes columnas:</p>
          <ul>
            <li>"Alumno": Nombre completo del alumno</li>
            <li>"Curso": Identificador del curso</li>
          </ul>
          <p style="color: #dc3545; margin-top: 1rem;">
            ⚠️ ATENCIÓN: La carga de un nuevo archivo eliminará todos los datos anteriores.
          </p>
        </div>

        <div style="
          display: flex;
          flex-direction: column;
          gap: 1rem;
        ">
          <input 
            type="file" 
            id="fileAlumnos" 
            accept=".xlsx,.xls" 
            style="
              padding: 0.5rem;
              border: 1px solid #ccc;
              border-radius: 4px;
            "
          />
          
          <div style="display: flex; gap: 1rem;">
            <button 
              id="btnCargar"
              style="
                padding: 0.7rem 1.2rem;
                background: #0044cc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
              "
            >
              Cargar Alumnos
            </button>
            
            <button 
              id="btnVolver"
              style="
                padding: 0.7rem 1.2rem;
                background: #fff;
                border: 1px solid #ccc;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
              "
            >
              <span>🔙</span> Volver
            </button>
          </div>
        </div>
      </div>
    `;

    // Eventos
    document.getElementById('btnCargar').onclick = async () => {
      const fileInput = document.getElementById('fileAlumnos');
      if (fileInput.files.length === 0) {
        alert('Por favor, selecciona un archivo Excel.');
        return;
      }

      try {
        // Mostrar loading
        this.mostrarLoading('Procesando archivo Excel...');

        // Parsear Excel
        const data = await ExcelUtils.parseExcelFile(fileInput.files[0]);
        
        // Confirmar acción
        if (!confirm('ATENCIÓN: Esto BORRARÁ TODA la base de datos. ¿Desea continuar?')) {
          this.ocultarLoading();
          return;
        }

        // Actualizar loading
        this.mostrarLoading('Actualizando base de datos...');

        // Cargar datos
        await DatabaseService.borrarBaseDeDatos();
        await DatabaseService.cargarAlumnosDesdeExcel(data);

        this.ocultarLoading();
        alert('Datos cargados correctamente.');
        
        // Volver al menú
        window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'menu' } }));

      } catch (error) {
        this.ocultarLoading();
        alert('Error al procesar el archivo: ' + error.message);
      } finally {
        this.ocultarLoading();
      }
    };

    document.getElementById('btnVolver').onclick = () => {
      window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'menu' } }));
    };
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