import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';
import { AuthService } from './auth.js';

let adminUids = null; // Cache for admin UIDs

export const RolesService = {
  async _fetchAdminUids() {
    if (adminUids) {
      return adminUids;
    }
    const fixedAdminsRef = ref(db, 'fixed_admins');
    const designatedAdminsRef = ref(db, 'designated_admins');
    const [fixedAdminsSnap, designatedAdminsSnap] = await Promise.all([
      get(fixedAdminsRef),
      get(designatedAdminsRef)
    ]);
    const fixedUids = fixedAdminsSnap.exists() ? Object.keys(fixedAdminsSnap.val()) : [];
    const designatedUids = designatedAdminsSnap.exists() ? Object.keys(designatedAdminsSnap.val()) : [];
    adminUids = [...fixedUids, ...designatedUids];
    return adminUids;
  },

  async isAdmin(user) {
    if (!user) {
      return false;
    }
    const uids = await this._fetchAdminUids();
    return uids.includes(user.uid);
  },

  invalidateAdminCache() {
    adminUids = null;
  },

  async addAdmin(email) {
    const sanitizedEmail = email.replace(/[.#$[\]]/g, '_');
    const userRef = ref(db, `users/${sanitizedEmail}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    const uid = snapshot.val();
    const designatedAdminsRef = ref(db, `designated_admins/${uid}`);
    await set(designatedAdminsRef, email);
    this.invalidateAdminCache();
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