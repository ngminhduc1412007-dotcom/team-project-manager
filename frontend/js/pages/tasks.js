const defaultMembers = [
  {
    id: 1,
    project_id: 1,
    user_id: 1,
    role: "owner",
    user: { id: 1, full_name: "Lê Quang Huy", email: "huy.lq@ptit.edu.vn" }
  },
  {
    id: 2,
    project_id: 1,
    user_id: 2,
    role: "member",
    user: { id: 2, full_name: "Nguyễn Minh Đức", email: "duc.nm@ptit.edu.vn" }
  },
  {
    id: 3,
    project_id: 1,
    user_id: 3,
    role: "member",
    user: { id: 3, full_name: "Lưu Đức Anh", email: "anh.ld@ptit.edu.vn" }
  },
  {
    id: 4,
    project_id: 1,
    user_id: 4,
    role: "member",
    user: { id: 4, full_name: "Trần Nhật Long", email: "long.tn@ptit.edu.vn" }
  },
  {
    id: 5,
    project_id: 1,
    user_id: 5,
    role: "member",
    user: { id: 5, full_name: "Hoàng Đức Duy Anh", email: "duyanh.hd@ptit.edu.vn" }
  }
];

const defaultTasks = [
  {
    id: 1,
    code: "#T-01",
    title: "Phân tích SRS và thiết kế CSDL PostgreSQL",
    description: "Chuẩn hóa 9 bảng dữ liệu, thiết lập khóa ngoại và sơ đồ ERD hoàn chỉnh.",
    assignee_id: 5,
    assignee_name: "Hoàng Đức Duy Anh",
    priority: "HIGH",
    status: "DONE",
    due_date: "2026-11-12"
  },
  {
    id: 2,
    code: "#T-02",
    title: "Xây dựng khung cơ sở Frontend HTML/CSS/JS",
    description: "Thiết lập style.css, layout.js dùng chung và cấu hình interceptor Axios.",
    assignee_id: 2,
    assignee_name: "Nguyễn Minh Đức",
    priority: "HIGH",
    status: "DONE",
    due_date: "2026-11-14"
  },
  {
    id: 3,
    code: "#T-03",
    title: "Xây dựng API xác thực JWT và phân quyền dự án",
    description: "Hoàn thiện đăng nhập, đăng ký, middleware RBAC cho Owner và Member.",
    assignee_id: 1,
    assignee_name: "Lê Quang Huy",
    priority: "URGENT",
    status: "REVIEW",
    due_date: "2026-11-21"
  },
  {
    id: 4,
    code: "#T-04",
    title: "Giao diện quản lý Thành viên & đồng bộ Assignee",
    description: "Nối API thêm/xóa thành viên có xác nhận và tự động cập nhật sang trang Task.",
    assignee_id: 3,
    assignee_name: "Lưu Đức Anh",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    due_date: "2026-11-23"
  },
  {
    id: 5,
    code: "#T-05",
    title: "API CRUD Task và ràng buộc chuyển trạng thái",
    description: "Kiểm tra hợp lệ trạng thái TODO, IN_PROGRESS, REVIEW, DONE ở Backend.",
    assignee_id: 4,
    assignee_name: "Trần Nhật Long",
    priority: "HIGH",
    status: "IN_PROGRESS",
    due_date: "2026-11-24"
  },
  {
    id: 6,
    code: "#T-06",
    title: "Kiểm thử tích hợp toàn bộ API & phân quyền",
    description: "Chạy kiểm thử 25 kịch bản P0 trên Swagger và xuất báo cáo nghiệm thu.",
    assignee_id: 5,
    assignee_name: "Hoàng Đức Duy Anh",
    priority: "URGENT",
    status: "TODO",
    due_date: "2026-11-17"
  }
];

const COLUMNS = [
  { key: "TODO", label: "Cần làm" },
  { key: "IN_PROGRESS", label: "Đang làm" },
  { key: "REVIEW", label: "Chờ duyệt" },
  { key: "DONE", label: "Hoàn thành" }
];

const AVATAR_PALETTE = [
  "#1d4ed8",
  "#0f766e",
  "#7c3aed",
  "#c2410c",
  "#0369a1",
  "#be123c",
  "#15803d"
];

const urlParams = new URLSearchParams(window.location.search);
const currentProjectId = Number(urlParams.get("project_id") || urlParams.get("id") || 1);

const MEMBERS_STORAGE_KEY = "sph_members_project_" + currentProjectId;
const TASKS_STORAGE_KEY = "sph_tasks_project_" + currentProjectId;
const STATUS_STORAGE_KEY = "sph_project_status_" + currentProjectId;

const subnavTasksLink = document.getElementById("subnav-tasks-link");
const subnavMembersLink = document.getElementById("subnav-members-link");
if (subnavTasksLink) subnavTasksLink.href = "tasks.html?project_id=" + currentProjectId;
if (subnavMembersLink) subnavMembersLink.href = "members.html?project_id=" + currentProjectId;

