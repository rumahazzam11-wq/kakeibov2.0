// ==================== CONSTANTS ====================
const CATEGORIES = {
    kebutuhan: { name: 'Kebutuhan', color: '#4CAF50', icon: '🛒' },
    keinginan: { name: 'Keinginan', color: '#FF9800', icon: '❤️' },
    budaya: { name: 'Budaya', color: '#9C27B0', icon: '📚' },
    tak_terduga: { name: 'Tak Terduga', color: '#F44336', icon: '⚠️' }
};

// ==================== DATA MANAGEMENT ====================
class KakeiboApp {
    constructor() {
        this.currentScreen = 'home';
        this.currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        this.data = this.loadData();
        this.setupAuthListeners();
        this.init();
    }

    async init() {
        this.setupNavigation();

        // Initialize Google Auth
        await googleAuth.init(window.GOOGLE_CLIENT_ID);

        if (googleAuth.checkStoredSession()) {
            // If already logged in, maybe try to load cloud data?
            console.log('User already logged in:', googleAuth.getUser().name);
        }

        this.checkOnboarding();
        this.renderCurrentScreen();
    }

    setupAuthListeners() {
        window.addEventListener('google-login', (e) => {
            console.log('Login success:', e.detail);
            this.renderCurrentScreen();
        });

        window.addEventListener('google-logout', () => {
            console.log('Logged out');
            this.renderCurrentScreen();
        });

        window.addEventListener('google-api-token', (e) => {
            console.log('API token received');
            // Can trigger a sync or something here
        });
    }

