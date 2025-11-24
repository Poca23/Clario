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
}