const projectStatusBadge = document.getElementById("project-status-badge");
const projectStatusSelect = document.getElementById("project-status-select");
const btnUpdateProjectStatus = document.getElementById("btn-update-project-status");
const projectStatusRoleHint = document.getElementById("project-status-role-hint");
const projectProgressStat = document.getElementById("project-progress-stat");
const projectProgressBar = document.getElementById("project-progress-bar");
const projectOverdueStat = document.getElementById("project-overdue-stat");
const totalMembersStat = document.getElementById("total-members-stat");
const heroAvatarStack = document.getElementById("hero-avatar-stack");
const statusBanner = document.getElementById("status-banner");

const kanbanBoard = document.getElementById("kanban-board");
const tableViewCard = document.getElementById("table-view-card");
const btnViewKanban = document.getElementById("btn-view-kanban");
const btnViewTable = document.getElementById("btn-view-table");
const tasksTbody = document.getElementById("tasks-tbody");
const taskCountLabel = document.getElementById("task-count-label");

const searchTaskInput = document.getElementById("search-task-input");
const filterStatusSelect = document.getElementById("filter-status-select");
const filterPrioritySelect = document.getElementById("filter-priority-select");
const filterAssigneeSelect = document.getElementById("filter-assignee-select");
const btnResetFilters = document.getElementById("btn-reset-filters");
const filterResultSummary = document.getElementById("filter-result-summary");

const taskModal = document.getElementById("task-modal");
const taskModalHeading = document.getElementById("task-modal-heading");
const btnOpenCreateTask = document.getElementById("btn-open-create-task");
const btnCloseTaskModal = document.getElementById("btn-close-task-modal");
const btnCancelTaskModal = document.getElementById("btn-cancel-task-modal");
const btnDeleteInModal = document.getElementById("btn-delete-in-modal");
const btnSubmitTask = document.getElementById("btn-submit-task");

const taskForm = document.getElementById("task-form");
const editingTaskIdInput = document.getElementById("editing-task-id");
const taskTitleInput = document.getElementById("task-title");
const taskTitleError = document.getElementById("task-title-error");
const taskAssigneeSelect = document.getElementById("task-assignee");
const taskPrioritySelect = document.getElementById("task-priority");
const taskStatusSelect = document.getElementById("task-status");
const taskDueDateInput = document.getElementById("task-due-date");
const taskDescInput = document.getElementById("task-desc");
const taskDescError = document.getElementById("task-desc-error");

let projectMembers = [];
let tasksList = [];
let apiFilteredTasks = null;
let lastFilterSource = "local";
let filterSearchTimer = null;
let latestFilterSeq = 0;
let currentView = "kanban";
let draggedTaskId = null;

function safeEscape(val) {
  if (typeof escapeHtml === "function") return escapeHtml(val);
  const div = document.createElement("div");
  div.textContent = val ?? "";
  return div.innerHTML;
}

function getInitials(name) {
  const parts = String(name || "?").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
  let hash = 0;
  const str = String(name || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function notifyResult(message, type = "success") {
  if (typeof showToast === "function") {
    showToast(message, type);
  } else {
    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  if (statusBanner) {
    statusBanner.textContent = message;
    statusBanner.className = "status-banner is-visible " + (type === "error" ? "error" : "success");
  }
}

function normalizeProjectRole(role) {
  const r = String(role || "member").trim().toUpperCase();
  if (r === "OWNER" || r === "ADMIN") return "OWNER";
  if (r === "VIEWER") return "VIEWER";
  return "MEMBER";
}

function getMemberName(member) {
  if (member.user && member.user.full_name) return member.user.full_name;
  if (member.full_name) return member.full_name;
  const email = getMemberEmail(member);
  return email ? email.split("@")[0] : "Thành viên #" + (member.user_id || member.id);
}

function getMemberEmail(member) {
  if (member.user && member.user.email) return member.user.email;
  if (member.email) return member.email;
  return "";
}

function getMemberUserId(member) {
  return Number(member.user_id || (member.user && member.user.id) || member.id);
}

function loadStoredMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(defaultMembers));
  return [...defaultMembers];
}

function loadStoredTasks() {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(defaultTasks));
  return [...defaultTasks];
}

