// Layout chung: tự động nạp header và footer vào các trang
const MENU = [
  { href: "index.html", label: "Trang chủ" },
  { href: "pages/projects.html", label: "Dự án của tôi" },
  { href: "pages/login.html", label: "Đăng nhập" },
];

function renderLayout() {
  const root = document.body.dataset.root || "./";
  const currentPath = window.location.pathname;
  const user = auth.getUser();
  const isLoggedIn = auth.isAuthenticated();

  const links = MENU.map(function (item) {
    // Nếu đã đăng nhập thì không hiện nút Đăng nhập trên navbar
    if (isLoggedIn && item.href === "pages/login.html") {
      return "";
    }
    const isActive = currentPath.endsWith("/" + item.href) ||
      (item.href === "index.html" && (currentPath.endsWith("/") || currentPath.endsWith("index.html")));
    const activeClass = isActive ? "active" : "";
    return '<a href="' + root + item.href + '" class="' + activeClass + '">' + item.label + '</a>';
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
      '<a href="' + root + 'index.html" class="brand" title="' + CONFIG.APP_NAME + '">' +
      '<img src="' + root + 'assets/images/logo.png" alt="' + CONFIG.APP_NAME + '" class="brand-logo">' +
      '</a>' +
      '<nav class="nav">' + links + userSection + '</nav>' +
      '</div>';
  }

  const footer = document.getElementById("app-footer");
  if (footer) {
    footer.innerHTML = '<div class="container">' +
      '© ' + new Date().getFullYear() + ' ' + CONFIG.APP_NAME + ' · Nhóm thực tập sinh viên CNTT PTIT' +
      '</div>';
  }
}

renderLayout();
