const initialMembers = [
  {
    id: 1,
    project_id: 1,
    user_id: 1,
    role: "owner",
    joined_at: "2026-09-01T08:00:00Z",
    user: {
      id: 1,
      full_name: "Lê Quang Huy",
      email: "huy.lq@ptit.edu.vn"
    }
  },
  {
    id: 2,
    project_id: 1,
    user_id: 2,
    role: "member",
    joined_at: "2026-09-02T09:00:00Z",
    user: {
      id: 2,
      full_name: "Nguyễn Minh Đức",
      email: "duc.nm@ptit.edu.vn"
    }
  },
  {
    id: 3,
    project_id: 1,
    user_id: 3,
    role: "member",
    joined_at: "2026-09-02T10:30:00Z",
    user: {
      id: 3,
      full_name: "Lưu Đức Anh",
      email: "anh.ld@ptit.edu.vn"
    }
  },
  {
    id: 4,
    project_id: 1,
    user_id: 4,
    role: "member",
    joined_at: "2026-09-03T08:15:00Z",
    user: {
      id: 4,
      full_name: "Trần Nhật Long",
      email: "long.tn@ptit.edu.vn"
    }
  },
  {
    id: 5,
    project_id: 1,
    user_id: 5,
    role: "member",
    joined_at: "2026-09-03T14:00:00Z",
    user: {
      id: 5,
      full_name: "Hoàng Đức Duy Anh",
      email: "duyanh.hd@ptit.edu.vn"
    }
  }
];

const urlParams = new URLSearchParams(window.location.search);
const currentProjectId = Number(urlParams.get("project_id") || urlParams.get("id") || 1);

const MEMBERS_STORAGE_KEY = "sph_members_project_" + currentProjectId;
const STATUS_STORAGE_KEY = "sph_project_status_" + currentProjectId;

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
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(initialMembers));
  return [...initialMembers];
}

function saveStoredMembers(list) {
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // Bỏ qua lỗi ghi localStorage
  }
}

let membersList = loadStoredMembers();
let searchKeyword = "";
let roleFilter = "ALL";
let pendingDeleteMember = null;

const subnavTasksLink = document.getElementById("subnav-tasks-link");
const subnavMembersLink = document.getElementById("subnav-members-link");
if (subnavTasksLink) subnavTasksLink.href = "tasks.html?project_id=" + currentProjectId;
if (subnavMembersLink) subnavMembersLink.href = "members.html?project_id=" + currentProjectId;

const membersTbody = document.getElementById("members-tbody");
const memberCountLabel = document.getElementById("member-count-label");
const totalMembersStat = document.getElementById("total-members-stat");
const statusBanner = document.getElementById("status-banner");

const projectStatusBadge = document.getElementById("project-status-badge");
const projectStatusSelect = document.getElementById("project-status-select");
const btnUpdateProjectStatus = document.getElementById("btn-update-project-status");
const projectStatusRoleHint = document.getElementById("project-status-role-hint");
const currentUserLabel = document.getElementById("current-user-label");

const addMemberForm = document.getElementById("add-member-form");
const emailInput = document.getElementById("member-email-input");
const emailError = document.getElementById("member-email-error");
const roleSelect = document.getElementById("member-role-select");
const btnAddMember = document.getElementById("btn-add-member");

const searchInput = document.getElementById("search-member-input");
const filterRoleSelect = document.getElementById("filter-role-select");

const deleteModal = document.getElementById("delete-member-modal");
const deleteMemberNameEl = document.getElementById("delete-member-name");
const deleteMemberEmailEl = document.getElementById("delete-member-email");
const btnCloseDeleteModal = document.getElementById("btn-close-delete-modal");
const btnCancelDelete = document.getElementById("btn-cancel-delete");
const btnConfirmDelete = document.getElementById("btn-confirm-delete");

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

// Chuẩn hóa vai trò: cả "owner" và "admin" trong dự án đều có quyền tương đương OWNER
function normalizeProjectRole(role) {
  const r = String(role || "member").trim().toUpperCase();
  if (r === "OWNER" || r === "ADMIN") return "OWNER";
  if (r === "VIEWER") return "VIEWER";
  return "MEMBER";
}

