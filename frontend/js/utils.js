// ==========================================================
// STUDENT PROJECT HUB - CÁC HÀM TIỆN ÍCH DÙNG CHUNG (UTILS)
// Bao gồm: Thư viện SVG icon, XSS, Format ngày tháng, Badge, Toast, Auth
// ==========================================================

// ---------- 1. THƯ VIỆN SVG ICONS CHUẨN HOÁ ----------
const ICONS = {
  // Biểu đồ / Dashboard
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,

  // Thư mục / Dự án
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,

  // Bảng Kanban
  kanban: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="6" height="14" x="3" y="5" rx="1"/><rect width="6" height="8" x="15" y="5" rx="1"/><rect width="6" height="6" x="15" y="16" rx="1"/></svg>`,

  // Cột mốc Milestone (Lá cờ)
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,

  // Bảng màu UI Components
  palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,

  // Chuông thông báo
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,

  // Menu 3 gạch (Mobile)
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,

  // Dấu đóng (X)
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,

  // Dấu tích thành công
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,

  // Dấu tích tròn (Success Status)
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,

  // Chấm than tròn (Lỗi)
  alertCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,

  // Tam giác cảnh báo
  alertTriangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,

  // Thông tin (i)
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`,

  // Mũi tên làm mới / Tải lại
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`,

  // Vòng xoay Loading (Spinner)
  spinner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,

  // Tên lửa (Bắt đầu / Giới thiệu)
  rocket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,

  // Ghim đính kèm (Lưu ý)
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`,

  // Mũi tên quay lại
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
};

// Hàm lấy thẻ icon SVG
function getIcon(name, options = {}) {
  const size = options.size || 18;
  const className = options.className || "";
  const svgContent = ICONS[name] || ICONS.info;
  return `<span class="icon ${className}" style="width: ${size}px; height: ${size}px;" aria-hidden="true">${svgContent}</span>`;
}

// ---------- 2. CHỐNG XSS (ESCAPE HTML) ----------
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

// ---------- 3. ĐỊNH DẠNG NGÀY THÁNG ----------
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("vi-VN", {
    timeZone: CONFIG.TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const time = d.toLocaleTimeString("vi-VN", {
    timeZone: CONFIG.TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d.toLocaleDateString("vi-VN", {
    timeZone: CONFIG.TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${time} ${date}`;
}

// ---------- 4. KIỂM TRA TASK QUÁ HẠN (BR-09, BR-19) ----------
function isOverdue(dueDateStr, status) {
  if (!dueDateStr || status === "DONE") return false;

  const now = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONFIG.TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
}).format(now);

return dueDateStr < todayStr;
}

// ---------- 5. HUY HIỆU TRẠNG THÁI (BADGES) ----------
function renderStatusBadge(status) {
  const map = {
    TODO: { label: "Chờ làm", cls: "badge-todo" },
    IN_PROGRESS: { label: "Đang làm", cls: "badge-in-progress" },
    REVIEW: { label: "Chờ duyệt", cls: "badge-review" },
    DONE: { label: "Hoàn thành", cls: "badge-done" },

    PLANNING: { label: "Lập kế hoạch", cls: "badge-planning" },
    ACTIVE: { label: "Đang chạy", cls: "badge-active" },
    COMPLETED: { label: "Đã xong", cls: "badge-completed" },
    ARCHIVED: { label: "Đã lưu trữ", cls: "badge-archived" },
  };

  const item = map[status] || { label: status || "N/A", cls: "badge-todo" };
  return `<span class="badge ${item.cls}">${escapeHtml(item.label)}</span>`;
}

function renderPriorityBadge(priority) {
  const map = {
    LOW: { label: "Thấp", cls: "badge-low" },
    MEDIUM: { label: "Trung bình", cls: "badge-medium" },
    HIGH: { label: "Cao", cls: "badge-high" },
    URGENT: { label: "Khẩn cấp", cls: "badge-urgent" },
  };

  const item = map[priority] || { label: priority || "N/A", cls: "badge-low" };
  return `<span class="badge ${item.cls}">${escapeHtml(item.label)}</span>`;
}

function renderRoleBadge(role) {
  const map = {
    OWNER: { label: "Trưởng nhóm (Owner)", cls: "badge-owner" },
    MEMBER: { label: "Thành viên", cls: "badge-member" },
    VIEWER: { label: "Người xem", cls: "badge-viewer" },
  };

  const item = map[role] || { label: role || "N/A", cls: "badge-viewer" };
  return `<span class="badge ${item.cls}">${escapeHtml(item.label)}</span>`;
}

// ---------- 6. THÔNG BÁO NỔI TOAST (DÙNG SVG) ----------
function showToast(message, type = "success") {
    const iconNames = {
      success: "checkCircle",
      error: "alertCircle",
      warning: "alertTriangle",
      info: "info",
    };

    const iconName = iconNames[type] || "info";
    const iconHtml = getIcon(iconName, { size: 18 });

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${iconHtml} <span>${escapeHtml(message)}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ---------- 7. QUẢN LÝ XÁC THỰC (AUTH) ----------
const auth = {
  getToken() {
    return localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
  },
  setToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.AUTH_TOKEN_KEY, token);
    }
  },
  getUser() {
    try {
      const data = localStorage.getItem(CONFIG.USER_INFO_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (user) {
      localStorage.setItem(CONFIG.USER_INFO_KEY, JSON.stringify(user));
    }
  },
  isAuthenticated() {
    return Boolean(this.getToken());
  },
  logout(redirectUrl = null) {
    localStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_INFO_KEY);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }
  },
};
