export class TabsNav {
  constructor(container, clases, claseActual, onClaseChange) {
    this.container = container;
    this.clases = clases;
    this.claseActual = claseActual;
    this.onClaseChange = onClaseChange;
  }

  formatearClase(clase) {
    // Convertir "1°ESO A" a "1A" y "1°BACH A" a "1bA"
    const match = clase.match(/(\d)°(ESO|BACH)\s+([A-Z])/i);
    if (match) {
      const [, numero, nivel, letra] = match;
      return nivel.toUpperCase() === 'BACH' ? `${numero}b${letra}` : `${numero}${letra}`;
    }
    return clase;
  }

  esBachillerato(clase) {
    return clase.toUpperCase().includes('BACH');
  }

  render() {
    this.container.innerHTML = `
      <div class="tabs-container" style="
        width: 100%;
        background: #fff;
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 1rem;
      ">
        <div class="tabs-scroll" style="
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          cursor: grab;
        ">
          <div class="tabs-wrapper" style="
            display: inline-flex;
            padding: 0 1rem;
          ">
            ${this.clases.map(clase => {
              const esBach = this.esBachillerato(clase);
              const nombreFormateado = this.formatearClase(clase);
              return `
                <button 
                  class="tab-btn ${clase === this.claseActual ? 'active' : ''}"
                  data-clase="${clase}"
                  style="
                    padding: 0.75rem 1.25rem;
                    border: none;
                    background: none;
                    color: ${clase === this.claseActual 
                      ? (esBach ? 'var(--bach-color)' : 'var(--primary-color)') 
                      : (esBach ? '#4a5568' : '#666')};
                    font-size: var(--font-size-base);
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s;
                    font-weight: ${clase === this.claseActual ? '600' : '400'};
                  "
                >
                  ${nombreFormateado}
                  ${clase === this.claseActual ? `
                    <div style="
                      position: absolute;
                      bottom: 0;
                      left: 0;
                      width: 100%;
                      height: 2px;
                      background: ${esBach ? 'var(--bach-color)' : 'var(--primary-color)'};
                    "></div>
                  ` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Ocultar scrollbar pero mantener funcionalidad
    const style = document.createElement('style');
    style.textContent = `
      .tabs-scroll::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);

    // Eventos de cambio de pestaña
    const tabs = this.container.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const clase = tab.dataset.clase;
        if (clase !== this.claseActual) {
          this.onClaseChange(clase);
        }
      });
    });

    // Scroll por arrastre de ratón (desktop y móvil)
    const scrollEl = this.container.querySelector('.tabs-scroll');
    let isDown = false;
    let startX;
    let scrollLeft;

    scrollEl.addEventListener('mousedown', (e) => {
      isDown = true;
      scrollEl.classList.add('dragging');
      startX = e.pageX - scrollEl.offsetLeft;
      scrollLeft = scrollEl.scrollLeft;
      scrollEl.style.cursor = 'grabbing';
    });
    scrollEl.addEventListener('mouseleave', () => {
      isDown = false;
      scrollEl.classList.remove('dragging');
      scrollEl.style.cursor = 'grab';
    });
    scrollEl.addEventListener('mouseup', () => {
      isDown = false;
      scrollEl.classList.remove('dragging');
      scrollEl.style.cursor = 'grab';
    });
    scrollEl.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollEl.offsetLeft;
      const walk = (x - startX) * 1.5; // velocidad
      scrollEl.scrollLeft = scrollLeft - walk;
    });
    // Soporte táctil
    let touchStartX = 0;
    let touchScrollLeft = 0;
    scrollEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = scrollEl.scrollLeft;
    });
    scrollEl.addEventListener('touchmove', (e) => {
      const x = e.touches[0].pageX;
      const walk = (x - touchStartX) * 1.5;
      scrollEl.scrollLeft = touchScrollLeft - walk;
    });
  }
} 