"use strict";
// Basic JavaScript for the project
// console.log("JavaScript file loaded"); // Keep for debugging if needed, or remove for production

document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOM fully loaded and parsed"); // Keep for debugging if needed

    // --- General UI Elements & Functions ---
    const userNotificationDiv = document.getElementById('userNotification');
    let notificationTimeout;

    /**
     * Displays a notification message to the user.
     * @param {string} message - The message to display.
     * @param {string} [type='success'] - The type of notification ('success' or 'error').
     */
    function showNotification(message, type = 'success') {
        clearTimeout(notificationTimeout);

        userNotificationDiv.textContent = message;
        userNotificationDiv.classList.remove('notification-success', 'notification-error'); // Remove old classes
        userNotificationDiv.classList.add(type === 'success' ? 'notification-success' : 'notification-error');

        userNotificationDiv.classList.add('show');

        notificationTimeout = setTimeout(() => {
            userNotificationDiv.classList.remove('show');
        }, 3000); // Notification visible for 3 seconds
    }

    // --- Portfolio Tracking ---
    const assetNameInput = document.getElementById('assetName');
    const assetValueInput = document.getElementById('assetValue');
    const assetTypeSelect = document.getElementById('assetType'); // Added for asset type
    const addAssetBtn = document.getElementById('addAssetBtn');
    const portfolioList = document.getElementById('portfolioList');
    const totalPortfolioValueSpan = document.getElementById('totalPortfolioValue');

    let portfolio = [];
    let editingAssetIndex = null; // To store the index of the asset being edited
    const LOCAL_STORAGE_PORTFOLIO_KEY = 'fireCalcPortfolio';

    /** Saves the current portfolio array to LocalStorage. */
    function savePortfolio() {
        localStorage.setItem(LOCAL_STORAGE_PORTFOLIO_KEY, JSON.stringify(portfolio));
    }

    /** Loads the portfolio array from LocalStorage. */
    function loadPortfolio() {
        const storedPortfolio = localStorage.getItem(LOCAL_STORAGE_PORTFOLIO_KEY);
        if (storedPortfolio) {
            try {
                const parsedPortfolio = JSON.parse(storedPortfolio);
                // Basic validation: Ensure it's an array. More robust validation could check item structure.
                if (Array.isArray(parsedPortfolio)) {
                    portfolio = parsedPortfolio;
                } else {
                    console.error('Invalid portfolio data in LocalStorage: Not an array. Initializing with empty array.');
                    portfolio = [];
                }
            } catch (error) {
                console.error('Error parsing portfolio data from LocalStorage. Initializing with empty array.', error);
                portfolio = [];
            }
        }
        // If nothing in localStorage, portfolio remains its default empty array: let portfolio = [];
    }

    /** Renders the portfolio items to the UI and updates the total value. */
    function renderPortfolio() {
        portfolioList.innerHTML = ''; // Clear existing list
        let totalValue = 0;

        portfolio.forEach((asset, index) => {
            const li = document.createElement('li');
            // Updated to display asset type
            li.textContent = `${asset.type}: ${asset.name} - $${asset.value.toLocaleString()}`;

            // Add an Edit button for each asset
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginLeft = '10px';
            editBtn.onclick = () => {
                editingAssetIndex = index;
                assetNameInput.value = asset.name;
                assetValueInput.value = asset.value;
                assetTypeSelect.value = asset.type; // Set asset type in dropdown
                addAssetBtn.textContent = 'Update Asset';
            };
            li.appendChild(editBtn);

            // Add a delete button for each asset
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.marginLeft = '5px'; // Adjusted margin
            deleteBtn.onclick = () => {
                const deletedAssetName = portfolio[index].name; // Capture name before splice

                // If deleting the item currently being edited, reset edit mode
                if (editingAssetIndex === index) {
                    resetAssetEditMode();
                }
                portfolio.splice(index, 1);
                // If an item with a higher index was being edited, adjust editingAssetIndex
                if (editingAssetIndex !== null && editingAssetIndex > index) {
                    editingAssetIndex--;
                }
                renderPortfolio();
                savePortfolio(); // Save after deleting
                showNotification(`Asset '${deletedAssetName}' deleted.`, 'success');
            };
            li.appendChild(deleteBtn);
            portfolioList.appendChild(li);
            totalValue += asset.value;
        });

        totalPortfolioValueSpan.textContent = `$${totalValue.toLocaleString()}`;
    }

    if (addAssetBtn) {
        addAssetBtn.addEventListener('click', () => {
            const name = assetNameInput.value.trim();
            const rawValue = assetValueInput.value; // Keep raw value for specific NaN check
            const type = assetTypeSelect.value; // Get asset type

            // Validate asset name
            if (name === '') {
                alert('Asset name cannot be empty.');
                return; // Stop execution if validation fails
            }

            // Validate asset value
            const value = parseFloat(rawValue);

            if (isNaN(value)) {
                // This catches empty string, non-numeric strings
                alert('Asset value must be a valid number.');
                return; // Stop execution if validation fails
            }

            if (value <= 0) {
                alert('Asset value must be a positive number.');
                return; // Stop execution if validation fails
            }

            // If all validations pass:
            if (editingAssetIndex !== null) {
                // Update existing asset
                portfolio[editingAssetIndex] = { name, value, type };
                showNotification(`Asset '${name}' updated successfully.`, 'success');
                resetAssetEditMode();
            } else {
                // Add new asset
                portfolio.push({ name, value, type });
                showNotification(`Asset '${name}' added successfully.`, 'success');
                clearAssetInputs(); // Clear after successful add
            }
            renderPortfolio();
            savePortfolio(); // Save after adding or updating
        });
    } else {
        console.error('Add Asset button not found');
    }

    /** Clears the input fields in the asset form. */
    function clearAssetInputs() {
        assetNameInput.value = '';
        assetValueInput.value = '';
        assetTypeSelect.value = 'Stocks'; // Reset to default
    }

    /** Resets the asset form from edit mode to add mode. */
    function resetAssetEditMode() {
        editingAssetIndex = null;
        addAssetBtn.textContent = 'Add Asset';
        clearAssetInputs();
    }

    // --- Expense Input ---
    // DOM Elements for Expenses
    const expenseNameInput = document.getElementById('expenseName');
    const expenseAmountInput = document.getElementById('expenseAmount');
    const expenseFrequencySelect = document.getElementById('expenseFrequency');
    const expenseCategorySelect = document.getElementById('expenseCategory'); // Added for category
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const expenseList = document.getElementById('expenseList');
    const totalAnnualExpensesSpan = document.getElementById('totalAnnualExpenses');

    let expenses = [];
    let editingExpenseIndex = null; // To store the index of the expense being edited
    const LOCAL_STORAGE_EXPENSES_KEY = 'fireCalcExpenses';

    /** Saves the current expenses array to LocalStorage. */
    function saveExpenses() {
        localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(expenses));
    }

    /** Loads the expenses array from LocalStorage. */
    function loadExpenses() {
        const storedExpenses = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
        if (storedExpenses) {
            try {
                const parsedExpenses = JSON.parse(storedExpenses);
                // Basic validation: Ensure it's an array.
                if (Array.isArray(parsedExpenses)) {
                    expenses = parsedExpenses;
                } else {
                    console.error('Invalid expenses data in LocalStorage: Not an array. Initializing with empty array.');
                    expenses = [];
                }
            } catch (error) {
                console.error('Error parsing expenses data from LocalStorage. Initializing with empty array.', error);
                expenses = [];
            }
        }
    }

    /**
     * Calculates the annual amount of an expense based on its frequency.
     * @param {number} amount - The amount of the expense.
     * @param {string} frequency - The frequency of the expense ('daily', 'weekly', 'monthly', 'yearly').
     * @returns {number} The calculated annual amount.
     */
    function calculateAnnualAmount(amount, frequency) {
        switch (frequency) {
            case 'daily':
                return amount * 365;
            case 'weekly':
                return amount * 52;
            case 'monthly':
                return amount * 12;
            case 'yearly':
                return amount;
            default:
                return 0;
        }
    }

    function renderExpenses() {
        expenseList.innerHTML = '';
        let totalAnnualCost = 0;

        // Each expense object is expected to have: { name, amount, frequency, category }
        expenses.forEach((expense, index) => {
            const li = document.createElement('li');
            const annualAmount = calculateAnnualAmount(expense.amount, expense.frequency);
            // Updated to display expense category
            li.textContent = `${expense.category}: ${expense.name} - $${expense.amount.toLocaleString()} (${expense.frequency}) - Annual: $${annualAmount.toLocaleString()}`;

            // Add an Edit button for each expense
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginLeft = '10px';
            editBtn.onclick = () => {
                editingExpenseIndex = index;
                expenseNameInput.value = expense.name;
                expenseAmountInput.value = expense.amount;
                expenseFrequencySelect.value = expense.frequency;
                expenseCategorySelect.value = expense.category; // Set category in dropdown
                addExpenseBtn.textContent = 'Update Expense';
            };
            li.appendChild(editBtn);

            // Add a delete button for each expense
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.marginLeft = '5px'; // Adjusted margin
            deleteBtn.onclick = () => {
                const deletedExpenseName = expenses[index].name; // Capture name before splice

                // If deleting the item currently being edited, reset edit mode
                if (editingExpenseIndex === index) {
                    resetExpenseEditMode();
                }
                expenses.splice(index, 1);
                // If an item with a higher index was being edited, adjust editingExpenseIndex
                if (editingExpenseIndex !== null && editingExpenseIndex > index) {
                    editingExpenseIndex--;
                }
                renderExpenses();
                saveExpenses(); // Save after deleting
                showNotification(`Expense '${deletedExpenseName}' deleted.`, 'success');
            };
            li.appendChild(deleteBtn);
            expenseList.appendChild(li);
            totalAnnualCost += annualAmount;
        });

        totalAnnualExpensesSpan.textContent = `$${totalAnnualCost.toLocaleString()}`;
    }

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            const name = expenseNameInput.value.trim();
            const amount = parseFloat(expenseAmountInput.value);
            const frequency = expenseFrequencySelect.value;
            const category = expenseCategorySelect.value; // Get category

            // Basic validation (as per existing code)
            if (name === '') {
                alert('Expense name cannot be empty.');
                return;
            }
            if (isNaN(amount) || amount <= 0) {
                alert('Expense amount must be a positive number.');
                return;
            }

            if (editingExpenseIndex !== null) {
                // Update existing expense
                expenses[editingExpenseIndex] = { name, amount, frequency, category };
                showNotification(`Expense '${name}' updated successfully.`, 'success');
                resetExpenseEditMode();
            } else {
                // Add new expense
                expenses.push({ name, amount, frequency, category });
                showNotification(`Expense '${name}' added successfully.`, 'success');
                clearExpenseInputs(); // Clear after successful add
            }
            renderExpenses();
            saveExpenses(); // Save after adding or updating
        });
    } else {
        console.error('Add Expense button not found');
    }

    /** Clears the input fields in the expense form. */
    function clearExpenseInputs() {
        expenseNameInput.value = '';
        expenseAmountInput.value = '';
        expenseFrequencySelect.value = 'monthly';
        expenseCategorySelect.value = 'Housing';
    }

    /** Resets the expense form from edit mode to add mode. */
    function resetExpenseEditMode() {
        editingExpenseIndex = null;
        addExpenseBtn.textContent = 'Add Expense';
        clearExpenseInputs();
    }

    // --- Withdrawal Simulation ---
    // DOM Elements for Simulation
    const withdrawalRateInput = document.getElementById('withdrawalRate');
    const simulationYearsInput = document.getElementById('simulationYears');
    const enableGuardrailCheckbox = document.getElementById('enableGuardrail');
    const runSimulationBtn = document.getElementById('runSimulationBtn');
    const simulationResultsDiv = document.getElementById('simulationResults');

    /**
     * Gathers and validates inputs for the withdrawal simulation.
     * @returns {object|null} An object with simulation parameters or null if validation fails.
     */
    function getSimulationInputs() {
        const rawPortfolioValue = totalPortfolioValueSpan.textContent.replace(/[^0-9.-]+/g, "");
        const initialPortfolioValue = parseFloat(rawPortfolioValue);
        const withdrawalRate = parseFloat(withdrawalRateInput.value);
        const simulationYears = parseInt(simulationYearsInput.value, 10);
        const useGuardrail = enableGuardrailCheckbox.checked;

        // Validate that the portfolio has a value before simulation
        if (isNaN(initialPortfolioValue) || initialPortfolioValue <= 0) { // Check for <=0 for meaningful simulation
            alert('Initial portfolio value must be positive. Please add assets to your portfolio.');
            return null;
        }
        if (isNaN(withdrawalRate) || withdrawalRate <= 0) {
            alert('Withdrawal rate must be a positive number.');
            return null;
        }
        if (isNaN(simulationYears) || simulationYears <= 0) {
            alert('Simulation years must be a positive integer.');
            return null;
        }
        return { initialPortfolioValue, withdrawalRate, simulationYears, useGuardrail };
    }

    /**
     * Performs the withdrawal simulation based on the provided inputs.
     * @param {object} inputs - The validated simulation parameters.
     * @returns {object} An object containing simulationData (array of yearly results) and depletedYear (number or -1).
     */
    function performSimulationLogic(inputs) {
        let currentPortfolioValue = inputs.initialPortfolioValue;
        // Store the initial portfolio value at the start of the simulation for guardrail percentage calculation
        const guardrailReferenceInitialValue = inputs.initialPortfolioValue;
        const simulationData = [];
        let depletedYear = -1;

        for (let i = 0; i < inputs.simulationYears; i++) {
            const yearNumber = i + 1;
            const portfolioAtStartOfYear = currentPortfolioValue;
            let isAdjusted = false; // Flag to indicate if withdrawal was adjusted by guardrail

            // Calculate standard withdrawal amount for the year
            let actualWithdrawalAmount = portfolioAtStartOfYear * (inputs.withdrawalRate / 100);

            // Apply Guardrail if enabled and portfolio value is below 50% of its initial value
            if (inputs.useGuardrail && portfolioAtStartOfYear < (guardrailReferenceInitialValue * 0.50)) {
                actualWithdrawalAmount *= 0.90; // Reduce withdrawal by 10%
                isAdjusted = true;
            }

            currentPortfolioValue -= actualWithdrawalAmount; // Subtract withdrawal from portfolio

            // Each yearData object: { year, startValue, withdrawal, endValue, isAdjusted }
            const yearData = {
                year: yearNumber,
                startValue: portfolioAtStartOfYear,
                withdrawal: actualWithdrawalAmount,
                endValue: Math.max(0, currentPortfolioValue), // Ensure end value doesn't go negative
                isAdjusted: isAdjusted
            };
            simulationData.push(yearData);

            if (currentPortfolioValue <= 0) {
                depletedYear = yearNumber;
                // Ensure the final entry reflects exact depletion if it occurs
                simulationData[simulationData.length - 1].endValue = 0;
                break; // Exit loop if portfolio is depleted
            }
        }
        return { simulationData, depletedYear };
    }

    /**
     * Displays the simulation results in a table format.
     * @param {object} results - The results from performSimulationLogic ({ simulationData, depletedYear }).
     * @param {number} simulationYears - The total number of years the simulation was run for.
     */
    function displaySimulationResults(results, simulationYears) {
        simulationResultsDiv.innerHTML = '';
        const resultsTitle = document.createElement('h3');
        resultsTitle.textContent = 'Simulation Results';
        simulationResultsDiv.appendChild(resultsTitle);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');
        ['Year', 'Start Value', 'Withdrawal Amount', 'End Value'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        results.simulationData.forEach(data => {
            const row = document.createElement('tr');
            Object.values(data).forEach((value, index) => {
                // Skip isAdjusted for direct table cell creation
                if (index === 4 && typeof value === 'boolean') return;

                const cell = document.createElement('td');
                let cellText = value;
                if (index === 1 || index === 2 || index === 3) { // startValue, withdrawal, endValue
                    cellText = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                if (index === 2 && data.isAdjusted) { // withdrawal amount and adjusted
                    cellText += " (Adjusted)";
                }
                cell.textContent = cellText;
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        simulationResultsDiv.appendChild(table);

        const messageElement = document.createElement('p');
        messageElement.style.fontWeight = 'bold';
        if (results.depletedYear !== -1) {
            messageElement.style.color = 'red';
            messageElement.textContent = `Portfolio depleted in Year ${results.depletedYear}.`;
        } else {
            messageElement.style.color = 'green';
            messageElement.textContent = `Portfolio survived ${simulationYears} years.`;
        }
        simulationResultsDiv.appendChild(messageElement);
    }

    if (runSimulationBtn) {
        runSimulationBtn.addEventListener('click', () => {
            const inputs = getSimulationInputs();
            if (!inputs) return;

            const simulationResults = performSimulationLogic(inputs);
            displaySimulationResults(simulationResults, inputs.simulationYears);
            showNotification('Simulation complete.', 'success');
        });
    } else {
        console.error('Run Simulation button not found');
    }

    // --- Initialization ---
    // Load data from LocalStorage and render initial UI state
    loadPortfolio();
    renderPortfolio();
    loadExpenses();
    renderExpenses();
});
