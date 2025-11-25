/**
 * 📅 DATE UTILITIES (CORRIGÉ)
 */

/**
 * Formate une date en français
 * @param {string|Date|number} date - Date à formater (ISO/Date/timestamp)
 * @returns {string} Date formatée (ex: "15 janv. 2024")
 */
export function formatDate(date) {
  if (!date) return "Aucune date";

  let dateObj;

  if (typeof date === "string") {
    dateObj = new Date(date);
  } else if (typeof date === "number") {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return "Format invalide";
  }

  if (isNaN(dateObj.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dateObj);
}

/**
 * Formate une date en format relatif
 * @param {string|Date|number} date - Date à formater
 * @returns {string} Format relatif (ex: "il y a 2 jours")
 */
export function formatRelative(date) {
  if (!date) return "Aucune date";

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "Date invalide";
  }

  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays === -1) return "Demain";
  if (diffDays > 1 && diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < -1 && diffDays > -7) return `Dans ${Math.abs(diffDays)} jours`;

  return formatDate(date);
}

/**
 * Vérifie si une date est passée
 * @param {string|Date|number} date - Date à vérifier
 * @returns {boolean} True si passée
 */
export function isPastDue(date) {
  if (!date) return false;
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime()) && dateObj < new Date();
}

/**
 * Calcule le nombre de jours restants
 * @param {string|Date|number} date - Date cible
 * @returns {number} Nombre de jours
 */
export function daysUntil(date) {
  if (!date) return null;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return null;

  const now = new Date();
  const diffMs = dateObj - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Retourne la date du jour en format ISO
 * @returns {string} Date ISO (YYYY-MM-DD)
 */
export function getTodayISO() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Valide un format de date
 * @param {string|Date|number} dateString - Date à valider
 * @returns {boolean} True si valide
 */
export function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Export par défaut pour compatibilité
export default {
  formatDate,
  formatRelative,
  isPastDue,
  daysUntil,
  getTodayISO,
  isValidDate,
};
