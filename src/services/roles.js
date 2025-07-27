import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';
import { UserService } from './users.js';

export const RolesService = {
  isAdmin(email) {
    const user = UserService.getUserByEmail(email);
    return user?.role === 'admin';
  },

  getRole(email) {
    return UserService.getUserByEmail(email)?.role || null;
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
