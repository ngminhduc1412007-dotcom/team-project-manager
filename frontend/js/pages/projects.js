// ==========================================================
// TRANG DANH SÁCH DỰ ÁN (PROJECTS.JS)
// Kết nối trực tiếp Backend API (GET/POST/DELETE /api/projects)
// Kèm cơ chế Mock Engine dự phòng khi Backend chưa bật
// ==========================================================

// 0. CHẶN TRANG KHI CHƯA ĐĂNG NHẬP (AUTH GUARD)
if (typeof auth !== "undefined" && !auth.requireAuth()) {
  // auth.requireAuth đã tự chuyển hướng về login.html
}

// 1. Dữ liệu giả lập dự phòng (sử dụng khi Backend chưa bật)
const fallbackProjects = [
  {
    id: 1,
    name: "Student Project Hub",
    description: "Nền tảng quản lý tiến độ đồ án và bài tập nhóm dành cho sinh viên ngành CNTT PTIT.",
    start_date: "2026-11-01T00:00:00Z",
    deadline: "2026-11-30T23:59:59Z",
    created_at: "2026-11-01T08:00:00Z",
    updated_at: "2026-11-12T10:00:00Z",
    status: "in_progress",
    owner_id: 1,
    owner: { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
    total_tasks: 20,
    done_tasks: 14,
    members: [{ id: 1, role: "owner" }]
  },
  {
    id: 2,
    name: "Hệ Thống Đăng Ký Học Phần Trực Tuyến",
    description: "Website cho phép sinh viên đăng ký môn học theo tín chỉ và tự động xếp thời khóa biểu.",
    start_date: "2026-10-15T00:00:00Z",
    deadline: "2026-12-15T23:59:59Z",
    created_at: "2026-10-15T09:30:00Z",
    updated_at: "2026-11-10T14:20:00Z",
    status: "planning",
    owner_id: 2,
    owner: { id: 2, full_name: "Trần Bảo Nam", email: "namtb@ptit.edu.vn" },
    total_tasks: 12,
    done_tasks: 3,
    members: [{ id: 2, role: "owner" }]
  },
  {
    id: 3,
    name: "Ứng Dụng Đặt Đồ Ăn Nhanh Canteen PTIT",
    description: "Hệ thống gọi món và thanh toán qua ví điện tử nội bộ cho căng tin cơ sở Hà Đông.",
    start_date: "2026-09-01T00:00:00Z",
    deadline: "2026-10-25T23:59:59Z",
    created_at: "2026-09-01T07:15:00Z",
    updated_at: "2026-10-25T16:00:00Z",
    status: "completed",
    owner_id: 1,
    owner: { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
    total_tasks: 16,
    done_tasks: 16,
    members: [{ id: 1, role: "owner" }]
  },
  {
    id: 4,
    name: "Website Thư Viện Điện Tử & Mượn Sách",
    description: "Quản lý kho tài liệu, bạn đọc, tra cứu giáo trình học tập và đặt lịch mượn trả trực tuyến.",
    start_date: "2026-10-01T00:00:00Z",
    deadline: "2026-11-20T23:59:59Z",
    created_at: "2026-10-01T10:00:00Z",
    updated_at: "2026-11-05T11:45:00Z",
    status: "in_progress",
    owner_id: 3,
    owner: { id: 3, full_name: "Lê Thu Hà", email: "halt@ptit.edu.vn" },
    total_tasks: 15,
    done_tasks: 9,
    members: [{ id: 3, role: "owner" }]
  }
];

let localProjects = [...fallbackProjects];

// 2. Trạng thái truy vấn (Query State)
const queryState = {
  search: "",
  page: 1,
  page_size: 10,
  sort_by: "created_at",
  sort_order: "desc",
  owner_id: null,
  my: false,
  status: "ALL",
};

// 3. Các phần tử DOM
const grid = document.getElementById("project-grid");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyDesc = document.getElementById("empty-desc");
const searchInput = document.getElementById("search-input");
const filterGroup = document.getElementById("filter-group");
const myFilterGroup = document.getElementById("my-filter-group");
const sortBySelect = document.getElementById("sort-by");
const sortOrderSelect = document.getElementById("sort-order");
const pageSizeSelect = document.getElementById("page-size");
const paginationWrapper = document.getElementById("pagination-wrapper");
const paginationInfo = document.getElementById("pagination-info");
const paginationControls = document.getElementById("pagination-controls");

// Modal DOM
const modal = document.getElementById("create-modal");
const modalProjectTitle = document.getElementById("modal-project-title");
const editProjectIdInput = document.getElementById("edit-project-id");
const btnOpenModal = document.getElementById("btn-open-modal");
const btnEmptyCreate = document.getElementById("btn-empty-create");
const btnCloseModal = document.getElementById("btn-close-modal");
const btnCancelModal = document.getElementById("btn-cancel-modal");
const createForm = document.getElementById("create-project-form");
const nameInput = document.getElementById("project-name");
const descInput = document.getElementById("project-desc");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const statusInput = document.getElementById("project-status");
const nameError = document.getElementById("name-error");
const dateError = document.getElementById("date-error");

// Delete modal DOM
const deleteModal = document.getElementById("delete-modal");
const btnCloseDeleteModal = document.getElementById("btn-close-delete-modal");
const btnCancelDeleteModal = document.getElementById("btn-cancel-delete-modal");
const btnConfirmDeleteAction = document.getElementById("btn-confirm-delete-action");
const deleteProjectNameDisplay = document.getElementById("delete-project-name-display");
let pendingDeleteId = null;
let pendingDeleteName = "";

// Helper: Hiển thị badge trạng thái chuẩn hóa theo Backend
function getBadge(status) {
  const s = (status || "").toLowerCase();
  if (s === "in_progress" || s === "active" || s === "đang thực hiện") {
    return '<span class="badge badge-active">Đang thực hiện</span>';
  }
  if (s === "planning" || s === "lập kế hoạch") {
    return '<span class="badge badge-planning">Lập kế hoạch</span>';
  }
  if (s === "completed" || s === "đã hoàn thành") {
    return '<span class="badge badge-completed">Đã hoàn thành</span>';
  }
  return '<span class="badge">' + escapeHtml(status) + '</span>';
}

    // 4. Mock Engine: xử lý cục bộ khi Backend offline
    function runMockEngine(params) {
      const currentUser = (typeof auth !== "undefined" && auth.getUser) ? auth.getUser() : null;
      const currentUserId = currentUser ? (currentUser.id || 1) : 1;

      let filtered = localProjects.filter((p) => {
        const kw = (params.search || params.name || "").trim().toLowerCase();
        const matchSearch = !kw ||
          p.name.toLowerCase().includes(kw) ||
          (p.description && p.description.toLowerCase().includes(kw));

        const matchMy = !params.my || (p.owner_id === currentUserId);
        const matchOwner = !params.owner_id || (p.owner_id === Number(params.owner_id));
        const matchStatus = !params.status || params.status === "ALL" || p.status.toLowerCase() === params.status.toLowerCase();

        return matchSearch && matchMy && matchOwner && matchStatus;
      });

        const sortBy = params.sort_by || "created_at";
        const isAsc = (params.sort_order || "desc").toLowerCase() === "asc";

        filtered.sort((a, b) => {
          let comparison = 0;
          if (sortBy === "id") {
            comparison = a.id - b.id;
          } else if (sortBy === "name") {
            comparison = a.name.localeCompare(b.name, "vi");
          } else if (sortBy === "deadline") {
            const dA = new Date(a.deadline || a.end_date || 0).getTime();
            const dB = new Date(b.deadline || b.end_date || 0).getTime();
            comparison = dA - dB;
          } else if (sortBy === "updated_at") {
            const dA = new Date(a.updated_at || a.created_at || 0).getTime();
            const dB = new Date(b.updated_at || b.created_at || 0).getTime();
            comparison = dA - dB;
          } else {
            const dA = new Date(a.created_at || 0).getTime();
            const dB = new Date(b.created_at || 0).getTime();
            comparison = dA - dB;
          }
          return isAsc ? comparison : -comparison;
        });

        const totalRecords = filtered.length;
        const pageSize = Math.max(1, Math.min(100, Number(params.page_size) || 10));
        const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
        const currentPage = Math.max(1, Math.min(Number(params.page) || 1, totalPages));

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalRecords);
        const items = filtered.slice(startIndex, endIndex);

        return {
          items,
          meta: {
            page: currentPage,
            page_size: pageSize,
            total_records: totalRecords,
            total_pages: totalPages,
            has_prev: currentPage > 1,
            has_next: currentPage < totalPages,
          },
          isMock: true,
        };
      }

      // 5. Tải danh sách dự án: Gọi Backend API (GET /api/projects)
      async function loadProjects() {
        const params = {
          search: queryState.search || undefined,
          name: queryState.search || undefined,
          page: queryState.page,
          page_size: queryState.page_size,
          sort_by: queryState.sort_by,
          sort_order: queryState.sort_order,
          my: queryState.my ? true : undefined,
          owner_id: queryState.owner_id || undefined,
        };

        try {
          if (typeof api !== "undefined" && api.get) {
            const res = await api.get("/projects", params);

            // Backend trả về: { success: true, data: { items: [...], meta: { ... } } }
            if (res && res.data && Array.isArray(res.data.items)) {
              renderProjectList(res.data.items, false);
              renderPagination(res.data.meta);
              return;
            }
          }
        } catch (err) {
          // Nếu backend trả về 404 (Không tìm thấy dự án do chưa có bản ghi nào phù hợp)
          if (err.status === 404) {
            renderProjectList([], false);
            renderPagination({
              page: queryState.page,
              page_size: queryState.page_size,
              total_records: 0,
              total_pages: 0,
              has_next: false,
              has_prev: false,
            });
            return;
          }

          // Nếu không kết nối được backend (status === 0), tự động chuyển sang chế độ Mock Engine
          if (err.status === 0) {
            console.info("Backend offline. Đang chạy chế độ Mock Engine:", err.message);
          } else {
            showToast(err.message, "error");
          }
        }

        // Chạy Mock Engine dự phòng
        const fallbackResult = runMockEngine({
          ...params,
          status: queryState.status,
        });
        renderProjectList(fallbackResult.items, true);
        renderPagination(fallbackResult.meta);
      }

      // 6. Hiển thị danh sách thẻ dự án ra giao diện
      function renderProjectList(items, isMock) {
        if (!items || items.length === 0) {
          grid.innerHTML = "";
          emptyState.style.display = "block";
            paginationWrapper.style.display = "none";

            if (queryState.search) {
              emptyTitle.textContent = 'Không tìm thấy dự án phù hợp với "' + escapeHtml(queryState.search) + '"';
              emptyDesc.textContent = "Vui lòng thử tìm với từ khóa khác hoặc bấm nút Tạo dự án mới bên dưới.";
            } else if (queryState.my) {
              emptyTitle.textContent = "Bạn chưa có dự án nào";
              emptyDesc.textContent = "Bấm 'Tất cả dự án' để xem dự án chung hoặc bấm Tạo dự án mới để bắt đầu.";
            } else {
              emptyTitle.textContent = "Chưa có dự án nào";
              emptyDesc.textContent = "Hệ thống chưa có dự án nào trong mục này. Hãy tạo dự án đầu tiên!";
            }
            return;
          }

          emptyState.style.display = "none";
            paginationWrapper.style.display = "flex";

            const currentUser = (typeof auth !== "undefined" && auth.getUser) ? auth.getUser() : null;
            const currentUserId = currentUser ? (currentUser.id || 1) : 1;

            currentProjectsList = items;

            grid.innerHTML = items.map((p) => {
              const isOwner = currentUser && (p.owner_id === currentUserId || (p.owner && p.owner.id === currentUserId));
              const ownerName = (p.owner && (p.owner.full_name || p.owner.email)) ? (p.owner.full_name || p.owner.email) : "Sinh viên PTIT";
              const deadlineText = p.deadline || p.end_date ? formatDate(p.deadline || p.end_date) : "Chưa đặt";
              const createdText = p.created_at ? formatDate(p.created_at) : "—";
              const membersCount = Array.isArray(p.members) ? p.members.length : (p.members || 1);

              const viewTasksBtn = '<a href="tasks.html?project_id=' + p.id + '" class="btn btn-small btn-primary" title="Xem danh sách công việc">📋 Công việc</a>';
              const editBtn = isOwner
                ? '<button type="button" class="btn btn-small btn-outline" onclick="openEditModal(' + p.id + ')" title="Chỉnh sửa dự án này">✏️ Sửa</button>'
                : '';
              const deleteBtn = isOwner
                ? '<button type="button" class="btn btn-small btn-danger" onclick="openDeleteModal(' + p.id + ', \'' + escapeHtml(p.name).replace(/'/g, "\\'") + '\')" title="Xóa dự án này">🗑️ Xóa</button>'
                : '';

              return (
                '<article class="project-card">' +
                '<div class="project-card-header">' +
                '<h3 class="project-title">' + escapeHtml(p.name) + '</h3>' +
                getBadge(p.status) +
                '</div>' +
                '<p class="project-desc">' + escapeHtml(p.description || "Chưa có mô tả.") + '</p>' +
                '<div class="project-meta">' +
                '<span>🎯 Deadline: <strong>' + deadlineText + '</strong></span>' +
                '<span>👥 ' + membersCount + ' thành viên</span>' +
                '</div>' +
                '<div class="project-meta" style="font-size: 11px; color: var(--color-muted); margin-bottom: 6px;">' +
                '<span>👤 Chủ sở hữu: ' + escapeHtml(ownerName) + '</span>' +
                '<span>📅 Tạo: ' + createdText + '</span>' +
                '</div>' +
                '<div class="project-card-actions" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">' +
                viewTasksBtn +
                editBtn +
                deleteBtn +
                '</div>' +
                '</article>'
              );
            }).join("");
          }

// 7. Render thanh phân trang
function renderPagination(meta) {
              if (!meta || meta.total_records === 0) {
                paginationWrapper.style.display = "none";
                return;
              }

              paginationWrapper.style.display = "flex";

              const startRecord = (meta.page - 1) * meta.page_size + 1;
              const endRecord = Math.min(meta.page * meta.page_size, meta.total_records);

              paginationInfo.innerHTML =
                'Hiển thị <strong>' + startRecord + ' - ' + endRecord + '</strong> trên tổng số <strong>' + meta.total_records + '</strong> dự án (Trang ' + meta.page + '/' + meta.total_pages + ')';

              let buttonsHtml = "";

              buttonsHtml +=
                '<button type="button" class="pagination-btn" data-page="' + (meta.page - 1) + '" ' +
                (!meta.has_prev ? 'disabled title="Đang ở trang đầu"' : 'title="Trang trước"') +
                '>« Trước</button>';

              for (let i = 1; i <= meta.total_pages; i++) {
                if (meta.total_pages > 7) {
                  if (i === 1 || i === meta.total_pages || (i >= meta.page - 1 && i <= meta.page + 1)) {
                    const activeClass = i === meta.page ? "active" : "";
                    buttonsHtml += '<button type="button" class="pagination-btn ' + activeClass + '" data-page="' + i + '">' + i + '</button>';
                  } else if (i === meta.page - 2 || i === meta.page + 2) {
                    buttonsHtml += '<span class="pagination-ellipsis">…</span>';
                  }
                } else {
                  const activeClass = i === meta.page ? "active" : "";
                  buttonsHtml += '<button type="button" class="pagination-btn ' + activeClass + '" data-page="' + i + '">' + i + '</button>';
                }
              }

              buttonsHtml +=
                '<button type="button" class="pagination-btn" data-page="' + (meta.page + 1) + '" ' +
                (!meta.has_next ? 'disabled title="Đang ở trang cuối"' : 'title="Trang tiếp"') +
                '>Tiếp »</button>';

              paginationControls.innerHTML = buttonsHtml;
            }

// 8. Chuyển trang
function goToPage(targetPage) {
              queryState.page = Number(targetPage);
              loadProjects();

              if (grid) {
                grid.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }

// 9. Xóa dự án (Modal xác nhận và DELETE /api/projects/{id})
function openDeleteModal(projectId, projectName) {
  pendingDeleteId = projectId;
  pendingDeleteName = projectName;
  if (deleteProjectNameDisplay) {
    deleteProjectNameDisplay.textContent = '"' + projectName + '"';
  }
  if (deleteModal) {
    deleteModal.classList.add("is-open");
  }
}

function closeDeleteModal() {
  if (deleteModal) {
    deleteModal.classList.remove("is-open");
  }
  pendingDeleteId = null;
  pendingDeleteName = "";
}

window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;

if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener("click", closeDeleteModal);
if (btnCancelDeleteModal) btnCancelDeleteModal.addEventListener("click", closeDeleteModal);
if (deleteModal) {
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });
}

if (btnConfirmDeleteAction) {
  btnConfirmDeleteAction.addEventListener("click", async () => {
    if (!pendingDeleteId) return;
    const targetId = pendingDeleteId;
    const targetName = pendingDeleteName;
    btnConfirmDeleteAction.disabled = true;
    btnConfirmDeleteAction.textContent = "Đang xóa...";

    try {
      if (typeof api !== "undefined" && api.delete) {
        await api.delete(`/projects/${targetId}`);
        closeDeleteModal();
        showToast(`Đã xóa dự án "${targetName}" thành công!`, "success");
        loadProjects();
        return;
      }
    } catch (err) {
      if (err.status !== 0) {
        showToast(err.message || "Không thể xóa dự án.", "error");
        btnConfirmDeleteAction.disabled = false;
        btnConfirmDeleteAction.textContent = "Xác nhận xóa";
        return;
      }
    } finally {
      btnConfirmDeleteAction.disabled = false;
      btnConfirmDeleteAction.textContent = "Xác nhận xóa";
    }

    // Fallback xóa local
    localProjects = localProjects.filter((p) => p.id !== targetId);
    closeDeleteModal();
    showToast(`Đã xóa dự án "${targetName}" (chế độ demo)!`, "success");
    loadProjects();
  });
}

// 10. Lắng nghe các sự kiện tìm kiếm, lọc, sắp xếp

let searchDebounceTimer = null;
          if (searchInput) {
            searchInput.addEventListener("input", (e) => {
              clearTimeout(searchDebounceTimer);
              searchDebounceTimer = setTimeout(() => {
                queryState.search = e.target.value.trim();
                queryState.page = 1;
                loadProjects();
              }, 300);
            });
          }

          if (myFilterGroup) {
            myFilterGroup.addEventListener("click", (e) => {
              const btn = e.target.closest(".filter-btn");
              if (!btn) return;
              myFilterGroup.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");

              queryState.my = btn.dataset.my === "true";
              queryState.page = 1;
              loadProjects();
            });
          }

          if (filterGroup) {
            filterGroup.addEventListener("click", (e) => {
              const btn = e.target.closest(".filter-btn");
              if (!btn) return;
              filterGroup.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");

              queryState.status = btn.dataset.status;
              queryState.page = 1;
              loadProjects();
            });
          }

          if (sortBySelect) {
            sortBySelect.addEventListener("change", (e) => {
              queryState.sort_by = e.target.value;
              queryState.page = 1;
              loadProjects();
            });
          }

          if (sortOrderSelect) {
            sortOrderSelect.addEventListener("change", (e) => {
              queryState.sort_order = e.target.value;
              queryState.page = 1;
              loadProjects();
            });
          }

          if (pageSizeSelect) {
            pageSizeSelect.addEventListener("change", (e) => {
              queryState.page_size = Number(e.target.value);
              queryState.page = 1;
              loadProjects();
            });
          }

          if (paginationControls) {
            paginationControls.addEventListener("click", (e) => {
              const btn = e.target.closest(".pagination-btn");
              if (!btn || btn.disabled) return;
              const targetPage = Number(btn.dataset.page);
              if (targetPage && targetPage !== queryState.page) {
                goToPage(targetPage);
              }
            });
          }

          // 11. Modal Tạo / Sửa dự án (POST /api/projects và PATCH /api/projects/{id})
          function openCreateModal() {
            if (editProjectIdInput) editProjectIdInput.value = "";
            if (modalProjectTitle) modalProjectTitle.textContent = "Tạo đồ án / dự án mới";
            const submitBtn = document.getElementById("btn-submit-project");
            if (submitBtn) submitBtn.textContent = "Tạo dự án";

            createForm.reset();
            nameInput.classList.remove("is-invalid");
            nameError.classList.remove("is-visible");
            if (dateError) dateError.classList.remove("is-visible");

            modal.classList.add("is-open");
            nameInput.focus();
          }

          function openEditModal(projectId) {
            const p = (currentProjectsList && currentProjectsList.find((item) => item.id === projectId)) ||
                      (localProjects && localProjects.find((item) => item.id === projectId));
            if (!p) {
              showToast("Không tìm thấy thông tin dự án để chỉnh sửa.", "error");
              return;
            }

            if (editProjectIdInput) editProjectIdInput.value = p.id;
            if (modalProjectTitle) modalProjectTitle.textContent = "Chỉnh sửa đồ án / dự án";
            const submitBtn = document.getElementById("btn-submit-project");
            if (submitBtn) submitBtn.textContent = "Lưu thay đổi";

            nameInput.value = p.name || "";
            descInput.value = p.description || "";
            startDateInput.value = p.start_date ? p.start_date.substring(0, 10) : "";
            endDateInput.value = (p.deadline || p.end_date) ? (p.deadline || p.end_date).substring(0, 10) : "";
            statusInput.value = p.status || "planning";

            nameInput.classList.remove("is-invalid");
            nameError.classList.remove("is-visible");
            if (dateError) dateError.classList.remove("is-visible");

            modal.classList.add("is-open");
            nameInput.focus();
          }

          function closeModal() {
            modal.classList.remove("is-open");
            createForm.reset();
            if (editProjectIdInput) editProjectIdInput.value = "";
            nameInput.classList.remove("is-invalid");
            nameError.classList.remove("is-visible");
            if (dateError) dateError.classList.remove("is-visible");
          }

          window.openCreateModal = openCreateModal;
          window.openEditModal = openEditModal;
          window.closeModal = closeModal;

          if (btnOpenModal) btnOpenModal.addEventListener("click", openCreateModal);
          if (btnEmptyCreate) btnEmptyCreate.addEventListener("click", openCreateModal);
          if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
          if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);

          modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
          });

          nameInput.addEventListener("input", () => {
            nameInput.classList.remove("is-invalid");
            nameError.classList.remove("is-visible");
          });

          if (endDateInput) {
            endDateInput.addEventListener("input", () => {
              if (dateError) dateError.classList.remove("is-visible");
            });
          }

          createForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const editId = editProjectIdInput && editProjectIdInput.value ? Number(editProjectIdInput.value) : null;
            const name = nameInput.value.trim();
            const desc = descInput.value.trim();
            const startDate = startDateInput.value ? new Date(startDateInput.value).toISOString() : null;
            const deadline = endDateInput.value ? new Date(endDateInput.value + "T23:59:59Z").toISOString() : null;
            const status = statusInput.value || "planning";

            // Validate tên dự án
            if (!name || name.length < 3) {
              nameInput.classList.add("is-invalid");
              nameError.textContent = "Tên dự án bắt buộc và phải có ít nhất 3 ký tự.";
              nameError.classList.add("is-visible");
              nameInput.focus();
              return;
            }

            // Validate ngày
            if (startDateInput.value && endDateInput.value && startDateInput.value > endDateInput.value) {
              if (dateError) {
                dateError.textContent = "Hạn chót (Deadline) không được trước ngày bắt đầu.";
                dateError.classList.add("is-visible");
              } else {
                showToast("Hạn chót không được trước ngày bắt đầu.", "warning");
              }
              endDateInput.focus();
              return;
            }

            const payload = {
              name,
              description: desc || null,
              start_date: startDate,
              deadline: deadline,
              status: status,
            };

            const submitBtn = document.getElementById("btn-submit-project");
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.textContent = editId ? "Đang lưu..." : "Đang tạo...";
            }

            try {
              if (editId) {
                if (typeof api !== "undefined" && (api.patch || api.put)) {
                  const method = api.patch ? api.patch : api.put;
                  const res = await method(`/projects/${editId}`, payload);
                  closeModal();
                  showToast(res.message || "Cập nhật dự án thành công!", "success");
                  loadProjects();
                  return;
                }
              } else {
                if (typeof api !== "undefined" && api.post) {
                  const res = await api.post("/projects", payload);
                  closeModal();
                  showToast(res.message || "Tạo dự án mới thành công!", "success");
                  queryState.page = 1;
                  loadProjects();
                  return;
                }
              }
            } catch (err) {
              if (err.status !== 0) {
                showToast(err.message || "Thao tác không thành công.", "error");
                if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.textContent = editId ? "Lưu thay đổi" : "Tạo dự án";
                }
                return;
              }
            } finally {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = editId ? "Lưu thay đổi" : "Tạo dự án";
              }
            }

            // Fallback demo local mode
            const nowIso = new Date().toISOString();
            if (editId) {
              const idx = localProjects.findIndex((p) => p.id === editId);
              if (idx !== -1) {
                localProjects[idx] = {
                  ...localProjects[idx],
                  name,
                  description: desc,
                  start_date: startDate,
                  deadline: deadline,
                  status: status,
                  updated_at: nowIso,
                };
              }
              closeModal();
              showToast("Cập nhật dự án thành công (chế độ demo)!", "success");
              loadProjects();
            } else {
              const currentUser = (typeof auth !== "undefined" && auth.getUser) ? auth.getUser() : null;
              const newProject = {
                id: Date.now(),
                name,
                description: desc,
                start_date: startDate,
                deadline: deadline,
                created_at: nowIso,
                updated_at: nowIso,
                status: status,
                owner_id: currentUser ? (currentUser.id || 1) : 1,
                owner: currentUser || { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
                total_tasks: 0,
                done_tasks: 0,
                members: [{ id: currentUser ? (currentUser.id || 1) : 1, role: "owner" }],
              };

              localProjects.unshift(newProject);
              closeModal();
              showToast("Tạo dự án mới thành công (chế độ demo)!", "success");
              queryState.page = 1;
              loadProjects();
            }
          });

          // 12. Khởi chạy ban đầu
          loadProjects();
