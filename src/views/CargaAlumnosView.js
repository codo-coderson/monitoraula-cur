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
          <p>De momento, la carga de alumnos solo funciona desde un ordenador de escritorio.</p>
          <p>El archivo Excel debe tener las siguientes columnas:</p>
          <ul>
            <li><strong>"Alumno"</strong> o <strong>"Nombre"</strong>: Nombre completo del alumno</li>
            <li><strong>"Curso"</strong> o <strong>"Clase"</strong>: Identificador del curso</li>
          </ul>
          <p style="color: #666; margin-top: 1rem;">
            ℹ️ El sistema acepta archivos .xlsx y .xls. Las columnas pueden estar en mayúsculas o minúsculas.
          </p>
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
              width: 100%;
              box-sizing: border-box;
            "
          />
          
          <div id="errorContainer" style="
            display: none;
            padding: 1rem;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            color: #721c24;
            margin-bottom: 1rem;
          "></div>
          
          <div id="successContainer" style="
            display: none;
            padding: 1rem;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            color: #155724;
            margin-bottom: 1rem;
          "></div>
          
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
                flex: 1;
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
                justify-content: center;
                gap: 0.5rem;
              "
            >
              <span>🔙</span> Volver
            </button>
          </div>
        </div>
      </div>
    `;

    const errorContainer = document.getElementById('errorContainer');
    const successContainer = document.getElementById('successContainer');
    
    const showError = (message) => {
      errorContainer.style.display = 'block';
      errorContainer.innerHTML = `<strong>Error:</strong> ${message}`;
      successContainer.style.display = 'none';
    };
    
    const showSuccess = (message) => {
      successContainer.style.display = 'block';
      successContainer.innerHTML = `<strong>✅ Éxito:</strong> ${message}`;
      errorContainer.style.display = 'none';
    };
    
    const hideMessages = () => {
      errorContainer.style.display = 'none';
      successContainer.style.display = 'none';
    };

    // Eventos
    document.getElementById('btnCargar').onclick = async () => {
      const fileInput = document.getElementById('fileAlumnos');
      const btnCargar = document.getElementById('btnCargar');
      
      hideMessages();
      
      if (fileInput.files.length === 0) {
        showError('Por favor, selecciona un archivo Excel.');
        return;
      }

      const file = fileInput.files[0];
      console.log('📁 Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);

      try {
        // Deshabilitar botón durante el proceso
        btnCargar.disabled = true;
        btnCargar.textContent = 'Procesando...';
        
        // Mostrar loading
        this.mostrarLoading('Procesando archivo Excel...');

        // Parsear Excel con mejor manejo de errores
        let data;
        try {
          data = await ExcelUtils.parseExcelFile(file);
          console.log(`✅ Archivo procesado: ${data.length} registros encontrados`);
        } catch (parseError) {
          console.error('Error al parsear Excel:', parseError);
          throw new Error(parseError.message || 'No se pudo leer el archivo Excel. Verifica que el formato sea correcto.');
        }
        
        // Mostrar resumen de datos encontrados
        const clases = [...new Set(data.map(row => row.Curso))];
        const mensaje = `Se encontraron ${data.length} alumnos en ${clases.length} clases.\n\nClases: ${clases.join(', ')}`;
        
        // Confirmar acción con más detalles
        if (!confirm(`${mensaje}\n\n⚠️ ATENCIÓN: Esto BORRARÁ TODA la base de datos actual.\n\n¿Desea continuar?`)) {
          this.ocultarLoading();
          btnCargar.disabled = false;
          btnCargar.textContent = 'Cargar Alumnos';
          showSuccess('Operación cancelada por el usuario.');
          return;
        }

        // Actualizar loading
        this.mostrarLoading('Actualizando base de datos...');

        // Cargar datos
        try {
          await DatabaseService.borrarBaseDeDatos();
          console.log('✅ Base de datos borrada');
          
          await DatabaseService.cargarAlumnosDesdeExcel(data);
          console.log('✅ Nuevos datos cargados');
          
          this.ocultarLoading();
          showSuccess(`Datos cargados correctamente: ${data.length} alumnos en ${clases.length} clases.`);
          
          // Navigate directly to the first class after a short delay
          setTimeout(() => {
            const firstClass = clases[0];
            if (firstClass) {
              window.dispatchEvent(new CustomEvent('navegacion', { 
                detail: { 
                  vista: 'clase',
                  params: { clase: firstClass }
                }
              }));
            } else {
              window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'clase' } }));
            }
          }, 1500);

        } catch (dbError) {
          console.error('Error al actualizar base de datos:', dbError);
          throw new Error('Error al actualizar la base de datos. Por favor, intenta de nuevo.');
        }

      } catch (error) {
        console.error('❌ Error en el proceso de carga:', error);
        this.ocultarLoading();
        showError(error.message || 'Error desconocido al procesar el archivo.');
      } finally {
        btnCargar.disabled = false;
        btnCargar.textContent = 'Cargar Alumnos';
        this.ocultarLoading();
      }
    };

    document.getElementById('btnVolver').onclick = () => {
      window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'clase' } }));
    };
    
    // Clear messages when selecting a new file
    document.getElementById('fileAlumnos').onchange = () => {
      hideMessages();
    };
  }

  mostrarLoading(mensaje) {
    // Remove any existing overlay first
    this.ocultarLoading();
    
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
      min-width: 250px;
      margin: 1rem;
    `;
    box.innerHTML = `
      <div style="margin-bottom: 1rem; font-size: 1.1rem;">${mensaje}</div>
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
