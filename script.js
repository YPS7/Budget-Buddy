let expenses = [];
let expenseLogs = [];
let balance = 0;
let currentPeriod = 'weekly';
let expenseChart;

document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const balanceForm = document.getElementById('balance-form');
    const clearButton = document.getElementById('clear-expenses');
    const exportButton = document.querySelector('.btn-export');
    const navLinks = document.querySelectorAll('nav a');
    const btnWeekly = document.getElementById('btn-weekly');
    const btnMonthly = document.getElementById('btn-monthly');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const themeSwitch = document.getElementById('theme-switch');

    loadExpenses();
    loadExpenseLogs();
    loadBalance();
    updateExpenseList();
    updateBudgetStatus();
    updateWeeklyExpenses();
    updateMonthlyExpenses();
    updateExpenseLogs();
    loadTheme();

    // Set initial remaining balance to 0
    document.getElementById('budget-remaining').textContent = 'Remaining: INR 0.00';

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addExpense();
    });

    balanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        setBalance();
    });

    clearButton.addEventListener('click', clearExpenses);
    exportButton.addEventListener('click', exportExpenses);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.dataset.view;
            showView(view);
        });
    });

    btnWeekly.addEventListener('click', () => setPeriod('weekly'));
    btnMonthly.addEventListener('click', () => setPeriod('monthly'));

    settingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    themeSwitch.addEventListener('change', () => {
        if (themeSwitch.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
        updateCalendarIconColor();
    });

    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    updateCalendarIconColor();
});

function addExpense() {
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    const currency = document.getElementById('currency-selector').value;

    if (name && amount && date) {
        const expense = {
            id: Date.now(),
            name,
            amount,
            date,
            currency
        };

        expenses.push(expense);
        saveExpenses();
        updateExpenseList();
        updateBudgetStatus();
        updateWeeklyExpenses();
        updateMonthlyExpenses();

        document.getElementById('expense-name').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-date').value = '';
    }
}

function setBalance() {
    const balanceAmount = parseFloat(document.getElementById('balance-amount').value);
    if (!isNaN(balanceAmount)) {
        balance = balanceAmount;
        saveBalance();
        updateBudgetStatus();
    }
}

