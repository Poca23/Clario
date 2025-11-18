/**
 * 📊 PROGRESS BAR COMPONENT
 *
 * WHO: Composant jauge de progression
 * WHAT: Calcule et affiche pourcentage tâches complétées
 * WHY: Feedback visuel motivation utilisateur
 * HOW: Calcul ratio + MAJ DOM + ARIA
 */

export class ProgressBar {
  /**
   * 🏗️ Constructeur
   * @param {string} containerId - ID élément conteneur
   */
  constructor(containerId = "progress-container") {
    this.container = document.getElementById(containerId);
    this.fillElement = document.getElementById("progress-fill");
    this.textElement = document.getElementById("progress-text");
    this.barElement = this.container?.querySelector(".progress-bar");

    if (!this.container || !this.fillElement || !this.textElement) {
      console.error("❌ ProgressBar: éléments DOM manquants");
      return;
    }
  }

  /**
   * 📊 Calcule le pourcentage de progression
   * @param {Array} tasks - Liste des tâches
   * @returns {number} Pourcentage (0-100)
   */
  calculateProgress(tasks) {
    if (!tasks || tasks.length === 0) return 0;

    const completed = tasks.filter((task) => task.completed).length;
    const total = tasks.length;

    return Math.round((completed / total) * 100);
  }

  /**
   * 🔄 Met à jour l'affichage
   * @param {number} percentage - Pourcentage (0-100)
   */
  update(percentage) {
    // Validation
    const safePercentage = Math.max(0, Math.min(100, percentage));

    // MAJ visuel
    this.fillElement.style.width = `${safePercentage}%`;
    this.textElement.textContent = `${safePercentage}%`;

    // MAJ ARIA
    this.barElement.setAttribute("aria-valuenow", safePercentage);

    // Animation complète
    if (safePercentage === 100) {
      this.celebrate();
    }
  }

  /**
   * 🎉 Animation de célébration
   */
  celebrate() {
    this.container.classList.add("completed");

    // Retirer après animation
    setTimeout(() => {
      this.container.classList.remove("completed");
    }, 1000);
  }

  /**
   * 👁️ Affiche la jauge
   */
  show() {
    this.container.style.display = "block";
  }

  /**
   * 🙈 Cache la jauge
   */
  hide() {
    this.container.style.display = "none";
  }
}