    // Data Management
    loadData() {
        const saved = localStorage.getItem('kakeiboData');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            onboardingComplete: false,
            months: {}
        };
    }

    saveData() {
        localStorage.setItem('kakeiboData', JSON.stringify(this.data));
    }

    getCurrentMonthData() {
        if (!this.data.months[this.currentMonth]) {
            this.data.months[this.currentMonth] = {
                income: 0,
                savingsTarget: 0,
                fixedExpenses: 0,
                transactions: [],
                reflection: '',
                budgets: {
                    kebutuhan: 0,
                    keinginan: 0,
                    budaya: 0,
                    tak_terduga: 0
                }
            };
        }
        // Ensure budgets exist for older data
        if (!this.data.months[this.currentMonth].budgets) {
            this.data.months[this.currentMonth].budgets = {
                kebutuhan: 0,
                keinginan: 0,
                budaya: 0,
                tak_terduga: 0
            };
        }
        return this.data.months[this.currentMonth];
    }

    // Navigation
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = item.getAttribute('data-screen');
                this.navigateTo(screen);
            });
        });
    }

    navigateTo(screen) {
        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-screen="${screen}"]`).classList.add('active');

        // Update current screen
        this.currentScreen = screen;
        this.renderCurrentScreen();
    }

    checkOnboarding() {
        if (!this.data.onboardingComplete) {
            this.showOnboarding();
        }
    }

    // Formatters
    formatRupiah(number) {
        return 'Rp ' + number.toLocaleString('id-ID');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }

    formatDateShort(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hari ini';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Kemarin';
        }
        return this.formatDate(dateString);
    }

    // Calculations
    calculateTotalIncome() {
        const monthData = this.getCurrentMonthData();
        const transactionIncome = monthData.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        return monthData.income + transactionIncome;
    }

    calculateTotalExpenses() {
        const monthData = this.getCurrentMonthData();
        return monthData.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    calculateRemaining() {
        return this.calculateTotalIncome() - this.calculateTotalExpenses();
    }

    calculateCategoryTotals() {
        const monthData = this.getCurrentMonthData();
        const totals = {};
        Object.keys(CATEGORIES).forEach(cat => {
            totals[cat] = monthData.transactions
                .filter(t => t.type === 'expense' && t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0);
        });
        return totals;
    }

    // ==================== SCREEN RENDERING ====================
    renderCurrentScreen() {
        const app = document.getElementById('app');
        const bottomNav = document.getElementById('bottomNav');

        switch (this.currentScreen) {
            case 'home':
                app.innerHTML = this.renderHomeScreen();
                bottomNav.style.display = 'flex';
                break;
            case 'transactions':
                app.innerHTML = this.renderTransactionsScreen();
                bottomNav.style.display = 'flex';
                break;
            case 'summary':
                app.innerHTML = this.renderSummaryScreen();
                bottomNav.style.display = 'flex';
                break;
            case 'budget':
                app.innerHTML = this.renderBudgetScreen();
                bottomNav.style.display = 'flex';
                break;
            case 'history':
                app.innerHTML = this.renderHistoryScreen();
                bottomNav.style.display = 'flex';
                break;
            case 'settings':
                app.innerHTML = this.renderSettingsScreen();
                bottomNav.style.display = 'flex';
                break;
        }
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Add Transaction Button
        const addIncomeBtn = document.getElementById('addIncome');
        const addExpenseBtn = document.getElementById('addExpense');
        if (addIncomeBtn) {
            addIncomeBtn.addEventListener('click', () => this.showAddTransactionModal('income'));
        }
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.showAddTransactionModal('expense'));
        }

        // Delete Transaction Buttons
        const deleteButtons = document.querySelectorAll('.btn-delete-transaction');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                this.deleteTransaction(id);
            });
        });

        // Show Reflection Button
        const reflectionBtn = document.getElementById('showReflection');
        if (reflectionBtn) {
            reflectionBtn.addEventListener('click', () => this.showReflectionModal());
        }

        // --- GOOGLE AUTH & SHEETS LISTENERS ---

        // Render Google Sign-In Button if not logged in and on settings screen
        if (this.currentScreen === 'settings' && !googleAuth.isAuthenticated()) {
            googleAuth.renderButton('googleSignInButton');
        }

        // Sign Out Button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                if (confirm('Keluar dari akun Google?')) {
                    googleAuth.signOut();
                }
            });
        }

        // Sheets Config Form
        const sheetsForm = document.getElementById('sheetsConfigForm');
        if (sheetsForm) {
            sheetsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const idInput = document.getElementById('sheetsIdInput');
                const sheetsId = idInput.value.trim();

                if (sheetsId) {
                    sheetsAPI.setSpreadsheetId(sheetsId);

                    try {
                        await googleAuth.requestAccessToken();
                        alert('Koneksi sedang diproses. Silakan klik Sync atau Load setelah login berhasil.');
                    } catch (err) {
                        alert('Gagal meminta izin akses Google Sheets: ' + err.message);
                    }
                }
            });
        }

        // Sync Data Button
        const syncBtn = document.getElementById('syncDataBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', async () => {
                try {
                    await googleAuth.requestAccessToken();
                    window.addEventListener('google-api-token', async (e) => {
                        try {
                            await sheetsAPI.initializeSpreadsheet();
                            await sheetsAPI.saveAllData(this.data);
                            alert('Berhasil sinkronisasi ke cloud! ☁️');
                        } catch (err) {
                            alert('Gagal sinkronisasi: ' + err.message);
                        }
                    }, { once: true });
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            });
        }

        // Load Data Button
        const loadBtn = document.getElementById('loadDataBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', async () => {
                if (!confirm('Load data dari cloud? Data lokal akan tertimpa.')) return;

                try {
                    await googleAuth.requestAccessToken();
                    window.addEventListener('google-api-token', async (e) => {
                        try {
                            const cloudData = await sheetsAPI.loadAllData();
                            this.data = cloudData;
                            this.saveData();
                            this.renderCurrentScreen();
                            alert('Berhasil memuat data dari cloud! 📥');
                        } catch (err) {
                            alert('Gagal memuat data: ' + err.message);
                        }
                    }, { once: true });
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            });
        }

        // --- END GOOGLE LISTENERS ---

        // Budget Form
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const monthData = this.getCurrentMonthData();

                Object.keys(CATEGORIES).forEach(key => {
                    const value = formData.get(`budget_${key}`);
                    monthData.budgets[key] = parseInt(value) || 0;
                });

                this.saveData();
                this.renderCurrentScreen();

                alert('Budget berhasil disimpan! 💾');
            });
        }
    }

    // ==================== HOME SCREEN ====================
    renderHomeScreen() {
        const monthData = this.getCurrentMonthData();
        const totalIncome = this.calculateTotalIncome();
        const totalExpenses = this.calculateTotalExpenses();
        const remaining = this.calculateRemaining();
        const savingsProgress = (remaining / monthData.savingsTarget) * 100;
        const categoryTotals = this.calculateCategoryTotals();
        const recentTransactions = monthData.transactions.slice(-5).reverse();

        return `
            <div class="screen active">
                <div class="screen-header">
                    <h1 class="screen-title">${this.getMonthName(this.currentMonth)}</h1>
                </div>

                <!-- Summary Card -->
                <div class="card">
                    <div class="flex justify-between mb-md">
                        <div>
                            <div class="input-label">Total Pemasukan</div>
                            <div class="card-value" style="color: var(--color-income);">
                                ${this.formatRupiah(totalIncome)}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div class="input-label">Total Pengeluaran</div>
                            <div class="card-value" style="color: var(--color-expense);">
                                ${this.formatRupiah(totalExpenses)}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div class="input-label">Sisa Uang</div>
                        <div class="card-value" style="color: var(--color-accent);">
                            ${this.formatRupiah(remaining)}
                        </div>
                    </div>
                    <div class="mt-md">
                        <div class="flex justify-between mb-sm">
                            <span class="input-label">Target Tabungan</span>
                            <span class="input-label">${Math.round(savingsProgress)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(savingsProgress, 100)}%; background-color: var(--color-income);"></div>
                        </div>
                    </div>
                </div>

                <!-- Category Breakdown -->
                <div class="card">
                    <div class="card-title mb-md">Kategori Pengeluaran</div>
                    ${Object.entries(CATEGORIES).map(([key, cat]) => `
                        <div class="flex justify-between items-center mb-sm">
                            <div class="flex items-center gap-sm">
                                <span style="font-size: 20px;">${cat.icon}</span>
                                <span>${cat.name}</span>
                            </div>
                            <span class="card-value" style="font-size: 16px; color: ${cat.color};">
                                ${this.formatRupiah(categoryTotals[key])}
                            </span>
                        </div>
                    `).join('')}
                </div>

                <!-- Quick Actions -->
                <div class="flex gap-md mb-md">
                    <button class="btn btn-success" id="addIncome">
                        <span>+ Tambah Pemasukan</span>
                    </button>
                    <button class="btn btn-warning" id="addExpense">
                        <span>- Tambah Pengeluaran</span>
                    </button>
                </div>

                <!-- Recent Transactions -->
                <div class="card">
                    <div class="card-title mb-md">Transaksi Terakhir</div>
                    ${recentTransactions.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">💰</div>
                            <div class="empty-state-text">Belum ada transaksi</div>
                        </div>
                    ` : recentTransactions.map(t => this.renderTransactionItem(t)).join('')}
                </div>
            </div>
        `;
    }

    renderTransactionItem(transaction) {
        const isIncome = transaction.type === 'income';
        const category = CATEGORIES[transaction.category];

        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">
                        ${transaction.description || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
                    </div>
                    <div class="flex items-center gap-sm">
                        ${!isIncome && category ? `<span class="category-badge ${transaction.category}">${category.name}</span>` : ''}
                        <span class="transaction-date">${this.formatDateShort(transaction.date)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${isIncome ? 'amount-income' : 'amount-expense'}">
                    ${isIncome ? '+' : '-'}${this.formatRupiah(transaction.amount)}
                </div>
            </div>
        `;
    }

    // ==================== TRANSACTIONS SCREEN ====================
    renderTransactionsScreen() {
        const monthData = this.getCurrentMonthData();
        const transactions = [...monthData.transactions].reverse();

        return `
            <div class="screen active">
                <div class="screen-header">
                    <h1 class="screen-title">Transaksi</h1>
                </div>

                ${transactions.length === 0 ? `
                    <div class="card">
                        <div class="empty-state">
                            <div class="empty-state-icon">📝</div>
                            <div class="empty-state-text">Belum ada transaksi bulan ini</div>
                        </div>
                    </div>
                ` : transactions.map(t => `
                    <div class="transaction-item" style="position: relative;">
                        <div class="transaction-info">
                            <div class="transaction-description">
                                ${t.description || (t.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                            </div>
                            <div class="flex items-center gap-sm">
                                ${t.type === 'expense' && CATEGORIES[t.category] ? `
                                    <span class="category-badge ${t.category}">${CATEGORIES[t.category].name}</span>
                                ` : ''}
                                <span class="transaction-date">${this.formatDate(t.date)}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="transaction-amount ${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
                                ${t.type === 'income' ? '+' : '-'}${this.formatRupiah(t.amount)}
                            </div>
                            <button class="btn-delete-transaction" data-id="${t.id}" style="background: var(--color-expense); color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer;">
                                🗑️
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ==================== SUMMARY SCREEN ====================
    renderSummaryScreen() {
        const totalIncome = this.calculateTotalIncome();
        const totalExpenses = this.calculateTotalExpenses();
        const remaining = this.calculateRemaining();
        const categoryTotals = this.calculateCategoryTotals();
        const monthData = this.getCurrentMonthData();

        return `
            <div class="screen active">
                <div class="screen-header">
                    <h1 class="screen-title">Ringkasan</h1>
                </div>

                <!-- Overall Stats -->
                <div class="card">
                    <div class="flex justify-between mb-sm">
                        <div>
                            <div class="input-label">Total Pemasukan</div>
                            <div class="card-value" style="color: var(--color-income); font-size: 20px;">
                                ${this.formatRupiah(totalIncome)}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div class="input-label">Total Pengeluaran</div>
                            <div class="card-value" style="color: var(--color-expense); font-size: 20px;">
                                ${this.formatRupiah(totalExpenses)}
                            </div>
                        </div>
                    </div>
                    <div class="input-label">Sisa Uang</div>
                    <div class="card-value" style="color: var(--color-accent);">
                        ${this.formatRupiah(remaining)}
                    </div>
                </div>

                <!-- Category Cards -->
                ${Object.entries(CATEGORIES).map(([key, cat]) => {
            const total = categoryTotals[key];
            const percentage = totalExpenses > 0 ? (total / totalExpenses * 100).toFixed(0) : 0;
            const count = monthData.transactions.filter(t => t.category === key).length;

            return `
                        <div class="card" style="border-left: 4px solid ${cat.color};">
                            <div class="flex justify-between items-center mb-sm">
                                <div class="flex items-center gap-sm">
                                    <span style="font-size: 24px;">${cat.icon}</span>
                                    <div>
                                        <div class="card-title">${cat.name}</div>
                                        <div class="input-label">${percentage}% dari pengeluaran • ${count} transaksi</div>
                                    </div>
                                </div>
                                <div class="card-value" style="color: ${cat.color};">
                                    ${this.formatRupiah(total)}
                                </div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%; background-color: ${cat.color};"></div>
                            </div>
                        </div>
                    `;
        }).join('')}

                <!-- Reflection Button -->
                <button class="btn btn-primary" id="showReflection">
                    ✨ Refleksi Bulanan
                </button>
            </div>
        `;
    }

    // ==================== BUDGET SCREEN ====================
    renderBudgetScreen() {
        const monthData = this.getCurrentMonthData();
        const categoryTotals = this.calculateCategoryTotals();

        return `
            <div class="screen active">
                <div class="screen-header">
                    <h1 class="screen-title">Budget</h1>
                </div>

                <div class="card">
                    <div class="card-title mb-md">Atur Budget Kategori</div>
                    <form id="budgetForm">
                        ${Object.entries(CATEGORIES).map(([key, cat]) => {
            const budget = monthData.budgets[key] || 0;
            const spent = categoryTotals[key];
            const percentage = budget > 0 ? (spent / budget * 100) : 0;

            // Determine status color
            let statusColor = 'var(--color-income)'; // green
            if (percentage >= 100) {
                statusColor = 'var(--color-expense)'; // red
            } else if (percentage >= 80) {
                statusColor = 'var(--color-secondary)'; // orange
            }

            return `
                                <div class="budget-category-card" style="margin-bottom: var(--spacing-lg);">
                                    <div class="flex items-center gap-md mb-sm">
                                        <span style="font-size: 28px;">${cat.icon}</span>
                                        <div style="flex: 1;">
                                            <div class="card-title">${cat.name}</div>
                                            <div class="input-label">
                                                ${this.formatRupiah(spent)} / ${this.formatRupiah(budget)}
                                                ${budget > 0 ? `<span style="color: ${statusColor}; font-weight: 700;"> (${percentage.toFixed(0)}%)</span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="input-group">
                                        <label class="input-label">Budget ${cat.name}</label>
                                        <input 
                                            type="number" 
                                            class="input" 
                                            name="budget_${key}" 
                                            value="${budget}"
                                            placeholder="0"
                                        >
                                    </div>
                                    
                                    ${budget > 0 ? `
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background-color: ${statusColor};"></div>
                                        </div>
                                        ${percentage >= 100 ? `
                                            <div class="budget-alert alert-danger">
                                                ⚠️ Budget terlampaui!
                                            </div>
                                        ` : percentage >= 80 ? `
                                            <div class="budget-alert alert-warning">
                                                ⚡ Mendekati batas budget
                                            </div>
                                        ` : `
                                            <div class="budget-alert alert-success">
                                                ✓ Masih dalam budget
                                            </div>
                                        `}
                                    ` : ''}
                                </div>
                            `;
        }).join('')}
                        
                        <button type="submit" class="btn btn-primary">
                            💾 Simpan Budget
                        </button>
                    </form>
                </div>

                <!-- Budget Summary -->
                <div class="card">
                    <div class="card-title mb-md">Ringkasan Budget</div>
                    ${(() => {
                const totalBudget = Object.values(monthData.budgets).reduce((sum, b) => sum + b, 0);
                const totalSpent = Object.values(categoryTotals).reduce((sum, s) => sum + s, 0);
                const remaining = totalBudget - totalSpent;
                const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;

                return `
                            <div class="flex justify-between mb-sm">
                                <div>
                                    <div class="input-label">Total Budget</div>
                                    <div class="card-value" style="font-size: 18px;">${this.formatRupiah(totalBudget)}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div class="input-label">Terpakai</div>
                                    <div class="card-value" style="font-size: 18px; color: var(--color-expense);">${this.formatRupiah(totalSpent)}</div>
                                </div>
                            </div>
                            <div class="input-label">Sisa Budget</div>
                            <div class="card-value" style="color: ${remaining >= 0 ? 'var(--color-income)' : 'var(--color-expense)'};">
                                ${this.formatRupiah(Math.abs(remaining))}
                                ${remaining < 0 ? ' (Over Budget)' : ''}
                            </div>
                            ${totalBudget > 0 ? `
                                <div class="mt-md">
                                    <div class="flex justify-between mb-sm">
                                        <span class="input-label">Penggunaan Budget</span>
                                        <span class="input-label">${overallPercentage.toFixed(0)}%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${Math.min(overallPercentage, 100)}%; background-color: ${overallPercentage >= 100 ? 'var(--color-expense)' : overallPercentage >= 80 ? 'var(--color-secondary)' : 'var(--color-income)'};"></div>
                                    </div>
                                </div>
                            ` : ''}
                        `;
            })()}
                </div>
            </div>
        `;
    }

    // ==================== HISTORY SCREEN ====================
    renderHistoryScreen() {
        const months = Object.keys(this.data.months).sort().reverse();

        return `
            <div class="screen active">
                <div class="screen-header">
                    <h1 class="screen-title">Riwayat</h1>
                </div>

                ${months.length === 0 ? `
                    <div class="card">
                        <div class="empty-state">
                            <div class="empty-state-icon">📅</div>
                            <div class="empty-state-text">Belum ada riwayat</div>
                        </div>
                    </div>
                ` : months.map(month => {
            const monthData = this.data.months[month];
            const income = monthData.income + monthData.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const expenses = monthData.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            const saved = income - expenses;
            const goalPercentage = (saved / monthData.savingsTarget * 100).toFixed(0);
            const isCurrent = month === this.currentMonth;

            return `
                        <div class="card" style="${isCurrent ? 'border: 2px solid var(--color-accent);' : ''}">
                            <div class="flex justify-between items-center mb-sm">
                                <div>
                                    <div class="card-title">${this.getMonthName(month)}</div>
                                    ${isCurrent ? '<span class="category-badge" style="background-color: var(--color-accent);">Saat Ini</span>' : ''}
                                </div>
                                <div style="text-align: right;">
                                    <div class="card-value" style="color: var(--color-accent); font-size: 18px;">
                                        ${this.formatRupiah(saved)}
                                    </div>
                                    <div class="input-label">Ditabung</div>
                                </div>
                            </div>
                            <div class="flex justify-between mb-sm">
                                <div>
                                    <div class="input-label">Pemasukan</div>
                                    <div style="color: var(--color-income); font-weight: 600;">
                                        ${this.formatRupiah(income)}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div class="input-label">Pengeluaran</div>
                                    <div style="color: var(--color-expense); font-weight: 600;">
                                        ${this.formatRupiah(expenses)}
                                    </div>
                                </div>
                            </div>
                            <div class="input-label">Target tabungan: ${goalPercentage}% tercapai ${goalPercentage >= 100 ? '✓' : ''}</div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    // ==================== SETTINGS SCREEN ====================
    renderSettingsScreen() {
        const user = googleAuth.getUser();
        const sheetsId = sheetsAPI.getSpreadsheetId() || '';

        return `
            <div class="screen active">
                <div class="screen-header">
                    <h1 class="screen-title">Pengaturan</h1>
                </div>

                ${window.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE' ? `
                    <div class="card" style="border: 2px solid var(--color-expense); background-color: rgba(244, 67, 54, 0.05);">
                        <div class="card-title" style="color: var(--color-expense);">⚠️ Perlu Konfigurasi</div>
                        <div class="input-label" style="color: var(--color-text);">
                            Google Client ID belum diatur. Silakan buka file <code>config.js</code> dan masukkan Client ID dari Google Cloud Console agar fitur Login & Cloud Sync berfungsi.
                        </div>
                    </div>
                ` : ''}

                ${user ? `
                    <!-- User Info -->
                    <div class="card">
                        <div class="card-title mb-md">Akun Google</div>
                        <div class="flex items-center gap-md mb-md">
                            <img src="${user.picture}" alt="${user.name}" style="width: 48px; height: 48px; border-radius: 50%;">
                            <div>
                                <div style="font-weight: 600;">${user.name}</div>
                                <div class="input-label">${user.email}</div>
                            </div>
                        </div>
                        <button class="btn btn-warning" id="signOutBtn">
                            🚪 Keluar
                        </button>
                    </div>

                    <!-- Google Sheets Configuration -->
                    <div class="card">
                        <div class="card-title mb-md">Google Sheets Database</div>
                        <div class="input-label mb-sm">
                            Masukkan ID file Google Sheets untuk menyimpan data Anda di cloud
                        </div>
                        <form id="sheetsConfigForm">
                            <div class="input-group">
                                <label class="input-label">Google Sheets ID</label>
                                <input 
                                    type="text" 
                                    class="input" 
                                    id="sheetsIdInput"
                                    value="${sheetsId}"
                                    placeholder="1xyz...abc" 
                                    required
                                >
                                <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">
                                    💡 Cara mendapatkan ID: Buka Google Sheets → URL: docs.google.com/spreadsheets/d/<strong>ID_ADA_DISINI</strong>/edit
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                💾 Simpan \u0026 Test Koneksi
                            </button>
                        </form>
                        ${sheetsId ? `
                            <button class="btn btn-success mt-md" id="syncDataBtn">
                                ☁️ Sync Data ke Google Sheets
                            </button>
                            <button class="btn btn-warning mt-md" id="loadDataBtn">
                                📥 Load Data dari Google Sheets
                            </button>
                        ` : ''}
                    </div>
                ` : `
                    <!-- Not Logged In -->
                    <div class="card">
                        <div class="card-title mb-md">Akun Google</div>
                        <div class="input-label mb-md">
                            Login dengan Google untuk menyimpan data di cloud
                        </div>
                        <div id="googleSignInButton"></div>
                    </div>
                `}

                <div class="card">
                    <div class="card-title mb-md">Tentang</div>
                    <div class="mb-sm">
                        <div class="input-label">Aplikasi</div>
                        <div style="font-weight: 600;">Kakeibo Tracker</div>
                    </div>
                    <div class="mb-sm">
                        <div class="input-label">Versi</div>
                        <div style="font-weight: 600;">2.0.0</div>
                    </div>
                    <div>
                        <div class="input-label">Metode</div>
                        <div style="font-weight: 600;">Kakeibo - Japanese Budgeting</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title mb-md">Data</div>
                    <button class="btn btn-warning" onclick="if(confirm('Reset semua data lokal?')) { localStorage.clear(); location.reload(); }">
                        🗑️ Reset Data Lokal
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== MODALS ====================
    showOnboarding() {
        const bottomNav = document.getElementById('bottomNav');
        bottomNav.style.display = 'none';

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen active" style="padding: var(--spacing-lg);">
                <div style="text-align: center; margin-bottom: var(--spacing-xl);">
                    <div style="font-size: 64px; margin-bottom: var(--spacing-md);">🏮</div>
                    <h1 style="font-size: 32px; font-weight: 700; margin-bottom: var(--spacing-sm);">
                        Selamat Datang di Kakeibo
                    </h1>
                    <p style="color: var(--color-text-secondary);">
                        Kuasai keuangan Anda dengan kebijaksanaan Jepang
                    </p>
                </div>

                <!-- Categories -->
                <div class="card mb-md">
                    <div class="card-title mb-md">4 Kategori Kakeibo</div>
                    ${Object.entries(CATEGORIES).map(([key, cat]) => `
                        <div class="flex items-center gap-md mb-sm">
                            <span style="font-size: 32px;">${cat.icon}</span>
                            <div>
                                <div style="font-weight: 600;">${cat.name}</div>
                                <div class="input-label" style="font-size: 12px;">
                                    ${key === 'kebutuhan' ? 'Kebutuhan dasar' :
                key === 'keinginan' ? 'Keinginan & hiburan' :
                    key === 'budaya' ? 'Pendidikan & budaya' :
                        'Pengeluaran darurat'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <form id="onboardingForm">
                    <div class="input-group">
                        <label class="input-label">Pendapatan Bulanan (Rp)</label>
                        <input type="number" class="input" name="income" placeholder="10000000" required>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Target Tabungan (Rp)</label>
                        <input type="number" class="input" name="savingsTarget" placeholder="3000000" required>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Pengeluaran Tetap (Rp)</label>
                        <input type="number" class="input" name="fixedExpenses" placeholder="2000000" required>
                    </div>

                    <button type="submit" class="btn btn-primary">Mulai</button>
                </form>
            </div>
        `;

        document.getElementById('onboardingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const monthData = this.getCurrentMonthData();
            monthData.income = parseInt(formData.get('income'));
            monthData.savingsTarget = parseInt(formData.get('savingsTarget'));
            monthData.fixedExpenses = parseInt(formData.get('fixedExpenses'));

            this.data.onboardingComplete = true;
            this.saveData();

            bottomNav.style.display = 'flex';
            this.navigateTo('home');
        });
    }

    showAddTransactionModal(type) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Tambah ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</h2>
                    <button class="btn-close" onclick="this.closest('.modal').remove()">Tutup</button>
                </div>

                <form id="addTransactionForm">
                    <div class="input-group">
                        <label class="input-label">Jumlah (Rp)</label>
                        <input type="number" class="input" name="amount" placeholder="50000" required autofocus>
                    </div>

                    ${type === 'expense' ? `
                        <div class="input-group">
                            <label class="input-label">Kategori</label>
                            <select class="input" name="category" required>
                                ${Object.entries(CATEGORIES).map(([key, cat]) => `
                                    <option value="${key}">${cat.icon} ${cat.name}</option>
                                `).join('')}
                            </select>
                        </div>
                    ` : ''}

                    <div class="input-group">
                        <label class="input-label">Deskripsi</label>
                        <input type="text" class="input" name="description" placeholder="Untuk apa?">
                    </div>

                    <div class="input-group">
                        <label class="input-label">Tanggal</label>
                        <input type="date" class="input" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>

                    <button type="submit" class="btn btn-primary">Simpan Transaksi</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.getElementById('addTransactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const transaction = {
                id: Date.now().toString(),
                type: type,
                amount: parseInt(formData.get('amount')),
                description: formData.get('description'),
                date: formData.get('date'),
                category: type === 'expense' ? formData.get('category') : null
            };

            const monthData = this.getCurrentMonthData();
            monthData.transactions.push(transaction);
            this.saveData();

            modal.remove();
            this.renderCurrentScreen();
        });
    }

    showReflectionModal() {
        const monthData = this.getCurrentMonthData();
        const remaining = this.calculateRemaining();
        const totalExpenses = this.calculateTotalExpenses();

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">✨ Refleksi Bulanan</h2>
                    <button class="btn-close" onclick="this.closest('.modal').remove()">Tutup</button>
                </div>

                <p style="text-align: center; color: var(--color-text-secondary); margin-bottom: var(--spacing-lg);">
                    Luangkan waktu untuk meninjau bulan Anda
                </p>

                <div class="card mb-md">
                    <div class="input-label mb-sm">Berapa banyak uang yang Anda miliki?</div>
                    <div class="card-value" style="color: var(--color-accent);">
                        ${this.formatRupiah(remaining)}
                    </div>
                    <div class="input-label">Sisa bulan ini</div>
                </div>

                <div class="card mb-md">
                    <div class="input-label mb-sm">Berapa banyak uang yang ingin Anda tabung?</div>
                    <div class="card-value" style="color: var(--color-income);">
                        ${this.formatRupiah(monthData.savingsTarget)}
                    </div>
                    <div class="input-label">Target tabungan Anda</div>
                </div>

                <div class="card mb-md">
                    <div class="input-label mb-sm">Berapa banyak uang yang Anda keluarkan?</div>
                    <div class="card-value" style="color: var(--color-expense);">
                        ${this.formatRupiah(totalExpenses)}
                    </div>
                    <div class="input-label">Total pengeluaran bulan ini</div>
                </div>

                <form id="reflectionForm">
                    <div class="input-group">
                        <label class="input-label">Bagaimana Anda bisa meningkat?</label>
                        <textarea 
                            class="input" 
                            name="reflection" 
                            rows="5" 
                            placeholder="Tulis pemikiran dan rencana Anda untuk bulan depan..."
                            style="resize: vertical;"
                        >${monthData.reflection || ''}</textarea>
                    </div>

                    <button type="submit" class="btn btn-primary">Simpan Refleksi</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.getElementById('reflectionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            monthData.reflection = formData.get('reflection');
            this.saveData();

            modal.remove();
            alert('Refleksi tersimpan! 🎉');
        });
    }

    deleteTransaction(id) {
        if (confirm('Hapus transaksi ini?')) {
            const monthData = this.getCurrentMonthData();
            monthData.transactions = monthData.transactions.filter(t => t.id !== id);
            this.saveData();
            this.renderCurrentScreen();
        }
    }

    // Helpers
    getMonthName(monthStr) {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        const options = { month: 'long', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }
}

// ==================== INITIALIZE APP ====================
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new KakeiboApp();
});
