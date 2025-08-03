export class LoadingComponent {
  constructor(container) {
    this.container = container;
  }

  render(message = 'Cargando datos...') {
    this.container.innerHTML = `
      <style>
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          flex-direction: column;
          gap: 1rem;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #0044cc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loading-message {
          font-size: 1.2rem;
          color: #333;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-message">${message}</div>
      </div>
    `;
  }

  hide() {
    const overlay = this.container.querySelector('.loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }
}
