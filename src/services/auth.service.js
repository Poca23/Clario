/**
 * 🔐 AUTHENTICATION SERVICE
 * Gère login/logout Firebase Auth
 */

import { auth } from "../config/firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export class AuthService {
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw new Error("Email ou mot de passe incorrect");
    }
  }

  static async logout() {
    await signOut(auth);
  }

  static onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  static getCurrentUser() {
    return auth.currentUser;
  }
}
