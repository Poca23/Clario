import TaskManager from './modules/TaskManager.js';
import UIManager from './modules/UIManager.js';
import ThemeManager from './modules/theme.js';
import KeyboardManager from './keyboard.js';

class ClarioApp {
  constructor() {
    this.taskManager = null;
    this.uiManager = null;
    this.deferredPrompt = null;
    this.init();
  }

  async init() {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', {
          scope: './'
        })
        .then((registration) => {
          console.log('✅ SW enregistré:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ SW échec:', error);
        });
      });
    }

    // Initialiser les managers
    const themeManager = new ThemeManager();

    try {
      // Initialiser le gestionnaire de tâches
      this.taskManager = new TaskManager();
      
      // Initialiser l'interface utilisateur
      this.uiManager = new UIManager(this.taskManager);
      const keyboardManager = new KeyboardManager(this.uiManager);

      // Rendre disponible globalement pour les événements inline
      window.uiManager = this.uiManager;
      
      // Rendu initial
      this.uiManager.renderTasks();
      this.uiManager.renderProgress();
      
      // Configurer la PWA
      this.setupPWAInstall();
      
      // Afficher un message de bienvenue
      this.showWelcomeMessage();
      
      console.log('🎯 Clario initialisé avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.showErrorMessage();
    }
  }

  // Gestion de l'installation PWA
  setupPWAInstall() {
    // Capturer l'événement beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Masquer le bouton après installation
    window.addEventListener('appinstalled', () => {
      this.hideInstallButton();
      this.uiManager.showNotification('🎉 Clario installée avec succès !', 'success');
    });

    // Détecter si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ App lancée en mode PWA');
    }
  }

  showInstallButton() {
    // Vérifier si le bouton n'existe pas déjà
    if (document.querySelector('.install-btn')) return;

    const installBtn = document.createElement('button');
    installBtn.className = 'btn btn-primary install-btn';
    installBtn.innerHTML = '📱 Installer l\'app';
    installBtn.onclick = () => this.promptInstall();
    installBtn.title = 'Installer Clario sur votre appareil';
    
    const headerControls = document.querySelector('.header-controls');
    if (headerControls) {
      headerControls.appendChild(installBtn);
    }
  }

  hideInstallButton() {
    const installBtn = document.querySelector('.install-btn');
    if (installBtn) {
      installBtn.remove();
    }
  }

  async promptInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('🎉 PWA installée par l\'utilisateur');
        this.uiManager.showNotification('Installation en cours...', 'info');
      } else {
        console.log('❌ Installation PWA annulée');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
    }
  }

  // Gestion des mises à jour du Service Worker
  handleServiceWorkerUpdate(registration) {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Nouvelle version disponible
        this.showUpdateNotification();
      }
    });
  }

  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-notification__content">
        <span>🔄 Nouvelle version disponible !</span>
        <button onclick="window.location.reload()" class="btn btn-primary btn-sm">
          Actualiser
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('update-notification--visible');
    }, 100);
  }

  showWelcomeMessage() {
    const stats = this.taskManager.getStats();
    
    if (stats.total === 0) {
      this.uiManager.showNotification('👋 Bienvenue dans Clario ! Ajoutez votre première tâche.', 'info');
    } else {
      this.uiManager.showNotification(`👋 Bienvenue ! Vous avez ${stats.pending} tâches en cours.`, 'info');
    }
  }

  showErrorMessage() {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; font-family: system-ui;">
        <div>
          <h1 style="color: #ef4444; margin-bottom: 1rem;">❌ Erreur de chargement</h1>
          <p style="color: #64748b; margin-bottom: 2rem;">Une erreur est survenue lors du chargement de l'application.</p>
          <button onclick="location.reload()" style="padding: 12px 24px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">
            🔄 Recharger la page
          </button>
        </div>
      </div>
    `;
  }
}

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  new ClarioApp();
});
