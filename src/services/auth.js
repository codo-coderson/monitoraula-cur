import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from 'firebase/auth';
import { RolesService } from './roles.js';
import app from '../config/firebase';

const auth = getAuth(app);

// Configurar persistencia local (equivalente a una cookie)
setPersistence(auth, browserLocalPersistence);

export const AuthService = {
  // Estado actual del usuario
  currentUser: null,
  isAdmin: false,
  lastVisitedClass: null,

  // Inicializar el servicio de autenticación
  async init() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        if (user) {
          this.isAdmin = RolesService.isAdmin(user.email);
          this.lastVisitedClass = await RolesService.getLastVisitedClass(user.email);
        } else {
          this.isAdmin = false;
          this.lastVisitedClass = null;
        }
        resolve(user);
      });
    });
  },

  // Iniciar sesión
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      this.isAdmin = RolesService.isAdmin(email);
      this.lastVisitedClass = await RolesService.getLastVisitedClass(email);
      return userCredential.user;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw this.translateError(error);
    }
  },

  // Cerrar sesión
  async logout() {
    try {
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