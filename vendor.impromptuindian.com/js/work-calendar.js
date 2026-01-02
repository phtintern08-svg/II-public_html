lucide.createIcons();

let currentDate = new Date();
const events = [
    { date: new Date(2024, 10, 24), type: 'new', title: 'ORD-012 Assigned' },
    { date: new Date(2024, 10, 25), type: 'production', title: 'ORD-005 Printing' },
    { date: new Date(2024, 10, 26), type: 'deadline', title: 'ORD-003 Due' },
    { date: new Date(2024, 10, 28), type: 'deadline', title: 'ORD-008 Due' },
    { date: new Date(2024, 10, 30), type: 'production', title: 'ORD-001 Quality Check' }
];

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    document.getElementById('calendar-month').textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const grid = document.getElementById('calendar-grid');
    let html = '<div class="calendar-header">';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        html += `<div class="calendar-day-name">${day}</div>`;
    });
    html += '</div><div class="calendar-days">';

    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-cell empty"></div>';
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const dayEvents = events.filter(e => e.date.toDateString() === date.toDateString());

        html += `<div class="calendar-cell ${isToday ? 'today' : ''}">
            <div class="cell-date">${day}</div>
            <div class="cell-events">
                ${dayEvents.map(e => `<div class="event-dot ${e.type}" title="${e.title}"></div>`).join('')}
            </div>
        </div>`;
    }

    html += '</div>';
    grid.innerHTML = html;
}

function renderTasks() {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingEvents = events.filter(e => e.date >= today && e.date <= nextWeek).sort((a, b) => a.date - b.date);

    const list = document.getElementById('tasks-list');
    if (upcomingEvents.length === 0) {
        list.innerHTML = '<div class="empty-state"><p class="text-gray-400">No upcoming tasks</p></div>';
        return;
    }

    list.innerHTML = upcomingEvents.map(e => {
        const daysUntil = Math.ceil((e.date - today) / (1000 * 60 * 60 * 24));
        return `
            <div class="task-item ${e.type}">
                <div class="task-icon"><i data-lucide="${e.type === 'deadline' ? 'clock' : e.type === 'new' ? 'plus-circle' : 'settings'}" class="w-5 h-5"></i></div>
                <div class="task-content">
                    <h4 class="task-title">${e.title}</h4>
                    <p class="task-date">${e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}</p>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    renderTasks();
    setTimeout(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('show')), 100);
});
