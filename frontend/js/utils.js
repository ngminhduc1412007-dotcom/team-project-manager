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
  setTimeout(() => toast.remove(), 3000);
}

const auth = {
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
