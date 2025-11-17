/**
 * 💾 LOCAL STORAGE SERVICE
 *
 * WHO: Gestionnaire stockage local
 * WHAT: CRUD sur localStorage
 * WHY: Persistance offline + performance
 * HOW: API Storage native + parsing JSON
 */

const STORAGE_KEY = "clario_tasks_v2";

export class StorageService {
  /**
   * Récupère toutes les tâches
   * @returns {Array} Liste des tâches
   */
  static getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("❌ Erreur lecture localStorage:", error);
      return [];
    }
  }

  /**
   * Sauvegarde les tâches
   * @param {Array} tasks - Liste des tâches
   */
  static saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      console.log("✅ Sauvegarde locale OK:", tasks.length, "tâches");
    } catch (error) {
      console.error("❌ Erreur écriture localStorage:", error);
      throw new Error("Stockage plein");
    }
  }

  /**
   * Ajoute une tâche
   * @param {Object} task - Nouvelle tâche
   */
  static addTask(task) {
    const tasks = this.getTasks();
    const newTask = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false, // Flag pour sync Firebase
      ...task,
    };
    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  /**
   * Met à jour une tâche
   * @param {string} id - ID tâche
   * @param {Object} updates - Modifications
   */
  static updateTask(id, updates) {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error("Tâche introuvable");
    }

    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    this.saveTasks(tasks);
    return tasks[index];
  }

  /**
   * Supprime une tâche
   * @param {string} id - ID tâche
   */
  static deleteTask(id) {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  }

  /**
   * Marque une tâche comme synchronisée
   * @param {string} id - ID tâche
   */
  static markAsSynced(id) {
    this.updateTask(id, { synced: true });
  }
}