function saveStoredTasks(list) {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

function isCurrentUserOwnerOrAdmin() {
  const currentUser = (typeof auth !== "undefined" && auth.getUser) ? auth.getUser() : null;
  if (!currentUser) return true;

  const sysRole = String(currentUser.role || currentUser.system_role || "").toLowerCase();
  if (sysRole === "admin" || sysRole === "owner") return true;

  const email = String(currentUser.email || "").toLowerCase();
  const matchedMember = projectMembers.find(
    (m) => getMemberEmail(m).toLowerCase() === email || getMemberUserId(m) === Number(currentUser.id)
  );
  if (matchedMember) {
    return normalizeProjectRole(matchedMember.role) === "OWNER";
  }
  return true;
}

function normalizeProjectStatus(status) {
  const s = String(status || "ACTIVE").trim().toUpperCase();
  if (s === "PLANNING") return "PLANNING";
  if (s === "COMPLETED" || s === "DONE") return "COMPLETED";
  return "ACTIVE";
}

function renderProjectStatusUI(statusValue) {
  const normalized = normalizeProjectStatus(statusValue);
  localStorage.setItem(STATUS_STORAGE_KEY, normalized);

  if (projectStatusSelect) projectStatusSelect.value = normalized;

  if (projectStatusBadge) {
    if (normalized === "PLANNING") {
      projectStatusBadge.className = "badge badge-planning";
      projectStatusBadge.textContent = "Lên kế hoạch";
    } else if (normalized === "COMPLETED") {
      projectStatusBadge.className = "badge badge-completed";
      projectStatusBadge.textContent = "Đã hoàn thành";
    } else {
      projectStatusBadge.className = "badge badge-active";
      projectStatusBadge.textContent = "Đang làm";
    }
  }

  const canChangeStatus = isCurrentUserOwnerOrAdmin();
  if (projectStatusSelect) projectStatusSelect.disabled = !canChangeStatus;
  if (btnUpdateProjectStatus) btnUpdateProjectStatus.disabled = !canChangeStatus;
  if (projectStatusRoleHint) {
    projectStatusRoleHint.textContent = canChangeStatus
      ? "(Quyền Owner / Admin)"
      : "(Chỉ Owner và Admin được đổi)";
  }
}

if (btnUpdateProjectStatus) {
  btnUpdateProjectStatus.addEventListener("click", async () => {
    if (!isCurrentUserOwnerOrAdmin()) {
      notifyResult("Chỉ Owner và Admin mới có quyền đổi trạng thái dự án.", "error");
      return;
    }

    const selectedStatus = projectStatusSelect ? projectStatusSelect.value : "ACTIVE";
    const backendStatusMap = {
      PLANNING: "planning",
      ACTIVE: "in_progress",
      COMPLETED: "completed"
    };

    btnUpdateProjectStatus.disabled = true;
    btnUpdateProjectStatus.textContent = "Đang lưu...";

    try {
      if (typeof api !== "undefined" && api.patch) {
        try {
          await api.patch("/projects/" + currentProjectId + "/status", {
            status: backendStatusMap[selectedStatus] || "in_progress"
          });
        } catch (apiErr) {
          if (apiErr && apiErr.status && apiErr.status !== 0 && apiErr.status !== 404) {
            throw new Error(apiErr.data?.message || apiErr.message || "Không thể đổi trạng thái dự án.");
          }
        }
      }

      renderProjectStatusUI(selectedStatus);
      const labelMap = {
        PLANNING: "Lên kế hoạch",
        ACTIVE: "Đang làm",
        COMPLETED: "Đã hoàn thành"
      };
      notifyResult("Đã đổi trạng thái dự án sang: " + labelMap[selectedStatus], "success");
    } catch (err) {
      notifyResult(err.message || "Lỗi khi cập nhật trạng thái dự án.", "error");
    } finally {
      btnUpdateProjectStatus.disabled = false;
      btnUpdateProjectStatus.textContent = "Đổi trạng thái";
    }
  });
}

function renderMembersUI() {
  if (totalMembersStat) totalMembersStat.textContent = String(projectMembers.length);

  if (heroAvatarStack) {
    const visibleMembers = projectMembers.slice(0, 5);
    const extraCount = projectMembers.length - visibleMembers.length;
    let html = visibleMembers
      .map((m) => {
        const name = getMemberName(m);
        return (
          '<span class="avatar-stack-item" style="background: ' +
          getAvatarColor(name) +
          ';" title="' +
          safeEscape(name + " (" + normalizeProjectRole(m.role) + ")") +
          '">' +
          safeEscape(getInitials(name)) +
          "</span>"
        );
      })
      .join("");
    if (extraCount > 0) {
      html +=
        '<span class="avatar-stack-item" style="background: #475569;" title="Và ' +
        extraCount +
        ' thành viên khác">+' +
        extraCount +
        "</span>";
    }
    heroAvatarStack.innerHTML = html;
  }

  if (taskAssigneeSelect) {
    const currentVal = taskAssigneeSelect.value;
    taskAssigneeSelect.innerHTML =
      '<option value="">-- Chưa phân công --</option>' +
      projectMembers
        .map((m) => {
          const uid = getMemberUserId(m);
          const name = safeEscape(getMemberName(m));
          const email = getMemberEmail(m);
          const role = normalizeProjectRole(m.role);
          const suffix = email ? " - " + safeEscape(email) : "";
          return '<option value="' + uid + '">' + name + " (" + role + suffix + ")</option>";
        })
        .join("");
    if (currentVal) taskAssigneeSelect.value = currentVal;
  }

  if (filterAssigneeSelect) {
    const currentFilter = filterAssigneeSelect.value;
    filterAssigneeSelect.innerHTML =
      '<option value="">Tất cả thành viên</option>' +
      projectMembers
        .map((m) => {
          const uid = getMemberUserId(m);
          const name = safeEscape(getMemberName(m));
          return '<option value="' + uid + '">' + name + "</option>";
        })
        .join("");
    if (currentFilter) filterAssigneeSelect.value = currentFilter;
  }
}

async function syncProjectMembers() {
  const localMembers = loadStoredMembers();
  projectMembers = localMembers;

  try {
    if (typeof api !== "undefined" && api.get) {
      const res = await api.get("/projects/" + currentProjectId + "/members");
      const apiItems = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;
      if (apiItems && apiItems.length > 0) {
        const merged = [...apiItems];
        localMembers.forEach((lm) => {
          const lmEmail = getMemberEmail(lm).toLowerCase();
          const exists = merged.some(
            (am) => getMemberEmail(am).toLowerCase() === lmEmail || getMemberUserId(am) === getMemberUserId(lm)
          );
          if (!exists) merged.push(lm);
        });
        projectMembers = merged;
        localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(projectMembers));
      }
    }
  } catch (e) {}

  renderMembersUI();
}

