import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

let adminUids = null; // Cache for admin UIDs.
let userEmailCache = {}; // Cache for mapping UID to email for getLastVisitedClass.

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

  async _fetchUserEmail(uid) {
    if (userEmailCache[uid]) {
      return userEmailCache[uid];
    }
    try {
      const userRef = ref(db, `users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const email = snapshot.val();
        userEmailCache[uid] = email;
        return email;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user email:", error);
      return null;
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

  async getLastVisitedClass(uid) {
    if (!uid) return null;
    const email = await this._fetchUserEmail(uid);
    if (!email) return null;

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