/**
 * 🌐 OFFLINE DETECTION SERVICE
 * Détecte et notifie les changements de connexion réseau
 */

export class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.init();
  }

  init() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners("online");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners("offline");
    });
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(status) {
    this.listeners.forEach((listener) => {
      try {
        listener(status, this.isOnline);
      } catch (error) {
        console.error("❌ Erreur listener offline:", error);
      }
    });
  }

  checkStatus() {
    return navigator.onLine;
  }

  async testConnection() {
    try {
      await fetch("https://www.google.com/favicon.ico", {
        mode: "no-cors",
        cache: "no-cache",
      });
      return true;
    } catch {
      return false;
    }
  }
}
