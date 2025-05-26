// 使用全局的 Firestore 实例
const calendarCollection = window.firestoreDb.collection('calendar_events');

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.events = {};
        this.initializeElements();
        this.setupEventListeners();
        this.loadEvents();
    }

    initializeElements() {
        this.calendarGrid = document.getElementById('calendarGrid');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        this.eventModal = document.getElementById('eventModal');
        this.eventForm = document.getElementById('eventForm');
        this.closeEventModal = document.getElementById('closeEventModal');
        this.eventsList = document.getElementById('eventsList');

        // 更新导航按钮文本
        this.prevMonthBtn.innerHTML = '&lsaquo;';
        this.nextMonthBtn.innerHTML = '&rsaquo;';
    }

    setupEventListeners() {
        this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        this.closeEventModal.addEventListener('click', () => this.closeModal());
        this.eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));

        // 添加键盘事件监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.eventModal.style.display === 'block') {
                this.closeModal();
            }
        });

        // 添加点击外部关闭模态框
        this.eventModal.addEventListener('click', (e) => {
            if (e.target === this.eventModal) {
                this.closeModal();
            }
        });
    }

    async loadEvents() {
        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            const snapshot = await calendarCollection
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .orderBy('date')
                .get();

            this.events = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                const dateStr = this.formatDate(data.date.toDate());
                this.events[dateStr] = {
                    id: doc.id,
                    ...data,
                    date: data.date.toDate()
                };
            });

            this.renderCalendar();
            this.renderEventsList();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.loadEvents();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay();
        const monthLength = lastDay.getDate();

        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        this.currentMonthElement.textContent = `${year}年 ${monthNames[month]}`;

        this.calendarGrid.innerHTML = '';

        const days = ['日', '一', '二', '三', '四', '五', '六'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            this.calendarGrid.appendChild(dayHeader);
        });

        // 添加上个月的剩余天数
        const prevMonthDays = startingDay;
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            emptyDay.textContent = prevMonthLastDay - i;
            this.calendarGrid.appendChild(emptyDay);
        }

        // 添加当月的天数
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentDate = today.getDate();

        for (let day = 1; day <= monthLength; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const dateStr = this.formatDate(new Date(year, month, day));
            
            if (year === currentYear && month === currentMonth && day === currentDate) {
                dayElement.classList.add('today');
            }

            if (this.events[dateStr]) {
                dayElement.classList.add('has-events');
                const tooltip = document.createElement('div');
                tooltip.className = 'event-tooltip';
                tooltip.textContent = this.events[dateStr].title;
                dayElement.appendChild(tooltip);
            }

            dayElement.addEventListener('click', () => this.openEventModal(dateStr));
            this.calendarGrid.appendChild(dayElement);
        }

        // 添加下个月的开始几天
        const remainingDays = 42 - (prevMonthDays + monthLength);
        for (let i = 1; i <= remainingDays; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            emptyDay.textContent = i;
            this.calendarGrid.appendChild(emptyDay);
        }
    }

    renderEventsList() {
        this.eventsList.innerHTML = '<h3>日程安排</h3>';
        const sortedEvents = Object.values(this.events)
            .sort((a, b) => a.date - b.date);

        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events-container';

        if (sortedEvents.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#666';
            emptyMessage.style.fontSize = '0.9rem';
            emptyMessage.style.padding = '1rem';
            emptyMessage.textContent = '本月暂无日程';
            eventsContainer.appendChild(emptyMessage);
        } else {
            sortedEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-item';
                eventElement.innerHTML = `
                    <h4>${event.date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</h4>
                    <p class="event-title">${event.title}</p>
                    ${event.description ? `<p class="event-desc">${event.description}</p>` : ''}
                    <button class="delete-event" title="删除日程">×</button>
                `;
                
                const deleteBtn = eventElement.querySelector('.delete-event');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这个日程吗？')) {
                        this.deleteEvent(event.id);
                    }
                });
                
                eventsContainer.appendChild(eventElement);
            });
        }

        this.eventsList.appendChild(eventsContainer);

        // 添加新日程按钮
        const addButton = document.createElement('button');
        addButton.className = 'add-event-btn';
        addButton.innerHTML = '<span>✚</span> 添加新日程';
        addButton.addEventListener('click', () => this.openEventModal());
        this.eventsList.appendChild(addButton);
    }

    async deleteEvent(eventId) {
        try {
            await calendarCollection.doc(eventId).delete();
            await this.loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('删除失败，请重试');
        }
    }

    openEventModal(date = '') {
        this.eventModal.style.display = 'block';
        this.eventModal.classList.add('show');
        if (date) {
            document.getElementById('eventDate').value = date;
        } else {
            document.getElementById('eventDate').value = this.formatDate(new Date());
        }
        document.getElementById('eventTitle').focus();
    }

    closeModal() {
        this.eventModal.classList.remove('show');
        setTimeout(() => {
            this.eventModal.style.display = 'none';
            this.eventForm.reset();
        }, 300);
    }

    async handleEventSubmit(e) {
        e.preventDefault();
        const dateStr = document.getElementById('eventDate').value;
        const title = document.getElementById('eventTitle').value;
        const description = document.getElementById('eventDescription').value;

        if (!title.trim()) {
            alert('请输入日程标题');
            return;
        }

        try {
            const date = new Date(dateStr);
            await calendarCollection.add({
                date: firebase.firestore.Timestamp.fromDate(date),
                title: title.trim(),
                description: description.trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            this.closeModal();
            await this.loadEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            alert('保存失败，请重试');
        }
    }
}

// 初始化日历
document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
}); 