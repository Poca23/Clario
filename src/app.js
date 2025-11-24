/**
 * 🎯 MAIN APPLICATION CONTROLLER
 */

import { AuthService } from "./services/auth.service.js";
import { LoginForm } from "./components/LoginForm.js";
import { StorageService } from "./services/storage.service.js";
import { SyncService } from "./services/sync.service.js";
import { OfflineService } from "./services/offline.service.js";
import { TaskCard } from "./components/TaskCard.js";
import { TaskForm } from "./components/TaskForm.js";
import { FilterBar } from "./components/FilterBar.js";
import { InstallButton } from "./components/InstallButton.js";
import { ProgressBar } from "./components/ProgressBar.js";
import toast from "./components/Toast.js";

window.toast = toast;

class ClarioApp {
  constructor() {
    this.checkAuth();
  }

  checkAuth() {
    AuthService.onAuthChange((user) => {
      if (user) {
        this.initApp(user);
      } else {
        new LoginForm();
      }
    });
  }

  async initApp(user) {
    this.userId = user.uid;
    this.offlineService = new OfflineService();
    this.tasks = [];
    this.searchQuery = "";
    this.currentTheme = localStorage.getItem("theme") || "light";

    this.tasksContainer = document.getElementById("tasks-container");
    this.searchInput = document.getElementById("search-input");
    this.addTaskBtn = document.getElementById("add-task-btn");
    this.syncBtn = document.getElementById("sync-btn");
    this.themeBtn = document.getElementById("theme-btn");

    this.installButton = new InstallButton();
    this.progressBar = new ProgressBar();

    const modal = document.getElementById("task-modal");
    const form = document.getElementById("task-form");
    this.taskForm = new TaskForm(modal, form);

    this.filterBar = new FilterBar(() => this.renderTasks());

    await this.init();
  }

  async init() {
    SyncService.init();
    await this.syncOnStartup(); // ✅ Charge directement depuis Firebase
    this.applyTheme();
    this.bindEvents();
    this.setupOfflineMode();
    this.renderTasks();
    await this.registerServiceWorker();
    this.updateProgress();
  }

  async syncOnStartup() {
    try {
      const firebaseTasks = await SyncService.fullSync();
      this.tasks = firebaseTasks;
    } catch (error) {
      console.error("❌ Erreur sync démarrage:", error);
      this.tasks = StorageService.getTasks(); // ✅ Fallback sur cache local
    }
  }

