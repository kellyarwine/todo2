// Todo Application JavaScript
class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todo2-tasks')) || [];
        this.taskIdCounter = parseInt(localStorage.getItem('todo2-counter')) || 1;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.taskCount = document.getElementById('taskCount');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.emptyState = document.getElementById('emptyState');
    }

    bindEvents() {
        // Add task events
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Clear completed tasks
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTasks());

        // Focus input on load
        this.taskInput.focus();
    }

    addTask() {
        const text = this.taskInput.value.trim();
        
        if (!text) {
            this.showInputError();
            return;
        }

        const task = {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.taskInput.value = '';
        this.saveData();
        this.render();
        
        // Add visual feedback
        this.showAddedFeedback();
    }

    showInputError() {
        this.taskInput.style.borderColor = '#dc3545';
        this.taskInput.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
        
        setTimeout(() => {
            this.taskInput.style.borderColor = '';
            this.taskInput.style.boxShadow = '';
        }, 1000);
        
        this.taskInput.focus();
    }

    showAddedFeedback() {
        const lastItem = this.taskList.lastElementChild;
        if (lastItem) {
            lastItem.classList.add('adding');
            setTimeout(() => lastItem.classList.remove('adding'), 300);
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveData();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveData();
        this.render();
    }

    clearCompletedTasks() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) return;
        
        if (confirm(`Delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveData();
            this.render();
        }
    }

    saveData() {
        localStorage.setItem('todo2-tasks', JSON.stringify(this.tasks));
        localStorage.setItem('todo2-counter', this.taskIdCounter.toString());
    }

    render() {
        this.renderTasks();
        this.updateStats();
        this.updateEmptyState();
        this.updateClearButton();
    }

    renderTasks() {
        this.taskList.innerHTML = '';

        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.taskList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', task.id);

        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 role="button" 
                 tabindex="0" 
                 aria-label="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
            </div>
            <span class="task-text">${this.escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="delete-btn" 
                        aria-label="Delete task"
                        title="Delete task">
                    ×
                </button>
            </div>
        `;

        // Bind events
        const checkbox = li.querySelector('.task-checkbox');
        const deleteBtn = li.querySelector('.delete-btn');

        checkbox.addEventListener('click', () => this.toggleTask(task.id));
        checkbox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTask(task.id);
            }
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });

        return li;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        if (total === 0) {
            this.taskCount.textContent = '0 tasks';
        } else if (completed === total) {
            this.taskCount.textContent = `All ${total} task${total > 1 ? 's' : ''} completed!`;
        } else {
            this.taskCount.textContent = `${pending} of ${total} task${total > 1 ? 's' : ''}`;
        }
    }

    updateEmptyState() {
        if (this.tasks.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.taskList.style.display = 'none';
        } else {
            this.emptyState.classList.add('hidden');
            this.taskList.style.display = 'block';
        }
    }

    updateClearButton() {
        const hasCompleted = this.tasks.some(t => t.completed);
        this.clearCompleted.disabled = !hasCompleted;
        this.clearCompleted.style.display = hasCompleted ? 'block' : 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Utility functions for better mobile experience
function preventZoom() {
    // Prevent zoom on double tap for better mobile experience
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

function setupServiceWorker() {
    // Basic PWA functionality for better mobile experience
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Note: Service worker registration would go here for offline functionality
            console.log('Todo2 app ready for offline functionality (service worker ready)');
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the todo app
    window.todoApp = new TodoApp();
    
    // Setup mobile optimizations
    preventZoom();
    setupServiceWorker();
    
    // Add installation prompt for PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        deferredPrompt = e;
        console.log('Todo2 can be installed as a PWA');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to clear input
        if (e.key === 'Escape' && document.activeElement === window.todoApp.taskInput) {
            window.todoApp.taskInput.value = '';
            window.todoApp.taskInput.blur();
        }
        
        // Ctrl/Cmd + Enter to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            window.todoApp.taskInput.focus();
        }
    });
    
    console.log('Todo2 app initialized successfully!');
});