function getPriorityBadge(priority) {
  const p = String(priority || "MEDIUM").toUpperCase();
  if (p === "URGENT") return '<span class="badge priority-urgent">URGENT</span>';
  if (p === "HIGH") return '<span class="badge priority-high">HIGH</span>';
  if (p === "LOW") return '<span class="badge priority-low">LOW</span>';
  return '<span class="badge priority-medium">MEDIUM</span>';
}

function getStatusBadge(status) {
  const s = String(status || "TODO").toUpperCase();
  if (s === "DONE") return '<span class="badge badge-done">Hoàn thành</span>';
  if (s === "REVIEW") return '<span class="badge badge-review">Chờ duyệt</span>';
  if (s === "IN_PROGRESS") return '<span class="badge badge-in-progress">Đang làm</span>';
  return '<span class="badge badge-todo">Cần làm</span>';
}

function getColumnLabel(statusKey) {
  const col = COLUMNS.find((c) => c.key === statusKey);
  return col ? col.label : statusKey;
}

function getDueStatusInfo(task) {
  const st = String(task.status || "TODO").toUpperCase();
  if (st === "DONE") {
    return { text: "Hoàn thành", className: "due-pill is-done", overdue: false };
  }
  if (!task.due_date) {
    return { text: "Chưa đặt hạn", className: "due-pill", overdue: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date + "T00:00:00");
  if (isNaN(due.getTime())) {
    return { text: task.due_date, className: "due-pill", overdue: false };
  }

  const diffDays = Math.floor((today.getTime() - due.getTime()) / 86400000);
  if (diffDays > 0) {
    return {
      text: "Trễ " + diffDays + " ngày",
      className: "due-pill is-overdue",
      overdue: true
    };
  }

  const dd = String(due.getDate()).padStart(2, "0");
  const mm = String(due.getMonth() + 1).padStart(2, "0");
  return { text: "Hạn " + dd + "/" + mm, className: "due-pill", overdue: false };
}

function resolveAssigneeName(task) {
  if (task.assignee_id) {
    const found = projectMembers.find((m) => getMemberUserId(m) === Number(task.assignee_id));
    if (found) return getMemberName(found);
  }
  return task.assignee_name || "Chưa phân công";
}

function mapStatusToBackend(status) {
  const s = String(status || "").toUpperCase();
  if (s === "TODO") return "todo";
  if (s === "IN_PROGRESS" || s === "REVIEW") return "in_progress";
  if (s === "DONE") return "done";
  if (s === "CANCELLED") return "cancelled";
  return undefined;
}

function normalizeTaskFromApi(raw) {
  const rawStatus = String(raw.status || "todo").toUpperCase();
  const normalizedStatus =
    rawStatus === "CANCELLED" ? "TODO" : rawStatus;
  const rawPriority = String(raw.priority || "medium").toUpperCase();
  const assigneeName =
    (raw.assignee && (raw.assignee.full_name || raw.assignee.email)) ||
    raw.assignee_name ||
    "";

  return {
    id: raw.id,
    code: raw.code || "#T-" + String(raw.id).padStart(2, "0"),
    title: raw.title || "",
    description: raw.description || "",
    assignee_id: raw.assignee_id || (raw.assignee && raw.assignee.id) || null,
    assignee_name: assigneeName,
    priority: rawPriority,
    status: normalizedStatus,
    due_date: raw.due_date ? String(raw.due_date).slice(0, 10) : ""
  };
}

function getActiveFilterValues() {
  return {
    search: (searchTaskInput?.value || "").trim(),
    status: (filterStatusSelect?.value || "").toUpperCase(),
    priority: (filterPrioritySelect?.value || "").toUpperCase(),
    assignee_id: filterAssigneeSelect?.value ? Number(filterAssigneeSelect.value) : null
  };
}

function getFilteredTasks() {
  const filters = getActiveFilterValues();
  const sourceList = Array.isArray(apiFilteredTasks) ? apiFilteredTasks : tasksList;
  const kw = filters.search.toLowerCase();

  return sourceList.filter((t) => {
    const matchSearch =
      !kw ||
      String(t.title || "").toLowerCase().includes(kw) ||
      String(t.code || "").toLowerCase().includes(kw) ||
      String(t.description || "").toLowerCase().includes(kw);
    const matchStatus = !filters.status || String(t.status || "").toUpperCase() === filters.status;
    const matchPriority = !filters.priority || String(t.priority || "").toUpperCase() === filters.priority;
    const matchAssignee = !filters.assignee_id || Number(t.assignee_id) === filters.assignee_id;
    return matchSearch && matchStatus && matchPriority && matchAssignee;
  });
}

async function loadTasksWithFilters() {
  const filters = getActiveFilterValues();
  const seq = ++latestFilterSeq;

  const params = {
    project_id: currentProjectId,
    page: 1,
    page_size: 100
  };
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = mapStatusToBackend(filters.status);
  if (filters.priority) params.priority = filters.priority.toLowerCase();
  if (filters.assignee_id) params.assignee_id = filters.assignee_id;

  const hasToken = typeof auth !== "undefined" && auth.getToken ? Boolean(auth.getToken()) : false;

  if (hasToken && typeof api !== "undefined" && api.get) {
    try {
      const res = await api.get("/tasks", params);
      if (seq !== latestFilterSeq) return;
      const rawItems = res?.data?.items || res?.data || res;
      if (Array.isArray(rawItems)) {
        const normalized = rawItems.map(normalizeTaskFromApi);
        const isUnfiltered = !filters.search && !filters.status && !filters.priority && !filters.assignee_id;
        if (isUnfiltered) {
          tasksList = normalized;
          saveStoredTasks(tasksList);
          apiFilteredTasks = null;
        } else {
          apiFilteredTasks = normalized;
        }
        lastFilterSource = "api";
        renderAllViews();
        return;
      }
    } catch (apiErr) {
      if (seq !== latestFilterSeq) return;
      if (apiErr && apiErr.status === 404) {
        apiFilteredTasks = [];
        lastFilterSource = "api";
        renderAllViews();
        return;
      }
    }
  }

  apiFilteredTasks = null;
  lastFilterSource = "local";
  renderAllViews();
}

function updateHeroStats() {
  const total = tasksList.length;
  const doneCount = tasksList.filter((t) => String(t.status).toUpperCase() === "DONE").length;
  const overdueCount = tasksList.filter((t) => getDueStatusInfo(t).overdue).length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (projectProgressStat) {
    projectProgressStat.textContent = percent + "% (" + doneCount + "/" + total + ")";
  }
  if (projectProgressBar) {
    projectProgressBar.style.width = percent + "%";
  }
  if (projectOverdueStat) {
    projectOverdueStat.textContent = overdueCount + " Task";
  }
}

function buildKanbanCardHtml(task) {
  const assigneeName = resolveAssigneeName(task);
  const avatarColor = assigneeName === "Chưa phân công" ? "#94a3b8" : getAvatarColor(assigneeName);
  const initials = assigneeName === "Chưa phân công" ? "?" : getInitials(assigneeName);
  const dueInfo = getDueStatusInfo(task);
  const st = String(task.status || "TODO").toUpperCase();
  const priority = String(task.priority || "MEDIUM").toUpperCase();

  const moveOptions = COLUMNS.map((c) => {
    const selected = c.key === st ? " selected" : "";
    return '<option value="' + c.key + '"' + selected + ">" + c.label + "</option>";
  }).join("");

  return (
    '<article class="task-card" draggable="true" data-task-id="' +
    task.id +
    '" data-priority="' +
    priority +
    '">' +
    '<div class="task-card-top">' +
    '<div class="task-card-tags">' +
    '<span class="task-code">' +
    safeEscape(task.code || "#T-" + task.id) +
    "</span>" +
    getPriorityBadge(priority) +
    "</div>" +
    '<span class="drag-grip" title="Kéo thả thẻ sang cột khác">⋮⋮</span>' +
    "</div>" +
    '<h4 class="task-card-title" data-open-task="' +
    task.id +
    '">' +
    safeEscape(task.title) +
    "</h4>" +
    '<p class="task-card-desc">' +
    safeEscape(task.description || "Chưa có mô tả chi tiết cho nhiệm vụ này.") +
    "</p>" +
    '<div class="task-card-meta">' +
    '<div class="assignee-chip">' +
    '<span class="assignee-avatar" style="background: ' +
    avatarColor +
    ';">' +
    safeEscape(initials) +
    "</span>" +
    '<span class="assignee-name" title="' +
    safeEscape(assigneeName) +
    '">' +
    safeEscape(assigneeName) +
    "</span>" +
    "</div>" +
    '<span class="' +
    dueInfo.className +
    '">' +
    safeEscape(dueInfo.text) +
    "</span>" +
    "</div>" +
    '<div class="task-card-footer">' +
    '<button type="button" class="btn btn-small" data-open-task="' +
    task.id +
    '">Chi tiết</button>' +
    '<select class="quick-move-select" data-quick-move="' +
    task.id +
    '" aria-label="Chuyển cột trạng thái">' +
    moveOptions +
    "</select>" +
    "</div>" +
    "</article>"
  );
}

function renderKanbanBoard(filtered) {
  const statusFilter = (filterStatusSelect?.value || "").toUpperCase();

  COLUMNS.forEach((col) => {
    const colEl = document.querySelector('.kanban-column[data-status="' + col.key + '"]');
    const colTasks = filtered.filter((t) => String(t.status || "TODO").toUpperCase() === col.key);
    const countEl = document.querySelector('[data-count-for="' + col.key + '"]');
    const dropzoneEl = document.querySelector('[data-dropzone="' + col.key + '"]');

    if (colEl) {
      colEl.style.opacity = statusFilter && statusFilter !== col.key ? "0.45" : "1";
    }
    if (countEl) countEl.textContent = String(colTasks.length);
    if (!dropzoneEl) return;

    if (colTasks.length === 0) {
      dropzoneEl.innerHTML = '<div class="kanban-empty">Chưa có task · Kéo thẻ vào đây</div>';
    } else {
      dropzoneEl.innerHTML = colTasks.map(buildKanbanCardHtml).join("");
    }
  });

  bindCardDragEvents();
}

function renderTableView(filtered) {
  if (!tasksTbody) return;
  if (taskCountLabel) taskCountLabel.textContent = String(filtered.length);

  if (filtered.length === 0) {
    tasksTbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: var(--color-muted); padding: 24px;">Không tìm thấy Task phù hợp.</td></tr>';
    return;
  }

  tasksTbody.innerHTML = filtered
    .map((t) => {
      const dueInfo = getDueStatusInfo(t);
      const assigneeName = resolveAssigneeName(t);
      return (
        "<tr>" +
        '<td><span class="task-code">' +
        safeEscape(t.code || "#T-" + t.id) +
        "</span></td>" +
        '<td><strong style="cursor: pointer;" data-open-task="' +
        t.id +
        '">' +
        safeEscape(t.title) +
        '</strong><div style="font-size: 12px; color: var(--color-muted);">' +
        safeEscape(t.description || "") +
        "</div></td>" +
        "<td>" +
        safeEscape(assigneeName) +
        "</td>" +
        "<td>" +
        getPriorityBadge(t.priority) +
        "</td>" +
        "<td>" +
        getStatusBadge(t.status) +
        "</td>" +
        '<td><span class="' +
        dueInfo.className +
        '">' +
        safeEscape(dueInfo.text) +
        "</span></td>" +
        '<td><button type="button" class="btn btn-small" data-open-task="' +
        t.id +
        '">Sửa / Chi tiết</button></td>' +
        "</tr>"
      );
    })
    .join("");
}

function renderAllViews() {
  const filters = getActiveFilterValues();
  const hasActiveFilter = Boolean(
    filters.search || filters.status || filters.priority || filters.assignee_id
  );
  if (btnResetFilters) {
    btnResetFilters.style.display = hasActiveFilter ? "inline-flex" : "none";
  }

  const filtered = getFilteredTasks();

  if (filterResultSummary) {
    if (hasActiveFilter) {
      filterResultSummary.style.display = "block";
      const sourceLabel = lastFilterSource === "api" ? "API GET /api/tasks" : "Bộ lọc cục bộ";
      filterResultSummary.innerHTML =
        filtered.length > 0
          ? "Tìm thấy <strong>" + filtered.length + "</strong> công việc phù hợp (" + sourceLabel + ")."
          : "Không tìm thấy công việc nào khớp với điều kiện lọc hiện tại (" + sourceLabel + ").";
    } else {
      filterResultSummary.style.display = "none";
    }
  }

  updateHeroStats();
  renderKanbanBoard(filtered);
  renderTableView(filtered);
}

async function moveTaskToStatus(taskId, targetStatus) {
  const task = tasksList.find((t) => Number(t.id) === Number(taskId));
  if (!task) return;

  const oldStatus = String(task.status || "TODO").toUpperCase();
  const nextStatus = String(targetStatus || "TODO").toUpperCase();
  if (oldStatus === nextStatus) return;

  task.status = nextStatus;
  saveStoredTasks(tasksList);
  renderAllViews();

  const backendStatusMap = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    REVIEW: "in_progress",
    DONE: "done"
  };

  try {
    if (typeof api !== "undefined" && api.patch) {
      await api.patch("/tasks/" + task.id + "/status", {
        status: backendStatusMap[nextStatus] || "todo"
      });
    }
  } catch (e) {
    // Fallback localStorage khi backend chưa bật
  }

  notifyResult(
    "Đã chuyển " +
      (task.code || "Task") +
      " từ " +
      getColumnLabel(oldStatus) +
      " sang " +
      getColumnLabel(nextStatus) +
      ".",
    "success"
  );
}

