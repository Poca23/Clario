// assets/js/modules/theme.js
class ThemeManager {
  constructor() {
    this.initTheme();
    this.bindEvents();
  }

  initTheme() {
    // Détecter préférence système
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    this.setTheme(theme);
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateIcon(theme);
  }

  updateIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  bindEvents() {
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Écouter changements système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

export default ThemeManager;
