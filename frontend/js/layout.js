// Layout chung: tự động nạp header, menu responsive và footer thống nhất cho toàn bộ trang
const MENU = [
  { href: "index.html", label: "Trang chủ" },
  { href: "pages/projects.html", label: "Dự án của tôi" },
  { href: "pages/tasks.html", label: "Nhiệm vụ" },
  { href: "pages/members.html", label: "Thành viên" },
  { href: "pages/profile.html", label: "Hồ sơ" },
  { href: "pages/login.html", label: "Đăng nhập" },
];

function getActiveProjectIdForNav() {
  try {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get("project_id") || params.get("id");
    if (paramId && /^\d+$/.test(paramId)) {
      sessionStorage.setItem("sph_active_project_id", paramId);
      return paramId;
    }
    const stored = sessionStorage.getItem("sph_active_project_id");
    if (stored && /^\d+$/.test(stored)) {
      return stored;
    }
  } catch (e) {
    // Bỏ qua nếu sessionStorage không khả dụng
  }
  return "";
}

function getUserInitials(name) {
  const parts = String(name || "SV").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderLayout() {
  const root = document.body.dataset.root || "./";
  const currentPath = window.location.pathname;
  const user = typeof auth !== "undefined" && auth.getUser ? auth.getUser() : null;
  const isLoggedIn = typeof auth !== "undefined" && auth.isAuthenticated ? auth.isAuthenticated() : false;
  const activeProjectId = getActiveProjectIdForNav();
  const appName = (typeof CONFIG !== "undefined" && CONFIG.APP_NAME) || "Student Project Management System";
  const safeEsc = typeof escapeHtml === "function" ? escapeHtml : (v) => String(v || "");

  const links = MENU.map(function (item) {
    if (isLoggedIn && item.href === "pages/login.html") {
      return "";
    }

    let targetHref = root + item.href;
    if (activeProjectId && (item.href === "pages/tasks.html" || item.href === "pages/members.html")) {
      targetHref += "?project_id=" + encodeURIComponent(activeProjectId);
    }

    const isActive =
      currentPath.endsWith("/" + item.href) ||
      (item.href === "index.html" && (currentPath.endsWith("/") || currentPath.endsWith("index.html")));
    const activeClass = isActive ? " active" : "";

    return (
      '<a href="' +
      targetHref +
      '" class="nav-link' +
      activeClass +
      '">' +
      item.label +
      "</a>"
    );
  }).join("");

  let userSection = "";
  if (isLoggedIn) {
    const displayName = (user && (user.full_name || user.email)) || "Sinh viên";
    const initials = getUserInitials(displayName);
    userSection =
      '<div class="user-nav">' +
      '<a href="' +
      root +
      'pages/profile.html" class="user-profile-link" title="Xem và chỉnh sửa hồ sơ cá nhân">' +
      '<span class="user-avatar-chip">' +
      safeEsc(initials) +
      "</span>" +
      '<span class="user-name-text">' +
      safeEsc(displayName) +
      "</span>" +
      "</a>" +
      '<button type="button" class="btn btn-small btn-danger btn-logout" id="btn-logout" onclick="auth.logout()" title="Đăng xuất khỏi tài khoản">Đăng xuất</button>' +
      "</div>";
  }

  const header = document.getElementById("app-header");
  if (header) {
    header.innerHTML =
      '<div class="container header-inner">' +
      '<a href="' +
      root +
      'index.html" class="brand" title="' +
      safeEsc(appName) +
      '">' +
      '<img src="' +
      root +
      'assets/images/logo.png" alt="' +
      safeEsc(appName) +
      '" class="brand-logo">' +
      "</a>" +
      '<button type="button" class="nav-toggle" id="btn-mobile-nav" aria-label="Mở menu điều hướng" aria-expanded="false" aria-controls="main-nav">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<line x1="4" y1="7" x2="20" y2="7"></line>' +
      '<line x1="4" y1="12" x2="20" y2="12"></line>' +
      '<line x1="4" y1="17" x2="20" y2="17"></line>' +
      "</svg>" +
      "</button>" +
      '<nav class="nav" id="main-nav" aria-label="Điều hướng chính">' +
      links +
      userSection +
      "</nav>" +
      "</div>";

    const toggleBtn = document.getElementById("btn-mobile-nav");
    const mainNav = document.getElementById("main-nav");
    if (toggleBtn && mainNav) {
      const closeMenu = function () {
        mainNav.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
      };

      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        const willOpen = !mainNav.classList.contains("is-open");
        mainNav.classList.toggle("is-open", willOpen);
        toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });

      document.addEventListener("click", function (e) {
        if (!header.contains(e.target)) {
          closeMenu();
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeMenu();
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 900) closeMenu();
      });
    }
  }

  const footer = document.getElementById("app-footer");
  if (footer) {
    const tasksHref = root + "pages/tasks.html" + (activeProjectId ? "?project_id=" + encodeURIComponent(activeProjectId) : "");
    const membersHref = root + "pages/members.html" + (activeProjectId ? "?project_id=" + encodeURIComponent(activeProjectId) : "");
    footer.innerHTML =
      '<div class="container footer-inner">' +
      "<div>© " +
      new Date().getFullYear() +
      " " +
      safeEsc(appName) +
      " · Nhóm thực tập sinh viên CNTT PTIT</div>" +
      '<div class="footer-links">' +
      '<a href="' + root + 'index.html">Trang chủ</a>' +
      '<a href="' + root + 'pages/projects.html">Dự án</a>' +
      '<a href="' + tasksHref + '">Nhiệm vụ</a>' +
      '<a href="' + membersHref + '">Thành viên</a>' +
      '<a href="' + root + 'pages/profile.html">Hồ sơ</a>' +
      "</div>" +
      "</div>";
  }
}

renderLayout();
