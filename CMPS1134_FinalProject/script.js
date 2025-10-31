// Todo list functionality with local storage
const STORAGE_KEY = 'tasks';
let tasks = [];

// Load tasks when page loads
function loadTasksFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        tasks = JSON.parse(saved);
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Public function kept for compatibility with pages that use onclick="addTask()"
function addTask() {
	// Choose whichever input is currently in the DOM and visible
	const input = document.getElementById('taskInput') || document.getElementById('todoInput');
	if (!input) return;
	const text = input.value.trim();
	if (!text) {
		// Do not alert on empty Enter from modal; just ignore
		return;
	}

	// Ensure tasks array is initialized from storage if needed
	if (!Array.isArray(tasks) || tasks.length === 0) {
		// lazy-load without overwriting existing tasks in memory
		try { loadTasksFromStorage(); } catch (_) {}
	}

	const newTask = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), text, completed: false };
	tasks.push(newTask);
	saveTasks();
	renderTasks();
	updateStats();
	input.value = '';
}

function createTaskElement(task) {
	const li = document.createElement('li');
	li.dataset.id = task.id;

	const span = document.createElement('span');
	span.textContent = task.text;
	li.appendChild(span);

	if (task.completed) li.classList.add('completed');

		// Toggle completed on click of the text
		li.addEventListener('click', function (e) {
			// ignore clicks on delete button
			if (e.target.classList && e.target.classList.contains('delete-btn')) return;
			task.completed = !task.completed;
			if (task.completed) task.completedAt = Date.now(); else delete task.completedAt;
			saveTasks();
			renderTasks();
		});

	// Delete button
	const deleteBtn = document.createElement('button');
	deleteBtn.textContent = 'X';
	deleteBtn.classList.add('delete-btn');
	deleteBtn.addEventListener('click', function (event) {
		event.stopPropagation();
		tasks = tasks.filter(t => t.id !== task.id);
		saveTasks();
		renderTasks();
	});

	li.appendChild(deleteBtn);
	return li;
}

// deduped: single source of truth for save/load exists above

function updateStats() {
	if (document.getElementById('totalTasks')) {
		document.getElementById('totalTasks').textContent = tasks.length;
		document.getElementById('completedToday').textContent = countCompletedToday();
		document.getElementById('pendingTasks').textContent = tasks.filter(t => !t.completed).length;
	}
}

function renderCalendar() {
	const calendar = document.getElementById('calendarGrid');
	if (!calendar) return;

	calendar.innerHTML = '';
	
	// Add day headers
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	days.forEach(day => {
		const dayHeader = document.createElement('div');
		dayHeader.className = 'calendar-header';
		dayHeader.textContent = day;
		calendar.appendChild(dayHeader);
	});

	// Get current month days
	const now = new Date();
	const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	
	// Add padding for first day
	for (let i = 0; i < firstDay.getDay(); i++) {
		calendar.appendChild(document.createElement('div'));
	}

	// Add days with task counts
	for (let date = 1; date <= lastDay.getDate(); date++) {
		const dayDiv = document.createElement('div');
		dayDiv.className = 'calendar-day';
		dayDiv.textContent = date;

		// Count tasks for this day
		const dayDate = new Date(now.getFullYear(), now.getMonth(), date);
		const taskCount = tasks.filter(t => {
			if (!t.completedAt) return false;
			const taskDate = new Date(t.completedAt);
			return taskDate.getDate() === dayDate.getDate() &&
				   taskDate.getMonth() === dayDate.getMonth() &&
				   taskDate.getFullYear() === dayDate.getFullYear();
		}).length;

		if (taskCount > 0) {
			dayDiv.classList.add('has-tasks');
			dayDiv.setAttribute('data-tasks', taskCount);
		}

		if (date === now.getDate()) {
			dayDiv.style.backgroundColor = '#e6f3ff';
		}

		// clicking a day toggles a calendar filter for that day (filters to tasks completed on that day)
		dayDiv.addEventListener('click', () => {
			// ignore empty padded cells
			if (!dayDiv.textContent) return;
			const selected = new Date(now.getFullYear(), now.getMonth(), date);
			setCalendarFilter(selected);
		});

		calendar.appendChild(dayDiv);
	}
}

