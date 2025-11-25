/**
 * 📝 TASK FORM COMPONENT
 *
 * WHO: Gestionnaire du formulaire de tâches
 * WHAT: Gère création/édition de tâches
 * WHY: Logique de formulaire centralisée
 * HOW: Event listeners + validation
 */

import { ValidationUtils } from "../utils/validation.utils.js";
import toast from "./Toast.js";

export class TaskForm {
  constructor(modalElement, formElement) {
    this.modal = modalElement;
    this.form = formElement;
    this.currentTaskId = null;
    this.onSubmitCallback = null;

    this.bindEvents();
    this.setMinDate();
  }

  // ==========================================
  // 🎯 EVENTS
  // ==========================================

  bindEvents() {
    // Soumission formulaire
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Bouton annuler
    const cancelBtn = this.form.querySelector('[type="button"]');
    cancelBtn.addEventListener("click", () => this.close());

    // Fermeture backdrop
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Fermeture ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.open) {
        this.close();
      }
    });

    // Validation heure dynamique
    const dateInput = this.form.querySelector('[name="dueDate"]');
    const timeInput = this.form.querySelector('[name="dueTime"]');

    dateInput?.addEventListener("change", () => {
      const selectedDate = new Date(dateInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate.toDateString() === today.toDateString()) {
        const now = new Date();
        const minTime = `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`;
        timeInput.setAttribute("min", minTime);
      } else {
        timeInput.removeAttribute("min");
      }
    });
  }

  setMinDate() {
    const dateInput = this.form.querySelector('[name="dueDate"]');
    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.setAttribute("min", today);
    }
  }

  // ==========================================
  // 🎨 UI METHODS
  // ==========================================

  open(callback) {
    this.currentTaskId = null;
    this.onSubmitCallback = callback;
    this.form.reset();
    this.form.querySelector("h2").textContent = "Nouvelle tâche";
    this.modal.showModal();

    setTimeout(() => {
      this.form.querySelector('[name="title"]').focus();
    }, 100);
  }

  openForEdit(task, callback) {
    this.currentTaskId = task.id;
    this.onSubmitCallback = callback;

    this.form.querySelector('[name="title"]').value = task.title;
    this.form.querySelector('[name="description"]').value =
      task.description || "";
    this.form.querySelector('[name="priority"]').value = task.priority;
    this.form.querySelector('[name="dueDate"]').value = task.dueDate || "";
    this.form.querySelector('[name="dueTime"]').value = task.dueTime || "";

    this.form.querySelector("h2").textContent = "Modifier la tâche";
    this.modal.showModal();
  }

  close() {
    this.modal.close();
    this.form.reset();
    this.currentTaskId = null;
  }

  // ==========================================
  // 📝 FORM HANDLING
  // ==========================================

  handleSubmit() {
    const formData = new FormData(this.form);
    const taskData = {
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      priority: formData.get("priority"),
      dueDate: formData.get("dueDate") || null,
      dueTime: formData.get("dueTime") || null,
    };

    const validation = ValidationUtils.validateTask(taskData);
    if (!validation.valid) {
      this.showError(validation.errors[0]);
      return;
    }

    if (this.onSubmitCallback) {
      this.onSubmitCallback(taskData, this.currentTaskId);
    }

    this.close();
  }

  // ==========================================
  // ⚠️ ERROR HANDLING
  // ==========================================

  showError(message) {
    toast.error(message, 4000);
  }
}