  bindEvents() {
    this.addTaskBtn.addEventListener("click", () => this.openCreateForm());

    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderTasks();
    });

    this.tasksContainer.addEventListener("click", (e) => {
      const button = e.target.closest(".task-card__btn");
      if (!button) return;

      const card = button.closest(".task-card");
      const taskId = card.dataset.taskId;
      const action = button.dataset.action;

      this.handleTaskAction(taskId, action);
    });

    this.syncBtn.addEventListener("click", () => this.manualSync());
    this.themeBtn.addEventListener("click", () => this.toggleTheme());

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await AuthService.logout();
        window.location.reload();
      });
    }

    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        this.openCreateForm();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        this.manualSync();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.searchInput.focus();
      }
    });
  }

  setupOfflineMode() {
    this.offlineService.addListener((status, isOnline) => {
      if (isOnline) {
        toast.success("✅ Connexion rétablie");
      } else {
        toast.warning("📡 Mode hors ligne activé");
      }
      this.updateSyncButton(isOnline);
    });

    this.updateSyncButton(this.offlineService.isOnline);
  }

  openCreateForm() {
    this.taskForm.open((taskData) => this.createTask(taskData));
  }

  openEditForm(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    this.taskForm.openForEdit(task, (taskData, id) =>
      this.updateTask(id, taskData)
    );
  }

  async createTask(taskData) {
    try {
      const newTask = await SyncService.addTask(
        { ...taskData, completed: false },
        this.userId
      );

      this.tasks.push(newTask);
      this.renderTasks();
      toast.success("✅ Tâche créée avec succès !");
    } catch (error) {
      console.error("❌ Erreur création:", error);
      toast.error("❌ Impossible de créer la tâche");
    }
  }

  async updateTask(taskId, updates) {
    try {
      const updatedTask = await SyncService.updateTask(
        taskId,
        updates,
        this.userId
      );

      const index = this.tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
      }

      this.renderTasks();
      toast.success("✏️ Tâche modifiée !");
    } catch (error) {
      console.error("❌ Erreur modification:", error);
      toast.error("❌ Erreur de modification");
    }
  }

  async deleteTask(taskId) {
    if (!confirm("Supprimer cette tâche ?")) return;

    try {
      await SyncService.deleteTask(taskId, this.userId);
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
      this.renderTasks();
      toast.success("🗑️ Tâche supprimée");
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      toast.error("❌ Impossible de supprimer");
    }
  }

  toggleTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    this.updateTask(taskId, { completed: !task.completed });

    if (!task.completed) {
      toast.success("🎉 Tâche terminée !", 2000);
    } else {
      toast.info("🔄 Tâche réactivée", 2000);
    }
  }

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

  getFilteredTasks() {
    let filtered = [...this.tasks];
    const filters = this.filterBar.getFilters();

    if (filters.status === "pending") {
      filtered = filtered.filter((t) => !t.completed);
    } else if (filters.status === "completed") {
      filtered = filtered.filter((t) => t.completed);
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }

    if (filters.date !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);

        switch (filters.date) {
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

    if (this.searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(this.searchQuery) ||
          (t.description &&
            t.description.toLowerCase().includes(this.searchQuery))
      );
    }

    return this.sortTasks(filtered, filters.sort);
  }

  sortTasks(tasks, sortType) {
    const sorted = [...tasks];

    switch (sortType) {
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

  renderTasks() {
    const filtered = this.getFilteredTasks();

    if (filtered.length === 0) {
      this.tasksContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
          <p>📭 Aucune tâche trouvée</p>
        </div>
      `;
      this.updateProgress();
      return;
    }

    this.tasksContainer.innerHTML = filtered
      .map((task) => TaskCard.render(task))
      .join("");

    this.updateProgress();
  }

  updateProgress() {
    const { percentage, completed, total } = this.progressBar.calculateProgress(
      this.tasks
    );
    this.progressBar.update(percentage, completed, total);
  }

  async manualSync() {
    if (!this.offlineService.isOnline) {
      toast.warning("📡 Synchronisation impossible : hors ligne");
      return;
    }

    toast.info("🔄 Synchronisation en cours...", 0);
    this.syncBtn.classList.add("syncing");

    try {
      await SyncService.processSyncQueue();
      this.tasks = StorageService.getTasks();
      this.renderTasks();

      toast.clearAll();
      toast.success("✅ Synchronisation réussie !");
    } catch (error) {
      console.error("❌ Erreur sync manuelle:", error);
      toast.clearAll();
      toast.error("❌ Échec de la synchronisation");
    } finally {
      this.syncBtn.classList.remove("syncing");
    }
  }

  updateSyncButton(isOnline) {
    this.syncBtn.disabled = !isOnline;
    this.syncBtn.style.opacity = isOnline ? "1" : "0.5";
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme();
    localStorage.setItem("theme", this.currentTheme);

    const themeEmoji = this.currentTheme === "dark" ? "🌙" : "☀️";
    const themeName = this.currentTheme === "dark" ? "sombre" : "clair";
    toast.info(`${themeEmoji} Thème ${themeName} activé`, 2000);
  }

  applyTheme() {
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    const icon = this.themeBtn.querySelector("svg");
    icon.innerHTML =
      this.currentTheme === "dark" ? this.getSunIcon() : this.getMoonIcon();
  }

  getMoonIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
      </svg>
    `;
  }

  getSunIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
      </svg>
    `;
  }

  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

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
        console.error("❌ Service Worker:", error);
      }
    }
  }

  showUpdateNotification() {
    toast.info(
      "🎉 Nouvelle version disponible ! Cliquez ici pour mettre à jour.",
      0
    );

    document.addEventListener(
      "click",
      (e) => {
        if (e.target.closest(".toast")) {
          navigator.serviceWorker.controller.postMessage({
            type: "SKIP_WAITING",
          });
          toast.info("🔄 Mise à jour en cours...", 1000);
          setTimeout(() => window.location.reload(), 1000);
        }
      },
      { once: true }
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.clarioApp = new ClarioApp();
});

export default ClarioApp;
