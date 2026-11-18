// ==========================================================
// TRANG DANH SÁCH DỰ ÁN (PROJECTS.JS)
// Hỗ trợ tìm kiếm theo tên, phân trang, sắp xếp và lọc dự án
// ==========================================================

// 1. Dữ liệu giả lập phong phú (18 Đồ án sinh viên PTIT với đầy đủ trường dữ liệu)
const initialProjects = [
  {
    id: 1,
    name: "Student Project Hub",
    description: "Nền tảng quản lý tiến độ đồ án và bài tập nhóm dành cho sinh viên ngành CNTT PTIT.",
    start_date: "2026-11-01",
    deadline: "2026-11-30",
    created_at: "2026-11-01T08:00:00Z",
    updated_at: "2026-11-12T10:00:00Z",
    status: "ACTIVE",
    owner_id: 1,
    owner: { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
    total_tasks: 20,
    done_tasks: 14,
    members: 5
  },
  {
    id: 2,
    name: "Hệ Thống Đăng Ký Học Phần Trực Tuyến",
    description: "Website cho phép sinh viên đăng ký môn học theo tín chỉ và tự động xếp thời khóa biểu.",
    start_date: "2026-10-15",
    deadline: "2026-12-15",
    created_at: "2026-10-15T09:30:00Z",
    updated_at: "2026-11-10T14:20:00Z",
    status: "PLANNING",
    owner_id: 2,
    owner: { id: 2, full_name: "Trần Bảo Nam", email: "namtb@ptit.edu.vn" },
    total_tasks: 12,
    done_tasks: 3,
    members: 4
  },
  {
    id: 3,
    name: "Ứng Dụng Đặt Đồ Ăn Nhanh Canteen PTIT",
    description: "Hệ thống gọi món và thanh toán qua ví điện tử nội bộ cho căng tin cơ sở Hà Đông.",
    start_date: "2026-09-01",
    deadline: "2026-10-25",
    created_at: "2026-09-01T07:15:00Z",
    updated_at: "2026-10-25T16:00:00Z",
    status: "COMPLETED",
    owner_id: 1,
    owner: { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
    total_tasks: 16,
    done_tasks: 16,
    members: 3
  },
  {
    id: 4,
    name: "Website Thư Viện Điện Tử & Mượn Sách",
    description: "Quản lý kho tài liệu, bạn đọc, tra cứu giáo trình học tập và đặt lịch mượn trả trực tuyến.",
    start_date: "2026-10-01",
    deadline: "2026-11-20",
    created_at: "2026-10-01T10:00:00Z",
    updated_at: "2026-11-05T11:45:00Z",
    status: "ACTIVE",
    owner_id: 3,
    owner: { id: 3, full_name: "Lê Thu Hà", email: "halt@ptit.edu.vn" },
    total_tasks: 15,
    done_tasks: 9,
    members: 4
  },
  {
    id: 5,
    name: "Ứng Dụng Điểm Danh Sinh Viên Bằng Nhận Diện Khuôn Mặt",
    description: "Ứng dụng di động AI hỗ trợ giảng viên điểm danh lớp học tự động qua camera.",
    start_date: "2026-10-10",
    deadline: "2026-12-20",
    created_at: "2026-10-10T13:00:00Z",
    updated_at: "2026-11-11T09:10:00Z",
    status: "ACTIVE",
    owner_id: 1,
    owner: { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
    total_tasks: 25,
    done_tasks: 18,
    members: 5
  },
  {
    id: 6,
    name: "Cổng Thông Tin Tuyển Dụng Thực Tập Sinh IT PTIT",
    description: "Cầu nối giữa doanh nghiệp công nghệ và sinh viên tìm kiếm cơ hội thực tập, việc làm.",
    start_date: "2026-09-15",
    deadline: "2026-11-28",
    created_at: "2026-09-15T08:45:00Z",
    updated_at: "2026-10-30T17:30:00Z",
    status: "PLANNING",
    owner_id: 4,
    owner: { id: 4, full_name: "Vũ Đình Trọng", email: "trongvd@ptit.edu.vn" },
    total_tasks: 18,
    done_tasks: 5,
    members: 4
  },
  {
    id: 7,
    name: "Nền Tảng Thi Thử Lập Trình & Chấm Điểm Tự Động",
    description: "Hệ thống Online Judge phục vụ học phần Cấu trúc dữ liệu và giải thuật.",
    start_date: "2026-08-20",
    deadline: "2026-10-30",
    created_at: "2026-08-20T14:20:00Z",
    updated_at: "2026-10-30T18:00:00Z",
    status: "COMPLETED",
    owner_id: 2,
    owner: { id: 2, full_name: "Trần Bảo Nam", email: "namtb@ptit.edu.vn" },
    total_tasks: 30,
    done_tasks: 30,
    members: 5
  },
  {
    id: 8,
    name: "Hệ Thống Quản Lý Ký Túc Xá Sinh Viên PTIT",
    description: "Website đăng ký phòng, quản lý tiền điện nước và phản ánh cơ sở vật chất nội trú.",
    start_date: "2026-10-20",
    deadline: "2026-12-05",
    created_at: "2026-10-20T11:00:00Z",
    updated_at: "2026-11-08T15:00:00Z",
    status: "ACTIVE",
    owner_id: 1,
    owner: { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
    total_tasks: 14,
    done_tasks: 8,
    members: 3
  },
  {
    id: 9,
    name: "Ứng Dụng Bản Đồ Số & Chỉ Đường Khuôn Viên Học Viện",
    description: "Bản đồ tương tác 3D tìm phòng học, hội trường và các phòng ban trong cơ sở đào tạo.",
    start_date: "2026-11-05",
    deadline: "2026-12-30",
    created_at: "2026-11-05T08:30:00Z",
    updated_at: "2026-11-12T16:40:00Z",
    status: "PLANNING",
    owner_id: 5,
    owner: { id: 5, full_name: "Hoàng Minh Quân", email: "quanhm@ptit.edu.vn" },
    total_tasks: 22,
    done_tasks: 4,
    members: 4
  },
  {
    id: 10,
    name: "Website Đánh Giá Giảng Viên & Khảo Sát Môn Học",
    description: "Hệ thống lấy ý kiến phản hồi chất lượng đào tạo ẩn danh của sinh viên từng học kỳ.",
    start_date: "2026-08-01",
    deadline: "2026-09-30",
    created_at: "2026-08-01T10:10:00Z",
    updated_at: "2026-09-30T17:00:00Z",
    status: "COMPLETED",
    owner_id: 3,
    owner: { id: 3, full_name: "Lê Thu Hà", email: "halt@ptit.edu.vn" },
    total_tasks: 10,
    done_tasks: 10,
    members: 3
  },
  {
    id: 11,
    name: "Mạng Xã Hội Chia Sẻ Tài Liệu & Góc Học Tập Sinh Viên",
    description: "Diễn đàn trao đổi kiến thức lập trình, bài giảng và đề thi trắc nghiệm các khóa trước.",
    start_date: "2026-10-25",
    deadline: "2026-12-10",
    created_at: "2026-10-25T16:00:00Z",
    updated_at: "2026-11-13T09:30:00Z",
    status: "ACTIVE",
    owner_id: 1,
    owner: { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
    total_tasks: 19,
    done_tasks: 12,
    members: 4
  },
  {
    id: 12,
    name: "Hệ Thống Bầu Cử Trực Tuyến BCH Đoàn Thanh Niên",
    description: "Ứng dụng bỏ phiếu đại hội đoàn khoa bảo mật bằng mã xác thực OTP sinh viên.",
    start_date: "2026-09-10",
    deadline: "2026-11-01",
    created_at: "2026-09-10T12:00:00Z",
    updated_at: "2026-11-01T18:00:00Z",
    status: "COMPLETED",
    owner_id: 4,
    owner: { id: 4, full_name: "Vũ Đình Trọng", email: "trongvd@ptit.edu.vn" },
    total_tasks: 15,
    done_tasks: 15,
    members: 3
  },
  {
    id: 13,
    name: "Ứng Dụng Quản Lý Chi Tiêu Cá Nhân Cho Sinh Viên",
    description: "Sổ thu chi thông minh, cảnh báo hạn mức ngân sách và thống kê biểu đồ theo tuần.",
    start_date: "2026-11-02",
    deadline: "2026-12-25",
    created_at: "2026-11-02T15:20:00Z",
    updated_at: "2026-11-10T11:00:00Z",
    status: "PLANNING",
    owner_id: 2,
    owner: { id: 2, full_name: "Trần Bảo Nam", email: "namtb@ptit.edu.vn" },
    total_tasks: 11,
    done_tasks: 2,
    members: 2
  },
  {
    id: 14,
    name: "Website Tìm Trọ & Ở Ghép Gần Cơ Sở Học Viện",
    description: "Nền tảng xác thực phòng trọ giá rẻ, hỗ trợ tân sinh viên tìm kiếm phòng trọ an toàn.",
    start_date: "2026-10-12",
    deadline: "2026-11-22",
    created_at: "2026-10-12T09:00:00Z",
    updated_at: "2026-11-04T14:15:00Z",
    status: "ACTIVE",
    owner_id: 1,
    owner: { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
    total_tasks: 17,
    done_tasks: 10,
    members: 4
  },
  {
    id: 15,
    name: "Hệ Thống Giám Sát Thiết Bị Phòng Thực Hành Mạng",
    description: "Theo dõi tình trạng hoạt động của router, switch và máy tính trong lab mạng Cisco.",
    start_date: "2026-09-28",
    deadline: "2026-11-18",
    created_at: "2026-09-28T10:40:00Z",
    updated_at: "2026-10-29T16:20:00Z",
    status: "ACTIVE",
    owner_id: 5,
    owner: { id: 5, full_name: "Hoàng Minh Quân", email: "quanhm@ptit.edu.vn" },
    total_tasks: 14,
    done_tasks: 9,
    members: 3
  },
  {
    id: 16,
    name: "Website Đặt Sân Bóng Đá & CLB Thể Thao Học Viện",
    description: "Lịch đặt sân thể thao nội bộ, tìm đối giao hữu và quản lý giải đấu sinh viên PTIT.",
    start_date: "2026-08-15",
    deadline: "2026-10-10",
    created_at: "2026-08-15T08:00:00Z",
    updated_at: "2026-10-10T17:45:00Z",
    status: "COMPLETED",
    owner_id: 3,
    owner: { id: 3, full_name: "Lê Thu Hà", email: "halt@ptit.edu.vn" },
    total_tasks: 12,
    done_tasks: 12,
    members: 3
  },
  {
    id: 17,
    name: "Nền Tảng Luyện Tiếng Anh Chuyên Ngành CNTT",
    description: "Học từ vựng thuật ngữ công nghệ, luyện nghe video kỹ thuật và giải đề TOEIC online.",
    start_date: "2026-11-08",
    deadline: "2027-01-10",
    created_at: "2026-11-08T11:15:00Z",
    updated_at: "2026-11-12T13:00:00Z",
    status: "PLANNING",
    owner_id: 1,
    owner: { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
    total_tasks: 20,
    done_tasks: 3,
    members: 5
  },
  {
    id: 18,
    name: "Hệ Thống Quản Lý Đề Tài NCKH Sinh Viên PTIT",
    description: "Theo dõi tiến độ nộp thuyết minh, phản biện và nghiệm thu các đề tài nghiên cứu khoa học.",
    start_date: "2026-10-05",
    deadline: "2026-12-01",
    created_at: "2026-10-05T09:20:00Z",
    updated_at: "2026-11-07T15:10:00Z",
    status: "ACTIVE",
    owner_id: 2,
    owner: { id: 2, full_name: "Trần Bảo Nam", email: "namtb@ptit.edu.vn" },
    total_tasks: 18,
    done_tasks: 11,
    members: 4
  }
];

// Bản sao lưu cục bộ để hỗ trợ tạo mới dự án
let localProjects = [...initialProjects];

// 2. Trạng thái truy vấn (Query State) theo đúng đặc tả yêu cầu
const queryState = {
  search: "",              // name / search: Tìm kiếm theo tên dự án (chứa chuỗi, không phân biệt hoa thường)
  page: 1,                 // page: Trang hiện tại (>= 1, mặc định 1)
  page_size: 10,           // page_size: Số bản ghi mỗi trang (1-100, mặc định 10)
  sort_by: "created_at",   // sort_by: Trường sắp xếp (id, name, created_at, updated_at, deadline; mặc định created_at)
  sort_order: "desc",      // sort_order: Thứ tự sắp xếp (asc hoặc desc; mặc định desc)
  owner_id: null,          // owner_id: Lọc theo ID chủ dự án
  my: false,               // my=true: Chỉ lấy dự án của người đang đăng nhập
  status: "ALL"            // Lọc trạng thái (ALL, ACTIVE, PLANNING, COMPLETED)
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
  const s = String(status || "").toLowerCase();
  if (s === "active" || s === "in_progress") return '<span class="badge badge-active">Đang làm</span>';
  if (s === "planning") return '<span class="badge badge-planning">Lên kế hoạch</span>';
  return '<span class="badge badge-completed">Đã hoàn thành</span>';
}

function getEffectiveProjectStatus(p) {
  const saved = localStorage.getItem("sph_project_status_" + p.id);
  if (saved) return saved;
  const raw = String(p.status || "ACTIVE").toUpperCase();
  if (raw === "IN_PROGRESS") return "ACTIVE";
  return raw;
}

function getEffectiveMemberCount(p) {
  try {
    const raw = localStorage.getItem("sph_members_project_" + p.id);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr.length;
    }
  } catch (e) {}
  return p.members || 1;
}

function canUserChangeProjectStatus(p) {
  const currentUser = (typeof auth !== "undefined" && auth.getUser) ? auth.getUser() : null;
  if (!currentUser) return true;
  const sysRole = String(currentUser.role || currentUser.system_role || "").toLowerCase();
  if (sysRole === "admin" || sysRole === "owner") return true;
  if (Number(p.owner_id) === Number(currentUser.id)) return true;
  return true;
}

async function handleQuickStatusChange(projectId, newStatus) {
  const target = localProjects.find((item) => Number(item.id) === Number(projectId));
  if (target && !canUserChangeProjectStatus(target)) {
    showToast("Chỉ Owner và Admin mới có quyền đổi trạng thái dự án.", "error");
    loadProjects();
    return;
  }

  const backendStatusMap = {
    PLANNING: "planning",
    ACTIVE: "in_progress",
    COMPLETED: "completed"
  };

  try {
    if (typeof api !== "undefined" && api.patch) {
      await api.patch("/projects/" + projectId + "/status", {
        status: backendStatusMap[newStatus] || "in_progress"
      });
    }
  } catch (e) {
    // Fallback lưu localStorage khi backend chưa bật
  }

  localStorage.setItem("sph_project_status_" + projectId, newStatus);
  if (target) target.status = newStatus;

  const labelMap = {
    PLANNING: "Lên kế hoạch",
    ACTIVE: "Đang làm",
    COMPLETED: "Đã hoàn thành"
  };
  showToast("Đã đổi trạng thái dự án sang: " + (labelMap[newStatus] || newStatus), "success");
  loadProjects();
}

// 4. Mock Engine: Xử lý tìm kiếm, lọc, sắp xếp và phân trang chuẩn đặc tả khi backend chưa chạy
function runMockEngine(params) {
      const currentUser = (typeof auth !== "undefined" && auth.getUser) ? auth.getUser() : null;
      const currentUserId = currentUser ? (currentUser.id || 1) : 1;

      // 4.1. Lọc dữ liệu
      let filtered = localProjects.filter((p) => {
        // name / search: Tìm kiếm theo tên dự án (chứa chuỗi, không phân biệt hoa thường)
        const kw = (params.search || params.name || "").trim().toLowerCase();
        const matchSearch = !kw ||
          p.name.toLowerCase().includes(kw) ||
          (p.description && p.description.toLowerCase().includes(kw));

        // my=true: Chỉ lấy dự án của người đang đăng nhập
        const matchMy = !params.my || (p.owner_id === currentUserId);

        // owner_id: Lọc theo ID chủ dự án
        const matchOwner = !params.owner_id || (p.owner_id === Number(params.owner_id));

        // status: Lọc trạng thái (tương thích cả ACTIVE lẫn in_progress)
        const pStatus = String(p.status || "").toLowerCase();
        const filterStatus = String(params.status || "ALL").toLowerCase();
        const matchStatus =
          !params.status ||
          filterStatus === "all" ||
          pStatus === filterStatus ||
          ((filterStatus === "in_progress" || filterStatus === "active") && (pStatus === "active" || pStatus === "in_progress"));

        return matchSearch && matchMy && matchOwner && matchStatus;
      });

        // 4.2. Sắp xếp (sort_by: id, name, created_at, updated_at, deadline) & (sort_order: asc, desc)
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
            // Mặc định: created_at
            const dA = new Date(a.created_at || 0).getTime();
            const dB = new Date(b.created_at || 0).getTime();
            comparison = dA - dB;
          }
          return isAsc ? comparison : -comparison;
        });

        // 4.3. Phân trang (page >= 1, page_size 1-100)
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
            has_next: currentPage < totalPages
          }
        };
      }

      // 5. Tải danh sách dự án (Gọi API backend hoặc fallback Mock Engine)
      async function loadProjects() {
        let statusParam = undefined;
        if (queryState.status && queryState.status !== "ALL") {
          statusParam = queryState.status.toLowerCase();
          if (statusParam === "active") statusParam = "in_progress";
        }

        const params = {
          search: queryState.search || undefined,
          name: queryState.search || undefined,
          page: queryState.page,
          page_size: queryState.page_size,
          sort_by: queryState.sort_by,
          sort_order: queryState.sort_order,
          my: queryState.my ? true : undefined,
          owner_id: queryState.owner_id || undefined,
          status: statusParam,
        };

        try {
          if (typeof api !== "undefined" && api.get) {
            const res = await api.get("/projects", params);
            if (res && res.data && Array.isArray(res.data.items) && res.data.meta) {
              renderProjectList(res.data.items);
              renderPagination(res.data.meta);
              return;
            }
          }
        } catch (err) {
          // Nếu backend trả về 404: Không tìm thấy dự án phù hợp với từ khóa
          if (err && err.status === 404) {
            renderProjectList([]);
            return;
          }
          // Nếu backend trả về 401: Yêu cầu đăng nhập
          if (err && err.status === 401) {
            console.warn("[Projects] Yêu cầu đăng nhập để truy cập dữ liệu thật:", err.message);
            if (!auth.getToken()) {
              grid.innerHTML = "";
              emptyState.style.display = "block";
              paginationWrapper.style.display = "none";
              emptyTitle.textContent = "Yêu cầu đăng nhập";
              emptyDesc.innerHTML = 'Vui lòng <a href="login.html" style="color: var(--color-primary); font-weight: bold; text-decoration: underline;">đăng nhập</a> để xem danh sách dự án của bạn.';
              return;
            }
          }
        }

        // Chạy Mock Engine nếu backend chưa kết nối hoặc chưa có dữ liệu
        const result = runMockEngine(params);
        renderProjectList(result.items);
        renderPagination(result.meta);
      }

      // 6. Render danh sách thẻ dự án
      function renderProjectList(items) {
        if (!items || items.length === 0) {
          grid.innerHTML = "";
          emptyState.style.display = "block";
            paginationWrapper.style.display = "none";

            if (queryState.search) {
              emptyTitle.textContent = 'Không tìm thấy dự án phù hợp với "' + escapeHtml(queryState.search) + '"';
              emptyDesc.textContent = "Vui lòng thử tìm với từ khóa khác hoặc bấm nút Tạo dự án mới.";
            } else if (queryState.my) {
              emptyTitle.textContent = "Bạn chưa có dự án nào";
              emptyDesc.textContent = "Bấm nút 'Tất cả dự án' để xem các dự án khác hoặc bấm Tạo dự án mới bên dưới.";
            } else {
              emptyTitle.textContent = "Chưa có dự án nào";
              emptyDesc.textContent = "Hiện chưa có dự án nào trong danh mục này.";
            }
            return;
          }

          emptyState.style.display = "none";
            paginationWrapper.style.display = "flex";

            grid.innerHTML = items.map((p) => {
              const effectiveStatus = getEffectiveProjectStatus(p);
              const memberCount = getEffectiveMemberCount(p);
              const canEditStatus = canUserChangeProjectStatus(p);
              const percent = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
              const deadlineText = p.deadline || p.end_date ? formatDate(p.deadline || p.end_date) : "Chưa đặt";
              const createdText = p.created_at ? formatDate(p.created_at) : "—";
              const ownerName = (p.owner && (p.owner.full_name || p.owner.email)) ? p.owner.full_name || p.owner.email : "Sinh viên PTIT";

              return (
                '<article class="project-card">' +
                '<div class="project-card-header">' +
                '<h3 class="project-title">' + escapeHtml(p.name) + '</h3>' +
                getBadge(effectiveStatus) +
                '</div>' +
                '<p class="project-desc">' + escapeHtml(p.description || "Chưa có mô tả.") + '</p>' +
                '<div class="project-meta">' +
                '<span>🎯 Deadline: <strong>' + deadlineText + '</strong></span>' +
                '<span>👥 ' + memberCount + ' thành viên</span>' +
                '</div>' +
                '<div class="project-meta" style="font-size: 11px; color: var(--color-muted); margin-bottom: 6px;">' +
                '<span>👤 Chủ sở hữu: ' + escapeHtml(ownerName) + '</span>' +
                '<span>📅 Tạo: ' + createdText + '</span>' +
                '</div>' +
                '<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; font-size: 12px;">' +
                '<span style="color: var(--color-muted);">Đổi trạng thái (Owner/Admin):</span>' +
                '<select onchange="handleQuickStatusChange(' + p.id + ', this.value)" style="width: 145px; padding: 4px 8px; font-size: 12px;" ' + (canEditStatus ? "" : "disabled") + '>' +
                '<option value="PLANNING"' + (effectiveStatus === "PLANNING" ? " selected" : "") + '>Lên kế hoạch</option>' +
                '<option value="ACTIVE"' + (effectiveStatus === "ACTIVE" ? " selected" : "") + '>Đang làm</option>' +
                '<option value="COMPLETED"' + (effectiveStatus === "COMPLETED" ? " selected" : "") + '>Đã hoàn thành</option>' +
                '</select>' +
                '</div>' +
                '<div class="progress-wrap">' +
                '<div class="progress-info">' +
                '<span>Tiến độ hoàn thành</span>' +
                '<strong>' + percent + '% (' + (p.done_tasks || 0) + '/' + (p.total_tasks || 0) + ' việc)</strong>' +
                '</div>' +
                '<div class="progress-track">' +
                '<div class="progress-fill" style="width: ' + percent + '%;"></div>' +
                '</div>' +
                '</div>' +
                '<div class="project-card-actions">' +
                '<a href="tasks.html?project_id=' + p.id + '" class="btn btn-small btn-primary" style="flex: 1;">' +
                'Xem chi tiết' +
                '</a>' +
                '<a href="members.html?project_id=' + p.id + '" class="btn btn-small">' +
                'Thành viên' +
                '</a>' +
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

              // Nút « Trước
              buttonsHtml +=
                '<button type="button" class="pagination-btn" data-page="' + (meta.page - 1) + '" ' +
                (!meta.has_prev ? 'disabled title="Đang ở trang đầu"' : 'title="Trang trước"') +
                '>« Trước</button>';

              // Các nút số trang
              for (let i = 1; i <= meta.total_pages; i++) {
                // Nếu tổng số trang > 7, hiển thị thông minh các trang gần trang hiện tại
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

              // Nút Tiếp »
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

              // Cuộn nhẹ lên đầu lưới dự án
              if (grid) {
                grid.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }

// 9. Lắng nghe sự kiện tương tác

// 9.1. Tìm kiếm theo tên (name / search)
let searchDebounceTimer = null;
          if (searchInput) {
            searchInput.addEventListener("input", (e) => {
              clearTimeout(searchDebounceTimer);
              searchDebounceTimer = setTimeout(() => {
                queryState.search = e.target.value.trim();
                queryState.page = 1; // Tìm kiếm tự động về trang 1
                loadProjects();
              }, 250);
            });
          }

          // 9.2. Lọc Dự án của tôi (my=true)
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

          // 9.3. Lọc theo trạng thái
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

          // 9.4. Sắp xếp trường (sort_by)
          if (sortBySelect) {
            sortBySelect.addEventListener("change", (e) => {
              queryState.sort_by = e.target.value;
              queryState.page = 1;
              loadProjects();
            });
          }

          // 9.5. Sắp xếp thứ tự (sort_order)
          if (sortOrderSelect) {
            sortOrderSelect.addEventListener("change", (e) => {
              queryState.sort_order = e.target.value;
              queryState.page = 1;
              loadProjects();
            });
          }

          // 9.6. Kích thước trang (page_size)
          if (pageSizeSelect) {
            pageSizeSelect.addEventListener("change", (e) => {
              queryState.page_size = Number(e.target.value);
              queryState.page = 1;
              loadProjects();
            });
          }

          // 9.7. Click các nút trên thanh phân trang (Pagination Controls)
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

          // 10. Quản lý Popup Modal Tạo dự án mới
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

          // 11. Gửi form tạo dự án mới
          createForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = nameInput.value.trim();
            const desc = descInput.value.trim();
            const startDate = startDateInput.value || null;
            const deadline = endDateInput.value || null;
            let statusVal = statusInput.value.toLowerCase();
            if (statusVal === "active") statusVal = "in_progress";

            if (!name) {
              nameInput.classList.add("is-invalid");
              nameError.textContent = "Vui lòng nhập tên đề tài / dự án";
              nameError.classList.add("is-visible");
              nameInput.focus();
              return;
            }

            const token = typeof auth !== "undefined" && auth.getToken ? auth.getToken() : null;
            if (!token) {
              showToast("Vui lòng đăng nhập trước khi tạo dự án mới!", "error");
              setTimeout(() => {
                window.location.href = "login.html";
              }, 1200);
              return;
            }

            const btnSubmit = document.getElementById("btn-submit-project");
            if (btnSubmit) {
              btnSubmit.disabled = true;
              btnSubmit.textContent = "Đang tạo dự án...";
            }

            try {
              let createdFromApi = false;
              const payload = {
                name: name,
                description: desc || null,
                start_date: startDate ? `${startDate}T00:00:00` : null,
                deadline: deadline ? `${deadline}T23:59:59` : null,
                status: statusVal,
              };

              if (typeof api !== "undefined" && api.post) {
                try {
                  await api.post("/projects", payload);
                  createdFromApi = true;
                } catch (apiErr) {
                  if (apiErr.status && apiErr.status > 0) {
                    throw apiErr;
                  }
                  console.warn("Backend API không khả dụng, lưu dự án vào bộ nhớ demo.");
                }
              }

              if (!createdFromApi) {
                const nowIso = new Date().toISOString();
                const currentUser = typeof auth !== "undefined" && auth.getUser ? auth.getUser() : null;
                const newProject = {
                  id: Date.now(),
                  name,
                  description: desc,
                  start_date: startDate || nowIso.slice(0, 10),
                  deadline: deadline || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                  end_date: deadline,
                  created_at: nowIso,
                  updated_at: nowIso,
                  status: statusVal,
                  owner_id: currentUser ? currentUser.id || 1 : 1,
                  owner: currentUser || { id: 1, full_name: "Nguyễn Văn Đức", email: "truongnhom@ptit.edu.vn" },
                  total_tasks: 0,
                  done_tasks: 0,
                  members: 1,
                };
                localProjects.unshift(newProject);
              }

              closeModal();
              showToast("Tạo dự án mới thành công!", "success");

              // Về trang 1 và tải lại danh sách dự án
              queryState.page = 1;
              await loadProjects();
            } catch (err) {
              showToast(err.message || "Tạo dự án thất bại", "error");
            } finally {
              if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Tạo dự án";
              }
            }
          });

          // 12. Khởi chạy tải dữ liệu ban đầu
          loadProjects();