/* ---------- XỬ LÝ DRAG & DROP (KÉO THẢ KIỂU TRELLO) ---------- */
function bindCardDragEvents() {
  const cards = document.querySelectorAll(".task-card");
  cards.forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      draggedTaskId = Number(card.dataset.taskId);
      card.classList.add("is-dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(draggedTaskId));
      }
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      draggedTaskId = null;
      document.querySelectorAll(".kanban-column.is-drag-over").forEach((col) => {
        col.classList.remove("is-drag-over");
      });
    });
  });
}

function setupColumnDropzones() {
  const columns = document.querySelectorAll(".kanban-column");
  columns.forEach((col) => {
    const targetStatus = col.dataset.status;

    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      col.classList.add("is-drag-over");
    });

    col.addEventListener("dragenter", (e) => {
      e.preventDefault();
      col.classList.add("is-drag-over");
    });

    col.addEventListener("dragleave", (e) => {
      if (!col.contains(e.relatedTarget)) {
        col.classList.remove("is-drag-over");
      }
    });

    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("is-drag-over");
      const transferId = e.dataTransfer ? Number(e.dataTransfer.getData("text/plain")) : null;
      const taskId = transferId || draggedTaskId;
      if (taskId && targetStatus) {
        moveTaskToStatus(taskId, targetStatus);
      }
    });
  });
}

