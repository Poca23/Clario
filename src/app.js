/**
 * 🎯 MAIN APPLICATION CONTROLLER
 *
 * WHO: Contrôleur principal de l'application
 * WHAT: Orchestre tous les services et composants
 * WHY: Point d'entrée unique + coordination
 * HOW: Pattern MVC + Event delegation + Auth Firebase
 */

import { AuthService } from "./services/auth.service.js";
import { LoginForm } from "./components/LoginForm.js";
import { StorageService } from "./services/storage.service.js";
import { SyncService } from "./services/sync.service.js";
import { OfflineService } from "./services/offline.service.js";
import { TaskCard } from "./components/TaskCard.js";
import { TaskForm } from "./components/TaskForm.js";
import * as DateUtils from "./utils/date.utils.js";

class ClarioApp {
  constructor() {
    this.checkAuth(); // ⚠️ Vérifier auth AVANT tout
  }

  /**
   * 🔐 Vérifie l'authentification
   */
  checkAuth() {
    AuthService.onAuthChange((user) => {
      if (user) {
        console.log("✅ User connecté:", user.email);
        this.initApp(user); // Lancer l'app
      } else {
        console.log("⚠️ Non connecté");
        new LoginForm(); // Afficher login
      }
    });
  }

  /**
   * 🚀 Initialise l'app après authentification
   */
  async initApp(user) {
    this.userId = user.uid; // ✅ ID réel utilisateur

    // Services
    this.offlineService = new OfflineService();

    // État application
    this.tasks = [];
    this.currentFilter = "all";
    this.searchQuery = "";
    this.currentTheme = localStorage.getItem("theme") || "light";
    this.currentPriority = "all";
    this.currentDateFilter = "all";
    this.currentSort = "newest";

    // Éléments DOM
    this.tasksContainer = document.getElementById("tasks-container");
    this.searchInput = document.getElementById("search-input");
    this.addTaskBtn = document.getElementById("add-task-btn");
    this.syncBtn = document.getElementById("sync-btn");
    this.themeBtn = document.getElementById("theme-btn");

    // ✅ 🆕 DROPDOWNS (LIGNE 70)
    this.filterDropdowns = {
      status: {
        btn: document.getElementById("status-btn"),
        menu: document.getElementById("status-menu"),
        items: document.querySelectorAll("#status-menu .filter-item"),
      },
      date: {
        btn: document.getElementById("date-btn"),
        menu: document.getElementById("date-menu"),
        items: document.querySelectorAll("#date-menu .filter-item"),
      },
      priority: {
        btn: document.getElementById("priority-btn"),
        menu: document.getElementById("priority-menu"),
        items: document.querySelectorAll("#priority-menu .filter-item"),
      },
      sort: {
        btn: document.getElementById("sort-btn"),
        menu: document.getElementById("sort-menu"),
        items: document.querySelectorAll("#sort-menu .filter-item"),
      },
    };

    // Composants
    const modal = document.getElementById("task-modal");
    const form = document.getElementById("task-form");
    this.taskForm = new TaskForm(modal, form);

    // Lancer initialisation
    await this.init();
  }

  /**
   * Initialise l'application
   */
  async init() {
    console.log("🚀 Initialisation Clario...");

    // 1. Charger local d'abord
    this.loadTasks();

    // 2. Sync Firebase au démarrage
    await this.syncOnStartup();

    // 3. Reste du code...
    this.applyTheme();
    this.bindEvents();
    this.setupOfflineMode();
    this.renderTasks();
    await this.registerServiceWorker();

    console.log("✅ Application prête !");
  }

  /**
   * Sync au démarrage avec userId réel
   */
  async syncOnStartup() {
    try {
      const firebaseTasks = await SyncService.syncFromFirebase(this.userId);
      StorageService.saveTasks(firebaseTasks);
      this.tasks = firebaseTasks;
      this.renderTasks();
      console.log("✅ Sync:", this.tasks.length, "tâches affichées");
    } catch (error) {
      console.error("❌ Sync erreur:", error);
    }
  }

