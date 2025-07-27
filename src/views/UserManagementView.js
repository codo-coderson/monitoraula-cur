import { UserManagementService } from '../services/userManagement.js';
import { AuthService } from '../services/auth.js';

export class UserManagementView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    console.log('🔄 Renderizando vista de gestión de usuarios...');
    
    try {
      // Inicializar el servicio si no está inicializado
      await UserManagementService.init();
      
      const users = UserManagementService.getUsers();
      
      this.container.innerHTML = `
        <div style="
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
          ">
            <h1 style="
              margin: 0;
              color: var(--gray-800);
              font-size: var(--font-size-xl);
            ">👥 Gestión de Usuarios</h1>
            <button id="addUserBtn" style="
              padding: 0.75rem 1.5rem;
              background: var(--success-color);
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: var(--font-size-base);
              display: flex;
              align-items: center;
              gap: 0.5rem;
            ">
              ➕ Añadir Usuario
            </button>
          </div>

          <!-- Formulario para añadir usuario -->
          <div id="addUserForm" style="
            display: none;
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            border: 1px solid #dee2e6;
          ">
            <h3 style="margin: 0 0 1rem 0; color: var(--gray-800);">Crear Nuevo Usuario</h3>
            <form id="userForm">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 1rem; align-items: end;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                    📧 Email
                  </label>
                  <input type="email" id="userEmail" required style="
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    font-size: var(--font-size-base);
                  " placeholder="usuario@ejemplo.com">
                </div>
                
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                    🔒 Contraseña
                  </label>
                  <input type="password" id="userPassword" required style="
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    font-size: var(--font-size-base);
                  " placeholder="Mínimo 6 caracteres">
                </div>
                
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                    👑 Rol
                  </label>
                  <select id="userRole" required style="
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    font-size: var(--font-size-base);
                    background: white;
                  ">
                    <option value="">Seleccionar rol</option>
                    <option value="admin">👑 Administrador</option>
                    <option value="teacher">👨‍🏫 Profesor</option>
                  </select>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                  <button type="submit" style="
                    padding: 0.75rem 1rem;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                  ">✅ Crear</button>
                  <button type="button" id="cancelBtn" style="
                    padding: 0.75rem 1rem;
                    background: var(--gray-500);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                  ">❌ Cancelar</button>
                </div>
              </div>
            </form>
          </div>

          <!-- Lista de usuarios -->
          <div style="
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">
            <div style="
              background: var(--primary-color);
              color: white;
              padding: 1rem;
              font-weight: 600;
            ">
              Lista de Usuarios (${users.length})
            </div>
            
            <div id="usersList">
              ${users.length === 0 ? this.renderEmptyState() : this.renderUsersList(users)}
            </div>
          </div>

          <!-- Loading overlay -->
          <div id="loadingOverlay" style="
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              background: white;
              padding: 2rem;
              border-radius: 8px;
              text-align: center;
            ">
              <div style="margin-bottom: 1rem; font-size: 2rem;">⏳</div>
              <div>Creando usuario...</div>
            </div>
          </div>
        </div>
      `;

      this.setupEvents();
      
    } catch (error) {
      console.error('❌ Error al renderizar gestión de usuarios:', error);
      this.mostrarError(error.message);
    }
  }

  renderEmptyState() {
    return `
      <div style="
        padding: 3rem;
        text-align: center;
        color: var(--gray-600);
      ">
        <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
        <h3 style="margin: 0 0 0.5rem 0;">No hay usuarios creados</h3>
        <p style="margin: 0;">Haz clic en "Añadir Usuario" para crear el primero</p>
      </div>
    `;
  }

  renderUsersList(users) {
    return users.map((user, index) => `
      <div style="
        padding: 1rem;
        border-bottom: ${index === users.length - 1 ? 'none' : '1px solid #eee'};
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div style="flex: 1;">
          <div style="
            font-weight: 500;
            color: var(--gray-800);
            margin-bottom: 0.25rem;
          ">
            📧 ${user.email}
          </div>
          <div style="
            display: flex;
            gap: 1rem;
            font-size: var(--font-size-sm);
            color: var(--gray-600);
          ">
            <span>
              ${user.role === 'admin' ? '👑 Administrador' : '👨‍🏫 Profesor'}
            </span>
            <span>
              📅 Creado: ${new Date(user.createdAt).toLocaleDateString('es-ES')}
            </span>
            <span>
              👤 Por: ${user.createdBy}
            </span>
          </div>
        </div>
        
        <div style="display: flex; gap: 0.5rem;">
          <select class="roleSelector" data-email="${user.email}" style="
            padding: 0.5rem;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: var(--font-size-sm);
          ">
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
            <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>👨‍🏫 Profesor</option>
          </select>
          
          <button class="deleteUserBtn" data-email="${user.email}" style="
            padding: 0.5rem 0.75rem;
            background: var(--danger-color);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: var(--font-size-sm);
          ">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  setupEvents() {
    // Botón añadir usuario
    const addUserBtn = document.getElementById('addUserBtn');
    const addUserForm = document.getElementById('addUserForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const userForm = document.getElementById('userForm');

    addUserBtn.onclick = () => {
      addUserForm.style.display = 'block';
      document.getElementById('userEmail').focus();
    };

    cancelBtn.onclick = () => {
      addUserForm.style.display = 'none';
      userForm.reset();
    };

    // Formulario de creación
    userForm.onsubmit = async (e) => {
      e.preventDefault();
      await this.createUser();
    };

    // Selectores de rol
    const roleSelectors = document.querySelectorAll('.roleSelector');
    roleSelectors.forEach(selector => {
      selector.onchange = async (e) => {
        await this.updateUserRole(e.target.dataset.email, e.target.value);
      };
    });

    // Botones de eliminar
    const deleteButtons = document.querySelectorAll('.deleteUserBtn');
    deleteButtons.forEach(button => {
      button.onclick = async (e) => {
        await this.deleteUser(e.target.dataset.email);
      };
    });
  }

  async createUser() {
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const currentUser = AuthService.getCurrentUser();

    if (!email || !password || !role) {
      alert('Todos los campos son requeridos');
      return;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      this.showLoading(true);
      
      await UserManagementService.createUser(email, password, role, currentUser.email);
      
      alert(`✅ Usuario ${email} creado correctamente con rol de ${role === 'admin' ? 'administrador' : 'profesor'}`);
      
      // Limpiar formulario y ocultarlo
      document.getElementById('userForm').reset();
      document.getElementById('addUserForm').style.display = 'none';
      
      // Recargar la vista
      await this.render();
      
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      alert('Error al crear usuario: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  async updateUserRole(email, newRole) {
    const currentUser = AuthService.getCurrentUser();
    
    try {
      await UserManagementService.updateUserRole(email, newRole, currentUser.email);
      alert(`✅ Rol de ${email} actualizado a ${newRole === 'admin' ? 'administrador' : 'profesor'}`);
      
    } catch (error) {
      console.error('❌ Error al actualizar rol:', error);
      alert('Error al actualizar rol: ' + error.message);
      // Recargar para restaurar el valor anterior
      await this.render();
    }
  }

  async deleteUser(email) {
    if (!confirm(`⚠️ ¿Está seguro de eliminar los permisos del usuario ${email}?\n\nNOTA: Esto solo eliminará el rol, el usuario seguirá existiendo en Firebase Auth.`)) {
      return;
    }

    try {
      await UserManagementService.removeUserRole(email);
      alert(`✅ Permisos de ${email} eliminados correctamente`);
      
      // Recargar la vista
      await this.render();
      
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      alert('Error al eliminar usuario: ' + error.message);
    }
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }

  mostrarError(mensaje) {
    this.container.innerHTML = `
      <div style="
        max-width: 600px;
        margin: 2rem auto;
        padding: 2rem;
        background: #fff;
        border: 1px solid #dc3545;
        border-radius: 8px;
        color: #dc3545;
        text-align: center;
      ">
        <h2 style="margin: 0 0 1rem 0;">⚠️ Error</h2>
        <p style="margin: 0 0 1rem 0;">${mensaje}</p>
        <button onclick="window.location.reload()" style="
          padding: 0.75rem 1.5rem;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">
          🔄 Reintentar
        </button>
      </div>
    `;
  }
}