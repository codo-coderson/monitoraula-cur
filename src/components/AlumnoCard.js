import { DateUtils } from '../utils/date.js';
import { DatabaseService } from '../services/database.js';
import { AuthService } from '../services/auth.js';

export class AlumnoCard {
  constructor(container, clase, alumnoId, nombre) {
    this.container = container;
    this.clase = clase;
    this.alumnoId = alumnoId;
    this.nombre = nombre;
    this.unsubscribe = null;
  }

  async render() {
    this.container.innerHTML = `
      <div class="alumno-card" style="
        border: 1px solid #e0e0e0;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        background-color: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      ">
        <div style="font-weight: bold; margin-bottom: 0.5rem;">${this.nombre}</div>
        <div id="botones-${this.alumnoId}" style="display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
        <div id="media-${this.alumnoId}" style="margin-top: 0.5rem; font-size: 0.9rem;"></div>
        <div id="aviso-${this.alumnoId}" style="color: #dc3545; font-size: 0.9rem; margin-top: 0.5rem; display: none;"></div>
      </div>
    `;

    // Usar la caché global para los registros
    this.actualizarTarjeta(DatabaseService.getRegistrosWC(this.clase, this.alumnoId));
    // Suscribirse a cambios globales ya lo hace la app principal
  }

  actualizarTarjeta(registros) {
    const fechaHoy = DateUtils.getFechaHoy();
    const registroHoy = registros[fechaHoy] || { salidas: [] };
    
    // Actualizar botones de horas
    const botonesContainer = document.getElementById(`botones-${this.alumnoId}`);
    if (botonesContainer) {
      botonesContainer.innerHTML = this.generarBotonesHoras(registroHoy.salidas);
      this.asignarEventosBotones(registroHoy.salidas);
    }

    // Actualizar media de salidas
    const mediaElement = document.getElementById(`media-${this.alumnoId}`);
    if (mediaElement) {
      const media = DateUtils.calcularMediaSalidas(registros);
      mediaElement.textContent = `Media últimos 30 días: ${media.toFixed(2)} salidas/día`;
    }
  }

  generarBotonesHoras(salidas = []) {
    const usuarioActual = AuthService.getCurrentUser()?.email || '';
    return Array.from({ length: 6 }, (_, i) => {
      const hora = i + 1;
      const registro = salidas.find(s => s.hora === hora);
      const activa = Boolean(registro);
      const esPropio = activa && registro.usuario === usuarioActual;
      
      const estilo = activa
        ? (esPropio
            ? 'background-color: #0044cc; color: #fff;'
            : 'background-color: #aaa; color: #fff; opacity: 0.7; cursor: not-allowed;')
        : 'background-color: #f5f5f5; color: #333;';

      return `
        <div style="display: inline-flex; align-items: center; gap: 0.5rem;">
          <button
            class="hora-btn"
            data-hora="${hora}"
            data-activa="${activa}"
            data-espropio="${esPropio}"
            style="
              ${estilo}
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              cursor: pointer;
              transition: all 0.2s ease;
            "
            ${activa && !esPropio ? 'disabled' : ''}
          >
            ${hora}
          </button>
        </div>
      `;
    }).join('');
  }

  asignarEventosBotones(salidas = []) {
    const usuarioActual = AuthService.getCurrentUser()?.email || '';
    const botones = this.container.querySelectorAll('.hora-btn');
    const aviso = this.container.querySelector(`#aviso-${this.alumnoId}`);
    botones.forEach(boton => {
      boton.onclick = async () => {
        const hora = parseInt(boton.dataset.hora);
        const activa = boton.dataset.activa === 'true';
        const esPropio = boton.dataset.espropio === 'true';
        aviso.style.display = 'none';

        if (activa && !esPropio) {
          aviso.textContent = 'Solo el usuario que marcó la salida puede desmarcarla.';
          aviso.style.display = 'block';
          return;
        }

        const fechaHoy = DateUtils.getFechaHoy();
        // Obtener registros actuales de la caché
        const registros = DatabaseService.getRegistrosWC(this.clase, this.alumnoId);
        const registroHoy = registros[fechaHoy] || { salidas: [] };
        // Alternar salida
        const index = registroHoy.salidas.findIndex(s => s.hora === hora);
        if (index > -1) {
          registroHoy.salidas.splice(index, 1);
        } else {
          registroHoy.salidas.push({ hora, usuario: usuarioActual, timestamp: new Date().toISOString() });
        }
        // Actualizar en la base de datos
        await DatabaseService.setRegistroWC(this.clase, this.alumnoId, fechaHoy, registroHoy);
      };
    });
  }

  destruir() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
} 