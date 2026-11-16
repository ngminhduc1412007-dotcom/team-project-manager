const kanbanTasks = [
  { id: "task-1", title: "Hoàn thiện giao diện đăng nhập", project: "Student Project Hub", priority: "Cao", assignee: "Minh", status: "todo" },
  { id: "task-2", title: "Thiết kế cơ sở dữ liệu", project: "Student Project Hub", priority: "Vừa", assignee: "Lan", status: "todo" },
  { id: "task-3", title: "Viết tài liệu đặc tả API", project: "Quản lý nhóm", priority: "Vừa", assignee: "Huy", status: "doing" },
  { id: "task-4", title: "Tạo trang danh sách dự án", project: "Student Project Hub", priority: "Thấp", assignee: "An", status: "doing" },
  { id: "task-5", title: "Khởi tạo cấu trúc frontend", project: "Student Project Hub", priority: "Thấp", assignee: "Minh", status: "done" },
  { id: "task-6", title: "Phân tích yêu cầu người dùng", project: "Quản lý nhóm", priority: "Cao", assignee: "Lan", status: "done" }
];

const kanbanBoard = document.getElementById("kanban-board");
const kanbanStatus = document.getElementById("kanban-status");
const kanbanTaskCount = document.getElementById("kanban-task-count");
const kanbanStatusLabels = {
  todo: "Cần làm",
  doing: "Đang làm",
  done: "Hoàn thành"
};
const kanbanPriorityClasses = {
  Cao: "high",
  Vừa: "medium",
  Thấp: "low"
};

function createKanbanCard(task) {
  const card = document.createElement("article");
  card.className = "kanban-card";
  card.draggable = true;
  card.dataset.taskId = task.id;
  card.setAttribute("aria-label", `${task.title}. Ưu tiên ${task.priority}. Kéo để chuyển cột.`);

  const project = document.createElement("p");
  project.className = "kanban-card-project";
  project.textContent = task.project;

  const title = document.createElement("h4");
  title.textContent = task.title;

  const footer = document.createElement("div");
  footer.className = "kanban-card-footer";

  const priority = document.createElement("span");
  priority.className = `kanban-priority kanban-priority-${kanbanPriorityClasses[task.priority]}`;
  priority.textContent = `Ưu tiên ${task.priority.toLowerCase()}`;

  const assignee = document.createElement("span");
  assignee.className = "kanban-assignee";
  assignee.textContent = task.assignee;
  assignee.setAttribute("aria-label", `Người phụ trách: ${task.assignee}`);

  footer.append(priority, assignee);
  card.append(project, title, footer);
  return card;
}

function renderKanban() {
  kanbanBoard.querySelectorAll("[data-dropzone]").forEach((dropzone) => {
    const status = dropzone.dataset.dropzone;
    const tasks = kanbanTasks.filter((task) => task.status === status);
    dropzone.replaceChildren(...tasks.map(createKanbanCard));
    dropzone.querySelectorAll(".kanban-empty").forEach((emptyMessage) => emptyMessage.remove());
    if (tasks.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "kanban-empty";
      emptyMessage.textContent = "Thả thẻ vào đây";
      dropzone.append(emptyMessage);
    }
    kanbanBoard.querySelector(`[data-count-for="${status}"]`).textContent = String(tasks.length);
  });

  kanbanTaskCount.textContent = `${kanbanTasks.length} công việc`;
}

kanbanBoard.addEventListener("dragstart", (event) => {
  const card = event.target.closest(".kanban-card");
  if (!card || !event.dataTransfer) return;

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", card.dataset.taskId);
  card.classList.add("is-dragging");
});

kanbanBoard.addEventListener("dragend", (event) => {
  const card = event.target.closest(".kanban-card");
  if (card) card.classList.remove("is-dragging");
  kanbanBoard.querySelectorAll(".is-drop-target").forEach((column) => column.classList.remove("is-drop-target"));
});

kanbanBoard.addEventListener("dragover", (event) => {
  const dropzone = event.target.closest("[data-dropzone]");
  if (!dropzone) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  dropzone.closest(".kanban-column").classList.add("is-drop-target");
});

kanbanBoard.addEventListener("dragleave", (event) => {
  const column = event.target.closest(".kanban-column");
  if (column && !column.contains(event.relatedTarget)) column.classList.remove("is-drop-target");
});

kanbanBoard.addEventListener("drop", (event) => {
  const dropzone = event.target.closest("[data-dropzone]");
  if (!dropzone) return;

  event.preventDefault();
  const taskId = event.dataTransfer.getData("text/plain");
  const task = kanbanTasks.find((item) => item.id === taskId);
  const nextStatus = dropzone.dataset.dropzone;
  if (!task || !kanbanStatusLabels[nextStatus] || task.status === nextStatus) return;

  task.status = nextStatus;
  kanbanStatus.textContent = `Đã chuyển "${task.title}" sang cột ${kanbanStatusLabels[nextStatus]}.`;
  renderKanban();
});

renderKanban();