/* ---------- MODAL TẠO / SỬA / XÓA TASK ---------- */
function openCreateTaskModal(defaultStatus = "TODO") {
  if (!taskModal) return;
  editingTaskIdInput.value = "";
  taskModalHeading.textContent = "Tạo Task mới";
  btnSubmitTask.textContent = "Tạo Task";
  if (btnDeleteInModal) btnDeleteInModal.style.display = "none";

  taskForm.reset();
  taskTitleInput.classList.remove("is-invalid");
  taskTitleError.classList.remove("is-visible");
  taskStatusSelect.value = defaultStatus;
  taskPrioritySelect.value = "MEDIUM";
  taskDueDateInput.value = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);

  taskModal.classList.add("is-open");
  taskTitleInput.focus();
}

function openEditTaskModal(taskId) {
  const task = tasksList.find((t) => Number(t.id) === Number(taskId));
  if (!task || !taskModal) return;

  editingTaskIdInput.value = String(task.id);
  taskModalHeading.textContent = "Chi tiết & Chỉnh sửa " + (task.code || "Task");
  btnSubmitTask.textContent = "Lưu thay đổi";
  if (btnDeleteInModal) btnDeleteInModal.style.display = "inline-flex";

  taskTitleInput.value = task.title || "";
  taskAssigneeSelect.value = task.assignee_id ? String(task.assignee_id) : "";
  taskStatusSelect.value = String(task.status || "TODO").toUpperCase();
  taskPrioritySelect.value = String(task.priority || "MEDIUM").toUpperCase();
  taskDueDateInput.value = task.due_date || "";
  taskDescInput.value = task.description || "";

  taskTitleInput.classList.remove("is-invalid");
  taskTitleError.classList.remove("is-visible");
  taskModal.classList.add("is-open");
}

