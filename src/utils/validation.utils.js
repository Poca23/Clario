/**
 * ✅ VALIDATION UTILITIES
 *
 * WHO: Helpers pour validation données
 * WHAT: Règles de validation tâches
 * WHY: Garantir intégrité des données
 * HOW: Règles métier + retour structuré
 */

export class ValidationUtils {
  /**
   * Valide les données d'une tâche
   * @param {Object} taskData - Données à valider
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateTask(taskData) {
    const errors = [];

    // Validation titre
    if (!taskData.title || taskData.title.trim().length === 0) {
      errors.push("Le titre est obligatoire");
    } else if (taskData.title.length > 100) {
      errors.push("Le titre ne peut dépasser 100 caractères");
    }

    // Validation description
    if (taskData.description && taskData.description.length > 500) {
      errors.push("La description ne peut dépasser 500 caractères");
    }

    // Validation priorité
    const validPriorities = ["low", "medium", "high"];
    if (taskData.priority && !validPriorities.includes(taskData.priority)) {
      errors.push("Priorité invalide");
    }

    // Validation date
    if (taskData.dueDate) {
      const date = new Date(taskData.dueDate);
      if (isNaN(date.getTime())) {
        errors.push("Format de date invalide");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize une chaîne (prévention XSS)
   * @param {string} str - Chaîne à nettoyer
   * @returns {string} Chaîne nettoyée
   */
  static sanitizeString(str) {
    if (typeof str !== "string") return "";
    return str
      .trim()
      .replace(/[<>]/g, "") // Supprime < et >
      .substring(0, 1000); // Limite longueur
  }

  /**
   * Valide la structure d'une tâche complète
   * @param {Object} task - Tâche à valider
   * @returns {boolean} True si structure valide
   */
  static isValidTaskStructure(task) {
    return (
      task &&
      typeof task === "object" &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.completed === "boolean" &&
      typeof task.createdAt === "string"
    );
  }

  /**
   * Vérifie si une tâche peut être synchronisée
   * @param {Object} task - Tâche à vérifier
   * @returns {boolean} True si synchronisable
   */
  static canSync(task) {
    return (
      this.isValidTaskStructure(task) &&
      task.synced === false &&
      task.title.length > 0
    );
  }
}
