/**
 * 📊 TASK COUNTER COMPONENT
 *
 * WHO: Affiche progression des tâches
 * WHAT: Jauge circulaire + stats
 * WHY: Feedback visuel immédiat
 * HOW: SVG circle + CSS animations
 */

export class TaskCounter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
  }

  /**
   * 🎨 Génère le HTML du compteur
   */
  render() {
    this.container.innerHTML = `
      <div class="task-counter">
        <!-- Jauge circulaire SVG -->
        <svg class="counter__gauge" viewBox="0 0 100 100">
          <!-- Background circle -->
          <circle class="gauge__bg" cx="50" cy="50" r="40" />
          
          <!-- Progress circle (animée) -->
          <circle 
            class="gauge__progress" 
            cx="50" 
            cy="50" 
            r="40"
            data-progress="0"
          />
        </svg>

        <!-- Texte central -->
        <div class="counter__label">
          <span class="counter__number">0</span>
          <span class="counter__total">/ 0</span>
          <span class="counter__text">terminées</span>
        </div>

        <!-- Stats détaillées (masquable mobile) -->
        <div class="counter__details">
          <div class="stat">
            <span class="stat__value" data-stat="pending">0</span>
            <span class="stat__label">En cours</span>
          </div>
          <div class="stat">
            <span class="stat__value" data-stat="completed">0</span>
            <span class="stat__label">Complétées</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 🔄 Met à jour le compteur
   * @param {Array} tasks - Liste des tâches
   */
  update(tasks) {
    const completed = tasks.filter((t) => t.completed).length;
    const total = tasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    // Update numbers
    this.container.querySelector(".counter__number").textContent = completed;
    this.container.querySelector(".counter__total").textContent = `/ ${total}`;

    // Update stats
    this.container.querySelector('[data-stat="pending"]').textContent =
      total - completed;
    this.container.querySelector('[data-stat="completed"]').textContent =
      completed;

    // Update gauge (animation CSS)
    const circle = this.container.querySelector(".gauge__progress");
    circle.style.setProperty("--progress", percentage);
  }
}
