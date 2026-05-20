/* script.js - Focus App */

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let timerInterval = null;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;
let currentTask = null;

// DOM Elements
const timerMinutesEl = document.getElementById('timer-minutes');
const timerSecondsEl = document.getElementById('timer-seconds');
const btnStartEl = document.getElementById('btn-start');
const btnPauseEl = document.getElementById('btn-pause');
const btnResetEl = document.getElementById('btn-reset');
const timerStatusTextEl = document.getElementById('timer-status-text');

const newTaskInputEl = document.getElementById('new-task-input');
const btnAddTaskEl = document.getElementById('btn-add-task');
const taskListEl = document.getElementById('task-list');

const focusOverlayEl = document.getElementById('focus-overlay');
const currentTaskTextEl = document.getElementById('current-task-text');
const focusMinutesEl = document.getElementById('focus-minutes');
const focusSecondsEl = document.getElementById('focus-seconds');
const btnExitFocusEl = document.getElementById('btn-exit-focus');

// Initialize
function init() {
    renderTasks();
    updateTimerDisplay();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // Timer Events
    btnStartEl.addEventListener('click', startTimer);
    btnPauseEl.addEventListener('click', pauseTimer);
    btnResetEl.addEventListener('click', resetTimer);

    // Task Events
    btnAddTaskEl.addEventListener('click', addTask);
    newTaskInputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Focus Overlay Events
    btnExitFocusEl.addEventListener('click', exitFocusMode);
}

// Timer Functions
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    timerMinutesEl.textContent = formattedMinutes;
    timerSecondsEl.textContent = formattedSeconds;
    
    // Update focus overlay timer as well
    if (focusMinutesEl && focusSecondsEl) {
        focusMinutesEl.textContent = formattedMinutes;
        focusSecondsEl.textContent = formattedSeconds;
    }

    // Update document title
    document.title = `${formattedMinutes}:${formattedSeconds} - FocusNow`;
}

function startTimer() {
    if (isRunning) return;
    
    // If no task is selected or active, and there are tasks, pick the first one
    if (!currentTask && tasks.length > 0) {
        const activeTasks = tasks.filter(t => !t.completed);
        if (activeTasks.length > 0) {
            currentTask = activeTasks[0];
            enterFocusMode(currentTask.text);
        }
    } else if (!currentTask && tasks.length === 0) {
        // Allow timer without task
        timerStatusTextEl.textContent = "Tiempo de Enfoque";
    }

    isRunning = true;
    btnStartEl.disabled = true;
    btnPauseEl.disabled = false;
    
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            btnStartEl.disabled = false;
            btnPauseEl.disabled = true;
            timerStatusTextEl.textContent = "¡Tiempo completado!";
            alert("¡Buen trabajo! Has completado tu sesión de enfoque.");
            exitFocusMode();
            resetTimer();
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    clearInterval(timerInterval);
    isRunning = false;
    btnStartEl.disabled = false;
    btnPauseEl.disabled = true;
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = 25 * 60;
    updateTimerDisplay();
    btnStartEl.disabled = false;
    btnPauseEl.disabled = true;
    timerStatusTextEl.textContent = "Tiempo de Enfoque";
}

// Task Functions
function renderTasks() {
    taskListEl.innerHTML = '';
    
    if (tasks.length === 0) {
        taskListEl.innerHTML = `
            <li class="task-item empty-state">
                <span>No hay tareas aún. ¡Agrega una!</span>
            </li>
        `;
        return;
    }
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        
        li.innerHTML = `
            <span class="task-text">${task.text}</span>
            <div class="task-actions">
                <button class="btn-action btn-complete" title="Completar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button class="btn-action btn-delete" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
        
        // Toggle Complete
        li.querySelector('.btn-complete').addEventListener('click', () => toggleTask(task.id));
        
        // Delete Task
        li.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id));
        
        // Click text to focus
        li.querySelector('.task-text').addEventListener('click', () => {
            if (!task.completed) {
                currentTask = task;
                enterFocusMode(task.text);
                startTimer();
            }
        });
        
        taskListEl.appendChild(li);
    });
}

function addTask() {
    const text = newTaskInputEl.value.trim();
    if (text === '') return;
    
    const newTask = {
        id: Date.now().toString(),
        text: text,
        completed: false
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    newTaskInputEl.value = '';
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    
    if (currentTask && currentTask.id === id) {
        exitFocusMode();
        resetTimer();
    }
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Focus Mode Functions
function enterFocusMode(taskText) {
    currentTaskTextEl.textContent = taskText;
    focusOverlayEl.classList.add('active');
}

function exitFocusMode() {
    focusOverlayEl.classList.remove('active');
    currentTask = null;
}

// Run on load
init();
