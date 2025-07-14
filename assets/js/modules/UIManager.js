import { formatDate, debounce } from '../utils/helpers.js';

class UIManager {
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.elements = {};
    this.isOnline = navigator.onLine;
    this.initializeElements();
    this.bindEvents();
    this.taskManager.subscribe(this);
    this.initOfflineIndicator();
  }

  initializeElements() {
    this.elements = {
      // Formulaire et boutons
      addButton: document.querySelector('.btn-primary'),
      modal: document.querySelector('.modal'),
      modalClose: document.querySelector('.modal__close'),
      taskForm: document.querySelector('.modal form'),
      
      // Filtres
      searchInput: document.querySelector('.filter-bar__search input'),
      filterSelect: document.querySelector('#task-filter'),
      
      // Affichage
      tasksContainer: document.querySelector('.tasks-container'),
      progressBar: document.querySelector('.progress-bar__fill'),
      progressText: document.querySelector('.progress-bar').nextElementSibling,
      
      // Inputs du formulaire
      taskTitle: document.querySelector('#task-title'),
      taskPriority: document.querySelector('#task-priority'),
      taskDescription: document.querySelector('#task-description')
    };
  }

  bindEvents() {
    // Événements du formulaire
    this.elements.addButton?.addEventListener('click', () => this.showModal());
    this.elements.modalClose?.addEventListener('click', () => this.hideModal());
    this.elements.modal?.addEventListener('click', (e) => {
      if (e.target === this.elements.modal) this.hideModal();
    });
    
    this.elements.taskForm?.addEventListener('submit', (e) => this.handleFormSubmit(e));
    
    // Événements des filtres
    this.elements.searchInput?.addEventListener('input', 
      debounce((e) => this.handleSearch(e), 300)
    );
    
    this.elements.filterSelect?.addEventListener('change', (e) => this.handleFilter(e));
    
    // Raccourcis clavier
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  // Gestion du mode offline
  initOfflineIndicator() {
    // Créer l'indicateur offline
    this.offlineIndicator = document.createElement('div');
    this.offlineIndicator.className = 'offline-indicator';
    this.offlineIndicator.innerHTML = '🔌 Mode hors ligne - Vos données sont sauvegardées localement';
    document.body.appendChild(this.offlineIndicator);
    
    // Écouter les changements de connexion
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.hideOfflineIndicator();
      this.showNotification('🌐 Connexion rétablie !', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineIndicator();
      this.showNotification('🔌 Mode hors ligne activé', 'info');
    });
    
    // Initialiser l'état
    if (!this.isOnline) {
      this.showOfflineIndicator();
    }
  }

  showOfflineIndicator() {
    this.offlineIndicator.classList.add('offline-indicator--visible');
    document.body.classList.add('app-offline');
  }

  hideOfflineIndicator() {
    this.offlineIndicator.classList.remove('offline-indicator--visible');
    document.body.classList.remove('app-offline');
  }

  // Observer Pattern - Réagit aux changements du TaskManager
  update(event, data) {
    switch (event) {
      case 'task-added':
      case 'task-updated':
      case 'task-deleted':
      case 'task-toggled':
        this.renderTasks();
        this.renderProgress();
        break;
      case 'filters-changed':
        this.renderTasks();
        break;
      case 'storage-error':
        this.showNotification('Erreur de sauvegarde', 'error');
        break;
    }
  }

  // Gestion du formulaire
  showModal() {
    this.elements.modal.style.display = 'flex';
    this.elements.taskTitle?.focus();
    document.body.style.overflow = 'hidden';
  }

  hideModal() {
    this.elements.modal.style.display = 'none';
    document.body.style.overflow = '';
    this.resetForm();
    
    // Reset mode édition
    delete this.elements.taskForm.dataset.editingId;
    
    // Reset textes modal
    const modalTitle = this.elements.modal.querySelector('.modal__header h2');
    modalTitle.textContent = 'Ajouter une tâche';
    
    const submitBtn = this.elements.modal.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Ajouter';
  }
  
  resetForm() {
    this.elements.taskForm?.reset();
  }

  handleFormSubmit(e) {
    e.preventDefault();
    
    const title = this.elements.taskTitle?.value.trim();
    const priority = this.elements.taskPriority?.value || 'medium';
    const description = this.elements.taskDescription?.value.trim();
    
    if (!title) {
      this.showNotification('Le titre est requis', 'error');
      return;
    }

    try {
      const editingId = this.elements.taskForm.dataset.editingId;
      
      if (editingId) {
        // Mode édition
        this.taskManager.editTask(editingId, title, priority, description);
        this.showNotification('Tâche modifiée avec succès', 'success');
      } else {
        // Mode ajout
        this.taskManager.addTask(title, priority, description);
        this.showNotification('Tâche ajoutée avec succès', 'success');
      }
      
      this.hideModal();
    } catch (error) {
      this.showNotification('Erreur lors de l\'opération', 'error');
    }
  }
  
  // Gestion des filtres
  handleSearch(e) {
    const search = e.target.value.trim();
    this.taskManager.setFilters({ search });
  }

  handleFilter(e) {
    const status = e.target.value === 'Toutes les tâches' ? 'all' : 
                   e.target.value === 'Terminées' ? 'completed' : 'pending';
    this.taskManager.setFilters({ status });
  }

  // Rendu des tâches
  renderTasks() {
    const tasks = this.taskManager.getFilteredTasks();
    
    if (!this.elements.tasksContainer) return;

    if (tasks.length === 0) {
      this.elements.tasksContainer.innerHTML = `
        <div style="text-align: center; padding: var(--space-xl); color: var(--text-secondary);">
          <p>Aucune tâche trouvée</p>
          <p style="font-size: var(--font-size-sm);">Ajoutez votre première tâche pour commencer</p>
        </div>
      `;
      return;
    }

    this.elements.tasksContainer.innerHTML = tasks.map(task => `
      <div class="task-card ${task.completed ? 'task-card--completed' : ''}" data-task-id="${task.id}">
        <div class="task-card__header">
          <h3 class="task-card__title ${task.completed ? 'task-card__title--completed' : ''}">${task.title}</h3>
          <div class="task-card__actions">
            <button class="btn ${task.completed ? 'btn-secondary' : 'btn-success'}" 
                    onclick="uiManager.toggleTask('${task.id}')"
                    title="${task.completed ? 'Marquer comme en cours' : 'Marquer comme terminée'}">
              ${task.completed ? '↻' : '✓'}
            </button>
            <button class="btn btn-secondary" 
                    onclick="uiManager.editTask('${task.id}')"
                    title="Éditer la tâche">
              ✏️
            </button>
            <button class="btn btn-danger" 
                    onclick="uiManager.deleteTask('${task.id}')"
                    title="Supprimer la tâche">
              🗑️
            </button>
          </div>
        </div>
        <div class="task-card__meta">
          <span class="task-card__priority task-card__priority--${task.priority}">${this.getPriorityLabel(task.priority)}</span>
          <span>Créée le ${formatDate(task.createdAt)}</span>
        </div>
        ${task.description ? `<p class="task-card__description">${task.description}</p>` : ''}
      </div>
    `).join('');
  }

  renderProgress() {
    const stats = this.taskManager.getStats();
    
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = `${stats.progress}%`;
      
      // Animation de complétion
      if (stats.progress === 100 && stats.total > 0) {
        this.elements.progressBar.classList.add('progress-bar__fill--complete');
        setTimeout(() => {
          this.elements.progressBar.classList.remove('progress-bar__fill--complete');
        }, 1000);
      }
    }
    
    if (this.elements.progressText) {
      this.elements.progressText.innerHTML = `
        <span>${stats.completed} sur ${stats.total} tâches terminées</span>
        <span class="progress-percentage">${stats.progress}%</span>
      `;
    }
  }

  // Actions sur les tâches
  toggleTask(id) {
    this.taskManager.toggleTask(id);
  }

  deleteTask(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      this.taskManager.deleteTask(id);
      this.showNotification('Tâche supprimée', 'success');
    }
  }

  editTask(id) {
    const task = this.taskManager.getTask(id);
    if (!task) return;

    // Pré-remplir le formulaire modal
    this.elements.taskTitle.value = task.title;
    this.elements.taskPriority.value = task.priority;
    this.elements.taskDescription.value = task.description || '';

    // Marquer comme édition
    this.elements.taskForm.dataset.editingId = id;
    
    // Changer le titre modal
    const modalTitle = this.elements.modal.querySelector('.modal__header h2');
    modalTitle.textContent = 'Modifier la tâche';
    
    // Changer le bouton submit
    const submitBtn = this.elements.modal.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Modifier';

    this.showModal();
  }

  // Utilitaires
  getPriorityLabel(priority) {
    const labels = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute'
    };
    return labels[priority] || 'Moyenne';
  }

  showNotification(message, type = 'info') {
    // Système de notifications amélioré
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
      <div class="notification__content">
        <span class="notification__icon">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <span class="notification__message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
      notification.classList.add('notification--visible');
    }, 100);
    
    // Suppression automatique
    setTimeout(() => {
      notification.classList.remove('notification--visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  handleKeyboard(e) {
    // Raccourcis clavier améliorés
    if (e.altKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault();
          this.showModal();
          break;
        case 'f':
          e.preventDefault();
          this.elements.searchInput?.focus();
          break;
      }
    }
    
    if (e.key === 'Escape') {
      this.hideModal();
    }
  }
}

export default UIManager;
