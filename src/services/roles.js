import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

const ADMIN_EMAILS = [
  'salvador.fernandez@salesianas.org',
  'codocoderson@gmail.com'
];

export const RolesService = {
  isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
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