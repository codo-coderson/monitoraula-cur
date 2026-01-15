export class StatusOverlay {
  constructor(container) {
    this.container = container;
    this.overlay = null;
    this.render();
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'status-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    `;

    this.overlay.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        max-width: 90%;
        width: 400px;
        border: 1px solid #e0e0e0;
      ">
        <div id="status-icon" style="font-size: 3rem; margin-bottom: 1rem;">📡</div>
        <h2 id="status-title" style="margin: 0 0 0.5rem 0; color: #333;">Conectando...</h2>
        <p id="status-message" style="color: #666; margin: 0 0 1.5rem 0;">Verificando estado del sistema...</p>
        <button id="status-action" onclick="window.location.reload()" style="
          background: var(--primary-color, #007bff);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 1rem;
        ">Recargar Página</button>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  show(type, message) {
    if (!this.overlay) return;
    
    const icon = this.overlay.querySelector('#status-icon');
    const title = this.overlay.querySelector('#status-title');
    const msg = this.overlay.querySelector('#status-message');
    const btn = this.overlay.querySelector('#status-action');

    this.overlay.style.display = 'flex';

    if (type === 'offline') {
      icon.textContent = '📡';
      title.textContent = 'Sin Conexión';
      msg.textContent = message || 'Se ha perdido la conexión a internet. Los cambios no se guardarán.';
      btn.textContent = 'Reconectar';
      // Auto-hide button if we just want to block
    } else if (type === 'auth') {
      icon.textContent = '🔒';
      title.textContent = 'Sesión Caducada';
      msg.textContent = message || 'Tu sesión ha expirado por inactividad.';
      btn.textContent = 'Iniciar Sesión';
    }
  }

  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }
}