function updateExpenseList() {
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = '';

    const filteredExpenses = filterExpensesByPeriod(expenses);

    filteredExpenses.forEach((expense) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="expense-details">${expense.name}: ${expense.currency} ${expense.amount.toFixed(2)} - ${new Date(expense.date).toLocaleString()}</div>
            <button class="delete-expense" data-id="${expense.id}">Delete</button>
        `;
        expenseList.appendChild(li);
    });

    document.querySelectorAll('.delete-expense').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            deleteExpense(id);
        });
    });
}

function updateBudgetStatus() {
    const budgetStatus = document.getElementById('budget-status');
    const budgetRemaining = document.getElementById('budget-remaining');
    const progressFill = document.querySelector('.progress-fill');

    const filteredExpenses = filterExpensesByPeriod(expenses);
    const totalExpenses = filteredExpenses.reduce((total, expense) => total + convertToINR(expense.amount, expense.currency), 0);
    const remaining = Math.max(balance - totalExpenses, 0);
    const percentageUsed = balance > 0 ? (totalExpenses / balance) * 100 : 0;

    budgetStatus.textContent = `${currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1)} Expenses: INR ${totalExpenses.toFixed(2)}`;
    budgetRemaining.textContent = `Remaining: INR ${remaining.toFixed(2)}`;
    progressFill.style.width = `${percentageUsed}%`;

    if (percentageUsed <= 50) {
        progressFill.className = 'progress-fill';
    } else if (percentageUsed <= 75) {
        progressFill.className = 'progress-fill warning';
    } else {
        progressFill.className = 'progress-fill danger';
    }
}

function updateWeeklyExpenses() {
    const weeklyExpenseList = document.getElementById('weekly-expense-list');
    weeklyExpenseList.innerHTML = '';

    const weeklyExpenses = filterExpensesByPeriod(expenses, 'weekly');
    const weeklyTotal = weeklyExpenses.reduce((total, expense) => total + convertToINR(expense.amount, expense.currency), 0);

    weeklyExpenses.forEach((expense) => {
        const li = document.createElement('li');
        li.textContent = `${expense.name}: ${expense.currency} ${expense.amount.toFixed(2)}`;
        weeklyExpenseList.appendChild(li);
    });

    const totalElement = document.createElement('div');
    totalElement.className = 'week-total';
    totalElement.textContent = `Total: INR ${weeklyTotal.toFixed(2)}`;
    weeklyExpenseList.appendChild(totalElement);
}

function updateMonthlyExpenses() {
    const monthlyExpenseList = document.getElementById('monthly-expense-list');
    monthlyExpenseList.innerHTML = '';

    const monthlyExpenses = filterExpensesByPeriod(expenses, 'monthly');
    const monthlyTotal = monthlyExpenses.reduce((total, expense) => total + convertToINR(expense.amount, expense.currency), 0);

    monthlyExpenses.forEach((expense) => {
        const li = document.createElement('li');
        li.textContent = `${expense.name}: ${expense.currency} ${expense.amount.toFixed(2)}`;
        monthlyExpenseList.appendChild(li);
    });

    const totalElement = document.createElement('div');
    totalElement.className = 'month-total';
    totalElement.textContent = `Total: INR ${monthlyTotal.toFixed(2)}`;
    monthlyExpenseList.appendChild(totalElement);
}

function updateExpenseLogs() {
    const logList = document.getElementById('log-list');
    logList.innerHTML = '';

    expenseLogs.forEach((log, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="log-content">
                <div class="log-date">${new Date(log.date).toLocaleString()}</div>
                <div class="log-details">
                    <ul>
                        ${log.expenses.map(expense => `
                            <li>${expense.name}: ${expense.currency} ${expense.amount.toFixed(2)} - ${new Date(expense.date).toLocaleString()}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            <button class="log-delete" data-index="${index}">Delete</button>
        `;
        logList.appendChild(li);
    });

    document.querySelectorAll('.log-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            deleteExpenseLog(index);
        });
    });
}

function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    updateExpenseList();
    updateBudgetStatus();
    updateWeeklyExpenses();
    updateMonthlyExpenses();
}

function deleteExpenseLog(index) {
    expenseLogs.splice(index, 1);
    saveExpenseLogs();
    updateExpenseLogs();
}

function filterExpensesByPeriod(expenses, period = currentPeriod) {
    const now = new Date();
    const startOfPeriod = period === 'weekly'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
        : new Date(now.getFullYear(), now.getMonth(), 1);

    return expenses.filter(expense => new Date(expense.date) >= startOfPeriod);
}

function setPeriod(period) {
    currentPeriod = period;
    document.getElementById('btn-weekly').classList.toggle('active', period === 'weekly');
    document.getElementById('btn-monthly').classList.toggle('active', period === 'monthly');
    updateExpenseList();
    updateBudgetStatus();
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function loadExpenses() {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
}

function saveExpenseLogs() {
    localStorage.setItem('expenseLogs', JSON.stringify(expenseLogs));
}

function loadExpenseLogs() {
    const savedLogs = localStorage.getItem('expenseLogs');
    if (savedLogs) {
        expenseLogs = JSON.parse(savedLogs);
    }
}

function saveBalance() {
    localStorage.setItem('balance', balance.toString());
}

function loadBalance() {
    const savedBalance = localStorage.getItem('balance');
    if (savedBalance) {
        balance = parseFloat(savedBalance);
    } else {
        balance = 0;
    }
}

function clearExpenses() {
    if (confirm('Are you sure you want to clear all expenses? This action cannot be undone.')) {
        const log = {
            date: new Date().toISOString(),
            expenses: [...expenses]
        };
        expenseLogs.push(log);
        saveExpenseLogs();
        expenses = [];
        saveExpenses();
        balance = 0;
        saveBalance();
        updateExpenseList();
        updateBudgetStatus();
        updateWeeklyExpenses();
        updateMonthlyExpenses();
        updateExpenseLogs();
        document.getElementById('balance-amount').value = '';
        document.getElementById('budget-remaining').textContent = 'Remaining: INR 0.00';
    }
}

function exportExpenses() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set the title
    doc.setFontSize(18);
    doc.text('Budget Tracker Dashboard', 105, 15, null, null, 'center');

    // Add current balance
    doc.setFontSize(14);
    doc.text(`Current Balance: INR ${balance.toFixed(2)}`, 20, 30);

    // Add period expenses
    const filteredExpenses = filterExpensesByPeriod(expenses);
    const totalExpenses = filteredExpenses.reduce((total, expense) => total + convertToINR(expense.amount, expense.currency), 0);
    doc.text(`${currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1)} Expenses: INR ${totalExpenses.toFixed(2)}`, 20, 40);

    // Add remaining balance
    const remaining = Math.max(balance - totalExpenses, 0);
    doc.text(`Remaining: INR ${remaining.toFixed(2)}`, 20, 50);

    // Set up table headers for recent expenses
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Name', 20, 70);
    doc.text('Amount', 80, 70);
    doc.text('Currency', 120, 70);
    doc.text('Date', 160, 70);

    // Add recent expenses data
    doc.setTextColor(0);
    let yPosition = 80;
    filteredExpenses.forEach((expense, index) => {
        if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
            // Repeat headers on new page
            doc.setTextColor(100);
            doc.text('Name', 20, yPosition);
            doc.text('Amount', 80, yPosition);
            doc.text('Currency', 120, yPosition);
            doc.text('Date', 160, yPosition);
            doc.setTextColor(0);
            yPosition += 10;
        }
        doc.text(expense.name, 20, yPosition);
        doc.text(expense.amount.toFixed(2), 80, yPosition);
        doc.text(expense.currency, 120, yPosition);
        doc.text(new Date(expense.date).toLocaleDateString(), 160, yPosition);
        yPosition += 10;
    });

    // Save the PDF
    doc.save(`budget_tracker_dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
}

