import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  initializeAuth,
  getApps
} from 'firebase/auth';
import { ref, get, set, push, onValue, off } from 'firebase/database';
import { db } from '../config/firebase';
import { initializeApp } from 'firebase/app';

// Caché global en memoria
let usersCache = new Map();
let rolesCache = new Map();
let isInitialized = false;
let dataListener = null;

export const UserManagementService = {
  // Inicializar el servicio y cargar datos
  async init() {
    if (isInitialized) {
      return;
    }

    console.log('🔄 Inicializando servicio de gestión de usuarios...');
    
    try {
      // Cargar usuarios de Firebase Auth y roles de Realtime Database
      await this.loadInitialData();
      
      // Configurar listener para cambios en roles
      this.setupRolesListener();
      
      isInitialized = true;
      console.log('✅ Servicio de gestión de usuarios inicializado');
    } catch (error) {
      console.error('❌ Error al inicializar gestión de usuarios:', error);
      throw error;
    }
  },

  // Cargar datos iniciales
  async loadInitialData() {
    console.log('🔄 Cargando datos iniciales de usuarios...');
    
    // Cargar roles de la base de datos
    const rolesRef = ref(db, 'userRoles');
    const snapshot = await get(rolesRef);
    
    if (snapshot.exists()) {
      const rolesData = snapshot.val();
      rolesCache.clear();
      
      Object.entries(rolesData).forEach(([email, roleData]) => {
        rolesCache.set(email, {
          role: roleData.role,
          createdAt: roleData.createdAt,
          createdBy: roleData.createdBy
        });
      });
      
      console.log('✅ Roles cargados:', rolesCache.size, 'usuarios');
    } else {
      console.log('ℹ️ No hay roles definidos aún');
    }

    // Inicializar caché de usuarios con los que tienen roles
    usersCache.clear();
    rolesCache.forEach((roleData, email) => {
      usersCache.set(email, {
        email: email,
        role: roleData.role,
        exists: false, // Se actualizará cuando se verifique en Auth
        createdAt: roleData.createdAt,
        createdBy: roleData.createdBy
      });
    });
  },

  // Configurar listener para cambios en roles
  setupRolesListener() {
    if (dataListener) {
      off(ref(db, 'userRoles'), 'value', dataListener);
    }

    const rolesRef = ref(db, 'userRoles');
    dataListener = onValue(rolesRef, (snapshot) => {
      console.log('🔄 Actualizando caché de roles...');
      
      rolesCache.clear();
      usersCache.clear();
      
      if (snapshot.exists()) {
        const rolesData = snapshot.val();
        
        Object.entries(rolesData).forEach(([email, roleData]) => {
          rolesCache.set(email, {
            role: roleData.role,
            createdAt: roleData.createdAt,
            createdBy: roleData.createdBy
          });
          
          usersCache.set(email, {
            email: email,
            role: roleData.role,
            exists: false,
            createdAt: roleData.createdAt,
            createdBy: roleData.createdBy
          });
        });
        
        console.log('✅ Caché actualizado:', rolesCache.size, 'usuarios');
      }
    });
  },

  // Crear nuevo usuario
  async createUser(email, password, role, createdBy) {
    console.log('🔄 Creando usuario:', { email, role, createdBy });
    
    // Validar datos
    if (!email || !password || !role) {
      throw new Error('Email, contraseña y rol son requeridos');
    }
    
    if (!['admin', 'teacher'].includes(role)) {
      throw new Error('Rol debe ser "admin" o "teacher"');
    }

    // Obtener la configuración de Firebase de la aplicación principal
    const app = getApps()[0];
    const config = app.options;
    
    // Crear un nombre único para la aplicación secundaria
    const secondaryAppName = `secondary-${Date.now()}`;
    
    // Crear una aplicación secundaria para crear usuarios sin afectar la sesión actual
    const secondaryApp = initializeApp({
      ...config,
      databaseURL: config.databaseURL
    }, secondaryAppName);
    
    const secondaryAuth = getAuth(secondaryApp);
    let userCredential = null;
    
    try {
      // Crear usuario en Firebase Auth con la instancia secundaria
      userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      
      // Inmediatamente cerrar sesión del usuario recién creado
      await signOut(secondaryAuth);
      
      console.log('✅ Usuario creado en Auth:', email);
      
      // Agregar rol a la base de datos
      const roleData = {
        role: role,
        createdAt: new Date().toISOString(),
        createdBy: createdBy
      };
      
      const roleRef = ref(db, `userRoles/${email.replace(/[.#$[\]]/g, '_')}`);
      await set(roleRef, roleData);
      
      // Actualizar caché inmediatamente
      rolesCache.set(email, roleData);
      usersCache.set(email, {
        email: email,
        role: role,
        exists: true,
        createdAt: roleData.createdAt,
        createdBy: roleData.createdBy
      });
      
      console.log('✅ Usuario y rol guardados:', email);
      
      // Limpiar la aplicación secundaria
      await secondaryApp.delete();
      
      return {
        email: email,
        role: role,
        createdAt: roleData.createdAt,
        createdBy: roleData.createdBy
      };
      
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      
      // Limpiar la aplicación secundaria en caso de error
      try {
        if (userCredential?.user) {
          await signOut(secondaryAuth);
        }
        await secondaryApp.delete();
      } catch (cleanupError) {
        console.error('❌ Error al limpiar aplicación secundaria:', cleanupError);
      }
      
      throw this.translateError(error);
    }
  },

  // Obtener todos los usuarios
  getUsers() {
    return Array.from(usersCache.values()).map(user => ({ ...user }));
  },

  // Obtener rol de un usuario
  getUserRole(email) {
    return rolesCache.get(email)?.role || null;
  },

  // Verificar si es administrador
  isAdmin(email) {
    return this.getUserRole(email) === 'admin';
  },

  // Verificar si es profesor
  isTeacher(email) {
    return this.getUserRole(email) === 'teacher';
  },

  // Verificar si tiene permisos de administrador (para compatibilidad)
  hasAdminPermissions(email) {
    return this.isAdmin(email);
  },

  // Actualizar rol de usuario
  async updateUserRole(email, newRole, updatedBy) {
    console.log('🔄 Actualizando rol de usuario:', { email, newRole, updatedBy });
    
    if (!['admin', 'teacher'].includes(newRole)) {
      throw new Error('Rol debe ser "admin" o "teacher"');
    }

    try {
      const roleData = {
        role: newRole,
        createdAt: rolesCache.get(email)?.createdAt || new Date().toISOString(),
        createdBy: rolesCache.get(email)?.createdBy || updatedBy,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy
      };
      
      const roleRef = ref(db, `userRoles/${email.replace(/[.#$[\]]/g, '_')}`);
      await set(roleRef, roleData);
      
      console.log('✅ Rol actualizado:', email);
      
    } catch (error) {
      console.error('❌ Error al actualizar rol:', error);
      throw this.translateError(error);
    }
  },

  // Eliminar usuario (solo rol, no del Auth)
  async removeUserRole(email) {
    console.log('🔄 Eliminando rol de usuario:', email);
    
    try {
      const roleRef = ref(db, `userRoles/${email.replace(/[.#$[\]]/g, '_')}`);
      await set(roleRef, null);
      
      console.log('✅ Rol eliminado:', email);
      
    } catch (error) {
      console.error('❌ Error al eliminar rol:', error);
      throw this.translateError(error);
    }
  },

  // Traducir errores
  translateError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'Este correo electrónico ya está en uso',
      'auth/invalid-email': 'El correo electrónico no es válido',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/weak-password': 'La contraseña es demasiado débil (mínimo 6 caracteres)',
      'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde'
    };

    return new Error(errorMessages[error.code] || error.message);
  },

  // Limpiar listeners al destruir
  destroy() {
    if (dataListener) {
      off(ref(db, 'userRoles'), 'value', dataListener);
      dataListener = null;
    }
    
    usersCache.clear();
    rolesCache.clear();
    isInitialized = false;
  }
};