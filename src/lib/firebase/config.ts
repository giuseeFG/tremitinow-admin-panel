
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
// import { getFirestore, Firestore } from "firebase/firestore"; // Firestore non è configurato in questo step

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
// let db: Firestore; // Firestore non è configurato in questo step

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
// db = getFirestore(app); // Firestore non è configurato in questo step

export { app, auth /*, db */ };
