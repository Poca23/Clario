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
   */
  constructor(containerId = "progress-container") {
    this.container = document.getElementById(containerId);
    this.fillElement = document.getElementById("progress-fill");
    this.textElement = document.getElementById("progress-text");
    this.barElement = this.container?.querySelector(".progress-bar");

    if (!this.container || !this.fillElement || !this.textElement) {
      console.error("❌ ProgressBar: éléments DOM manquants");
    }
  }

  /**
   * 📊 Calcule le pourcentage de progression
   */
  calculateProgress(tasks) {
    if (!tasks || tasks.length === 0)
      return { percentage: 0, completed: 0, total: 0 };

    const completed = tasks.filter((task) => task.completed).length;
    const total = tasks.length;
    const percentage = Math.round((completed / total) * 100);

    return { percentage, completed, total };
  }

  /**
   * 🔄 Met à jour l'affichage
   */
  update(percentage, completed = 0, total = 0) {
    const safePercentage = Math.max(0, Math.min(100, percentage));

    this.fillElement.style.width = `${safePercentage}%`;
    this.textElement.textContent = `${safePercentage}%`;

    const countElement = document.getElementById("task-count");
    if (countElement) {
      countElement.textContent = `(${completed}/${total})`;
    }

    this.barElement.setAttribute("aria-valuenow", safePercentage);

    if (safePercentage === 100) {
      this.celebrate();
    }
  }

  /**
   * 🎉 Animation de célébration
   */
  celebrate() {
    this.container.classList.add("completed");
    setTimeout(() => {
      this.container.classList.remove("completed");
    }, 1000);
  }

  /**
   * 👁️ Affiche/Cache la jauge
   */
  show() {
    this.container.style.display = "block";
  }

  hide() {
    this.container.style.display = "none";
  }
}
