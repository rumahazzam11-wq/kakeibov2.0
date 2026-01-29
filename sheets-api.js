// ==================== GOOGLE SHEETS API ====================

class GoogleSheetsAPI {
    constructor() {
        this.spreadsheetId = null;
        this.isConnected = false;
        this.syncQueue = [];
    }

    // Set spreadsheet ID
    setSpreadsheetId(id) {
        this.spreadsheetId = id;
        localStorage.setItem('googleSheetsId', id);
    }

    // Get spreadsheet ID from storage
    getSpreadsheetId() {
        if (!this.spreadsheetId) {
            this.spreadsheetId = localStorage.getItem('googleSheetsId');
        }
        return this.spreadsheetId;
    }

    // Get access token from auth
    getAccessToken() {
        return googleAuth.getApiAccessToken();
    }

    // Test connection to spreadsheet
    async testConnection() {
        if (!this.spreadsheetId) {
            throw new Error('Spreadsheet ID not set');
        }

        const token = this.getAccessToken();
        if (!token) {
            throw new Error('Not authenticated with Google Sheets API');
        }

        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to connect to spreadsheet');
            }

            const data = await response.json();
            this.isConnected = true;
            return { success: true, title: data.properties.title };
        } catch (error) {
            this.isConnected = false;
            throw error;
        }
    }

    // Initialize spreadsheet with required sheets
    async initializeSpreadsheet() {
        const token = this.getAccessToken();

        // Create sheets if they don't exist
        const sheetsToCreate = ['Transactions', 'MonthlyData', 'Settings'];

        for (const sheetName of sheetsToCreate) {
            await this.createSheetIfNotExists(sheetName);
        }

        // Initialize headers
        await this.initializeHeaders();
    }

    // Create sheet if it doesn't exist
    async createSheetIfNotExists(sheetName) {
        const token = this.getAccessToken();

        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();
            const sheetExists = data.sheets.some(sheet => sheet.properties.title === sheetName);

            if (!sheetExists) {
                await fetch(
                    `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            requests: [{
                                addSheet: {
                                    properties: {
                                        title: sheetName
                                    }
                                }
                            }]
                        })
                    }
                );
            }
        } catch (error) {
            console.error(`Error creating sheet ${sheetName}:`, error);
        }
    }

    // Initialize headers for sheets
    async initializeHeaders() {
        const token = this.getAccessToken();

        // Transactions headers
        await this.updateRange('Transactions!A1:G1', [[
            'ID', 'Type', 'Amount', 'Category', 'Description', 'Date', 'Month'
        ]]);

        // MonthlyData headers
        await this.updateRange('MonthlyData!A1:I1', [[
            'Month', 'Income', 'SavingsTarget', 'FixedExpenses', 'Reflection',
            'BudgetKebutuhan', 'BudgetKeinginan', 'BudgetBudaya', 'BudgetTakTerduga'
        ]]);

        // Settings headers
        await this.updateRange('Settings!A1:B1', [[
            'Key', 'Value'
        ]]);
    }

    // Read data from range
    async readRange(range) {
        const token = this.getAccessToken();

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to read from spreadsheet');
        }

        const data = await response.json();
        return data.values || [];
    }

    // Update data in range
    async updateRange(range, values) {
        const token = this.getAccessToken();

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: values
                })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update spreadsheet');
        }

        return await response.json();
    }

    // Append data to sheet
    async appendData(sheetName, values) {
        const token = this.getAccessToken();

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A:Z:append?valueInputOption=RAW`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: values
                })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to append to spreadsheet');
        }

        return await response.json();
    }

    // Sync transactions to Google Sheets
    async syncTransactions(transactions) {
        const rows = transactions.map(t => [
            t.id,
            t.type,
            t.amount,
            t.category || '',
            t.description || '',
            t.date,
            t.date.slice(0, 7) // Month YYYY-MM
        ]);

        // Clear existing transactions (keep header)
        await this.updateRange('Transactions!A2:G', []);

        // Add all transactions
        if (rows.length > 0) {
            await this.updateRange('Transactions!A2', rows);
        }
    }

    // Sync monthly data to Google Sheets
    async syncMonthlyData(months) {
        const rows = Object.entries(months).map(([month, data]) => [
            month,
            data.income || 0,
            data.savingsTarget || 0,
            data.fixedExpenses || 0,
            data.reflection || '',
            data.budgets?.kebutuhan || 0,
            data.budgets?.keinginan || 0,
            data.budgets?.budaya || 0,
            data.budgets?.tak_terduga || 0
        ]);

        // Clear existing data (keep header)
        await this.updateRange('MonthlyData!A2:I', []);

        // Add all monthly data
        if (rows.length > 0) {
            await this.updateRange('MonthlyData!A2', rows);
        }
    }

    // Load all data from Google Sheets
    async loadAllData() {
        const transactions = await this.readRange('Transactions!A2:G');
        const monthlyData = await this.readRange('MonthlyData!A2:I');
        const settings = await this.readRange('Settings!A2:B');

        // Convert to app format
        const data = {
            onboardingComplete: false,
            months: {}
        };

        // Parse settings
        settings.forEach(row => {
            if (row[0] === 'onboardingComplete') {
                data.onboardingComplete = row[1] === 'true';
            }
        });

        // Parse monthly data
        monthlyData.forEach(row => {
            const month = row[0];
            data.months[month] = {
                income: parseInt(row[1]) || 0,
                savingsTarget: parseInt(row[2]) || 0,
                fixedExpenses: parseInt(row[3]) || 0,
                reflection: row[4] || '',
                budgets: {
                    kebutuhan: parseInt(row[5]) || 0,
                    keinginan: parseInt(row[6]) || 0,
                    budaya: parseInt(row[7]) || 0,
                    tak_terduga: parseInt(row[8]) || 0
                },
                transactions: []
            };
        });

        // Parse transactions
        transactions.forEach(row => {
            const month = row[6];
            if (data.months[month]) {
                data.months[month].transactions.push({
                    id: row[0],
                    type: row[1],
                    amount: parseInt(row[2]) || 0,
                    category: row[3] || null,
                    description: row[4] || '',
                    date: row[5]
                });
            }
        });

        return data;
    }

    // Save all data to Google Sheets
    async saveAllData(appData) {
        // Save settings
        await this.updateRange('Settings!A2:B', [[
            'onboardingComplete',
            appData.onboardingComplete ? 'true' : 'false'
        ]]);

        // Collect all transactions
        const allTransactions = [];
        Object.entries(appData.months).forEach(([month, monthData]) => {
            monthData.transactions.forEach(t => {
                allTransactions.push(t);
            });
        });

        // Sync transactions and monthly data
        await this.syncTransactions(allTransactions);
        await this.syncMonthlyData(appData.months);
    }
}

// Export singleton instance
const sheetsAPI = new GoogleSheetsAPI();
