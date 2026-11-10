// ==========================================================
// STUDENT PROJECT HUB - LAYOUT CHUNG (HEADER / MENU / FOOTER)
// Sử dụng SVG icon đồng bộ cho menu và các nút điều khiển
// ==========================================================

// Danh sách các mục trong Menu chính
const MENU = [
  { href: "index.html", label: "Tổng quan", icon: "dashboard" },
  { href: "pages/projects.html", label: "Dự án của tôi", icon: "folder" },
  { href: "pages/kanban.html", label: "Kanban Board", icon: "kanban" },
  { href: "pages/milestones.html", label: "Cột mốc", icon: "flag" },
  { href: "pages/components.html", label: "Khung UI Mẫu", icon: "palette" },
];

function renderLayout() {
  const root = document.body.dataset.root || "./";
  const currentPath = window.location.pathname;

  // 1. Tạo các mục menu với SVG Icon
  const linksHtml = MENU.map((item) => {
    const isRootMatch = item.href === "index.html" && (currentPath.endsWith("/") || currentPath.endsWith("/index.html"));
    const isPageMatch = currentPath.endsWith(item.href);
    const isActive = isRootMatch || isPageMatch;
    const iconHtml = typeof getIcon === "function" ? getIcon(item.icon, { size: 16 }) : "";

    return `<a href="${root}${item.href}" class="${isActive ? "active" : ""}">
      ${iconHtml}
      <span>${item.label}</span>
    </a>`;
  }).join("");

  // 2. Khu vực trạng thái người dùng (User & Notifications)
  const user = typeof auth !== "undefined" ? auth.getUser() : null;
  let userActionsHtml = "";

  const bellIconHtml = typeof getIcon === "function" ? getIcon("bell", { size: 18 }) : "🔔";
  const menuIconHtml = typeof getIcon === "function" ? getIcon("menu", { size: 20 }) : "☰";

  if (user) {
    userActionsHtml = `
      <a href="${root}pages/notifications.html" class="btn-icon-badge" title="Thông báo">
        ${bellIconHtml}
        <span class="badge-count" id="header-notif-count">2</span>
      </a>
      <div class="user-profile-menu">
        <span class="muted">${escapeHtml(user.full_name || "Thành viên")}</span>
        <button id="btn-header-logout" class="btn btn-small btn-outline-danger">Đăng xuất</button>
      </div>
    `;
  } else {
    userActionsHtml = `
      <a href="${root}pages/components.html" class="btn btn-small btn-primary">
        ${typeof getIcon === "function" ? getIcon("palette", { size: 14 }) : ""}
        <span>UI Kit Mẫu</span>
      </a>
    `;
  }

  // 3. Render Header
  const headerEl = document.getElementById("app-header");
  if (headerEl) {
    headerEl.innerHTML = `
      <div class="container header-inner">
        <a href="${root}index.html" class="brand">
          <img src="${root}assets/images/logo.svg" alt="SPH Logo" width="32" height="32">
          <span>${CONFIG.APP_NAME}</span>
        </a>

        <button class="mobile-menu-toggle" id="btn-toggle-menu" aria-label="Mở menu">
          ${menuIconHtml}
        </button>

        <nav class="header-nav" id="header-nav">
          ${linksHtml}
        </nav>

        <div class="header-actions">
          ${userActionsHtml}
        </div>
      </div>
    `;

    // Bắt sự kiện menu trên mobile
    const toggleBtn = document.getElementById("btn-toggle-menu");
    const navEl = document.getElementById("header-nav");
    if (toggleBtn && navEl) {
      toggleBtn.addEventListener("click", () => {
        navEl.classList.toggle("is-open");
      });
    }

    // Bắt sự kiện đăng xuất nếu có nút
    const logoutBtn = document.getElementById("btn-header-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
          auth.logout(`${root}index.html`);
        }
      });
    }
  }

  // 4. Render Footer
  const footerEl = document.getElementById("app-footer");
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="container">
        <p style="margin-bottom: 4px;">
          <strong>${CONFIG.APP_NAME}</strong> · Nền tảng quản lý đồ án và bài tập nhóm CNTT (SRS v1.0)
        </p>
        <p class="muted" style="margin-bottom: 0; font-size: 13px;">
          © ${new Date().getFullYear()} Nhóm 5 sinh viên CNTT PTIT · Lớp HN-KS25-CNTT1
        </p>
      </div>
    `;
  }
}

// Lắng nghe sự kiện mất phiên đăng nhập
window.addEventListener("sph:unauthorized", (event) => {
  if (typeof showToast === "function") {
    showToast(event.detail?.message || "Phiên đăng nhập đã hết hạn.", "error");
  }
});

// Tự động khởi chạy layout khi nạp file
renderLayout();
