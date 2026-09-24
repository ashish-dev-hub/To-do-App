const STORAGE_KEY = "taskflow_tasks_v2";

const defaultSampleTasks = [
  { id: 1, text: "Explore search and filter features", completed: true, createdAt: Date.now() - 3600000 },
  { id: 2, text: "Try editing this task by clicking the edit icon", completed: false, createdAt: Date.now() - 1800000 },
  { id: 3, text: "Add your high-priority goals for the week", completed: false, createdAt: Date.now() }
];

let tasks = loadTasks();
let currentFilter = "all";
let searchQuery = "";
let editingTaskId = null;

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const noResultsState = document.getElementById("no-results-state");

const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search-btn");
const filterTabs = document.querySelectorAll(".filter-tab");

const countAllEl = document.getElementById("count-all");
const countActiveEl = document.getElementById("count-active");
const countCompletedEl = document.getElementById("count-completed");

const progressBar = document.getElementById("progress-bar");
const progressPercent = document.getElementById("progress-percent");
const taskCounter = document.getElementById("task-counter");
const activeTasksSummary = document.getElementById("active-tasks-summary");
const clearCompletedBtn = document.getElementById("clear-completed-btn");

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load tasks:", e);
  }
  return defaultSampleTasks;
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save tasks:", e);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function addTask(text) {
  const newTask = {
    id: Date.now(),
    text: text.trim(),
    completed: false,
    createdAt: Date.now()
  };

  tasks.unshift(newTask);
  saveTasks();
  renderApp();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderApp();
  }
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  if (editingTaskId === id) {
    editingTaskId = null;
  }
  saveTasks();
  renderApp();
}

function startEditing(id) {
  editingTaskId = id;
  renderApp();

  const editInput = document.querySelector(`.task-item[data-id="${id}"] .edit-input`);
  if (editInput) {
    editInput.focus();
    editInput.select();
  }
}

function saveEdit(id, newText) {
  const trimmed = newText.trim();
  if (trimmed === "") {
    cancelEdit();
    return;
  }

  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.text = trimmed;
    saveTasks();
  }
  editingTaskId = null;
  renderApp();
}

function cancelEdit() {
  editingTaskId = null;
  renderApp();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  renderApp();
}

function getFilteredTasks() {
  return tasks.filter((task) => {
    if (currentFilter === "active" && task.completed) return false;
    if (currentFilter === "completed" && !task.completed) return false;

    if (searchQuery) {
      return task.text.toLowerCase().includes(searchQuery);
    }

    return true;
  });
}

function updateCountersAndStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;

  if (countAllEl) countAllEl.textContent = total;
  if (countActiveEl) countActiveEl.textContent = active;
  if (countCompletedEl) countCompletedEl.textContent = completed;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
    progressBar.classList.toggle("is-empty", percentage === 0);
  }
  if (progressPercent) progressPercent.textContent = `${percentage}%`;
  if (taskCounter) taskCounter.textContent = `${completed} of ${total} completed`;

  if (activeTasksSummary) {
    if (active === 0 && total > 0) {
      activeTasksSummary.textContent = "All tasks completed";
    } else {
      activeTasksSummary.textContent = `${active} task${active === 1 ? "" : "s"} remaining`;
    }
  }

  if (clearCompletedBtn) {
    clearCompletedBtn.disabled = completed === 0;
  }
}

