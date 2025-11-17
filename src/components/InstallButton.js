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
    console.log("✅ InstallButton initialisé");
  }

  /**
   * 🎨 Crée le bouton dans le DOM
   */
  createButton() {
    // Créer élément
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

    // Injecter dans header
    const headerActions = document.querySelector(".header-actions");
    if (headerActions) {
      headerActions.insertBefore(this.button, headerActions.firstChild);
    }
  }

  /**
   * 🔗 Lie les événements
   */
  bindEvents() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.show();
      console.log("✅ Installation PWA disponible");
    });

    // ✅ AJOUT: Forcer affichage en dev (localhost)
    if (
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    ) {
      setTimeout(() => {
        if (!this.deferredPrompt) {
          console.log(
            "ℹ️ Mode DEV: bouton visible (pas installable réellement)"
          );
          this.show();
        }
      }, 1000);
    }

    // ✅ Clic sur bouton
    this.button.addEventListener("click", () => this.install());

    // ✅ Détecter installation réussie
    window.addEventListener("appinstalled", () => {
      this.hide();
      this.deferredPrompt = null;
      console.log("✅ PWA installée avec succès");
    });

    // ✅ Cacher si déjà installé (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      this.hide();
      console.log("ℹ️ App déjà installée");
    }
  }

  /**
   * 📥 Déclenche l'installation
   */
  async install() {
    if (!this.deferredPrompt) {
      console.warn("⚠️ Prompt installation non disponible");
      return;
    }

    try {
      // Afficher prompt natif
      this.deferredPrompt.prompt();

      // Attendre choix utilisateur
      const { outcome } = await this.deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("✅ Utilisateur a accepté l'installation");
      } else {
        console.log("❌ Installation refusée");
      }

      // Reset
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

    // Animation d'apparition après 2s
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
