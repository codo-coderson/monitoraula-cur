import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

// Lista estática de administradores (fallback)
const ADMIN_EMAILS = [
  'salvador.fernandez@salesianas.org',
  'codocoderson@gmail.com'
];

export const RolesService = {
  isAdmin(email) {
    // Primero verificar en el sistema de gestión de usuarios
    if (typeof window !== 'undefined' && window.UserManagementService) {
      const role = window.UserManagementService.getUserRole(email);
      if (role === 'admin') {
        return true;
      }
      if (role === 'teacher') {
        return false;
      }
    }
    
    // Fallback a la lista estática para compatibilidad
    return ADMIN_EMAILS.includes(email);
  },

  isTeacher(email) {
    // Verificar en el sistema de gestión de usuarios
    if (typeof window !== 'undefined' && window.UserManagementService) {
      const role = window.UserManagementService.getUserRole(email);
      return role === 'teacher';
    }
    
    return false;
  },

  // Método para compatibilidad - verificar si tiene permisos para ver todo
  hasFullAccess(email) {
    return this.isAdmin(email);
  },

  // Método para verificar si puede ver solo visitas al WC
  canViewVisits(email) {
    return this.isAdmin(email) || this.isTeacher(email);
  },

  async getLastVisitedClass(email) {
    try {
      const userPrefsRef = ref(db, `userPreferences/${email.replace(/[.#$[\]]/g, '_')}`);
      const snapshot = await get(userPrefsRef);
      return snapshot.exists() ? snapshot.val().lastClass : null;
    } catch (error) {
      console.error('Error al obtener la última clase visitada:', error);
      return null;
    }
  },

  async setLastVisitedClass(email, className) {
    try {
      const userPrefsRef = ref(db, `userPreferences/${email.replace(/[.#$[\]]/g, '_')}`);
      await set(userPrefsRef, {
        lastClass: className,
        lastVisit: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al guardar la última clase visitada:', error);
    }
  }
}; 