function closeTaskModal() {
  if (taskModal) taskModal.classList.remove("is-open");
}

if (btnOpenCreateTask) {
  btnOpenCreateTask.addEventListener("click", () => openCreateTaskModal("TODO"));
}
if (btnCloseTaskModal) btnCloseTaskModal.addEventListener("click", closeTaskModal);
if (btnCancelTaskModal) btnCancelTaskModal.addEventListener("click", closeTaskModal);
if (taskModal) {
  taskModal.addEventListener("click", (e) => {
    if (e.target === taskModal) closeTaskModal();
  });
}

document.querySelectorAll(".col-quick-add").forEach((btn) => {
  btn.addEventListener("click", () => {
    openCreateTaskModal(btn.dataset.addStatus || "TODO");
  });
});

if (taskTitleInput) {
  taskTitleInput.addEventListener("input", () => {
    taskTitleInput.classList.remove("is-invalid");
    taskTitleError.classList.remove("is-visible");
  });
}

if (taskDescInput) {
  taskDescInput.addEventListener("input", () => {
    taskDescInput.classList.remove("is-invalid");
    if (taskDescError) taskDescError.classList.remove("is-visible");
  });
}

if (taskForm) {
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = (taskTitleInput.value || "").trim();
    const description = (taskDescInput.value || "").trim();
    let isValid = true;

    if (!title) {
      taskTitleInput.classList.add("is-invalid");
      taskTitleError.textContent = "Vui lòng nhập tên nhiệm vụ (Task Title).";
      taskTitleError.classList.add("is-visible");
      isValid = false;
    } else if (title.length < 3) {
      taskTitleInput.classList.add("is-invalid");
      taskTitleError.textContent = "Tên nhiệm vụ phải có ít nhất 3 ký tự.";
      taskTitleError.classList.add("is-visible");
      isValid = false;
    } else if (title.length > 255) {
      taskTitleInput.classList.add("is-invalid");
      taskTitleError.textContent = "Tên nhiệm vụ không được vượt quá 255 ký tự.";
      taskTitleError.classList.add("is-visible");
      isValid = false;
    }

    if (description.length > 2000) {
      taskDescInput.classList.add("is-invalid");
      if (taskDescError) {
        taskDescError.textContent = "Mô tả công việc không được vượt quá 2000 ký tự.";
        taskDescError.classList.add("is-visible");
      }
      isValid = false;
    }

    if (!isValid) {
      taskTitleInput.focus();
      return;
    }

    if (btnSubmitTask) {
      btnSubmitTask.disabled = true;
    }

    const editingId = editingTaskIdInput.value ? Number(editingTaskIdInput.value) : null;
    const assigneeId = taskAssigneeSelect.value ? Number(taskAssigneeSelect.value) : null;
    const selectedMember = projectMembers.find((m) => getMemberUserId(m) === assigneeId);
    const assigneeName = selectedMember ? getMemberName(selectedMember) : "Chưa phân công";
    const status = (taskStatusSelect.value || "TODO").toUpperCase();
    const priority = (taskPrioritySelect.value || "MEDIUM").toUpperCase();
    const dueDate = taskDueDateInput.value || "";

    try {
      if (editingId) {
        const existing = tasksList.find((t) => Number(t.id) === editingId);
        if (existing) {
          existing.title = title;
          existing.assignee_id = assigneeId;
          existing.assignee_name = assigneeName;
          existing.status = status;
          existing.priority = priority;
          existing.due_date = dueDate;
          existing.description = description;
          saveStoredTasks(tasksList);
          closeTaskModal();
          renderAllViews();
          notifyResult("Đã cập nhật " + (existing.code || "Task") + " thành công!", "success");
        }
        return;
      }

      const nextNum = tasksList.length + 1;
      const newTask = {
        id: Date.now(),
        code: "#T-" + String(nextNum).padStart(2, "0"),
        title,
        description,
        assignee_id: assigneeId,
        assignee_name: assigneeName,
        priority,
        status,
        due_date: dueDate
      };

      try {
        if (typeof api !== "undefined" && api.post) {
          await api.post("/tasks", {
            project_id: currentProjectId,
            title,
            description: description || null,
            assignee_id: assigneeId,
            priority: priority.toLowerCase(),
            status: mapStatusToBackend(status) || "todo",
            due_date: dueDate || null
          });
        }
      } catch (err) {}

      tasksList.unshift(newTask);
      saveStoredTasks(tasksList);
      closeTaskModal();
      renderAllViews();
      notifyResult(
        'Đã tạo Task "' + title + '" trong cột ' + getColumnLabel(status) + " (" + assigneeName + ").",
        "success"
      );
    } finally {
      if (btnSubmitTask) {
        btnSubmitTask.disabled = false;
      }
    }
  });
}

