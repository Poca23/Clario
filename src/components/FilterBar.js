/**
 * 🎯 FILTER BAR COMPONENT
 */

export class FilterBar {
  constructor(onFilterChange) {
    this.onFilterChange = onFilterChange;

    this.filters = {
      status: "all",
      date: "all",
      priority: "all",
      sort: "newest",
    };

    this.config = ["status", "date", "priority", "sort"];
    this.dropdowns = {};
    this.activeMenu = null;

    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.config.forEach((key) => {
      const btn = document.getElementById(`${key}-btn`);
      const menu = document.getElementById(`${key}-menu`);

      if (menu && menu.parentElement !== document.body) {
        document.body.appendChild(menu);
      }

      this.dropdowns[key] = {
        btn,
        menu,
        items: document.querySelectorAll(`#${key}-menu .filter-item`),
      };
    });
  }

  bindEvents() {
    this.config.forEach((key) => {
      const { btn, items } = this.dropdowns[key];

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggle(key);
      });

      items.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.select(key, item);
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (this.activeMenu) {
        const clickedMenu = e.target.closest(".filter-menu");
        const clickedBtn = e.target.closest(".filter-btn");

        if (!clickedMenu && !clickedBtn) {
          this.closeAll();
        }
      }
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.activeMenu) {
          this.position(
            this.dropdowns[this.activeMenu].btn,
            this.dropdowns[this.activeMenu].menu
          );
        }
      }, 100);
    });
  }

  toggle(key) {
    if (this.activeMenu === key) {
      this.close(key);
      this.activeMenu = null;
      return;
    }

    if (this.activeMenu) {
      this.close(this.activeMenu);
    }

    this.open(key);
    this.activeMenu = key;
  }

  open(key) {
    const { btn, menu } = this.dropdowns[key];

    btn.classList.add("active");
    menu.classList.add("active");
    menu.style.display = "flex";

    this.position(btn, menu);
  }

  close(key) {
    const { btn, menu } = this.dropdowns[key];

    btn.classList.remove("active");
    menu.classList.remove("active");
    menu.style.display = "none";
  }

  closeAll() {
    if (!this.activeMenu) return;

    this.config.forEach((key) => {
      this.close(key);
    });

    this.activeMenu = null;
  }

  position(btn, menu) {
    const PAD = 16;
    const isMobile = window.innerWidth <= 480;

    Object.assign(menu.style, {
      top: "",
      bottom: "",
      left: "",
      right: "",
      transform: "",
      visibility: "hidden",
    });

    menu.offsetHeight;

    const btnRect = btn.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceBelow = vh - btnRect.bottom - PAD;
    const spaceAbove = btnRect.top - PAD;
    const menuHeight = menuRect.height;

    if (spaceBelow >= menuHeight) {
      menu.style.top = `${btnRect.bottom + 4}px`;
    } else if (spaceAbove >= menuHeight) {
      menu.style.top = `${btnRect.top - menuHeight - 4}px`;
    } else {
      menu.style.top = `${btnRect.bottom + 4}px`;
      menu.style.maxHeight = `${spaceBelow - PAD}px`;
      menu.style.overflowY = "auto";
    }

    if (isMobile) {
      const center = btnRect.left + btnRect.width / 2 - menuRect.width / 2;
      const left = Math.max(PAD, Math.min(center, vw - menuRect.width - PAD));
      menu.style.left = `${left}px`;
    } else {
      const spaceRight = vw - btnRect.left - PAD;
      if (spaceRight >= menuRect.width) {
        menu.style.left = `${btnRect.left}px`;
      } else {
        menu.style.right = `${vw - btnRect.right}px`;
      }
    }

    menu.style.visibility = "visible";
  }

  select(type, item) {
    const { items } = this.dropdowns[type];

    items.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    const value =
      item.dataset[type] || item.dataset.filter || item.dataset.sort;
    this.filters[type] = value;

    this.close(type);
    this.activeMenu = null;

    this.onFilterChange(this.filters);
  }

  getFilters() {
    return { ...this.filters };
  }
}
