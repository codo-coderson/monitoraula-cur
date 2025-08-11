export class AdminBDView {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 1rem;">
        <h2 style="margin: 0 0 1.5rem 0; font-size: var(--font-size-lg); color: var(--gray-800); font-weight:600;">
          🛠️ Administración BD
        </h2>
        <p style="margin: 0 0 1.5rem 0; color: var(--gray-700); font-size: var(--font-size-base);">
          Accesos directos a la consola de Firebase para tareas administrativas.
        </p>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <a href="https://console.firebase.google.com/project/monitoraula-cur/authentication/users?hl=es-419" target="_blank" rel="noopener noreferrer" style="
            display: block; padding: 1rem 1.25rem; background:#fff; border:1px solid var(--gray-300); border-radius:8px; text-decoration:none; color: var(--primary-color); font-weight:500;">
            👥 Gestión de usuarios
            <div style="font-size: var(--font-size-sm); color: var(--gray-600); font-weight:400; margin-top:0.25rem;">Ver, buscar y gestionar cuentas de usuario.</div>
          </a>
          <a href="https://console.firebase.google.com/project/monitoraula-cur/database/monitoraula-cur-default-rtdb/data?hl=es-419" target="_blank" rel="noopener noreferrer" style="
            display: block; padding: 1rem 1.25rem; background:#fff; border:1px solid var(--gray-300); border-radius:8px; text-decoration:none; color: var(--primary-color); font-weight:500;">
            👑 Hacer administrador a otro usuario
            <div style="font-size: var(--font-size-sm); color: var(--gray-600); font-weight:400; margin-top:0.25rem;">Añade el UID en <code>designated_admins</code> o <code>fixed_admins</code>.</div>
          </a>
          <a href="https://console.firebase.google.com/project/monitoraula-cur/database/monitoraula-cur-default-rtdb/data?hl=es-419" target="_blank" rel="noopener noreferrer" style="
            display: block; padding: 1rem 1.25rem; background:#fff; border:1px solid var(--gray-300); border-radius:8px; text-decoration:none; color: var(--primary-color); font-weight:500;">
            ➕ Dar de alta un nuevo alumno
            <div style="font-size: var(--font-size-sm); color: var(--gray-600); font-weight:400; margin-top:0.25rem;">Inserta manualmente la entrada correspondiente dentro de <code>alumnos</code>.</div>
          </a>
          <a href="https://console.firebase.google.com/project/monitoraula-cur/authentication/usage/current-billing?hl=es-419" target="_blank" rel="noopener noreferrer" style="
            display: block; padding: 1rem 1.25rem; background:#fff; border:1px solid var(--gray-300); border-radius:8px; text-decoration:none; color: var(--primary-color); font-weight:500;">
            📈 Ver métricas de la base de datos
            <div style="font-size: var(--font-size-sm); color: var(--gray-600); font-weight:400; margin-top:0.25rem;">Uso y facturación de autenticación / base de datos.</div>
          </a>
        </div>
      </div>
    `;
  }
}
