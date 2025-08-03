import { AuthService } from '../services/auth.js';
import { DatabaseService } from '../services/database.js';

export class LoginView {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <div style="
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        <h2 style="
          margin: 0 0 1.5rem 0;
          text-align: center;
          color: #333;
        ">Iniciar Sesión</h2>
        
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label for="email" style="color: #666;">Correo electrónico</label>
            <input 
              type="email" 
              id="email" 
              required 
              style="
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 1rem;
              "
            >
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label for="password" style="color: #666;">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              required 
              style="
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 1rem;
              "
            >
          </div>

          <div id="errorMessage" style="
            color: #dc3545;
            font-size: 0.9rem;
            min-height: 1.2rem;
            margin-top: 0.5rem;
          "></div>

          <button 
            type="submit" 
            style="
              padding: 0.75rem;
              background: #0044cc;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 1rem;
              cursor: pointer;
              transition: background-color 0.2s;
            "
          >
            Iniciar Sesión
          </button>

          <button 
            type="button"
            id="btnResetPassword"
            style="
              padding: 0.75rem;
              background: none;
              border: 1px solid #0044cc;
              color: #0044cc;
              border-radius: 4px;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.2s;
              margin-top: 0.5rem;
            "
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>

        <div id="successMessage" style="
          display: none;
          color: #198754;
          text-align: center;
          margin-top: 1rem;
          padding: 1rem;
          background: #d1e7dd;
          border-radius: 4px;
        "></div>
      </div>
    `;

    // Manejar envío del formulario
    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const submitButton = form.querySelector('button[type="submit"]');
    const resetButton = document.getElementById('btnResetPassword');
    const emailInput = document.getElementById('email');

    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const email = emailInput.value;
      const password = document.getElementById('password').value;

      const originalText = submitButton.textContent;
      try {
        // Mostrar estado de carga
        submitButton.disabled = true;
        submitButton.textContent = 'Iniciando sesión...';
        errorMessage.textContent = '';
        successMessage.style.display = 'none';

        // Intentar login
        await AuthService.login(email, password);

        // Forzar recarga para que el flujo de 'iniciar' en main.js se encargue de todo
        window.location.reload();

      } catch (error) {
        errorMessage.textContent = error.message;
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    };

    // Manejar restablecimiento de contraseña
    resetButton.onclick = async () => {
      const email = emailInput.value;
      
      if (!email) {
        errorMessage.textContent = 'Introduce tu correo electrónico para restablecer la contraseña';
        return;
      }

      try {
        resetButton.disabled = true;
        const originalText = resetButton.textContent;
        resetButton.textContent = 'Enviando...';
        errorMessage.textContent = '';
        successMessage.style.display = 'none';

        await AuthService.sendPasswordReset(email);
        
        successMessage.textContent = 'Se ha enviado un enlace de restablecimiento a tu correo electrónico';
        successMessage.style.display = 'block';
        resetButton.textContent = originalText;
        resetButton.disabled = false;

      } catch (error) {
        errorMessage.textContent = error.message;
        resetButton.textContent = originalText;
        resetButton.disabled = false;
      }
    };
  }
}