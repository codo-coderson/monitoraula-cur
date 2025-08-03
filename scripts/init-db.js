import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.europe-west1.firebasedatabase.app`
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Datos de ejemplo
const datosIniciales = {
  clases: ['1A', '1B', '2A', '2B'],
  alumnos: {
    '1A': {
      'Juan_Perez': {
        nombre: 'Juan Pérez'
      },
      'Ana_Garcia': {
        nombre: 'Ana García'
      }
    },
    '1B': {
      'Pedro_Lopez': {
        nombre: 'Pedro López'
      },
      'Maria_Rodriguez': {
        nombre: 'María Rodríguez'
      }
    }
  },
  fixed_admins: {
    'yEQpuLmSnqhg03XwbQAaJ2TtVhk2': 'salvador.fernandez@salesianas.org',
    'W1WvJJB88DMLETAYWhDzeqGiBEw1': 'codocoderson@gmail.com'
  },
  designated_admins: {},
  users: {
    'salvador_fernandez@salesianas_org': 'yEQpuLmSnqhg03XwbQAaJ2TtVhk2',
    'codocoderson@gmail_com': 'W1WvJJB88DMLETAYWhDzeqGiBEw1'
  }
};

// Función para inicializar la base de datos
async function inicializarDB() {
  try {
    // Guardar clases
    await set(ref(db, 'clases'), datosIniciales.clases);
    
    // Guardar alumnos
    for (const [clase, alumnos] of Object.entries(datosIniciales.alumnos)) {
      await set(ref(db, `alumnos/${clase}`), alumnos);
    }
    
    // Guardar admins
    await set(ref(db, 'fixed_admins'), datosIniciales.fixed_admins);
    await set(ref(db, 'designated_admins'), datosIniciales.designated_admins);
    await set(ref(db, 'users'), datosIniciales.users);

    console.log('Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar inicialización
inicializarDB(); 