function showView(view) {
    document.getElementById('dashboard-view').style.display = view === 'dashboard' ? 'block' : 'none';
    document.getElementById('expenses-view').style.display = view === 'expenses' ? 'block' : 'none';
    document.getElementById('graph-view').style.display = view === 'graph' ? 'block' : 'none';

    document.querySelectorAll('nav a').forEach(link => {
        link.classList.toggle('active', link.dataset.view === view);
    });

    if (view === 'expenses') {
        updateWeeklyExpenses();
        updateMonthlyExpenses();
        updateExpenseLogs();
    } else if (view === 'graph') {
        updateExpenseChart();
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('theme-switch').checked = true;
    }
    updateCalendarIconColor();
}

function updateCalendarIconColor() {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.style.setProperty('--calendar-invert', isDarkMode ? '1' : '0');
}

function convertToINR(amount, fromCurrency) {
    // Exchange rates (as of a specific date, you may want to use an API for real-time rates)
    const rates = {
        INR: 1,
        USD: 74.5,
        EUR: 88.5,
        GBP: 103.5,
        JPY: 0.68
    };

    return amount * rates[fromCurrency];
}

function updateExpenseChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // Group expenses by name and sum their amounts
    const expenseData = expenses.reduce((acc, expense) => {
        const amount = convertToINR(expense.amount, expense.currency);
        acc[expense.name] = (acc[expense.name] || 0) + amount;
        return acc;
    }, {});

    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Expense Distribution'
                }
            }
        }
    });
}