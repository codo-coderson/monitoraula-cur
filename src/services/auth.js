import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { RolesService } from './roles.js';
import { auth, db } from '../config/firebase';

// Configurar persistencia local (equivalente a una cookie)
setPersistence(auth, browserLocalPersistence);

export const AuthService = {
  // Estado actual del usuario
  currentUser: null,
  isAdmin: false,
  lastVisitedClass: null,
  adminListenerUnsubscribe: null,

  // Inicializar el servicio de autenticación
  init() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // We only need the initial state once.
        this.currentUser = user;
        if (user) {
          await this.updateAdminStatus();
          this.listenForAdminChanges();
          this.lastVisitedClass = await RolesService.getLastVisitedClass(this.currentUser.email);
        } else {
          this.isAdmin = false;
          this.lastVisitedClass = null;
          if (this.adminListenerUnsubscribe) {
            this.adminListenerUnsubscribe();
          }
        }
        resolve(user);
      });
    });
  },

  async updateAdminStatus() {
    const wasAdmin = this.isAdmin;
    this.isAdmin = await RolesService.isAdmin(this.currentUser);
    if (wasAdmin !== this.isAdmin) {
      window.dispatchEvent(new CustomEvent('admin-status-changed'));
    }
  },

  listenForAdminChanges() {
    if (this.adminListenerUnsubscribe) {
      this.adminListenerUnsubscribe();
    }
    const designatedAdminsRef = ref(db, 'designated_admins');
    this.adminListenerUnsubscribe = onValue(designatedAdminsRef, () => {
      RolesService.invalidateAdminCache();
      this.updateAdminStatus();
    });
  },

  // Iniciar sesión
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      await this.updateAdminStatus();
      this.listenForAdminChanges();
      this.lastVisitedClass = await RolesService.getLastVisitedClass(this.currentUser.email);
      return userCredential.user;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw this.translateError(error);
    }
  },

  // Cerrar sesión
  async logout() {
    try {
      if (this.adminListenerUnsubscribe) {
        this.adminListenerUnsubscribe();
      }
      await signOut(auth);
      this.currentUser = null;
      this.isAdmin = false;
      this.lastVisitedClass = null;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw this.translateError(error);
    }
  },

  // Enviar email de restablecimiento de contraseña
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error al enviar email de restablecimiento:', error);
      throw this.translateError(error);
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!this.currentUser;
  },

  // Obtener el usuario actual
  getCurrentUser() {
    return this.currentUser;
  },

  // Actualizar última clase visitada
  async updateLastVisitedClass(className) {
    if (this.currentUser?.email) {
      await RolesService.setLastVisitedClass(this.currentUser.email, className);
      this.lastVisitedClass = className;
    }
  },

  // Traducir errores de Firebase a mensajes amigables
  translateError(error) {
    const errorMessages = {
      'auth/invalid-email': 'El correo electrónico no es válido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
      'auth/wrong-password': 'La contraseña es incorrecta',
      'auth/email-already-in-use': 'Este correo electrónico ya está en uso',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/weak-password': 'La contraseña es demasiado débil',
      'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
      'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión'
    };

    return new Error(errorMessages[error.code] || error.message);
  }
};
