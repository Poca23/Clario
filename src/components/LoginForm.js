/**
 * 🔐 LOGIN FORM COMPONENT
 *
 * WHO: Formulaire de connexion
 * WHAT: Interface login
 * WHY: Authentifier l'utilisateur
 * HOW: Form + validation + masquage DOM
 */

import { AuthService } from "../services/auth.service.js";

export class LoginForm {
  constructor() {
    this.container = null;
    this.render();
    this.bindEvents();
  }

  render() {
    // Créer conteneur login
    this.container = document.createElement("div");
    this.container.id = "login-container";
    this.container.className = "login-container";
    this.container.innerHTML = `
      <div class="login-card">
        <h1 class="login-title">🎯 Clario</h1>
        <p class="login-subtitle">Connectez-vous pour continuer</p>
        
        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="cnd@gmail.com"
              required
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input 
              type="password" 
              id="password" 
              placeholder="••••••••"
              required
              autocomplete="current-password"
            >
          </div>

          <button type="submit" class="btn-primary btn-block">
            Se connecter
          </button>

          <p class="login-error" id="login-error"></p>
        </form>
      </div>
    `;

    // Masquer le contenu principal
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.style.display = "none";
    }

    // Ajouter au body
    document.body.prepend(this.container);
  }

  bindEvents() {
    const form = document.getElementById("login-form");
    const errorEl = document.getElementById("login-error");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      // Reset erreur
      errorEl.textContent = "";

      try {
        await AuthService.login(email, password);

        // ✅ MASQUER formulaire après succès
        this.hide();
      } catch (error) {
        errorEl.textContent = error.message;
      }
    });
  }

  /**
   * ✅ Masque le formulaire de login
   */
  hide() {
    if (this.container) {
      this.container.remove();
    }

    // Réafficher le contenu principal
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.style.display = "block";
    }
  }
}
