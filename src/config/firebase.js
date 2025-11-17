/**
 * 🔥 FIREBASE CONFIGURATION
 *
 * WHO: Service de connexion Firebase
 * WHAT: Initialise Firestore + Auth
 * WHY: Persistance cloud + sync multi-devices
 * HOW: SDK Firebase v9 CDN
 */

// Import depuis CDN Firebase (compatible navigateur)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDqb-NdZ7qpwGgew9MnC_Zd5-vjqx141F4",
  authDomain: "clario-cnd.firebaseapp.com",
  projectId: "clario-cnd",
  storageBucket: "clario-cnd.firebasestorage.app",
  messagingSenderId: "638758511632",
  appId: "1:638758511632:web:3aaff5535673c16f775695",
};

// Initialisation
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log("🔥 Firebase initialisé avec succès");
