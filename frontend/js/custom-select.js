(function () {
  const STYLE_ID = "sph-custom-select-styles";
  let activeMenu = null;
  let activeInstance = null;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        color-scheme: light;
      }

      .cselect-native {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
        pointer-events: none !important;
      }

      .cselect-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        max-width: 100%;
        min-width: 0;
      }

      .cselect-trigger {
        width: 100%;
        min-width: 0;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius, 8px);
        background: #ffffff;
        color: var(--color-text, #0f172a);
        font: inherit;
        font-size: 13.5px;
        font-weight: 500;
        line-height: 1.4;
        cursor: pointer;
        text-align: left;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }

      .cselect-trigger:hover:not(:disabled) {
        border-color: #94a3b8;
        background: #fafcff;
      }

      .cselect-trigger.is-open,
      .cselect-trigger:focus-visible {
        outline: none;
        border-color: var(--color-primary, #163b65);
        box-shadow: 0 0 0 3px rgba(22, 59, 101, 0.12);
        background: #ffffff;
      }

      .cselect-trigger:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: #f8fafc;
      }

      .cselect-wrap.is-compact .cselect-trigger {
        padding: 4px 9px;
        font-size: 12px;
        font-weight: 600;
        border-radius: 7px;
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      .cselect-wrap.is-compact .cselect-trigger:hover:not(:disabled) {
        background: #ffffff;
        border-color: var(--color-primary, #163b65);
      }

      .cselect-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        min-width: 0;
      }

      .cselect-chevron {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
        color: var(--color-muted, #64748b);
        transition: transform 0.18s ease, color 0.15s ease;
      }

      .cselect-trigger.is-open .cselect-chevron {
        transform: rotate(180deg);
        color: var(--color-primary, #163b65);
      }

      .cselect-menu {
        position: fixed;
        z-index: 9999;
        background: #ffffff;
        border: 1px solid #dbe4f0;
        border-radius: 11px;
        padding: 5px;
        box-shadow: 0 14px 32px -6px rgba(15, 23, 42, 0.16), 0 4px 10px -4px rgba(15, 23, 42, 0.08);
        max-height: 260px;
        overflow-y: auto;
        min-width: 150px;
        animation: cselectFadeIn 0.13s ease-out;
      }

      @keyframes cselectFadeIn {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .cselect-option {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        border: none;
        border-radius: 7px;
        background: transparent;
        color: #1e293b;
        font: inherit;
        font-size: 13px;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 0.12s ease, color 0.12s ease;
      }

      .cselect-option:hover:not(:disabled) {
        background: #f1f5f9;
        color: #0f172a;
      }

      .cselect-option.is-selected {
        background: #eef4fb;
        color: var(--color-primary, #163b65);
        font-weight: 600;
      }

      .cselect-option:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .cselect-option-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .cselect-check {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        color: var(--color-primary, #163b65);
      }
    `;
    document.head.appendChild(style);
  }

  function closeActiveMenu() {
    if (activeMenu) {
      activeMenu.remove();
      activeMenu = null;
    }
    if (activeInstance) {
      activeInstance.trigger.classList.remove("is-open");
      activeInstance.trigger.setAttribute("aria-expanded", "false");
      activeInstance = null;
    }
  }

  function syncInstance(select) {
    const inst = select._cselect;
    if (!inst) return;
    const selectedOpt = select.options[select.selectedIndex] || select.options[0];
    inst.labelEl.textContent = selectedOpt ? selectedOpt.textContent.trim() : "";
    inst.trigger.disabled = Boolean(select.disabled);
  }

  function openMenu(select) {
    const inst = select._cselect;
    if (!inst || select.disabled) return;

    if (activeInstance === inst) {
      closeActiveMenu();
      return;
    }

    closeActiveMenu();
    syncInstance(select);

    const menu = document.createElement("div");
    menu.className = "cselect-menu";
    menu.setAttribute("role", "listbox");

    Array.from(select.options).forEach((opt, idx) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "cselect-option" + (idx === select.selectedIndex ? " is-selected" : "");
      item.disabled = opt.disabled;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", idx === select.selectedIndex ? "true" : "false");

      const textSpan = document.createElement("span");
      textSpan.className = "cselect-option-text";
      textSpan.textContent = opt.textContent.trim();
      item.appendChild(textSpan);

      if (idx === select.selectedIndex) {
        const checkSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        checkSvg.setAttribute("viewBox", "0 0 20 20");
        checkSvg.setAttribute("fill", "currentColor");
        checkSvg.setAttribute("class", "cselect-check");
        checkSvg.innerHTML =
          '<path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.415 0l-3.25-3.25a1 1 0 111.415-1.414L8.75 11.84l6.543-6.55a1 1 0 011.411 0z" clip-rule="evenodd"/>';
        item.appendChild(checkSvg);
      }

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        if (opt.disabled) return;
        const changed = select.selectedIndex !== idx;
        select.selectedIndex = idx;
        syncInstance(select);
        closeActiveMenu();
        if (changed) {
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });

      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    const rect = inst.trigger.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 165);
    menu.style.width = menuWidth + "px";

    const menuHeight = menu.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom - 10;
    const spaceAbove = rect.top - 10;

    let top = rect.bottom + 6;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      top = Math.max(8, rect.top - menuHeight - 6);
    }

    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - menuWidth - 10);
    }

    menu.style.top = top + "px";
    menu.style.left = left + "px";

    inst.trigger.classList.add("is-open");
    inst.trigger.setAttribute("aria-expanded", "true");
    activeMenu = menu;
    activeInstance = inst;
  }

  function enhanceSelect(select) {
    if (!select || select.tagName !== "SELECT" || select._cselect || select.dataset.nativeSelect === "true") {
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "cselect-wrap";

    const isCompact =
      select.classList.contains("quick-move-select") ||
      (select.style.padding && select.style.padding.startsWith("4px")) ||
      (select.style.padding && select.style.padding.startsWith("5px"));

    if (isCompact) {
      wrap.classList.add("is-compact");
    }

    if (select.style.width && select.style.width !== "auto") {
      wrap.style.width = select.style.width;
    } else if (select.closest(".form-group")) {
      wrap.style.width = "100%";
    } else if (select.classList.contains("quick-move-select")) {
      wrap.style.minWidth = "112px";
    } else {
      wrap.style.minWidth = "135px";
    }

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cselect-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const labelEl = document.createElement("span");
    labelEl.className = "cselect-label";

    const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chevron.setAttribute("viewBox", "0 0 20 20");
    chevron.setAttribute("fill", "currentColor");
    chevron.setAttribute("class", "cselect-chevron");
    chevron.innerHTML =
      '<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>';

    trigger.appendChild(labelEl);
    trigger.appendChild(chevron);

    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    wrap.appendChild(trigger);
    select.classList.add("cselect-native");
    select.tabIndex = -1;

    select._cselect = { wrap, trigger, labelEl };
    syncInstance(select);

    // Chặn kéo thẻ Kanban khi người dùng tương tác với dropdown
    wrap.addEventListener("mousedown", (e) => e.stopPropagation());
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openMenu(select);
    });

    select.addEventListener("change", () => syncInstance(select));

    // Theo dõi cập nhật programmatically trên select.value và select.disabled
    const valueDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    if (valueDesc && valueDesc.set && valueDesc.get) {
      Object.defineProperty(select, "value", {
        get() {
          return valueDesc.get.call(this);
        },
        set(val) {
          valueDesc.set.call(this, val);
          syncInstance(this);
        }
      });
    }

    const disabledDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "disabled");
    if (disabledDesc && disabledDesc.set && disabledDesc.get) {
      Object.defineProperty(select, "disabled", {
        get() {
          return disabledDesc.get.call(this);
        },
        set(val) {
          disabledDesc.set.call(this, val);
          syncInstance(this);
        }
      });
    }

    // Theo dõi thay đổi danh sách option bên trong select (innerHTML)
    const optionObserver = new MutationObserver(() => syncInstance(select));
    optionObserver.observe(select, { childList: true, subtree: true, characterData: true, attributes: true });
  }

  function enhanceAll(root = document) {
    injectStyles();
    root.querySelectorAll("select").forEach(enhanceSelect);
  }

  document.addEventListener("click", (e) => {
    if (activeMenu && !activeMenu.contains(e.target)) {
      closeActiveMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeActiveMenu();
  });

  window.addEventListener(
    "scroll",
    (e) => {
      if (activeMenu && e.target !== activeMenu && !activeMenu.contains(e.target)) {
        closeActiveMenu();
      }
    },
    true
  );

  window.addEventListener("resize", closeActiveMenu);

  document.addEventListener("reset", (e) => {
    if (e.target && e.target.tagName === "FORM") {
      setTimeout(() => {
        e.target.querySelectorAll("select").forEach(syncInstance);
      }, 0);
    }
  });

  function startObserver() {
    enhanceAll(document);
    const bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.tagName === "SELECT") {
            enhanceSelect(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll("select").forEach(enhanceSelect);
          }
        });
      });
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  window.refreshCustomSelects = () => enhanceAll(document);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
