// ==========================================================
// TRANG DANH SÁCH DỰ ÁN (PROJECTS.JS)
// Quản lý hiển thị thẻ dự án, tìm kiếm/lọc, modal tạo mới, empty state
// ==========================================================

// 1. Dữ liệu giả lập ban đầu (Mock data theo đề tài sinh viên PTIT)
let mockProjects = [
  {
    id: 1,
    name: "Student Project Hub",
    description: "Nền tảng quản lý tiến độ đồ án và bài tập nhóm dành cho sinh viên ngành CNTT.",
    start_date: "2026-11-01",
    end_date: "2026-11-30",
    status: "ACTIVE",
    total_tasks: 20,
    done_tasks: 13,
    members: 5
  },
  {
    id: 2,
    name: "Hệ Thống Đăng Ký Học Phần Trực Tuyến",
    description: "Website cho phép sinh viên đăng ký môn học theo tín chỉ và tự động xếp thời khóa biểu.",
    start_date: "2026-11-10",
    end_date: "2026-12-15",
    status: "PLANNING",
    total_tasks: 12,
    done_tasks: 2,
    members: 4
  },
  {
    id: 3,
    name: "Ứng Dụng Đặt Đồ Ăn Nhanh Canteen PTIT",
    description: "Hệ thống gọi món và thanh toán qua ví điện tử nội bộ cho căng tin trường học.",
    start_date: "2026-09-01",
    end_date: "2026-10-25",
    status: "COMPLETED",
    total_tasks: 16,
    done_tasks: 16,
    members: 3
  },
  {
    id: 4,
    name: "Website Thư Viện Điện Tử & Mượn Sách",
    description: "Quản lý kho sách, bạn đọc, tra cứu tài liệu học tập và đặt lịch mượn trả trực tuyến.",
    start_date: "2026-10-01",
    end_date: "2026-11-15",
    status: "ACTIVE",
    total_tasks: 15,
    done_tasks: 9,
    members: 4
  }
];

let currentFilter = "ALL";
let searchKeyword = "";

// Các phần tử DOM
const grid = document.getElementById("project-grid");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyDesc = document.getElementById("empty-desc");
const searchInput = document.getElementById("search-input");
const filterGroup = document.getElementById("filter-group");

// Modal DOM
const modal = document.getElementById("create-modal");
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

// Helper: Hiển thị badge trạng thái
function getBadge(status) {
  if (status === "ACTIVE") return `<span class="badge badge-active">Đang thực hiện</span>`;
  if (status === "PLANNING") return `<span class="badge badge-planning">Lập kế hoạch</span>`;
  return `<span class="badge badge-completed">Đã hoàn thành</span>`;
}

// 2. Render danh sách thẻ dự án
function renderProjects() {
  const filtered = mockProjects.filter((p) => {
    const matchStatus = currentFilter === "ALL" || p.status === currentFilter;
    const matchKeyword = !searchKeyword || 
      p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchStatus && matchKeyword;
  });

  // Xử lý trạng thái rỗng (Empty State)
  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.style.display = "block";
    if (searchKeyword) {
      emptyTitle.textContent = `Không tìm thấy dự án phù hợp với "${searchKeyword}"`;
      emptyDesc.textContent = "Vui lòng thử tìm với từ khóa khác hoặc bấm nút Tạo dự án mới bên dưới.";
    } else {
      emptyTitle.textContent = "Chưa có dự án nào";
      emptyDesc.textContent = "Hiện chưa có dự án nào trong mục này. Hãy bắt đầu bằng cách tạo dự án mới!";
    }
    return;
  }

  emptyState.style.display = "none";
  grid.innerHTML = filtered.map((p) => {
    const percent = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
    return `
      <article class="project-card">
        <div class="project-card-header">
          <h3 class="project-title">${escapeHtml(p.name)}</h3>
          ${getBadge(p.status)}
        </div>
        <p class="project-desc">${escapeHtml(p.description || "Chưa có mô tả.")}</p>
        <div class="project-meta">
          <span>📅 ${formatDate(p.start_date)} - ${formatDate(p.end_date)}</span>
          <span>👥 ${p.members} thành viên</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-info">
            <span>Tiến độ hoàn thành</span>
            <strong>${percent}% (${p.done_tasks}/${p.total_tasks} việc)</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>
        <div class="project-card-actions">
          <button class="btn btn-small btn-primary" onclick="showToast('Xem chi tiết đồ án: ${escapeHtml(p.name)}', 'info')" style="flex: 1;">
            Xem chi tiết
          </button>
        </div>
      </article>
    `;
  }).join("");
}

// 3. Sự kiện tìm kiếm & lọc trạng thái
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchKeyword = e.target.value.trim();
    renderProjects();
  });
}

if (filterGroup) {
  filterGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filterGroup.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.status;
    renderProjects();
  });
}

// 4. Quản lý Popup Modal
function openModal() {
  modal.classList.add("is-open");
  nameInput.value = "";
  descInput.value = "";
  nameInput.classList.remove("is-invalid");
  nameError.classList.remove("is-visible");
  nameInput.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  createForm.reset();
  nameInput.classList.remove("is-invalid");
  nameError.classList.remove("is-visible");
}

if (btnOpenModal) btnOpenModal.addEventListener("click", openModal);
if (btnEmptyCreate) btnEmptyCreate.addEventListener("click", openModal);
if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

nameInput.addEventListener("input", () => {
  nameInput.classList.remove("is-invalid");
  nameError.classList.remove("is-visible");
});

// 5. Gửi form tạo dự án mới
createForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const desc = descInput.value.trim();
  const startDate = startDateInput.value || new Date().toISOString().slice(0, 10);
  const endDate = endDateInput.value || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const status = statusInput.value;

  if (!name) {
    nameInput.classList.add("is-invalid");
    nameError.textContent = "Vui lòng nhập tên đề tài / dự án";
    nameError.classList.add("is-visible");
    nameInput.focus();
    return;
  }

  const newProject = {
    id: Date.now(),
    name,
    description: desc,
    start_date: startDate,
    end_date: endDate,
    status,
    total_tasks: 0,
    done_tasks: 0,
    members: 1
  };

  mockProjects.unshift(newProject);
  closeModal();
  showToast("Tạo dự án mới thành công!", "success");
  renderProjects();
});

// Khởi chạy render lần đầu
renderProjects();

