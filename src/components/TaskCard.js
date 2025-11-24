/**
 * 📋 TASK CARD COMPONENT
 *
 * WHO: Composant d'affichage d'une tâche
 * WHAT: Génère le HTML d'une card task
 * WHY: Réutilisabilité + séparation des préoccupations
 * HOW: Template literals + event delegation
 */

import { formatDate } from "../utils/date.utils.js";

export class TaskCard {
  /**
   * Tronque la description à 4 mots
   * @param {string} text - Texte à tronquer
   * @returns {string} Texte tronqué
   */
  static truncateDescription(text) {
    if (!text) return "";

    const words = text.split(" ");
    if (words.length <= 4) return text;

    return words.slice(0, 4).join(" ") + "...";
  }

  /**
   * Formate date + heure
   * @param {string} date - Date ISO
   * @param {string} time - Heure (HH:MM)
   * @returns {string} Date formatée
   */
  static formatDateTime(date, time) {
    const dateStr = formatDate(date);
    if (!time) return dateStr;

    return `${dateStr} • ${time}`;
  }
  /**
   * Crée le HTML d'une task card
   * @param {Object} task - Données de la tâche
   * @returns {string} HTML de la card
   */
  static render(task) {
    const {
      id,
      title,
      description = "",
      priority = "medium",
      completed = false,
      dueDate,
      dueTime,
      createdAt,
    } = task;

    const status = task.status || (completed ? "done" : "todo");
    const statusLabels = {
      todo: "À faire",
      progress: "En cours",
      done: "Terminée",
    };
    const statusClass = status;
    const statusText = statusLabels[status];
    const truncatedDesc = this.truncateDescription(description);

    return `
      <article 
        class="task-card" 
        data-task-id="${id}"
        data-priority="${priority}"
        data-completed="${completed}"
        role="article"
        aria-label="Tâche: ${title}"
      >
        <header class="task-card__header">
          <h3 class="task-card__title">${this.escapeHtml(title)}</h3>
          <div class="task-card__actions">
  <select class="task-card__status-select" data-action="change-status" 
    aria-label="Changer le statut">
    <option value="todo" ${
      status === "todo" ? "selected" : ""
    }>⏳ À faire</option>
    <option value="progress" ${
      status === "progress" ? "selected" : ""
    }>🔄 En cours</option>
    <option value="done" ${
      status === "done" ? "selected" : ""
    }>✔️ Terminée</option>
  </select>
  <button class="task-card__btn" data-action="edit" aria-label="Modifier">
    ${this.getEditIcon()}
  </button>
  <button class="task-card__btn" data-action="delete" aria-label="Supprimer">
    ${this.getDeleteIcon()}
  </button>
</div>
        </header>

        ${
          truncatedDesc
            ? `
          <p class="task-card__description">${this.escapeHtml(
            truncatedDesc
          )}</p>
        `
            : ""
        }

        <footer class="task-card__footer">
          <span class="task-card__date">
            ${this.getCalendarIcon()}
            ${this.formatDateTime(dueDate || createdAt, dueTime)}
          </span>
          <span class="task-card__status task-card__status--${statusClass}">
            ${statusText}
          </span>
        </footer>
      </article>
    `;
  }

  /**
   * Échappe le HTML pour éviter XSS
   * @param {string} text - Texte à échapper
   * @returns {string} Texte sécurisé
   */
  static escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Icône checkbox
   * @param {boolean} checked - État de la checkbox
   * @returns {string} SVG
   */
  static getCheckIcon(checked) {
    return checked
      ? `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>
    `
      : `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
      </svg>
    `;
  }

  /**
   * Icône édition
   * @returns {string} SVG
   */
  static getEditIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    `;
  }

  /**
   * Icône suppression
   * @returns {string} SVG
   */
  static getDeleteIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;
  }

  /**
   * Icône calendrier
   * @returns {string} SVG
   */
  static getCalendarIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
      </svg>
    `;
  }
}
