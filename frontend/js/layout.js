// Layout chung: tự động nạp header và footer thống nhất vào mọi trang
const MENU = [
  { href: "index.html", label: "Trang chủ" },
  { href: "pages/projects.html", label: "Dự án của tôi" },
  { href: "pages/tasks.html", label: "Nhiệm vụ", keepProject: true },
  { href: "pages/members.html", label: "Thành viên", keepProject: true },
  { href: "pages/profile.html", label: "Hồ sơ" },
  { href: "pages/login.html", label: "Đăng nhập" },
];

function renderLayout() {
  const root = document.body.dataset.root || "./";
  const currentPath = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const currentProjectId = searchParams.get("project_id") || searchParams.get("id");
  const user = typeof auth !== "undefined" && auth.getUser ? auth.getUser() : null;
  const isLoggedIn = typeof auth !== "undefined" && auth.isAuthenticated ? auth.isAuthenticated() : false;
  const appName = (typeof CONFIG !== "undefined" && CONFIG.APP_NAME) ? CONFIG.APP_NAME : "Student Project Hub";

  const links = MENU.map(function (item) {
    // Nếu đã đăng nhập thì ẩn nút Đăng nhập; nếu chưa đăng nhập thì ẩn Hồ sơ
    if (isLoggedIn && item.href === "pages/login.html") {
      return "";
    }
    if (!isLoggedIn && item.href === "pages/profile.html") {
      return "";
    }
    const isActive = currentPath.endsWith("/" + item.href) ||
      (item.href === "index.html" && (currentPath.endsWith("/") || currentPath.endsWith("index.html")));
    const activeClass = isActive ? "active" : "";
    const querySuffix = (item.keepProject && currentProjectId) ? ("?project_id=" + encodeURIComponent(currentProjectId)) : "";
    return '<a href="' + root + item.href + querySuffix + '" class="' + activeClass + '">' + item.label + '</a>';
  }).join("");

  let userSection = "";
  if (isLoggedIn) {
    const displayName = (user && (user.full_name || user.email)) || "Sinh viên";
    userSection = '<div class="user-nav">' +
      '<span class="user-greeting">Xin chào, <strong>' + escapeHtml(displayName) + '</strong></span>' +
      '<button type="button" class="btn btn-small btn-danger btn-logout" id="btn-logout" onclick="auth.logout()" title="Đăng xuất khỏi tài khoản">Đăng xuất</button>' +
      '</div>';
  }

  const header = document.getElementById("app-header");
  if (header) {
    header.innerHTML = '<div class="container header-inner">' +
      '<a href="' + root + 'index.html" class="brand" title="' + escapeHtml(appName) + '">' +
      '<img src="' + root + 'assets/images/logo.png" alt="' + escapeHtml(appName) + '" class="brand-logo">' +
      '</a>' +
      '<button type="button" class="nav-toggle" id="btn-mobile-nav-toggle" aria-label="Mở menu điều hướng" aria-expanded="false">☰</button>' +
      '<nav class="nav" id="app-main-nav">' + links + userSection + '</nav>' +
      '</div>';

    const toggleBtn = document.getElementById("btn-mobile-nav-toggle");
    const mainNav = document.getElementById("app-main-nav");
    if (toggleBtn && mainNav) {
      toggleBtn.addEventListener("click", function () {
        const isOpen = mainNav.classList.toggle("is-open");
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        toggleBtn.textContent = isOpen ? "✕" : "☰";
      });
      mainNav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          mainNav.classList.remove("is-open");
          toggleBtn.setAttribute("aria-expanded", "false");
          toggleBtn.textContent = "☰";
        });
      });
    }
  }

  const footer = document.getElementById("app-footer");
  if (footer) {
    footer.innerHTML = '<div class="container">' +
      '© ' + new Date().getFullYear() + ' ' + escapeHtml(appName) + ' · Nhóm thực tập sinh viên CNTT PTIT' +
      '</div>';
  }
}

renderLayout();
