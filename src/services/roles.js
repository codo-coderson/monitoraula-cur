import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

let adminUids = null; // Cache for admin UIDs.

export const RolesService = {
  async _fetchAdminUids() {
    if (adminUids) {
      return adminUids;
    }

    // Fetch fixed admins
    const fixedAdminsRef = ref(db, 'fixed_admins');
    const fixedAdminsSnap = await get(fixedAdminsRef);
    const fixedAdmins = fixedAdminsSnap.exists() ? fixedAdminsSnap.val() : {};

    // Fetch designated admins
    try {
      const designatedAdminsRef = ref(db, 'designated_admins');
      const designatedAdminsSnap = await get(designatedAdminsRef);
      const designatedAdmins = designatedAdminsSnap.exists() ? designatedAdminsSnap.val() : {};

      // Combine and get UIDs
      adminUids = [...Object.keys(fixedAdmins), ...Object.keys(designatedAdmins)];
      return adminUids;
    } catch (error) {
      console.error("Error fetching designated admins:", error);
      // If there's an error fetching designated admins, we'll just use fixed admins
      adminUids = Object.keys(fixedAdmins);
      return adminUids;
    }
  },

  async isAdmin(user) {
    if (!user || !user.uid) {
      return false;
    }
    const uids = await this._fetchAdminUids();
    return uids.includes(user.uid);
  },

  invalidateAdminCache() {
    adminUids = null;
  },

  async addAdmin(uid) {
    if (!uid) {
      throw new Error("UID is required to add an admin.");
    }
    const designatedAdminsRef = ref(db, `designated_admins/${uid}`);
    await set(designatedAdminsRef, true); // Set to true or any value to indicate presence
    this.invalidateAdminCache();
  },

  async getLastVisitedClass(email) {
    if (!email) return null;
    const sanitizedEmail = email.replace(/[.#$[\]]/g, '_');

    try {
      const userPrefsRef = ref(db, `userPreferences/${sanitizedEmail}`);
      const snapshot = await get(userPrefsRef);
      if (snapshot.exists()) {
        const prefs = snapshot.val();
        return prefs.lastClass || null;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener la última clase visitada:', error);
      return null;
    }
  },

  async setLastVisitedClass(email, className) {
    if (!email || !className) return;
    const sanitizedEmail = email.replace(/[.#$[\]]/g, '_');
    try {
      const userPrefsRef = ref(db, `userPreferences/${sanitizedEmail}`);
      await set(userPrefsRef, {
        lastClass: className,
        lastVisit: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al guardar la última clase visitada:', error);
    }
  }
};
