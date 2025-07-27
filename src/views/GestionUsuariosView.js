import { UserService } from '../services/users.js';

export class GestionUsuariosView {
  constructor(container) {
    this.container = container;
  }

  render() {
    UserService.subscribeAll(() => this.render());
    const usuarios = UserService.getUsers();
    const filas = Object.values(usuarios).map(u => `
      <tr>
        <td style="padding:0.5rem;border-bottom:1px solid #eee;">${u.email}</td>
        <td style="padding:0.5rem;border-bottom:1px solid #eee;">${u.role}</td>
      </tr>`).join('');

    this.container.innerHTML = `
      <div style="max-width:600px;margin:0 auto;">
        <h2 style="margin-bottom:1rem;">👥 Gestión de Usuarios</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:1rem;">
          <thead>
            <tr><th style="text-align:left;padding:0.5rem;">Email</th><th style="text-align:left;padding:0.5rem;">Rol</th></tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          <input id="nuevoEmail" type="email" placeholder="Correo" style="padding:0.5rem;border:1px solid #ccc;border-radius:4px;">
          <input id="nuevoPassword" type="password" placeholder="Contraseña" style="padding:0.5rem;border:1px solid #ccc;border-radius:4px;">
          <select id="nuevoRol" style="padding:0.5rem;border:1px solid #ccc;border-radius:4px;">
            <option value="profesor">Profesor</option>
            <option value="admin">Administrador</option>
          </select>
          <div id="usuarioError" style="color:#dc3545;font-size:0.9rem;"></div>
          <div style="display:flex;gap:1rem;margin-top:0.5rem;">
            <button id="btnCrear" style="padding:0.5rem 1rem;background:#0044cc;color:white;border:none;border-radius:4px;cursor:pointer;">Crear</button>
            <button id="btnVolver" style="padding:0.5rem 1rem;background:#fff;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Volver</button>
          </div>
        </div>
      </div>`;

    document.getElementById('btnCrear').onclick = async () => {
      const email = document.getElementById('nuevoEmail').value.trim();
      const password = document.getElementById('nuevoPassword').value.trim();
      const role = document.getElementById('nuevoRol').value;
      const errorEl = document.getElementById('usuarioError');
      errorEl.textContent = '';
      if (!email || !password) {
        errorEl.textContent = 'Email y contraseña requeridos';
        return;
      }
      try {
        await UserService.addUser(email, password, role);
        document.getElementById('nuevoEmail').value = '';
        document.getElementById('nuevoPassword').value = '';
      } catch (e) {
        errorEl.textContent = e.message;
      }
    };

    document.getElementById('btnVolver').onclick = () => {
      window.dispatchEvent(new CustomEvent('navegacion', { detail: { vista: 'menu' } }));
    };
  }
}
