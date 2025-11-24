/**
 * 🎯 INSTALL BUTTON COMPONENT
 *
 * WHO: Bouton d'installation PWA discret
 * WHAT: Prompt natif d'installation Progressive Web App
 * WHY: Permettre installation offline de l'app
 * HOW: beforeinstallprompt event + design subtil
 */

export class InstallButton {
  constructor() {
    this.deferredPrompt = null;
    this.button = null;
    this.init();
  }

  /**
   * 🚀 Initialisation
   */
  init() {
    this.createButton();
    this.bindEvents();
  }

  /**
   * 🎨 Crée le bouton dans le DOM
   */
  createButton() {
    this.button = document.createElement("button");
    this.button.id = "install-btn";
    this.button.className = "install-btn hidden";
    this.button.setAttribute("aria-label", "Installer l'application");
    this.button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <span class="install-btn__text">Installer</span>
    `;

    const headerActions = document.querySelector(".header-actions");
    if (headerActions) {
      headerActions.insertBefore(this.button, headerActions.firstChild);
    }
  }

  /**
   * 🔗 Lie les événements
   */
  bindEvents() {
    // Écoute événement installation natif
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.show();
    });

    // Mode dev: affichage forcé (localhost uniquement)
    if (
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    ) {
      setTimeout(() => {
        if (!this.deferredPrompt) this.show();
      }, 1000);
    }

    // Déclenchement installation
    this.button.addEventListener("click", () => this.install());

    // Détection installation réussie
    window.addEventListener("appinstalled", () => {
      this.hide();
      this.deferredPrompt = null;
    });

    // Cache si déjà installé
    if (window.matchMedia("(display-mode: standalone)").matches) {
      this.hide();
    }
  }

  /**
   * 📥 Déclenche l'installation
   */
  async install() {
    if (!this.deferredPrompt) {
      console.warn("⚠️ Installation non disponible");
      return;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      this.deferredPrompt = null;
      this.hide();
    } catch (error) {
      console.error("❌ Erreur installation:", error);
    }
  }

  /**
   * 👁️ Affiche le bouton
   */
  show() {
    this.button.classList.remove("hidden");
    setTimeout(() => {
      this.button.classList.add("visible");
    }, 2000);
  }

  /**
   * 🙈 Cache le bouton
   */
  hide() {
    this.button.classList.remove("visible");
    setTimeout(() => {
      this.button.classList.add("hidden");
    }, 300);
  }
}
