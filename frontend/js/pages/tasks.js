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
    description: "Chuẩn hóa 9 bảng dữ liệu và sơ đồ ERD",
    assignee_id: 5,
    assignee_name: "Hoàng Đức Duy Anh",
    priority: "HIGH",
    status: "DONE",
    due_date: "2026-11-05"
  },
  {
    id: 2,
    code: "#T-02",
    title: "Xây dựng khung cơ sở Frontend HTML/CSS/JS",
    description: "Thiết lập style.css, layout.js và cấu hình Axios",
    assignee_id: 2,
    assignee_name: "Nguyễn Minh Đức",
    priority: "HIGH",
    status: "DONE",
    due_date: "2026-11-08"
  },
  {
    id: 3,
    code: "#T-03",
    title: "Xây dựng API xác thực JWT và phân quyền dự án",
    description: "Đăng nhập, đăng ký và kiểm tra vai trò Owner/Member",
    assignee_id: 1,
    assignee_name: "Lê Quang Huy",
    priority: "URGENT",
    status: "REVIEW",
    due_date: "2026-11-12"
  },
  {
    id: 4,
    code: "#T-04",
    title: "Lập trình giao diện trang Danh sách dự án và Thành viên",
    description: "Hiển thị danh sách thành viên, form mời và bộ lọc",
    assignee_id: 3,
    assignee_name: "Lưu Đức Anh",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    due_date: "2026-11-15"
  },
  {
    id: 5,
    code: "#T-05",
    title: "Xây dựng API CRUD Task và kiểm tra State Machine",
    description: "Ràng buộc chuyển trạng thái TODO sang IN_PROGRESS, REVIEW, DONE",
    assignee_id: 4,
    assignee_name: "Trần Nhật Long",
    priority: "HIGH",
    status: "IN_PROGRESS",
    due_date: "2026-11-16"
  },
  {
    id: 6,
    code: "#T-06",
    title: "Viết kịch bản kiểm thử tích hợp API & phân quyền",
    description: "Kiểm thử 25 test case P0 trong tài liệu SRS",
    assignee_id: 5,
    assignee_name: "Hoàng Đức Duy Anh",
    priority: "URGENT",
    status: "TODO",
    due_date: "2026-11-09"
  }
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
const projectOverdueStat = document.getElementById("project-overdue-stat");
const totalMembersStat = document.getElementById("total-members-stat");
const statusBanner = document.getElementById("status-banner");

const createTaskForm = document.getElementById("create-task-form");
const taskTitleInput = document.getElementById("task-title");
const taskTitleError = document.getElementById("task-title-error");
const taskAssigneeSelect = document.getElementById("task-assignee");
const taskPrioritySelect = document.getElementById("task-priority");
const taskStatusSelect = document.getElementById("task-status");
const taskDueDateInput = document.getElementById("task-due-date");
const taskDescInput = document.getElementById("task-desc");

const tasksTbody = document.getElementById("tasks-tbody");
const taskCountLabel = document.getElementById("task-count-label");
const searchTaskInput = document.getElementById("search-task-input");
const filterStatusSelect = document.getElementById("filter-status-select");
const filterPrioritySelect = document.getElementById("filter-priority-select");
const filterAssigneeSelect = document.getElementById("filter-assignee-select");

let projectMembers = [];
let tasksList = [];

function safeEscape(val) {
  if (typeof escapeHtml === "function") return escapeHtml(val);
  const div = document.createElement("div");
  div.textContent = val ?? "";
  return div.innerHTML;
}

function safeDate(val) {
  if (typeof formatDate === "function") return formatDate(val);
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("vi-VN");
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Bỏ qua lỗi đọc localStorage
  }
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(defaultMembers));
  return [...defaultMembers];
}

function loadStoredTasks() {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Bỏ qua lỗi đọc localStorage
  }
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(defaultTasks));
  return [...defaultTasks];
}

