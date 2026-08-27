// DOM Elements
const form = document.getElementById('add-habit-form');
const input = document.getElementById('habit-input');
const list = document.getElementById('habit-list');
const currentDateEl = document.getElementById('current-date');
const chartContainer = document.getElementById('weekly-chart');

// State
let habits = JSON.parse(localStorage.getItem('habits')) || [];
// Completions structure: { "YYYY-MM-DD": [habitId1, habitId2, ...] }
let completions = JSON.parse(localStorage.getItem('completions')) || {};

// Helper: Get Today's Date Key (YYYY-MM-DD)
function getTodayKey() {
    const today = new Date();
    return formatDateKey(today);
}

// Helper: Format Date Key
function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Helper: Format Display Date
function getDisplayDate() {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
}

// Save to LocalStorage
function save() {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('completions', JSON.stringify(completions));
    render();
}

// Add Habit
function addHabit(text) {
    const newHabit = {
        id: Date.now().toString(),
        text,
        createdAt: getTodayKey()
    };
    habits.push(newHabit);
    save();
}

// Delete Habit
function deleteHabit(id) {
    habits = habits.filter(h => h.id !== id);
    // Cleanup completions? Maybe keep for history, but for now let's keep it simple.
    // If we delete the habit, we can't display it anymore, but historical data remains in 'completions' map.
    // Clean up current day for consistency if needed, but keeping it is fine.
    save();
}

// Toggle Completion
function toggleHabit(id) {
    const today = getTodayKey();
    if (!completions[today]) {
        completions[today] = [];
    }

    const index = completions[today].indexOf(id);
    if (index > -1) {
        // Remove
        completions[today].splice(index, 1);
    } else {
        // Add
        completions[today].push(id);
    }
    save();
}

// Render Habits
function renderHabits() {
    list.innerHTML = '';
    const today = getTodayKey();
    const todayCompletions = completions[today] || [];

    if (habits.length === 0) {
        list.innerHTML = '<li class="empty-state">No habits yet. Add one above!</li>';
        return;
    }

    habits.forEach(habit => {
        const isCompleted = todayCompletions.includes(habit.id);
        const li = document.createElement('li');
        li.className = `habit-item ${isCompleted ? 'completed' : ''}`;

        li.innerHTML = `
            <div class="habit-checkbox ${isCompleted ? 'checked' : ''}" onclick="toggleHabit('${habit.id}')"></div>
            <span class="habit-text">${habit.text}</span>
            <button class="delete-btn" onclick="deleteHabit('${habit.id}')" aria-label="Delete habit">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;
        list.appendChild(li);
    });
}

// Render Weekly Progress
function renderProgress() {
    chartContainer.innerHTML = '';

    // Get last 7 days including today
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
    }

    const totalHabits = habits.length;

    days.forEach(day => {
        const dateKey = formatDateKey(day);
        const dayCompletions = completions[dateKey] || [];
        // Filter out completions for deleted habits if we want strict accuracy, 
        // but for now simple count is fine. 
        // Actually, better to count only active habits that were completed.
        const activeCompletedCount = dayCompletions.filter(id => habits.find(h => h.id === id)).length;

        // Calculate percentage. Avoid division by zero.
        const percentage = totalHabits > 0 ? (activeCompletedCount / totalHabits) * 100 : 0;

        const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., Mon
        const dateLabel = day.getDate(); // e.g., 15

        const col = document.createElement('div');
        col.className = 'day-column';
        col.innerHTML = `
            <div class="bar-container" title="${activeCompletedCount}/${totalHabits} completed">
                <div class="bar-fill" style="height: ${percentage}%"></div>
            </div>
            <span class="day-label">${dayLabel}</span>
            <span class="date-label">${dateLabel}</span>
        `;
        chartContainer.appendChild(col);
    });
}

// Render Init
function render() {
    currentDateEl.textContent = getDisplayDate();
    renderHabits();
    renderProgress();
}

// Event Listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addHabit(text);
        input.value = '';
    }
});

// Initial Render
render();
