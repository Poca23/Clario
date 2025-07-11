import TaskManager from './modules/TaskManager.js';
import UIManager from './modules/UIManager.js';

class ClarioApp {
  constructor() {
    this.taskManager = null;
    this.uiManager = null;
    this.init();
  }

  async init() {
    try {
      // Initialiser le gestionnaire de tâches
      this.taskManager = new TaskManager();
      
      // Initialiser l'interface utilisateur
      this.uiManager = new UIManager(this.taskManager);
      
      // Rendre disponible globalement pour les événements inline
      window.uiManager = this.uiManager;
      
      // Rendu initial
      this.uiManager.renderTasks();
      this.uiManager.renderProgress();
      
      // Afficher un message de bienvenue
      this.showWelcomeMessage();
      
      console.log('🎯 Clario initialisé avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.showErrorMessage();
    }
  }

  showWelcomeMessage() {
    const stats = this.taskManager.getStats();
    
    if (stats.total === 0) {
      this.uiManager.showNotification('Bienvenue dans Clario ! Ajoutez votre première tâche.', 'info');
    } else {
      this.uiManager.showNotification(`Bienvenue ! Vous avez ${stats.pending} tâches en cours.`, 'info');
    }
  }

  showErrorMessage() {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center;">
        <div>
          <h1>❌ Erreur de chargement</h1>
          <p>Une erreur est survenue lors du chargement de l'application.</p>
          <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">
            Recharger la page
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
