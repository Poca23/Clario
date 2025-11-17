/**
 * 🎯 FILTER BAR COMPONENT
 *
 * WHO: Barre de filtres responsive avec dropdowns
 * WHAT: Gestion filtres statut/date/priorité/tri
 * WHY: Séparation logique filtrage de l'app principale
 * HOW: Event delegation + positionnement intelligent
 */

export class FilterBar {
  constructor(onFilterChange) {
    this.onFilterChange = onFilterChange; // Callback vers app.js

    // État des filtres
    this.filters = {
      status: "all",
      date: "all",
      priority: "all",
      sort: "newest",
    };

    // Éléments DOM
    this.dropdowns = {
      status: {
        btn: document.getElementById("status-btn"),
        menu: document.getElementById("status-menu"),
        items: document.querySelectorAll("#status-menu .filter-item"),
      },
      date: {
        btn: document.getElementById("date-btn"),
        menu: document.getElementById("date-menu"),
        items: document.querySelectorAll("#date-menu .filter-item"),
      },
      priority: {
        btn: document.getElementById("priority-btn"),
        menu: document.getElementById("priority-menu"),
        items: document.querySelectorAll("#priority-menu .filter-item"),
      },
      sort: {
        btn: document.getElementById("sort-btn"),
        menu: document.getElementById("sort-menu"),
        items: document.querySelectorAll("#sort-menu .filter-item"),
      },
    };

    this.init();
  }

  /**
   * 🚀 Initialisation
   */
  init() {
    this.bindEvents();
    console.log("✅ FilterBar initialisée");
  }

  /**
   * 🔗 Lie les événements
   */
  bindEvents() {
    // Toggle dropdowns
    Object.entries(this.dropdowns).forEach(([key, dropdown]) => {
      dropdown.btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleDropdown(key);
      });

      // Sélection items
      dropdown.items.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleSelect(key, item);
        });
      });
    });

    // Fermer au clic extérieur
    document.addEventListener("click", () => this.closeAll());

    // Repositionner au resize
    window.addEventListener("resize", () => {
      Object.entries(this.dropdowns).forEach(([key, dropdown]) => {
        if (dropdown.menu.classList.contains("active")) {
          this.position(dropdown.btn, dropdown.menu);
        }
      });
    });
  }

  /**
   * 🎯 Toggle un dropdown
   */
  toggleDropdown(key) {
    const dropdown = this.dropdowns[key];
    const isActive = dropdown.menu.classList.contains("active");

    this.closeAll();

    if (!isActive) {
      dropdown.menu.classList.add("active");
      dropdown.btn.classList.add("active");
      this.position(dropdown.btn, dropdown.menu);
    }
  }

  /**
   * 📍 Positionne intelligemment le menu SANS DÉBORDEMENT
   */
  position(button, menu) {
    const PADDING = 16; // Marge sécurité viewport
    const isMobile = window.innerWidth <= 480;

    // Reset
    menu.style.top = "";
    menu.style.bottom = "";
    menu.style.left = "";
    menu.style.right = "";
    menu.style.transform = "";

    const btnRect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // ===== VERTICAL =====
    const spaceBelow = viewport.height - btnRect.bottom - PADDING;
    const spaceAbove = btnRect.top - PADDING;

    if (spaceBelow >= menuRect.height || spaceBelow > spaceAbove) {
      menu.style.top = `${btnRect.bottom + 4}px`;
    } else {
      menu.style.bottom = `${viewport.height - btnRect.top + 4}px`;
    }

    // ===== HORIZONTAL =====
    if (isMobile) {
      // Mobile: centré avec contrainte
      const centeredLeft =
        btnRect.left + btnRect.width / 2 - menuRect.width / 2;
      const maxLeft = viewport.width - menuRect.width - PADDING;
      const finalLeft = Math.max(PADDING, Math.min(centeredLeft, maxLeft));

      menu.style.left = `${finalLeft}px`;
    } else {
      // Desktop: aligné bouton avec contrainte
      const spaceRight = viewport.width - btnRect.left - PADDING;

      if (spaceRight >= menuRect.width) {
        menu.style.left = `${btnRect.left}px`;
      } else {
        menu.style.right = `${viewport.width - btnRect.right}px`;
      }
    }
  }

  /**
   * ✅ Gère la sélection d'un item
   */
  handleSelect(type, item) {
    const dropdown = this.dropdowns[type];

    // Mise à jour UI
    dropdown.items.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    // Mise à jour état
    const value =
      item.dataset[type] || item.dataset.filter || item.dataset.sort;
    this.filters[type] = value;

    // Fermer menu
    dropdown.menu.classList.remove("active");
    dropdown.btn.classList.remove("active");

    // Notifier parent
    this.onFilterChange(this.filters);
  }

  /**
   * 🚪 Ferme tous les dropdowns
   */
  closeAll() {
    Object.values(this.dropdowns).forEach((dropdown) => {
      dropdown.menu.classList.remove("active");
      dropdown.btn.classList.remove("active");
    });
  }

  /**
   * 📊 Récupère les filtres actuels
   */
  getFilters() {
    return { ...this.filters };
  }
}
