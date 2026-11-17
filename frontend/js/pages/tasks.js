// Trang Quản lý Công việc (Tasks) - Đầy đủ CRUD: Danh sách, Tạo, Sửa, Xóa
(function () {
  'use strict';

  // 1. Kiểm tra đăng nhập (Bảo vệ trang)
  if (typeof auth !== 'undefined' && auth.requireAuth) {
    if (!auth.requireAuth('login.html')) {
      return;
    }
  }

  // 2. Mock Data Dự án & Công việc PTIT
  const DEFAULT_PROJECTS = [
    { id: 1, name: 'Hệ thống quản lý điểm sinh viên PTIT' },
    { id: 2, name: 'Ứng dụng điểm danh bằng nhận diện khuôn mặt AI' },
    { id: 3, name: 'Cổng thông tin tuyển sinh Học viện CNBCVT' },
    { id: 4, name: 'Website đăng ký đồ án tốt nghiệp trực tuyến' },
    { id: 5, name: 'Hệ sinh thái học tập số PTIT LMS 2.0' },
    { id: 6, name: 'Ứng dụng trợ lý ảo chatbot tư vấn tuyển sinh PTIT' }
  ];

  const INITIAL_TASKS = [
    {
      id: 101,
      title: 'Thiết kế Entity Relationship Diagram (ERD) cho CSDL',
      description: 'Phân tích thực thể users, projects, tasks, project_members và vẽ quan hệ 1-N, N-N chuẩn hóa 3NF.',
      project_id: 1,
      project_name: 'Hệ thống quản lý điểm sinh viên PTIT',
      assignee: 'Nguyễn Văn A',
      priority: 'urgent',
      status: 'done',
      due_date: '2026-11-20',
      created_at: '2026-11-10T08:00:00Z'
    },
    {
      id: 102,
      title: 'Dựng API xác thực JWT đăng nhập, đăng ký và làm mới token',
      description: 'Cài đặt FastAPI security OAuth2, băm mật khẩu bcrypt và sinh Bearer token có hạn sử dụng 24h.',
      project_id: 1,
      project_name: 'Hệ thống quản lý điểm sinh viên PTIT',
      assignee: 'Trần Văn B',
      priority: 'high',
      status: 'done',
      due_date: '2026-11-22',
      created_at: '2026-11-11T09:30:00Z'
    },
    {
      id: 103,
      title: 'Xây dựng giao diện Form đăng ký và đăng nhập Responsive',
      description: 'Thiết kế form tương thích cả Desktop và Mobile, validate định dạng email @ptit.edu.vn và mật khẩu.',
      project_id: 1,
      project_name: 'Hệ thống quản lý điểm sinh viên PTIT',
      assignee: 'Lưu Đức H',
      priority: 'medium',
      status: 'in_progress',
      due_date: '2026-11-25',
      created_at: '2026-11-12T10:00:00Z'
    },
    {
      id: 104,
      title: 'Lập trình phân trang danh sách đồ án và bộ lọc trạng thái',
      description: 'Hỗ trợ tham số page, page_size, sort_by, sort_order và lọc dự án theo người đăng nhập (my=true).',
      project_id: 1,
      project_name: 'Hệ thống quản lý điểm sinh viên PTIT',
      assignee: 'Lưu Đức H',
      priority: 'high',
      status: 'in_progress',
      due_date: '2026-11-26',
      created_at: '2026-11-13T14:15:00Z'
    },
    {
      id: 105,
      title: 'Viết kịch bản kiểm thử giao diện tài khoản (Desktop & Mobile)',
      description: 'Soạn 15 test cases kiểm thử validate, thông báo lỗi, chuyển hướng trang và ghi nhận nhật ký lỗi đã sửa.',
      project_id: 1,
      project_name: 'Hệ thống quản lý điểm sinh viên PTIT',
      assignee: 'Lưu Đức H',
      priority: 'medium',
      status: 'done',
      due_date: '2026-11-24',
      created_at: '2026-11-14T08:30:00Z'
    },
    {
      id: 106,
      title: 'Tích hợp thư viện nhận diện khuôn mặt OpenCV vào backend',
      description: 'Xử lý tiền xử lý ảnh webcam sinh viên và trích xuất đặc trưng khuôn mặt đối sánh dữ liệu phòng máy.',
      project_id: 2,
      project_name: 'Ứng dụng điểm danh bằng nhận diện khuôn mặt AI',
      assignee: 'Hoàng Minh K',
      priority: 'urgent',
      status: 'todo',
      due_date: '2026-12-05',
      created_at: '2026-11-15T11:00:00Z'
    },
    {
      id: 107,
      title: 'Tối ưu hóa truy vấn SQL và tạo chỉ mục (Index) trên MySQL',
      description: 'Đánh index trên owner_id, project_id, email để tăng tốc độ truy vấn danh sách lớn.',
      project_id: 1,
      project_name: 'Hệ thống quản lý điểm sinh viên PTIT',
      assignee: 'Nguyễn Văn A',
      priority: 'low',
      status: 'todo',
      due_date: '2026-11-30',
      created_at: '2026-11-15T13:45:00Z'
    },
    {
      id: 108,
      title: 'Xây dựng modal tạo, sửa, xóa công việc có xác nhận an toàn',
      description: 'Modal validate tiêu đề bắt buộc, chọn dự án, gán quyền và hiển thị toast thông báo.',
      project_id: 1,
      project_name: 'Hệ thống quản lý điểm sinh viên PTIT',
      assignee: 'Lưu Đức H',
      priority: 'high',
      status: 'done',
      due_date: '2026-11-27',
      created_at: '2026-11-16T09:00:00Z'
    }
  ];

  // Local storage cache key
  const TASKS_STORAGE_KEY = 'ptit_student_tasks_data';
  let localTasks = (function () {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TASKS.slice();
  })();

  function saveLocalTasks() {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(localTasks));
    } catch (e) {}
  }

  // 3. Quản lý trạng thái bộ lọc (Filter State)
  const urlParams = new URLSearchParams(window.location.search);
  const initialProjectId = urlParams.get('project_id') || '';

  const filterState = {
    search: '',
    status: '',
    priority: '',
    project_id: initialProjectId
  };

  // 4. DOM Elements
  const searchInput = document.getElementById('task-search-input');
  const projectFilterSelect = document.getElementById('filter-task-project');
  const priorityFilterSelect = document.getElementById('filter-task-priority');
  const statusFilterGroup = document.getElementById('task-status-filters');
  const tasksGrid = document.getElementById('tasks-grid');
  const emptyState = document.getElementById('tasks-empty-state');
  const emptyTitle = document.getElementById('tasks-empty-title');
  const visibleCountEl = document.getElementById('visible-task-count');

  // Modal Elements
  const taskModal = document.getElementById('task-modal');
  const modalTaskTitle = document.getElementById('modal-task-title');
  const btnOpenTaskModal = document.getElementById('btn-open-task-modal');
  const btnEmptyCreateTask = document.getElementById('btn-empty-create-task');
  const btnCloseTaskModal = document.getElementById('btn-close-task-modal');
  const btnCancelTaskModal = document.getElementById('btn-cancel-task-modal');
  const taskForm = document.getElementById('task-form');
  const taskEditIdInput = document.getElementById('task-edit-id');
  const taskTitleInput = document.getElementById('task-title-input');
  const taskDescInput = document.getElementById('task-desc-input');
  const taskProjectSelect = document.getElementById('task-project-select');
  const taskAssigneeInput = document.getElementById('task-assignee-input');
  const taskPrioritySelect = document.getElementById('task-priority-select');
  const taskStatusSelect = document.getElementById('task-status-select');
  const taskDueDateInput = document.getElementById('task-due-date-input');
  const taskTitleError = document.getElementById('task-title-error');
  const taskProjectError = document.getElementById('task-project-error');

  // Delete Modal Elements
  const deleteTaskModal = document.getElementById('delete-task-modal');
  const btnCloseDeleteTaskModal = document.getElementById('btn-close-delete-task-modal');
  const btnCancelDeleteTaskModal = document.getElementById('btn-cancel-delete-task-modal');
  const btnConfirmDeleteTaskAction = document.getElementById('btn-confirm-delete-task-action');
  const deleteTaskTitleDisplay = document.getElementById('delete-task-title-display');
  let pendingDeleteTaskId = null;
  let pendingDeleteTaskTitle = '';

  // 5. Khởi tạo danh sách dự án cho các Select
  let projectOptions = DEFAULT_PROJECTS.slice();

  async function loadProjectOptions() {
    try {
      if (typeof api !== 'undefined' && api.get) {
        const res = await api.get('/projects?page=1&page_size=50');
        const data = res.data && res.data.items ? res.data.items : (Array.isArray(res.data) ? res.data : []);
        if (data.length > 0) {
          projectOptions = data.map(p => ({ id: p.id, name: p.name }));
        }
      }
    } catch (e) {}

    // Populate dropdowns
    const filterOptionsHtml = '<option value="">Tất cả dự án (' + projectOptions.length + ')</option>' +
      projectOptions.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>').join('');
    if (projectFilterSelect) {
      projectFilterSelect.innerHTML = filterOptionsHtml;
      if (filterState.project_id) {
        projectFilterSelect.value = filterState.project_id;
      }
    }

    const formOptionsHtml = '<option value="">-- Chọn dự án --</option>' +
      projectOptions.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>').join('');
    if (taskProjectSelect) {
      taskProjectSelect.innerHTML = formOptionsHtml;
    }
  }

  // 6. Helpers hiển thị Badge
  function getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'done':
        return '<span class="badge badge-done">Hoàn thành</span>';
      case 'in_progress':
        return '<span class="badge badge-in_progress">Đang làm</span>';
      case 'cancelled':
        return '<span class="badge badge-cancelled">Đã hủy</span>';
      case 'todo':
      default:
        return '<span class="badge badge-todo">Cần làm</span>';
    }
  }

  function getPriorityBadge(priority) {
    const p = (priority || '').toLowerCase();
    switch (p) {
      case 'urgent':
        return '<span class="badge badge-priority-urgent">🔥 Khẩn cấp</span>';
      case 'high':
        return '<span class="badge badge-priority-high">⚡ Cao</span>';
      case 'low':
        return '<span class="badge badge-priority-low">Thấp</span>';
      case 'medium':
      default:
        return '<span class="badge badge-priority-medium">Trung bình</span>';
    }
  }

  // 7. Cập nhật số đếm thống kê trạng thái
  function updateStatusCounts(tasks) {
    const counts = {
      all: tasks.length,
      todo: 0,
      in_progress: 0,
      done: 0,
      cancelled: 0
    };

    tasks.forEach(t => {
      const s = (t.status || 'todo').toLowerCase();
      if (counts[s] !== undefined) {
        counts[s]++;
      }
    });

    const elAll = document.getElementById('count-all');
    const elTodo = document.getElementById('count-todo');
    const elInProg = document.getElementById('count-in_progress');
    const elDone = document.getElementById('count-done');
    const elCancel = document.getElementById('count-cancelled');

    if (elAll) elAll.textContent = counts.all;
    if (elTodo) elTodo.textContent = counts.todo;
    if (elInProg) elInProg.textContent = counts.in_progress;
    if (elDone) elDone.textContent = counts.done;
    if (elCancel) elCancel.textContent = counts.cancelled;
  }

  // 8. Render danh sách công việc
  function renderTasks() {
    let filtered = localTasks.slice();

    // Lọc theo tìm kiếm
    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      filtered = filtered.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assignee && t.assignee.toLowerCase().includes(q))
      );
    }

    // Lọc theo dự án
    if (filterState.project_id) {
      filtered = filtered.filter(t => String(t.project_id) === String(filterState.project_id));
    }

    // Lọc theo độ ưu tiên
    if (filterState.priority) {
      filtered = filtered.filter(t => t.priority === filterState.priority);
    }

    // Cập nhật số đếm theo bộ lọc dự án/độ ưu tiên
    updateStatusCounts(filtered);

    // Lọc theo trạng thái tab
    if (filterState.status) {
      filtered = filtered.filter(t => t.status === filterState.status);
    }

    if (visibleCountEl) {
      visibleCountEl.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      if (tasksGrid) tasksGrid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (emptyTitle) {
        emptyTitle.textContent = filterState.search || filterState.status || filterState.project_id
          ? 'Không tìm thấy công việc phù hợp'
          : 'Chưa có công việc nào';
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (tasksGrid) {
      tasksGrid.innerHTML = filtered.map(t => {
        const projectName = t.project_name || ('Dự án #' + t.project_id);
        const assigneeName = t.assignee || 'Chưa phân công';
        const dueDateText = t.due_date ? formatDate(t.due_date) : 'Chưa đặt hạn';

        return (
          '<article class="task-card">' +
            '<div>' +
              '<div class="task-card-header">' +
                '<h3 class="task-card-title">' + escapeHtml(t.title) + '</h3>' +
                getPriorityBadge(t.priority) +
              '</div>' +
              '<p class="task-card-desc">' + escapeHtml(t.description || 'Không có mô tả chi tiết.') + '</p>' +
              '<div style="margin-bottom: 8px;">' +
                getStatusBadge(t.status) +
                '<span style="font-size: 11px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px 6px; margin-left: 6px; color: #475569;">📁 ' + escapeHtml(projectName) + '</span>' +
              '</div>' +
              '<div class="task-card-meta">' +
                '<span>👤 <strong>' + escapeHtml(assigneeName) + '</strong></span>' +
                '<span>🎯 Hạn: <strong>' + dueDateText + '</strong></span>' +
              '</div>' +
            '</div>' +
            '<div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; border-top: 1px solid #f1f5f9; padding-top: 10px;">' +
              '<button type="button" class="btn btn-small btn-outline" onclick="window.openEditTaskModal(' + t.id + ')" title="Chỉnh sửa công việc">✏️ Sửa</button>' +
              '<button type="button" class="btn btn-small btn-danger" onclick="window.openDeleteTaskModal(' + t.id + ', \'' + escapeHtml(t.title).replace(/'/g, "\\'") + '\')" title="Xóa công việc này">🗑️ Xóa</button>' +
            '</div>' +
          '</article>'
        );
      }).join('');
    }
  }

  // 9. Modal Tạo / Chỉnh sửa Task
  function openCreateTaskModal() {
    if (taskEditIdInput) taskEditIdInput.value = '';
    if (modalTaskTitle) modalTaskTitle.textContent = 'Tạo công việc mới';
    const submitBtn = document.getElementById('btn-submit-task');
    if (submitBtn) submitBtn.textContent = 'Tạo công việc';

    taskForm.reset();
    if (filterState.project_id && taskProjectSelect) {
      taskProjectSelect.value = filterState.project_id;
    }
    clearTaskFormErrors();
    taskModal.classList.add('is-open');
    if (taskTitleInput) taskTitleInput.focus();
  }

  function openEditTaskModal(taskId) {
    const t = localTasks.find(item => item.id === taskId);
    if (!t) {
      showToast('Không tìm thấy thông tin công việc để chỉnh sửa.', 'error');
      return;
    }

    if (taskEditIdInput) taskEditIdInput.value = t.id;
    if (modalTaskTitle) modalTaskTitle.textContent = 'Chỉnh sửa công việc';
    const submitBtn = document.getElementById('btn-submit-task');
    if (submitBtn) submitBtn.textContent = 'Lưu thay đổi';

    taskTitleInput.value = t.title || '';
    taskDescInput.value = t.description || '';
    taskProjectSelect.value = t.project_id || '';
    taskAssigneeInput.value = t.assignee || '';
    taskPrioritySelect.value = t.priority || 'medium';
    taskStatusSelect.value = t.status || 'todo';
    taskDueDateInput.value = t.due_date ? t.due_date.substring(0, 10) : '';

    clearTaskFormErrors();
    taskModal.classList.add('is-open');
    if (taskTitleInput) taskTitleInput.focus();
  }

  function closeTaskModal() {
    taskModal.classList.remove('is-open');
    taskForm.reset();
    if (taskEditIdInput) taskEditIdInput.value = '';
    clearTaskFormErrors();
  }

  function clearTaskFormErrors() {
    if (taskTitleInput) taskTitleInput.classList.remove('is-invalid');
    if (taskTitleError) taskTitleError.classList.remove('is-visible');
    if (taskProjectSelect) taskProjectSelect.classList.remove('is-invalid');
    if (taskProjectError) taskProjectError.classList.remove('is-visible');
  }

  window.openCreateTaskModal = openCreateTaskModal;
  window.openEditTaskModal = openEditTaskModal;
  window.closeTaskModal = closeTaskModal;

  if (btnOpenTaskModal) btnOpenTaskModal.addEventListener('click', openCreateTaskModal);
  if (btnEmptyCreateTask) btnEmptyCreateTask.addEventListener('click', openCreateTaskModal);
  if (btnCloseTaskModal) btnCloseTaskModal.addEventListener('click', closeTaskModal);
  if (btnCancelTaskModal) btnCancelTaskModal.addEventListener('click', closeTaskModal);

  if (taskModal) {
    taskModal.addEventListener('click', e => {
      if (e.target === taskModal) closeTaskModal();
    });
  }

  if (taskTitleInput) {
    taskTitleInput.addEventListener('input', () => {
      taskTitleInput.classList.remove('is-invalid');
      if (taskTitleError) taskTitleError.classList.remove('is-visible');
    });
  }

  if (taskProjectSelect) {
    taskProjectSelect.addEventListener('change', () => {
      taskProjectSelect.classList.remove('is-invalid');
      if (taskProjectError) taskProjectError.classList.remove('is-visible');
    });
  }

  // 10. Xử lý Form Submit (Tạo / Sửa Task có Validate)
  taskForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearTaskFormErrors();

    const editId = taskEditIdInput.value ? Number(taskEditIdInput.value) : null;
    const title = taskTitleInput.value.trim();
    const desc = taskDescInput.value.trim();
    const projectId = taskProjectSelect.value ? Number(taskProjectSelect.value) : null;
    const assignee = taskAssigneeInput.value.trim();
    const priority = taskPrioritySelect.value || 'medium';
    const status = taskStatusSelect.value || 'todo';
    const dueDate = taskDueDateInput.value ? taskDueDateInput.value : null;

    let hasError = false;

    // Validate tiêu đề task
    if (!title || title.length < 3) {
      if (taskTitleInput) taskTitleInput.classList.add('is-invalid');
      if (taskTitleError) {
        taskTitleError.textContent = 'Tiêu đề công việc bắt buộc và phải có ít nhất 3 ký tự.';
        taskTitleError.classList.add('is-visible');
      }
      if (taskTitleInput) taskTitleInput.focus();
      hasError = true;
    }

    // Validate dự án
    if (!projectId) {
      if (taskProjectSelect) taskProjectSelect.classList.add('is-invalid');
      if (taskProjectError) {
        taskProjectError.textContent = 'Vui lòng chọn dự án cho công việc này.';
        taskProjectError.classList.add('is-visible');
      }
      if (!hasError && taskProjectSelect) taskProjectSelect.focus();
      hasError = true;
    }

    if (hasError) return;

    const selectedProj = projectOptions.find(p => p.id === projectId);
    const projectName = selectedProj ? selectedProj.name : ('Dự án #' + projectId);

    const payload = {
      title,
      description: desc || null,
      project_id: projectId,
      assignee: assignee || null,
      priority,
      status,
      due_date: dueDate
    };

    const submitBtn = document.getElementById('btn-submit-task');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = editId ? 'Đang lưu...' : 'Đang tạo...';
    }

    // Thử gửi API Backend
    try {
      if (editId) {
        if (typeof api !== 'undefined' && (api.patch || api.put)) {
          const method = api.patch ? api.patch : api.put;
          await method('/tasks/' + editId, payload);
          showToast('Cập nhật công việc thành công!', 'success');
        }
      } else {
        if (typeof api !== 'undefined' && api.post) {
          await api.post('/tasks', payload);
          showToast('Tạo công việc mới thành công!', 'success');
        }
      }
    } catch (err) {
      // Nếu API backend chưa sẵn sàng, tiếp tục lưu local fallback
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = editId ? 'Lưu thay đổi' : 'Tạo công việc';
      }
    }

    // Cập nhật Local Storage & UI
    if (editId) {
      const idx = localTasks.findIndex(t => t.id === editId);
      if (idx !== -1) {
        localTasks[idx] = {
          ...localTasks[idx],
          title,
          description: desc,
          project_id: projectId,
          project_name: projectName,
          assignee: assignee || 'Chưa phân công',
          priority,
          status,
          due_date: dueDate
        };
      }
      showToast('Cập nhật công việc thành công!', 'success');
    } else {
      const newTask = {
        id: Date.now(),
        title,
        description: desc,
        project_id: projectId,
        project_name: projectName,
        assignee: assignee || 'Chưa phân công',
        priority,
        status,
        due_date: dueDate,
        created_at: new Date().toISOString()
      };
      localTasks.unshift(newTask);
      showToast('Tạo công việc mới thành công!', 'success');
    }

    saveLocalTasks();
    closeTaskModal();
    renderTasks();
  });

  // 11. Modal Xác nhận xóa Task
  function openDeleteTaskModal(taskId, taskTitle) {
    pendingDeleteTaskId = taskId;
    pendingDeleteTaskTitle = taskTitle;
    if (deleteTaskTitleDisplay) {
      deleteTaskTitleDisplay.textContent = '"' + taskTitle + '"';
    }
    if (deleteTaskModal) {
      deleteTaskModal.classList.add('is-open');
    }
  }

  function closeDeleteTaskModal() {
    if (deleteTaskModal) {
      deleteTaskModal.classList.remove('is-open');
    }
    pendingDeleteTaskId = null;
    pendingDeleteTaskTitle = '';
  }

  window.openDeleteTaskModal = openDeleteTaskModal;
  window.closeDeleteTaskModal = closeDeleteTaskModal;

  if (btnCloseDeleteTaskModal) btnCloseDeleteTaskModal.addEventListener('click', closeDeleteTaskModal);
  if (btnCancelDeleteTaskModal) btnCancelDeleteTaskModal.addEventListener('click', closeDeleteTaskModal);
  if (deleteTaskModal) {
    deleteTaskModal.addEventListener('click', e => {
      if (e.target === deleteTaskModal) closeDeleteTaskModal();
    });
  }

  if (btnConfirmDeleteTaskAction) {
    btnConfirmDeleteTaskAction.addEventListener('click', async function () {
      if (!pendingDeleteTaskId) return;
      const targetId = pendingDeleteTaskId;
      const targetTitle = pendingDeleteTaskTitle;

      btnConfirmDeleteTaskAction.disabled = true;
      btnConfirmDeleteTaskAction.textContent = 'Đang xóa...';

      try {
        if (typeof api !== 'undefined' && api.delete) {
          await api.delete('/tasks/' + targetId);
        }
      } catch (err) {}

      localTasks = localTasks.filter(t => t.id !== targetId);
      saveLocalTasks();
      closeDeleteTaskModal();
      btnConfirmDeleteTaskAction.disabled = false;
      btnConfirmDeleteTaskAction.textContent = 'Xác nhận xóa';

      showToast('Đã xóa công việc "' + targetTitle + '" thành công!', 'success');
      renderTasks();
    });
  }

  // 12. Lắng nghe các sự kiện tìm kiếm & bộ lọc
  if (searchInput) {
    let debounceTimer = null;
    searchInput.addEventListener('input', e => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        filterState.search = e.target.value.trim();
        renderTasks();
      }, 250);
    });
  }

  if (projectFilterSelect) {
    projectFilterSelect.addEventListener('change', e => {
      filterState.project_id = e.target.value;
      renderTasks();
    });
  }

  if (priorityFilterSelect) {
    priorityFilterSelect.addEventListener('change', e => {
      filterState.priority = e.target.value;
      renderTasks();
    });
  }

  if (statusFilterGroup) {
    statusFilterGroup.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      statusFilterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      filterState.status = btn.dataset.status || '';
      renderTasks();
    });
  }

  // 13. Khởi tạo trang
  loadProjectOptions().then(() => {
    renderTasks();
  });
})();
