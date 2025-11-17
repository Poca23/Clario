// assets/js/keyboard.js
class KeyboardManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.selectedTaskId = null;
    this.bindKeyboardEvents();
    // Suppression de showKeyboardHints() car maintenant en HTML
  }

  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      // Ignorer si on est dans un input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Permettre seulement Escape pour fermer modal
        if (e.key === 'Escape') {
          this.uiManager.hideModal();
        }
        return;
      }

      // Alt+N - Nouvelle tâche (sécurisé)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        this.uiManager.showModal();
      }
      
      // Alt+F - Focus recherche (sécurisé)
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.filter-bar__search input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      // Escape - Fermer modal
      if (e.key === 'Escape') {
        this.uiManager.hideModal();
      }
      
      // Delete - Supprimer tâche sélectionnée
      if (e.key === 'Delete' && this.selectedTaskId) {
        e.preventDefault();
        this.uiManager.taskManager.deleteTask(this.selectedTaskId);
        this.uiManager.renderTasks();
        this.uiManager.renderProgress();
        this.selectedTaskId = null;
      }
      
      // Space - Toggle tâche sélectionnée
      if (e.key === ' ' && this.selectedTaskId) {
        e.preventDefault();
        const task = this.uiManager.taskManager.getTask(this.selectedTaskId);
        if (task) {
          this.uiManager.taskManager.updateTask(this.selectedTaskId, {
            completed: !task.completed
          });
          this.uiManager.renderTasks();
          this.uiManager.renderProgress();
        }
      }
    });

    // Gestion des clics pour sélection
    document.addEventListener('click', (e) => {
      const taskCard = e.target.closest('.task-card');
      if (taskCard) {
        this.selectTask(taskCard.dataset.taskId);
      } else {
        this.deselectTask();
      }
    });
  }

  selectTask(taskId) {
    // Retirer la sélection précédente
    this.deselectTask();
    
    // Sélectionner la nouvelle tâche
    this.selectedTaskId = taskId;
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.classList.add('task-card--selected');
    }
  }

  deselectTask() {
    if (this.selectedTaskId) {
      const taskElement = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`);
      if (taskElement) {
        taskElement.classList.remove('task-card--selected');
      }
    }
    this.selectedTaskId = null;
  }
}

export default KeyboardManager;