function getRoleBadge(role) {
  const normalized = normalizeProjectRole(role);
  if (normalized === "OWNER") return '<span class="badge badge-owner">OWNER</span>';
  if (normalized === "VIEWER") return '<span class="badge badge-viewer">VIEWER</span>';
  return '<span class="badge badge-member">MEMBER</span>';
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

// Kiểm tra người dùng hiện tại có phải là Owner hoặc Admin không
function isCurrentUserOwnerOrAdmin() {
  const currentUser = (typeof auth !== "undefined" && auth.getUser) ? auth.getUser() : null;
  if (!currentUser) {
    // Mặc định tài khoản mẫu trên trang là Lê Quang Huy (Owner)
    return true;
  }

  const sysRole = String(currentUser.role || currentUser.system_role || "").toLowerCase();
  if (sysRole === "admin" || sysRole === "owner") {
    return true;
  }

  const email = String(currentUser.email || "").toLowerCase();
  const matchedMember = membersList.find(
    (m) => getMemberEmail(m).toLowerCase() === email || Number(m.user_id) === Number(currentUser.id)
  );
  if (matchedMember) {
    return normalizeProjectRole(matchedMember.role) === "OWNER";
  }

  return true;
}

// Đồng bộ và hiển thị trạng thái dự án (Lên kế hoạch, Đang làm, Đã hoàn thành)
function normalizeProjectStatus(status) {
  const s = String(status || "ACTIVE").trim().toUpperCase();
  if (s === "PLANNING") return "PLANNING";
  if (s === "COMPLETED" || s === "DONE") return "COMPLETED";
  return "ACTIVE";
}

function renderProjectStatusUI(statusValue) {
  const normalized = normalizeProjectStatus(statusValue);
  localStorage.setItem(STATUS_STORAGE_KEY, normalized);

  if (projectStatusSelect) {
    projectStatusSelect.value = normalized;
  }

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

function renderMembers() {
  if (!membersTbody) return;

  const filtered = membersList.filter((m) => {
    const roleUpper = normalizeProjectRole(m.role);
    const matchRole = roleFilter === "ALL" || roleUpper === roleFilter;

    const kw = searchKeyword.trim().toLowerCase();
    const name = getMemberName(m).toLowerCase();
    const email = getMemberEmail(m).toLowerCase();
    const matchSearch = !kw || name.includes(kw) || email.includes(kw);

    return matchRole && matchSearch;
  });

  if (memberCountLabel) memberCountLabel.textContent = String(filtered.length);
  if (totalMembersStat) totalMembersStat.textContent = String(membersList.length);

  if (filtered.length === 0) {
    membersTbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: var(--color-muted); padding: 24px;">Không tìm thấy thành viên phù hợp.</td></tr>';
    return;
  }

  membersTbody.innerHTML = filtered
    .map((m, idx) => {
      const roleUpper = normalizeProjectRole(m.role);
      const isPrimaryOwner = Number(m.id) === 1 && roleUpper === "OWNER";
      const name = safeEscape(getMemberName(m));
      const email = safeEscape(getMemberEmail(m));
      const joinedDate = safeDate(m.joined_at);

      const actionHtml = isPrimaryOwner
        ? '<span style="font-size: 12px; color: var(--color-muted);">Chủ dự án</span>'
        : '<button type="button" class="btn btn-small btn-danger btn-remove-member" data-id="' +
          m.id +
          '">Xóa khỏi dự án</button>';

      return (
        "<tr>" +
        "<td>" + (idx + 1) + "</td>" +
        "<td><strong>" + name + "</strong></td>" +
        "<td>" + email + "</td>" +
        "<td>" + getRoleBadge(roleUpper) + "</td>" +
        "<td>" + joinedDate + "</td>" +
        "<td>" + actionHtml + "</td>" +
        "</tr>"
      );
    })
    .join("");
}

async function loadProjectMembers() {
  const savedStatus = localStorage.getItem(STATUS_STORAGE_KEY) || "ACTIVE";
  renderProjectStatusUI(savedStatus);

  try {
    if (typeof api !== "undefined" && api.get) {
      const res = await api.get("/projects/" + currentProjectId + "/members");
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;
      if (items && items.length > 0) {
        membersList = items;
        saveStoredMembers(membersList);
        renderMembers();
        return;
      }
    }
  } catch (err) {
    // Fallback dữ liệu trong localStorage khi backend chưa bật
  }

  saveStoredMembers(membersList);
  renderMembers();
}

function validateEmail(email) {
  if (!email) {
    return "Vui lòng nhập email thành viên cần thêm.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Định dạng email không hợp lệ (VD: sv@ptit.edu.vn).";
  }
  const exists = membersList.some(
    (m) => getMemberEmail(m).toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    return "Người dùng với email này đã có trong dự án.";
  }
  return "";
}

if (emailInput) {
  emailInput.addEventListener("input", () => {
    emailInput.classList.remove("is-invalid");
    if (emailError) emailError.classList.remove("is-visible");
  });
}

if (addMemberForm) {
  addMemberForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailInput?.value || "").trim().toLowerCase();
    const selectedRole = (roleSelect?.value || "member").toLowerCase();

    const errorMsg = validateEmail(email);
    if (errorMsg) {
      emailInput.classList.add("is-invalid");
      if (emailError) {
        emailError.textContent = errorMsg;
        emailError.classList.add("is-visible");
      }
      emailInput.focus();
      return;
    }

    if (btnAddMember) {
      btnAddMember.disabled = true;
      btnAddMember.textContent = "Đang thêm...";
    }

    try {
      let createdMember = null;
      // Backend schema nhận role ('admin', 'member', 'viewer'), trong đó 'admin' trong dự án có quyền như 'owner'
      const apiRolePayload = selectedRole === "owner" ? "admin" : selectedRole;

      if (typeof api !== "undefined" && api.post) {
        try {
          const res = await api.post("/projects/" + currentProjectId + "/members", {
            email,
            role: apiRolePayload
          });
          createdMember = res?.data || res;
          if (createdMember && selectedRole === "owner") {
            createdMember.role = "owner";
          }
        } catch (apiErr) {
          if (apiErr && apiErr.status && apiErr.status !== 0) {
            const msg = apiErr.data?.message || apiErr.message || "Không thể thêm thành viên.";
            throw new Error(msg);
          }
        }
      }

      if (!createdMember || !createdMember.id) {
        const displayName = email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        createdMember = {
          id: Date.now(),
          project_id: currentProjectId,
          user_id: Date.now(),
          role: selectedRole === "owner" ? "owner" : selectedRole,
          joined_at: new Date().toISOString(),
          user: {
            id: Date.now(),
            full_name: displayName,
            email
          }
        };
      }

      membersList.push(createdMember);
      saveStoredMembers(membersList);
      emailInput.value = "";
      renderMembers();
      notifyResult("Thêm thành viên " + email + " (" + normalizeProjectRole(selectedRole) + ") vào dự án thành công!", "success");
    } catch (err) {
      emailInput.classList.add("is-invalid");
      if (emailError) {
        emailError.textContent = err.message;
        emailError.classList.add("is-visible");
      }
      notifyResult(err.message || "Lỗi khi thêm thành viên.", "error");
    } finally {
      if (btnAddMember) {
        btnAddMember.disabled = false;
        btnAddMember.textContent = "Thêm thành viên";
      }
    }
  });
}

