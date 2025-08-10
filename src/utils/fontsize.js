const STORAGE_KEY = 'monitoraula_font_size';
const DEFAULT_SIZE = 14;
const MIN_SIZE = 8; // reducido para permitir tamaño más pequeño
const MAX_SIZE = 20;
const STEP = 1;

export const FontSizeService = {
  // Obtener el tamaño actual
  getCurrentSize() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored) : DEFAULT_SIZE;
  },

  // Aumentar el tamaño
  increase() {
    const current = this.getCurrentSize();
    const newSize = Math.min(current + STEP, MAX_SIZE);
    this.setSize(newSize);
    return newSize;
  },

  // Disminuir el tamaño
  decrease() {
    const current = this.getCurrentSize();
    const newSize = Math.max(current - STEP, MIN_SIZE);
    this.setSize(newSize);
    return newSize;
  },

  // Establecer el tamaño
  setSize(size) {
    localStorage.setItem(STORAGE_KEY, size);
    document.documentElement.style.setProperty('--font-size-base', `${size}px`);
    document.documentElement.style.setProperty('--font-size-sm', `${size - 2}px`);
    document.documentElement.style.setProperty('--font-size-lg', `${size + 2}px`);
  },

  // Inicializar
  init() {
    this.setSize(this.getCurrentSize());
  }
}; 