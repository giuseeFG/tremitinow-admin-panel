
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage"; // Import getStorage

// Configurazione Firebase fornita dall'utente
const firebaseConfig = {
  apiKey: "AIzaSyAtqDF-CPR2wyxwOaocKOsaCrcVm7NFwTE",
  authDomain: "tremti-n.firebaseapp.com",
  databaseURL: "https://tremti-n.firebaseio.com",
  projectId: "tremti-n",
  storageBucket: "tremti-n.appspot.com",
  messagingSenderId: "937307554070",
  appId: "1:937307554070:web:bb29dc6b63d13a6b5d9037",
  measurementId: "G-VKR5GJMR97"
};

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage; // Declare storage

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
storage = getStorage(app); // Initialize storage

export { app, auth, storage }; // Export storage