function formatDateKey(d) {
	return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function setCalendarFilter(dateObj) {
	if (!dateObj) {
		calendarFilterDate = null;
	} else {
		const key = formatDateKey(dateObj);
		if (calendarFilterDate === key) {
			calendarFilterDate = null; // toggle off
		} else {
			calendarFilterDate = key;
		}
	}
	// update UI indicator
	const indicator = document.getElementById('calendarFilterIndicator');
	const clearBtn = document.getElementById('clearCalendarFilterBtn');
	if (calendarFilterDate) {
		if (indicator) indicator.textContent = 'Showing: ' + calendarFilterDate;
		if (clearBtn) clearBtn.style.display = 'inline-block';
	} else {
		if (indicator) indicator.textContent = '';
		if (clearBtn) clearBtn.style.display = 'none';
	}
	renderTasks();
}

function renderTasks() {
	// find the list either on-page or in the injected modal
	const list = document.getElementById('taskList') || document.getElementById('todoTaskList');
	if (!list) return;
	list.innerHTML = '';
	// If calendarFilterDate is set, show only tasks completed on that date (matches completedAt)
	const visible = calendarFilterDate ? tasks.filter(t => {
		if (!t.completedAt) return false;
		const d = new Date(t.completedAt);
		return formatDateKey(d) === calendarFilterDate;
	}) : tasks;

	visible.forEach(t => list.appendChild(createTaskElement(t)));
	updateBadge();
	updateNavCount();
	updateStats();
	renderCalendar();
}

// Storage event to sync across tabs
window.addEventListener('storage', function (e) {
	if (e.key === STORAGE_KEY) {
		loadTasksFromStorage();
		renderTasks();
	}
});

// count tasks completed today (local date)
function countCompletedToday() {
	const now = new Date();
	const todayY = now.getFullYear();
	const todayM = now.getMonth();
	const todayD = now.getDate();
	return tasks.reduce((acc, t) => {
		if (!t.completedAt) return acc;
		const d = new Date(t.completedAt);
		return (d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD) ? acc + 1 : acc;
	}, 0);
}

function updateNavCount() {
	// find nav link(s) to to_do_list.html and update/create a small counter
	document.querySelectorAll('a[href$="to_do_list.html"]').forEach(a => {
		let span = a.querySelector('.nav-todo-count');
		const count = countCompletedToday();
		if (count > 0) {
			if (!span) {
				span = document.createElement('span');
				span.className = 'nav-todo-count';
				a.appendChild(span);
			}
			span.textContent = ` ${count}✓`;
		} else {
			if (span) span.remove();
		}
	});
}

// update the floating button badge with the number of incomplete tasks
function updateBadge() {
	const btn = document.getElementById('todoToggleBtn');
	if (!btn) return;
	const badge = btn.querySelector('.todo-badge');
	const count = tasks.filter(t => !t.completed).length;
	if (count > 0) {
		if (badge) badge.textContent = count;
		else {
			const span = document.createElement('span');
			span.className = 'todo-badge';
			span.textContent = count;
			btn.appendChild(span);
		}
	} else {
		if (badge) badge.remove();
	}
}

// If page already has #taskList and #taskInput, use them (legacy to_do_list.html)
function initInlineIfPresent() {
	const inlineList = document.getElementById('taskList');
	if (!inlineList) return false;
	// ensure there is a global addTask function (we already have it)
	loadTasksFromStorage();
	renderTasks();
	return true;
}

// Create floating button + modal to-do UI
function createTodoWidget() {
	// Floating toggle button
	const btn = document.createElement('button');
	btn.id = 'todoToggleBtn';
	btn.title = 'Open To-Do';
	btn.innerHTML = 'To-Do';
	btn.className = 'todo-toggle';
	document.body.appendChild(btn);

	// Modal
	const modal = document.createElement('div');
	modal.id = 'todoModal';
	modal.className = 'todo-modal';
	modal.innerHTML = `
		<div class="todo-card">
			<div class="todo-header">
				<h3>📝 To-Do</h3>
				<button id="todoCloseBtn" class="todo-close">✕</button>
			</div>
			<div class="todo-body">
				<div class="input-section">
					<input id="todoInput" type="text" placeholder="Add a task...">
					<button id="todoAddBtn">Add</button>
				</div>
				<ul id="todoTaskList"></ul>
			</div>
		</div>
	`;
	document.body.appendChild(modal);

		// wire up events
		btn.addEventListener('click', () => {
			const open = modal.classList.toggle('open');
			if (open) document.getElementById('todoInput').focus();
			else btn.focus();
		});
		document.getElementById('todoCloseBtn').addEventListener('click', () => { modal.classList.remove('open'); modal.classList.remove('expanded'); btn.focus(); });
	document.getElementById('todoAddBtn').addEventListener('click', addTask);
	document.getElementById('todoInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
		updateBadge();
}

		// If there are navigation links that point to the standalone to_do_list page,
		// make them open the modal widget instead of navigating (when widget is available).
		function wireNavTodoLinks() {
			const modal = document.getElementById('todoModal');
			if (!modal) return;
			document.querySelectorAll('a[href$="to_do_list.html"]').forEach(a => {
				// ignore if link is on the actual to_do_list page
				if (location.pathname.endsWith('to_do_list.html')) return;
				a.addEventListener('click', (e) => {
					e.preventDefault();
					// open larger modal when invoked from navigation to give a fuller experience
					modal.classList.add('open');
					modal.classList.add('expanded');
					const input = document.getElementById('todoInput');
					if (input) input.focus();
				});
			});
		}

// Initialize for both standalone page and floating widget (path-based only)
window.addEventListener('DOMContentLoaded', () => {
	loadTasksFromStorage();
	if (location.pathname.endsWith('to_do_list.html')) {
		// Standalone To-Do page: render inline UI only
		renderTasks();
		updateStats();
		const taskInput = document.getElementById('taskInput');
		if (taskInput) {
			taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
		}
	} else {
		// Other pages (Home, Team, Videos, Docs): floating widget only
		createTodoWidget();
		wireNavTodoLinks();
	}
});

