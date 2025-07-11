// assets/js/keyboard.js
class KeyboardManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.bindKeyboardEvents();
  }

  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+N - Nouvelle tâche
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.uiManager.showModal();
      }
      
      // Ctrl+F - Focus recherche
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.filter-bar__search input');
        searchInput.focus();
      }
      
      // Escape - Fermer modal
      if (e.key === 'Escape') {
        this.uiManager.hideModal();
      }
      
      // Enter dans modal - Valider
      if (e.key === 'Enter' && document.querySelector('.modal').style.display !== 'none') {
        const form = document.querySelector('.modal form');
        if (e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          form.dispatchEvent(new Event('submit'));
        }
      }
    });

    // Afficher les raccourcis (optionnel)
    this.showKeyboardHint();
  }

  showKeyboardHint() {
    // Ajouter une indication des raccourcis
    const hint = document.createElement('div');
    hint.className = 'keyboard-hint';
    hint.innerHTML = `
      <small>💡 Raccourcis : Ctrl+N (Nouvelle tâche) | Ctrl+F (Recherche) | Esc (Fermer)</small>
    `;
    document.querySelector('.container').appendChild(hint);
  }
}

export default KeyboardManager;
