import { generateId } from '../utils/helpers.js';

class TaskManager {
  constructor() {
    this.tasks = this.loadTasks();
    this.filters = { 
      status: 'all', 
      search: '' 
    };
    this.observers = [];
  }

  // Observer Pattern pour notifier les changements
  subscribe(observer) {
    this.observers.push(observer);
  }

  notify(event, data) {
    this.observers.forEach(observer => observer.update(event, data));
  }

  // CRUD Operations
  addTask(title, priority = 'medium', description = '') {
    const task = {
      id: generateId(),
      title: title.trim(),
      priority,
      description: description.trim(),
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.tasks.push(task);
    this.saveTasks();
    this.notify('task-added', task);
    return task;
  }

  updateTask(id, updates) {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return null;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveTasks();
    this.notify('task-updated', this.tasks[taskIndex]);
    return this.tasks[taskIndex];
  }

  deleteTask(id) {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return false;

    const deletedTask = this.tasks[taskIndex];
    this.tasks.splice(taskIndex, 1);
    this.saveTasks();
    this.notify('task-deleted', deletedTask);
    return true;
  }

  toggleTask(id) {
    const task = this.tasks.find(task => task.id === id);
    if (!task) return null;

    task.completed = !task.completed;
    task.updatedAt = Date.now();
    this.saveTasks();
    this.notify('task-toggled', task);
    return task;
  }

  // Filtres et recherche
  getFilteredTasks() {
    let filteredTasks = [...this.tasks];

    // Filtre par statut
    if (this.filters.status !== 'all') {
      filteredTasks = filteredTasks.filter(task => {
        return this.filters.status === 'completed' ? task.completed : !task.completed;
      });
    }

    // Filtre par recherche
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }

    return filteredTasks;
  }

  setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
    this.notify('filters-changed', this.filters);
  }

  // Statistiques
  getStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(task => task.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending: total - completed,
      progress
    };
  }

  // Persistance LocalStorage
  saveTasks() {
    try {
      localStorage.setItem('clario-tasks', JSON.stringify(this.tasks));
      localStorage.setItem('clario-filters', JSON.stringify(this.filters));
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      this.notify('storage-error', { type: 'save', error });
    }
  }

  loadTasks() {
    try {
      const savedTasks = localStorage.getItem('clario-tasks');
      const savedFilters = localStorage.getItem('clario-filters');
      
      if (savedTasks) {
        this.tasks = JSON.parse(savedTasks);
      }
      
      if (savedFilters) {
        this.filters = JSON.parse(savedFilters);
      }
      
      return this.tasks || [];
    } catch (error) {
      console.error('Erreur de chargement:', error);
      this.notify('storage-error', { type: 'load', error });
      return [];
    }
  }
}

export default TaskManager;