function renderApp() {
  updateCountersAndStats();

  const filteredTasks = getFilteredTasks();
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.style.display = "none";
    emptyState.style.display = "block";
    noResultsState.style.display = "none";
    return;
  }

  if (filteredTasks.length === 0) {
    taskList.style.display = "none";
    emptyState.style.display = "none";
    noResultsState.style.display = "block";
    return;
  }

  taskList.style.display = "flex";
  emptyState.style.display = "none";
  noResultsState.style.display = "none";

  filteredTasks.forEach((task) => {
    const isEditing = task.id === editingTaskId;
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""} ${isEditing ? "is-editing" : ""}`;
    li.dataset.id = task.id;

    if (isEditing) {
      li.innerHTML = `
        <form class="edit-form" data-id="${task.id}">
          <input 
            type="text" 
            class="edit-input" 
            value="${escapeHtml(task.text)}" 
            maxlength="140"
            required
            aria-label="Edit task title"
          />
          <div class="task-actions">
            <button type="submit" class="action-btn save-btn" title="Save" aria-label="Save task">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            <button type="button" class="action-btn cancel-btn" title="Cancel" aria-label="Cancel editing">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
      `;
    } else {
      li.innerHTML = `
        <div class="task-content">
          <label class="custom-checkbox-wrapper" title="${task.completed ? "Mark as active" : "Mark as completed"}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} aria-label="Toggle task status" />
            <span class="checkbox-custom">
              <svg viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1.5 5 4.5 8 10.5 1.5"></polyline>
              </svg>
            </span>
          </label>
          <span class="task-text">${escapeHtml(task.text)}</span>
        </div>
        <div class="task-actions">
          <button type="button" class="action-btn edit-btn" title="Edit task" aria-label="Edit task">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button type="button" class="action-btn delete-btn" title="Delete task" aria-label="Delete task">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      `;
    }

    taskList.appendChild(li);
  });
}

taskForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (text !== "") {
    addTask(text);
    taskInput.value = "";
    taskInput.focus();
  }
});

searchInput.addEventListener("input", function (e) {
  searchQuery = e.target.value.toLowerCase().trim();
  clearSearchBtn.style.display = e.target.value.length > 0 ? "block" : "none";
  renderApp();
});

clearSearchBtn.addEventListener("click", function () {
  searchInput.value = "";
  searchQuery = "";
  clearSearchBtn.style.display = "none";
  searchInput.focus();
  renderApp();
});

searchInput.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.style.display = "none";
    renderApp();
  }
});

filterTabs.forEach((tab) => {
  tab.addEventListener("click", function () {
    const filter = this.dataset.filter;
    if (filter === currentFilter) return;

    filterTabs.forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });

    this.classList.add("active");
    this.setAttribute("aria-selected", "true");
    currentFilter = filter;
    renderApp();
  });
});

clearCompletedBtn.addEventListener("click", function () {
  clearCompleted();
});

taskList.addEventListener("click", function (e) {
  const taskItem = e.target.closest(".task-item");
  if (!taskItem) return;

  const taskId = Number(taskItem.dataset.id);

  if (e.target.closest(".delete-btn")) {
    deleteTask(taskId);
    return;
  }

  if (e.target.closest(".edit-btn")) {
    startEditing(taskId);
    return;
  }

  if (e.target.closest(".cancel-btn")) {
    cancelEdit();
    return;
  }

  if (e.target.classList.contains("task-checkbox") || e.target.closest(".custom-checkbox-wrapper")) {
    toggleTask(taskId);
    return;
  }

  if (e.target.classList.contains("task-text")) {
    toggleTask(taskId);
    return;
  }
});

taskList.addEventListener("dblclick", function (e) {
  if (e.target.classList.contains("task-text")) {
    const taskItem = e.target.closest(".task-item");
    if (taskItem) {
      const taskId = Number(taskItem.dataset.id);
      startEditing(taskId);
    }
  }
});

taskList.addEventListener("submit", function (e) {
  if (e.target.classList.contains("edit-form")) {
    e.preventDefault();
    const taskId = Number(e.target.dataset.id);
    const input = e.target.querySelector(".edit-input");
    if (input) {
      saveEdit(taskId, input.value);
    }
  }
});

taskList.addEventListener("keydown", function (e) {
  if (e.target.classList.contains("edit-input")) {
    if (e.key === "Escape") {
      cancelEdit();
    }
  }
});

renderApp();