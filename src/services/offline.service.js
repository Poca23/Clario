/**
 * 🌐 OFFLINE DETECTION SERVICE
 *
 * WHO: Gestionnaire état réseau
 * WHAT: Détecte connexion/déconnexion
 * WHY: Adapter UX selon disponibilité réseau
 * HOW: API Navigator + EventListeners
 */

export class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.init();
  }

  /**
   * Initialise les listeners réseau
   */
  init() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners("online");
      console.log("🌐 Connexion rétablie");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners("offline");
      console.log("📡 Mode hors ligne");
    });
  }

  /**
   * Enregistre un listener de changement d'état
   * @param {Function} callback - Fonction appelée lors du changement
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notifie tous les listeners
   * @param {string} status - 'online' ou 'offline'
   */
  notifyListeners(status) {
    this.listeners.forEach((listener) => {
      try {
        listener(status, this.isOnline);
      } catch (error) {
        console.error("❌ Erreur listener offline:", error);
      }
    });
  }

  /**
   * Vérifie l'état actuel du réseau
   * @returns {boolean} True si en ligne
   */
  checkStatus() {
    return navigator.onLine;
  }

  /**
   * Teste la connexion avec un ping
   * @returns {Promise<boolean>} True si connecté
   */
  async testConnection() {
    try {
      const response = await fetch("https://www.google.com/favicon.ico", {
        mode: "no-cors",
        cache: "no-cache",
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
