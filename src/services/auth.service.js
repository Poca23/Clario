/**
 * 🔐 AUTHENTICATION SERVICE
 *
 * WHO: Service d'authentification
 * WHAT: Gère login/logout Firebase
 * WHY: Sécuriser l'accès à l'app
 * HOW: Firebase Auth email/password
 */

import { auth } from "../config/firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export class AuthService {
  /**
   * Connexion utilisateur
   */
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("✅ Connexion OK:", userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error("❌ Erreur connexion:", error.message);
      throw new Error("Email ou mot de passe incorrect");
    }
  }

  /**
   * Déconnexion
   */
  static async logout() {
    try {
      await signOut(auth);
      console.log("✅ Déconnexion OK");
    } catch (error) {
      console.error("❌ Erreur déconnexion:", error);
    }
  }

  /**
   * Écoute changements auth
   */
  static onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Utilisateur actuel
   */
  static getCurrentUser() {
    return auth.currentUser;
  }
}
