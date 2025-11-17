/**
 * 📝 TASK FORM COMPONENT
 *
 * WHO: Gestionnaire du formulaire de tâches
 * WHAT: Gère création/édition de tâches
 * WHY: Logique de formulaire centralisée
 * HOW: Event listeners + validation
 */

import { ValidationUtils } from "../utils/validation.utils.js";

export class TaskForm {
  constructor(modalElement, formElement) {
    this.modal = modalElement;
    this.form = formElement;
    this.currentTaskId = null;
    this.onSubmitCallback = null;

    this.bindEvents();
  }

  /**
   * Lie les événements du formulaire
   */
  bindEvents() {
    // Soumission formulaire
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Bouton annuler
    const cancelBtn = this.form.querySelector('[type="button"]');
    cancelBtn.addEventListener("click", () => this.close());

    // Fermeture au clic backdrop
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Échap pour fermer
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.open) {
        this.close();
      }
    });
  }

  /**
   * Ouvre le formulaire (création)
   * @param {Function} callback - Fonction appelée à la soumission
   */
  open(callback) {
    this.currentTaskId = null;
    this.onSubmitCallback = callback;
    this.form.reset();
    this.form.querySelector("h2").textContent = "Nouvelle tâche";
    this.modal.showModal();

    // Focus sur le premier champ
    setTimeout(() => {
      this.form.querySelector('[name="title"]').focus();
    }, 100);
  }

  /**
   * Ouvre le formulaire en mode édition
   * @param {Object} task - Tâche à éditer
   * @param {Function} callback - Fonction appelée à la soumission
   */
  openForEdit(task, callback) {
    this.currentTaskId = task.id;
    this.onSubmitCallback = callback;

    // Pré-remplir les champs
    this.form.querySelector('[name="title"]').value = task.title;
    this.form.querySelector('[name="description"]').value =
      task.description || "";
    this.form.querySelector('[name="priority"]').value = task.priority;
    this.form.querySelector('[name="dueDate"]').value = task.dueDate || "";

    this.form.querySelector("h2").textContent = "Modifier la tâche";
    this.modal.showModal();
  }

  /**
   * Ferme le formulaire
   */
  close() {
    this.modal.close();
    this.form.reset();
    this.currentTaskId = null;
  }

  /**
   * Gère la soumission du formulaire
   */
  handleSubmit() {
    const formData = new FormData(this.form);
    const taskData = {
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      priority: formData.get("priority"),
      dueDate: formData.get("dueDate") || null,
    };

    // Validation
    const validation = ValidationUtils.validateTask(taskData);
    if (!validation.valid) {
      this.showError(validation.errors[0]);
      return;
    }

    // Callback avec données
    if (this.onSubmitCallback) {
      this.onSubmitCallback(taskData, this.currentTaskId);
    }

    this.close();
  }

  /**
   * Affiche une erreur de validation
   * @param {string} message - Message d'erreur
   */
  showError(message) {
    // TODO: Implémenter toast notification
    alert(message);
  }
}