function openDeleteModal(member) {
  pendingDeleteMember = member;
  if (deleteMemberNameEl) deleteMemberNameEl.textContent = getMemberName(member);
  if (deleteMemberEmailEl) deleteMemberEmailEl.textContent = getMemberEmail(member);
  if (deleteModal) deleteModal.classList.add("is-open");
}

function closeDeleteModal() {
  pendingDeleteMember = null;
  if (deleteModal) deleteModal.classList.remove("is-open");
}

if (membersTbody) {
  membersTbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remove-member");
    if (!btn) return;
    const memberId = Number(btn.dataset.id);
    const target = membersList.find((m) => Number(m.id) === memberId);
    if (target) openDeleteModal(target);
  });
}

if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener("click", closeDeleteModal);
if (btnCancelDelete) btnCancelDelete.addEventListener("click", closeDeleteModal);
if (deleteModal) {
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });
}

if (btnConfirmDelete) {
  btnConfirmDelete.addEventListener("click", async () => {
    if (!pendingDeleteMember) return;
    const target = pendingDeleteMember;
    const targetName = getMemberName(target);

    btnConfirmDelete.disabled = true;
    btnConfirmDelete.textContent = "Đang xóa...";

    try {
      if (typeof api !== "undefined" && api.delete) {
        try {
          await api.delete(
            "/projects/" + currentProjectId + "/members/" + (target.user_id || target.id)
          );
        } catch (apiErr) {
          if (apiErr && apiErr.status && apiErr.status !== 0 && apiErr.status !== 404 && apiErr.status !== 405) {
            const msg = apiErr.data?.message || apiErr.message || "Không thể xóa thành viên.";
            throw new Error(msg);
          }
        }
      }

      membersList = membersList.filter((m) => Number(m.id) !== Number(target.id));
      saveStoredMembers(membersList);
      closeDeleteModal();
      renderMembers();
      notifyResult("Đã xóa thành viên " + targetName + " khỏi dự án.", "success");
    } catch (err) {
      closeDeleteModal();
      notifyResult(err.message || "Không thể xóa thành viên.", "error");
    } finally {
      btnConfirmDelete.disabled = false;
      btnConfirmDelete.textContent = "Xác nhận xóa";
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchKeyword = e.target.value;
    renderMembers();
  });
}

if (filterRoleSelect) {
  filterRoleSelect.addEventListener("change", (e) => {
    roleFilter = e.target.value;
    renderMembers();
  });
}

loadProjectMembers();
