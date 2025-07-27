import { ref, onValue, set } from 'firebase/database';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase.js';

// Global cache for users
const cache = {
  users: {}, // { uid: { email, role } }
  loaded: false
};

let unsubscribe = null;

export const UserService = {
  subscribeAll(onUpdate) {
    if (unsubscribe) unsubscribe();
    const usersRef = ref(db, 'usuarios');
    let first = true;
    return new Promise(resolve => {
      unsubscribe = onValue(usersRef, snapshot => {
        cache.users = snapshot.val() || {};
        cache.loaded = true;
        if (onUpdate) onUpdate();
        if (first) { first = false; resolve(); }
      });
    });
  },

  getUsers() {
    return cache.users;
  },

  getUserByEmail(email) {
    return Object.values(cache.users).find(u => u.email === email) || null;
  },

  isLoaded() {
    return cache.loaded;
  },

  async addUser(email, password, role) {
    const secondaryApp = initializeApp(auth.app.options, 'secondary');
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await set(ref(db, `usuarios/${cred.user.uid}`), { email, role });
      await signOut(secondaryAuth);
    } finally {
      await deleteApp(secondaryApp);
    }
  }
};
