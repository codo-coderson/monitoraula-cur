import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

let adminUids = null; // Cache for admin UIDs.
let userEmailCache = {}; // Cache for mapping UID to email for getLastVisitedClass.

export const RolesService = {
  async _fetchAdminUids() {
    try {
      // Always fetch fresh admin data to avoid stale cache issues
      console.log('🔍 Fetching admin UIDs...');

      // Fetch fixed admins
      const fixedAdminsRef = ref(db, 'fixed_admins');
      const fixedAdminsSnap = await get(fixedAdminsRef);
      const fixedAdmins = fixedAdminsSnap.exists() ? fixedAdminsSnap.val() : {};
      console.log('✅ Fixed admins:', Object.keys(fixedAdmins));

      // Fetch designated admins
      const designatedAdminsRef = ref(db, 'designated_admins');
      const designatedAdminsSnap = await get(designatedAdminsRef);
      const designatedAdmins = designatedAdminsSnap.exists() ? designatedAdminsSnap.val() : {};
      console.log('✅ Designated admins:', Object.keys(designatedAdmins));

      // Combine and get UIDs
      const combinedUids = [...Object.keys(fixedAdmins), ...Object.keys(designatedAdmins)];
      console.log('✅ Combined admin UIDs:', combinedUids);

      // Update cache
      adminUids = combinedUids;
      return adminUids;
    } catch (error) {
      console.error("❌ Error fetching admin UIDs:", error);
      // On error, invalidate cache to force fresh fetch next time
      this.invalidateAdminCache();
      return [];
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
    try {
      if (!user || !user.uid) {
        console.log('❌ No user or uid provided for admin check');
        return false;
      }

      // Always fetch fresh admin data
      const uids = await this._fetchAdminUids();
      const isAdmin = uids.includes(user.uid);
      
      console.log(`🔍 Admin check for ${user.email} (${user.uid}):`, isAdmin);
      return isAdmin;
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      return false;
    }
  },

  invalidateAdminCache() {
    console.log('🔄 Invalidating admin cache');
    adminUids = null;
    userEmailCache = {};
  },

  async addAdmin(uid) {
    if (!uid) {
      throw new Error("UID is required to add an admin.");
    }
    try {
      const designatedAdminsRef = ref(db, `designated_admins/${uid}`);
      await set(designatedAdminsRef, true);
      console.log('✅ Added new admin:', uid);
      this.invalidateAdminCache();
    } catch (error) {
      console.error('❌ Error adding admin:', error);
      throw error;
    }
  },

  async getLastVisitedClass(email) {
    if (!email) return null;

    try {
      const sanitizedEmail = email.replace(/[.#$[\]]/g, '_');
      const userPrefsRef = ref(db, `userPreferences/${sanitizedEmail}`);
      const snapshot = await get(userPrefsRef);
      if (snapshot.exists()) {
        const prefs = snapshot.val();
        return prefs.lastClass || null;
      }
      return null;
    } catch (error) {
      console.error('❌ Error al obtener la última clase visitada:', error);
      return null;
    }
  },

  async setLastVisitedClass(email, className) {
    if (!email || !className) return;

    try {
      const sanitizedEmail = email.replace(/[.#$[\]]/g, '_');
      const userPrefsRef = ref(db, `userPreferences/${sanitizedEmail}`);
      await set(userPrefsRef, {
        lastClass: className,
        lastVisit: new Date().toISOString()
      });
      console.log('✅ Updated last visited class:', { email, className });
    } catch (error) {
      console.error('❌ Error al guardar la última clase visitada:', error);
    }
  }
};