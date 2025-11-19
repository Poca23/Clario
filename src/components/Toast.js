/**
 * 🔔 TOAST NOTIFICATION SYSTEM
 *
 * WHO: Système de notifications utilisateur
 * WHAT: Affichage toast responsive et accessible
 * WHY: Feedback utilisateur unifié et non-intrusif
 * WHERE: Overlay z-index 9999
 * WHEN: Actions CRUD + événements système
 * HOW: Injection dynamique + auto-dismiss + queue
 */

export class Toast {
  constructor() {
    this.container = null;
    this.queue = [];
    this.isProcessing = false;
    this.init();
  }

  // ==========================================
  // 🎯 INITIALISATION
  // ==========================================

  init() {
    if (document.getElementById("toast-container")) return;

    this.container = document.createElement("div");
    this.container.id = "toast-container";
    this.container.className = "toast-container";
    this.container.setAttribute("role", "region");
    this.container.setAttribute("aria-label", "Notifications");
    this.container.setAttribute("aria-live", "polite");

    document.body.appendChild(this.container);
  }

  // ==========================================
  // 🔄 GESTION QUEUE
  // ==========================================

  show(message, type = "info", duration = 4500) {
    const toast = {
      id: `toast-${Date.now()}`,
      message,
      type,
      duration,
    };

    this.queue.push(toast);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const toast = this.queue.shift();

    await this.displayToast(toast);
    this.isProcessing = false;

    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 300);
    }
  }

  // ==========================================
  // 🎨 AFFICHAGE
  // ==========================================

  displayToast({ id, message, type, duration }) {
    return new Promise((resolve) => {
      const toast = this.createToastElement(id, message, type);
      this.container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.add("toast--visible");
      });

      if (duration > 0) {
        setTimeout(() => {
          this.removeToast(id, resolve);
        }, duration);
      }

      const closeBtn = toast.querySelector(".toast__close");
      closeBtn.addEventListener("click", () => {
        this.removeToast(id, resolve);
      });
    });
  }

  createToastElement(id, message, type) {
    const toast = document.createElement("div");
    toast.id = id;
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "alert");

    toast.innerHTML = `
      <div class="toast__icon">${this.getIcon(type)}</div>
      <p class="toast__message">${this.escapeHtml(message)}</p>
      <button class="toast__close" aria-label="Fermer notification">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `;

    return toast;
  }

  removeToast(id, callback) {
    const toast = document.getElementById(id);
    if (!toast) return callback();

    toast.classList.remove("toast--visible");
    toast.classList.add("toast--exit");

    setTimeout(() => {
      toast.remove();
      callback();
    }, 300);
  }

  // ==========================================
  // 🛠️ HELPERS
  // ==========================================

  getIcon(type) {
    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>`,
      error: `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>`,
      info: `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>`,
    };

    return icons[type] || icons.info;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================
  // 🚀 API PUBLIQUE
  // ==========================================

  success(message, duration) {
    this.show(message, "success", duration);
  }

  error(message, duration) {
    this.show(message, "error", duration);
  }

  warning(message, duration) {
    this.show(message, "warning", duration);
  }

  info(message, duration) {
    this.show(message, "info", duration);
  }

  clearAll() {
    this.queue = [];
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}

const toast = new Toast();
export default toast;
