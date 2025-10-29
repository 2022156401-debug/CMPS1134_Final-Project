/*
	To-do widget (site-wide)
	- Adds a floating To-Do button on pages that don't already include the to-do markup
	- If a page contains #taskList and #taskInput, the script will use those elements (backwards compatible)
	- Tasks are stored in localStorage under 'tasks' and synced across tabs via the storage event
*/

const STORAGE_KEY = 'tasks';

let tasks = [];

// Public function kept for compatibility with pages that use onclick="addTask()"
function addTask() {
	// prefer any visible input with id taskInput, else modal input
	const input = document.getElementById('taskInput') || document.getElementById('todoInput');
	if (!input) return;
	const text = input.value.trim();
	if (!text) { alert('Please enter a task!'); return; }

	const newTask = { id: Date.now().toString() + Math.random().toString(36).slice(2), text, completed: false };
	tasks.push(newTask);
	saveTasks();
	renderTasks();
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

function saveTasks() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasksFromStorage() {
	tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function renderTasks() {
	// find the list either on-page or in the injected modal
	const list = document.getElementById('taskList') || document.getElementById('todoTaskList');
	if (!list) return;
	list.innerHTML = '';
	tasks.forEach(t => list.appendChild(createTaskElement(t)));
	updateBadge();
}

// Storage event to sync across tabs
window.addEventListener('storage', function (e) {
	if (e.key === STORAGE_KEY) {
		loadTasksFromStorage();
		renderTasks();
	}
});

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
		document.getElementById('todoCloseBtn').addEventListener('click', () => { modal.classList.remove('open'); btn.focus(); });
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
					modal.classList.add('open');
					const input = document.getElementById('todoInput');
					if (input) input.focus();
				});
			});
		}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
	const usedInline = initInlineIfPresent();
	if (!usedInline) {
		createTodoWidget();
		loadTasksFromStorage();
		renderTasks();
		// wire navigation links to open modal on other pages
		wireNavTodoLinks();
	}
});

