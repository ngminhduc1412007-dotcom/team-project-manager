// Các hàm tiện ích dùng chung
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN");
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Quản lý xác thực, token và phiên làm việc
const auth = {
getToken: function () {
  return localStorage.getItem("token");
},
setToken: function (token) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
},
getUser: function () {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
},
setUser: function (user) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
},
isAuthenticated: function () {
  return Boolean(localStorage.getItem("token"));
},
logout: function () {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  const root = document.body.dataset.root || "./";
  window.location.href = root + "pages/login.html?logout=true";
},
requireAuth: function () {
  if (!this.isAuthenticated()) {
    const root = document.body.dataset.root || "./";
    const current = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(root + "pages/login.html?redirect=" + current + "&reason=auth_required");
    return false;
  }
  return true;
},
redirectIfAuth: function () {
  if (this.isAuthenticated()) {
    const root = document.body.dataset.root || "./";
    window.location.replace(root + "pages/projects.html");
    return true;
  }
  return false;
}
  getToken: () => localStorage.getItem("token"),
  setToken: (t) => localStorage.setItem("token", t),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  },
  setUser: (u) => localStorage.setItem("user", JSON.stringify(u)),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }
};
