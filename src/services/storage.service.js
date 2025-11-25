/**
 * 💾 LOCAL STORAGE SERVICE
 * Gestionnaire de persistance locale des tâches
 */

const STORAGE_KEY = "clario_tasks_v2";

export class StorageService {
  /**
   * Récupère toutes les tâches depuis localStorage
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
   * Sauvegarde le tableau complet des tâches
   */
  static saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("❌ Erreur écriture localStorage:", error);
      throw new Error("Stockage plein");
    }
  }

  /**
   * Ajoute une nouvelle tâche
   */
  static addTask(task) {
    const tasks = this.getTasks();
    const newTask = {
      ...task,
      id: task.id || `task_${Date.now()}`,
      createdAt: task.createdAt || Date.now(),
    };
    tasks.push(newTask);
    this.saveTasks(tasks);
    return newTask;
  }
}
