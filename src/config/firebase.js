import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.europe-west1.firebasedatabase.app`
};

console.log('🔍 Firebase Config:', {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: firebaseConfig.databaseURL,
  hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY
});

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Configurar autenticación con persistencia local
const auth = getAuth(app);

// Ensure authentication state persists across browser sessions and devices
// This is critical for keeping users logged in
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Persistencia de autenticación configurada correctamente');
  })
  .catch((error) => {
    console.error('❌ Error configurando persistencia:', error);
  });

// Configurar Realtime Database
const db = getDatabase(app);

export { auth, db };