function saveStoredTasks(list) {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // Bỏ qua lỗi ghi localStorage
  }
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
      ? "(Quyền Owner / Admin: có thể đổi trạng thái)"
      : "(Chỉ Owner và Admin mới có thể đổi trạng thái)";
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
    const backendStatus = backendStatusMap[selectedStatus] || "in_progress";

    btnUpdateProjectStatus.disabled = true;
    btnUpdateProjectStatus.textContent = "Đang lưu...";

    try {
      if (typeof api !== "undefined" && api.patch) {
        try {
          await api.patch("/projects/" + currentProjectId + "/status", {
            status: backendStatus
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

function renderAssigneeSelectOptions() {
  if (totalMembersStat) {
    totalMembersStat.textContent = String(projectMembers.length);
  }

  if (taskAssigneeSelect) {
    const currentVal = taskAssigneeSelect.value;
    const optionsHtml =
      '<option value="">-- Chưa phân công --</option>' +
      projectMembers
        .map((m) => {
          const uid = getMemberUserId(m);
          const name = safeEscape(getMemberName(m));
          const email = getMemberEmail(m);
          const role = normalizeProjectRole(m.role);
          const emailSuffix = email ? " - " + safeEscape(email) : "";
          return (
            '<option value="' +
            uid +
            '">' +
            name +
            " (" +
            role +
            emailSuffix +
            ")</option>"
          );
        })
        .join("");
    taskAssigneeSelect.innerHTML = optionsHtml;
    if (currentVal) taskAssigneeSelect.value = currentVal;
  }

  if (filterAssigneeSelect) {
    const currentFilterVal = filterAssigneeSelect.value;
    const filterHtml =
      '<option value="">Tất cả thành viên</option>' +
      projectMembers
        .map((m) => {
          const uid = getMemberUserId(m);
          const name = safeEscape(getMemberName(m));
          return '<option value="' + uid + '">' + name + "</option>";
        })
        .join("");
    filterAssigneeSelect.innerHTML = filterHtml;
    if (currentFilterVal) filterAssigneeSelect.value = currentFilterVal;
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
  } catch (e) {
    // Dùng dữ liệu trong localStorage khi backend chưa bật
  }

  renderAssigneeSelectOptions();
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
  if (s === "DONE") return '<span class="badge badge-done">DONE</span>';
  if (s === "REVIEW") return '<span class="badge badge-review">REVIEW</span>';
  if (s === "IN_PROGRESS") return '<span class="badge badge-in-progress">IN_PROGRESS</span>';
  return '<span class="badge badge-todo">TODO</span>';
}

function isTaskOverdue(task) {
  if (!task.due_date || String(task.status).toUpperCase() === "DONE") return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.due_date < today;
}

function resolveAssigneeName(task) {
  if (task.assignee_id) {
    const found = projectMembers.find((m) => getMemberUserId(m) === Number(task.assignee_id));
    if (found) return getMemberName(found);
  }
  return task.assignee_name || "Chưa phân công";
}

function updateProjectTaskStats() {
  const total = tasksList.length;
  const doneCount = tasksList.filter((t) => String(t.status).toUpperCase() === "DONE").length;
  const overdueCount = tasksList.filter((t) => isTaskOverdue(t)).length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (projectProgressStat) {
    projectProgressStat.textContent = percent + "% (" + doneCount + "/" + total + ")";
  }
  if (projectOverdueStat) {
    projectOverdueStat.textContent = overdueCount + " Task";
  }
}

function renderTasks() {
  if (!tasksTbody) return;

  const kw = (searchTaskInput?.value || "").trim().toLowerCase();
  const statusFilter = (filterStatusSelect?.value || "").toUpperCase();
  const priorityFilter = (filterPrioritySelect?.value || "").toUpperCase();
  const assigneeFilter = filterAssigneeSelect?.value || "";

  const filtered = tasksList.filter((t) => {
    const matchSearch =
      !kw ||
      String(t.title || "").toLowerCase().includes(kw) ||
      String(t.description || "").toLowerCase().includes(kw);
    const matchStatus = !statusFilter || String(t.status || "").toUpperCase() === statusFilter;
    const matchPriority = !priorityFilter || String(t.priority || "").toUpperCase() === priorityFilter;
    const matchAssignee = !assigneeFilter || Number(t.assignee_id) === Number(assigneeFilter);

    return matchSearch && matchStatus && matchPriority && matchAssignee;
  });

  if (taskCountLabel) taskCountLabel.textContent = String(filtered.length);
  updateProjectTaskStats();

  if (filtered.length === 0) {
    tasksTbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: var(--color-muted); padding: 24px;">Không tìm thấy Task phù hợp.</td></tr>';
    return;
  }

  tasksTbody.innerHTML = filtered
    .map((t, index) => {
      const code = safeEscape(t.code || "#T-" + String(index + 1).padStart(2, "0"));
      const title = safeEscape(t.title);
      const desc = safeEscape(t.description || "Không có mô tả chi tiết");
      const assigneeName = safeEscape(resolveAssigneeName(t));
      const dueDateText = safeDate(t.due_date);
      const overdueHtml = isTaskOverdue(t) ? '<div class="text-overdue">Quá hạn</div>' : "";
      const st = String(t.status || "TODO").toUpperCase();

      let actionButtons = "";
      if (st === "TODO") {
        actionButtons =
          '<button type="button" class="btn btn-small btn-change-task-status" data-id="' +
          t.id +
          '" data-status="IN_PROGRESS">Bắt đầu</button> ' +
          '<button type="button" class="btn btn-small btn-danger btn-delete-task" data-id="' +
          t.id +
          '">Xóa</button>';
      } else if (st === "IN_PROGRESS") {
        actionButtons =
          '<button type="button" class="btn btn-small btn-change-task-status" data-id="' +
          t.id +
          '" data-status="REVIEW">Gửi REVIEW</button> ' +
          '<button type="button" class="btn btn-small btn-danger btn-delete-task" data-id="' +
          t.id +
          '">Xóa</button>';
      } else if (st === "REVIEW") {
        actionButtons =
          '<button type="button" class="btn btn-small btn-primary btn-change-task-status" data-id="' +
          t.id +
          '" data-status="DONE">Duyệt DONE</button> ' +
          '<button type="button" class="btn btn-small btn-change-task-status" data-id="' +
          t.id +
          '" data-status="IN_PROGRESS">Trả lại</button>';
      } else {
        actionButtons =
          '<button type="button" class="btn btn-small btn-change-task-status" data-id="' +
          t.id +
          '" data-status="IN_PROGRESS">Mở lại</button>';
      }

      return (
        "<tr>" +
        "<td>" + code + "</td>" +
        "<td><strong>" + title + '</strong><div style="font-size: 12px; color: var(--color-muted);">' + desc + "</div></td>" +
        "<td>" + assigneeName + "</td>" +
        "<td>" + getPriorityBadge(t.priority) + "</td>" +
        "<td>" + getStatusBadge(st) + "</td>" +
        "<td><div>" + dueDateText + "</div>" + overdueHtml + "</td>" +
        "<td>" + actionButtons + "</td>" +
        "</tr>"
      );
    })
    .join("");
}

if (taskTitleInput) {
  taskTitleInput.addEventListener("input", () => {
    taskTitleInput.classList.remove("is-invalid");
    if (taskTitleError) taskTitleError.classList.remove("is-visible");
  });
}

if (createTaskForm) {
  createTaskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = (taskTitleInput?.value || "").trim();
    if (!title) {
      if (taskTitleInput) taskTitleInput.classList.add("is-invalid");
      if (taskTitleError) {
        taskTitleError.textContent = "Vui lòng nhập tên nhiệm vụ (Task Title).";
        taskTitleError.classList.add("is-visible");
      }
      if (taskTitleInput) taskTitleInput.focus();
      return;
    }

    const assigneeId = taskAssigneeSelect?.value ? Number(taskAssigneeSelect.value) : null;
    const selectedMember = projectMembers.find((m) => getMemberUserId(m) === assigneeId);
    const assigneeName = selectedMember ? getMemberName(selectedMember) : "Chưa phân công";
    const priority = (taskPrioritySelect?.value || "MEDIUM").toUpperCase();
    const status = (taskStatusSelect?.value || "TODO").toUpperCase();
    const dueDate = taskDueDateInput?.value || "";
    const description = (taskDescInput?.value || "").trim();

    const nextNumber = tasksList.length + 1;
    const newTask = {
      id: Date.now(),
      code: "#T-" + String(nextNumber).padStart(2, "0"),
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
        try {
          await api.post("/projects/" + currentProjectId + "/tasks", {
            title,
            description,
            assignee_id: assigneeId,
            priority: priority.toLowerCase(),
            status: status.toLowerCase(),
            deadline: dueDate || null
          });
        } catch (apiErr) {
          // Fallback lưu local khi backend chưa bật
        }
      }
    } catch (err) {
      // Bỏ qua lỗi mạng
    }

    tasksList.unshift(newTask);
    saveStoredTasks(tasksList);
    createTaskForm.reset();
    if (taskPrioritySelect) taskPrioritySelect.value = "MEDIUM";
    if (taskStatusSelect) taskStatusSelect.value = "TODO";
    if (taskDueDateInput) taskDueDateInput.value = "2026-11-20";
    renderTasks();
    notifyResult(
      "Đã tạo Task \"" + title + "\" (Trạng thái: " + status + ", Người thực hiện: " + assigneeName + ") thành công!",
      "success"
    );
  });
}

if (tasksTbody) {
  tasksTbody.addEventListener("click", (e) => {
    const changeBtn = e.target.closest(".btn-change-task-status");
    if (changeBtn) {
      const taskId = Number(changeBtn.dataset.id);
      const nextStatus = changeBtn.dataset.status;
      const task = tasksList.find((t) => Number(t.id) === taskId);
      if (task && nextStatus) {
        task.status = nextStatus;
        saveStoredTasks(tasksList);
        renderTasks();
        notifyResult("Đã chuyển trạng thái Task " + (task.code || "") + " sang " + nextStatus + ".", "success");
      }
      return;
    }

    const deleteBtn = e.target.closest(".btn-delete-task");
    if (deleteBtn) {
      const taskId = Number(deleteBtn.dataset.id);
      const task = tasksList.find((t) => Number(t.id) === taskId);
      if (task) {
        tasksList = tasksList.filter((t) => Number(t.id) !== taskId);
        saveStoredTasks(tasksList);
        renderTasks();
        notifyResult("Đã xóa Task " + (task.code || "") + " khỏi dự án.", "success");
      }
    }
  });
}

[searchTaskInput, filterStatusSelect, filterPrioritySelect, filterAssigneeSelect].forEach((el) => {
  if (!el) return;
  const eventType = el.tagName === "INPUT" ? "input" : "change";
  el.addEventListener(eventType, renderTasks);
});

// Tự động cập nhật danh sách thành viên nếu tab khác vừa thêm thành viên
window.addEventListener("storage", (e) => {
  if (e.key === MEMBERS_STORAGE_KEY) {
    projectMembers = loadStoredMembers();
    renderAssigneeSelectOptions();
    renderTasks();
  } else if (e.key === STATUS_STORAGE_KEY && e.newValue) {
    renderProjectStatusUI(e.newValue);
  }
});

async function initTasksPage() {
  const savedStatus = localStorage.getItem(STATUS_STORAGE_KEY) || "ACTIVE";
  renderProjectStatusUI(savedStatus);
  await syncProjectMembers();
  tasksList = loadStoredTasks();
  renderTasks();
}

initTasksPage();