  /**
   * Charge les tâches depuis le storage
   */
  loadTasks() {
    try {
      this.tasks = StorageService.getTasks();
      console.log(`📦 ${this.tasks.length} tâches chargées`);
    } catch (error) {
      console.error("❌ Erreur chargement tâches:", error);
      this.showNotification("Erreur de chargement", "error");
    }
  }

  /**
   * Lie tous les événements de l'interface
   */
  bindEvents() {
    // Bouton ajout tâche
    this.addTaskBtn.addEventListener("click", () => {
      this.openCreateForm();
    });

    // Recherche temps réel
    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderTasks();
    });

    // ✅ 🆕 DROPDOWNS (LIGNE 160)
    this.bindDropdowns();

    // Actions sur les cards (event delegation)
    this.tasksContainer.addEventListener("click", (e) => {
      const button = e.target.closest(".task-card__btn");
      if (!button) return;

      const card = button.closest(".task-card");
      const taskId = card.dataset.taskId;
      const action = button.dataset.action;

      this.handleTaskAction(taskId, action);
    });

    // Bouton sync
    this.syncBtn.addEventListener("click", () => {
      this.syncWithFirebase();
    });

    // Toggle thème
    this.themeBtn.addEventListener("click", () => {
      this.toggleTheme();
    });

    // Bouton déconnexion
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await AuthService.logout();
        window.location.reload();
      });
    }

    // Raccourcis clavier
    this.setupKeyboardShortcuts();
  }

  // ✅ 🆕 NOUVELLES MÉTHODES DROPDOWNS (LIGNE 200)
  /**
   * 🎯 Gestion dropdowns
   */
  bindDropdowns() {
    Object.entries(this.filterDropdowns).forEach(([key, dropdown]) => {
      // Toggle menu au clic
      dropdown.btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleDropdown(key);
      });

      // Sélection item
      dropdown.items.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleDropdownSelect(key, item);
        });
      });
    });

    // Fermer au clic extérieur
    document.addEventListener("click", () => {
      this.closeAllDropdowns();
    });
  }

  /**
   * Toggle un dropdown
   */
  toggleDropdown(key) {
    const dropdown = this.filterDropdowns[key];
    const isActive = dropdown.menu.classList.contains("active");

    // Fermer tous
    this.closeAllDropdowns();

    // Ouvrir celui-ci si fermé
    if (!isActive) {
      dropdown.menu.classList.add("active");
    }
  }

  /**
   * Ferme tous les dropdowns
   */
  closeAllDropdowns() {
    Object.values(this.filterDropdowns).forEach((dropdown) => {
      dropdown.menu.classList.remove("active");
    });
  }

  /**
   * Gère la sélection d'un item
   */
  handleDropdownSelect(type, item) {
    const dropdown = this.filterDropdowns[type];

    // Mettre à jour actifs
    dropdown.items.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    // Appliquer filtre
    switch (type) {
      case "status":
        this.currentFilter = item.dataset.filter;
        break;
      case "date":
        this.currentDateFilter = item.dataset.date;
        break;
      case "priority":
        this.currentPriority = item.dataset.priority;
        break;
      case "sort":
        this.currentSort = item.dataset.sort;
        break;
    }

    // Mettre à jour bouton
    if (item.classList.contains("active")) {
      dropdown.btn.classList.add("active");
    }

    // Fermer menu + render
    dropdown.menu.classList.remove("active");
    this.renderTasks();
  }

  /**
   * Configure les raccourcis clavier
   */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + N : Nouvelle tâche
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        this.openCreateForm();
      }

      // Ctrl/Cmd + S : Synchroniser
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        this.syncWithFirebase();
      }

      // Ctrl/Cmd + K : Focus recherche
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.searchInput.focus();
      }
    });
  }

  /**
   * Configure le mode hors ligne
   */
  setupOfflineMode() {
    this.offlineService.addListener((status, isOnline) => {
      if (isOnline) {
        this.showNotification("Connexion rétablie", "success");
        this.syncWithFirebase();
      } else {
        this.showNotification("Mode hors ligne", "warning");
      }
      this.updateSyncButton(isOnline);
    });

    // État initial
    this.updateSyncButton(this.offlineService.isOnline);
  }
  /**
   * Ouvre le formulaire de création
   */
  openCreateForm() {
    this.taskForm.open((taskData) => {
      this.createTask(taskData);
    });
  }

  /**
   * Ouvre le formulaire d'édition
   * @param {string} taskId - ID de la tâche
   */
  openEditForm(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    this.taskForm.openForEdit(task, (taskData, id) => {
      this.updateTask(id, taskData);
    });
  }

  /**
   * Crée une nouvelle tâche
   * @param {Object} taskData - Données de la tâche
   */
  createTask(taskData) {
    try {
      const newTask = StorageService.addTask({
        ...taskData,
        completed: false,
      });

      this.tasks.push(newTask);
      this.renderTasks();
      this.showNotification("Tâche créée !", "success");

      // Sync auto si en ligne
      if (this.offlineService.isOnline) {
        this.syncWithFirebase();
      }
    } catch (error) {
      console.error("❌ Erreur création tâche:", error);
      this.showNotification("Erreur de création", "error");
    }
  }

  /**
   * Met à jour une tâche
   * @param {string} taskId - ID de la tâche
   * @param {Object} updates - Modifications
   */
  updateTask(taskId, updates) {
    try {
      const updatedTask = StorageService.updateTask(taskId, updates);

      const index = this.tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
      }

      this.renderTasks();
      this.showNotification("Tâche modifiée !", "success");

      // Sync auto
      if (this.offlineService.isOnline) {
        this.syncWithFirebase();
      }
    } catch (error) {
      console.error("❌ Erreur mise à jour:", error);
      this.showNotification("Erreur de modification", "error");
    }
  }

  /**
   * Supprime une tâche
   * @param {string} taskId - ID de la tâche
   */
  deleteTask(taskId) {
    if (!confirm("Supprimer cette tâche ?")) return;

    try {
      StorageService.deleteTask(taskId);
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
      this.renderTasks();
      this.showNotification("Tâche supprimée", "success");

      // Sync Firebase
      if (this.offlineService.isOnline) {
        SyncService.deleteFromFirebase(taskId);
      }
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      this.showNotification("Erreur de suppression", "error");
    }
  }

  /**
   * Toggle le statut d'une tâche
   * @param {string} taskId - ID de la tâche
   */
  toggleTask(taskId) {
    try {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task) return;

      this.updateTask(taskId, {
        completed: !task.completed,
      });
    } catch (error) {
      console.error("❌ Erreur toggle tâche:", error);
    }
  }

  /**
   * Gère les actions sur les cartes
   * @param {string} taskId - ID de la tâche
   * @param {string} action - Action à effectuer
   */
  handleTaskAction(taskId, action) {
    switch (action) {
      case "toggle":
        this.toggleTask(taskId);
        break;
      case "edit":
        this.openEditForm(taskId);
        break;
      case "delete":
        this.deleteTask(taskId);
        break;
    }
  }

  /**
   * ✅ 🔍 Applique tous les filtres
   * @returns {Array} Tâches filtrées
   */
  getFilteredTasks() {
    let filtered = [...this.tasks];

    // Filtre statut
    if (this.currentFilter === "pending") {
      filtered = filtered.filter((t) => !t.completed);
    } else if (this.currentFilter === "completed") {
      filtered = filtered.filter((t) => t.completed);
    }

    // Filtre priorité
    if (this.currentPriority !== "all") {
      filtered = filtered.filter((t) => t.priority === this.currentPriority);
    }

    // Filtre date
    if (this.currentDateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);

        switch (this.currentDateFilter) {
          case "today":
            return dueDate.toDateString() === today.toDateString();
          case "week":
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return dueDate >= today && dueDate <= weekEnd;
          case "month":
            return (
              dueDate.getMonth() === today.getMonth() &&
              dueDate.getFullYear() === today.getFullYear()
            );
          case "overdue":
            return dueDate < today && !task.completed;
          default:
            return true;
        }
      });
    }

    // Filtre par recherche
    if (this.searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(this.searchQuery) ||
          (t.description &&
            t.description.toLowerCase().includes(this.searchQuery))
      );
    }

    // Tri
    return this.sortTasks(filtered);
  }

  /**
   * ✅ 📊 Trie les tâches
   */
  sortTasks(tasks) {
    const sorted = [...tasks];

    switch (this.currentSort) {
      case "oldest":
        return sorted.sort((a, b) => a.createdAt - b.createdAt);
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return sorted.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
      case "dueDate":
        return sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      case "newest":
      default:
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  /**
   * ✅ Affiche les tâches dans le DOM
   */
  renderTasks() {
    const filtered = this.getFilteredTasks();

    if (filtered.length === 0) {
      this.tasksContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
          <p>📭 Aucune tâche trouvée</p>
        </div>
      `;
      return;
    }

    this.tasksContainer.innerHTML = filtered
      .map((task) => TaskCard.render(task))
      .join("");
  }

  /**
   * Synchronise avec Firebase (userId réel)
   */
  async syncWithFirebase() {
    if (!this.offlineService.isOnline) {
      this.showNotification("Hors ligne", "warning");
      return;
    }

    this.showNotification("Synchronisation...", "info");
    this.syncBtn.classList.add("syncing");

    try {
      await SyncService.syncToFirebase(this.userId);
      const firebaseTasks = await SyncService.syncFromFirebase(this.userId);
      StorageService.saveTasks(firebaseTasks);
      this.tasks = firebaseTasks;
      this.renderTasks();
      this.showNotification("Synchronisé !", "success");
    } catch (error) {
      console.error("❌ Erreur sync:", error);
      this.showNotification("Erreur de synchronisation", "error");
    } finally {
      this.syncBtn.classList.remove("syncing");
    }
  }

  /**
   * Met à jour l'apparence du bouton sync
   * @param {boolean} isOnline - État de la connexion
   */
  updateSyncButton(isOnline) {
    this.syncBtn.disabled = !isOnline;
    this.syncBtn.style.opacity = isOnline ? "1" : "0.5";
  }

  /**
   * Toggle le thème sombre/clair
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme();
    localStorage.setItem("theme", this.currentTheme);
  }

  /**
   * Applique le thème actuel
   */
  applyTheme() {
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    const icon = this.themeBtn.querySelector("svg");
    icon.innerHTML =
      this.currentTheme === "dark" ? this.getSunIcon() : this.getMoonIcon();
  }

  /**
   * Affiche une notification
   * @param {string} message - Message à afficher
   * @param {string} type - Type ('success', 'error', 'warning', 'info')
   */
  showNotification(message, type = "info") {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * Icône lune (mode clair)
   * @returns {string} SVG
   */
  getMoonIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
      </svg>
    `;
  }

  /**
   * Icône soleil (mode sombre)
   * @returns {string} SVG
   */
  getSunIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
      </svg>
    `;
  }

  /**
   * Enregistre le Service Worker pour PWA
   */
  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("✅ Service Worker enregistré:", registration.scope);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error("❌ Erreur Service Worker:", error);
      }
    }
  }

  /**
   * Affiche une notification de mise à jour disponible
   */
  showUpdateNotification() {
    const notification = document.createElement("div");
    notification.className = "update-notification";
    notification.innerHTML = `
      <p>Une nouvelle version est disponible !</p>
      <button id="update-btn" class="btn-primary">Mettre à jour</button>
    `;

    document.body.appendChild(notification);

    document.getElementById("update-btn").addEventListener("click", () => {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    });
  }
}

// Initialiser l'application au chargement
document.addEventListener("DOMContentLoaded", () => {
  window.clarioApp = new ClarioApp();
});

// Exporter pour utilisation
export default ClarioApp;