if (btnDeleteInModal) {
  btnDeleteInModal.addEventListener("click", () => {
    const editingId = editingTaskIdInput.value ? Number(editingTaskIdInput.value) : null;
    if (!editingId) return;
    const target = tasksList.find((t) => Number(t.id) === editingId);
    if (!target) return;

    if (confirm('Bạn có chắc muốn xóa "' + target.title + '" khỏi bảng không?')) {
      tasksList = tasksList.filter((t) => Number(t.id) !== editingId);
      saveStoredTasks(tasksList);
      closeTaskModal();
      renderAllViews();
      notifyResult("Đã xóa " + (target.code || "Task") + " khỏi dự án.", "success");
    }
  });
}

/* ---------- SỰ KIỆN CLICK MỞ CHI TIẾT & CHUYỂN NHANH ---------- */
document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-open-task]");
  if (trigger) {
    openEditTaskModal(Number(trigger.dataset.openTask));
  }
});

document.addEventListener("change", (e) => {
  const quickSelect = e.target.closest("[data-quick-move]");
  if (quickSelect) {
    const taskId = Number(quickSelect.dataset.quickMove);
    moveTaskToStatus(taskId, quickSelect.value);
  }
});

/* ---------- CHUYỂN CHẾ ĐỘ XEM KANBAN / BẢNG ---------- */
function setViewMode(mode) {
  currentView = mode;
  if (mode === "table") {
    if (kanbanBoard) kanbanBoard.style.display = "none";
    if (tableViewCard) tableViewCard.classList.add("is-visible");
    if (btnViewKanban) btnViewKanban.classList.remove("active");
    if (btnViewTable) btnViewTable.classList.add("active");
  } else {
    if (kanbanBoard) kanbanBoard.style.display = "grid";
    if (tableViewCard) tableViewCard.classList.remove("is-visible");
    if (btnViewKanban) btnViewKanban.classList.add("active");
    if (btnViewTable) btnViewTable.classList.remove("active");
  }
}

if (btnViewKanban) btnViewKanban.addEventListener("click", () => setViewMode("kanban"));
if (btnViewTable) btnViewTable.addEventListener("click", () => setViewMode("table"));

/* ---------- BỘ LỌC & TÌM KIẾM TASK (NỐI API GET /tasks) ---------- */
if (searchTaskInput) {
  searchTaskInput.addEventListener("input", () => {
    clearTimeout(filterSearchTimer);
    filterSearchTimer = setTimeout(() => {
      loadTasksWithFilters();
    }, 300);
  });
}

[filterStatusSelect, filterPrioritySelect, filterAssigneeSelect].forEach((el) => {
  if (!el) return;
  el.addEventListener("change", () => {
    loadTasksWithFilters();
  });
});

if (btnResetFilters) {
  btnResetFilters.addEventListener("click", () => {
    if (searchTaskInput) searchTaskInput.value = "";
    if (filterStatusSelect) filterStatusSelect.value = "";
    if (filterPrioritySelect) filterPrioritySelect.value = "";
    if (filterAssigneeSelect) filterAssigneeSelect.value = "";
    apiFilteredTasks = null;
    loadTasksWithFilters();
  });
}

window.addEventListener("storage", (e) => {
  if (e.key === MEMBERS_STORAGE_KEY) {
    projectMembers = loadStoredMembers();
    renderMembersUI();
    renderAllViews();
  } else if (e.key === STATUS_STORAGE_KEY && e.newValue) {
    renderProjectStatusUI(e.newValue);
  }
});

async function initTasksPage() {
  setupColumnDropzones();
  const savedStatus = localStorage.getItem(STATUS_STORAGE_KEY) || "ACTIVE";
  renderProjectStatusUI(savedStatus);
  await syncProjectMembers();
  tasksList = loadStoredTasks();
  await loadTasksWithFilters();
}

initTasksPage();
