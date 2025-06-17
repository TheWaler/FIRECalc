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
    // let editingExpenseIndex = null; // To store the index of the expense being edited - REPLACED
    let editingExpenseId = null; // Stores ID of expense being edited
    let currentParentIdForSubExpense = null; // Stores parent ID when adding a sub-expense
    const LOCAL_STORAGE_EXPENSES_KEY = 'fireCalcExpenses';

    /**
     * Finds an expense by its ID in a nested expense array.
     * @param {string} id - The ID of the expense to find.
     * @param {Array} currentExpensesArray - The array of expenses to search.
     * @returns {object|null} The found expense object or null if not found.
     */
    function findExpenseById(id, currentExpensesArray) {
        for (const expense of currentExpensesArray) {
            if (expense.id === id) {
                return expense;
            }
            if (expense.subExpenses && expense.subExpenses.length > 0) {
                const foundInSub = findExpenseById(id, expense.subExpenses);
                if (foundInSub) {
                    return foundInSub;
                }
            }
        }
        return null;
    }

    /**
     * Deletes an expense by its ID from a nested expense array.
     * @param {string} id - The ID of the expense to delete.
     * @param {Array} currentExpensesArray - The array of expenses to search (e.g., main expenses or subExpenses).
     * @returns {boolean} True if an expense was deleted, false otherwise.
     */
    function deleteExpenseById(id, currentExpensesArray) {
        for (let i = 0; i < currentExpensesArray.length; i++) {
            if (currentExpensesArray[i].id === id) {
                currentExpensesArray.splice(i, 1);
                return true; // Expense found and deleted at this level
            }
            // If the current expense has sub-expenses, recursively search in them
            if (currentExpensesArray[i].subExpenses && currentExpensesArray[i].subExpenses.length > 0) {
                if (deleteExpenseById(id, currentExpensesArray[i].subExpenses)) {
                    // If a sub-expense was deleted, and if the parent now has no sub-expenses
                    // AND no amount/frequency of its own (which means it was purely a container),
                    // it could potentially be cleaned up or converted.
                    // For now, just ensure the deletion in sub-array is propagated.
                    // Additional logic for parent cleanup can be added if required by product spec.
                    // e.g. if (currentExpensesArray[i].subExpenses.length === 0 && !currentExpensesArray[i].amount) { /* decide if parent should also be removed */ }
                    return true; // Deletion occurred in a sub-array
                }
            }
        }
        return false; // Expense not found in this array or its children
    }


    /**
     * Generates a unique ID string.
     * @returns {string} A unique ID.
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /** Saves the current expenses array to LocalStorage. */
    function saveExpenses() {
        localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(expenses));
    }

    /** Loads the expenses array from LocalStorage. */
    function loadExpenses() {
        const storedExpenses = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
        let dataModified = false; // Flag to track if data was changed
        if (storedExpenses) {
            try {
                const parsedExpenses = JSON.parse(storedExpenses);
                // Basic validation: Ensure it's an array.
                if (Array.isArray(parsedExpenses)) {
                    expenses = parsedExpenses.map(expense => {
                        let currentExpense = { ...expense };
                        if (!currentExpense.id) {
                            currentExpense.id = generateId();
                            dataModified = true;
                        }
                        if (!currentExpense.subExpenses) {
                            currentExpense.subExpenses = [];
                            dataModified = true;
                        }
                        // Future: Could also migrate other properties or validate structure here
                        return currentExpense;
                    });
                } else {
                    console.error('Invalid expenses data in LocalStorage: Not an array. Initializing with empty array.');
                    expenses = [];
                }
            } catch (error) {
                console.error('Error parsing expenses data from LocalStorage. Initializing with empty array.', error);
                expenses = [];
            }
        }
        // If data was modified during loading (e.g., adding IDs), save it back.
        if (dataModified) {
            saveExpenses();
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

    /**
     * Calculates the total annual amount for an expense, including its sub-expenses.
     * @param {object} expense - The expense object.
     * @returns {number} The total annual amount for the expense and its children.
     */
    function getExpenseAnnualAmount(expense) {
        if (expense.subExpenses && expense.subExpenses.length > 0) {
            let total = 0;
            expense.subExpenses.forEach(subExpense => {
                total += getExpenseAnnualAmount(subExpense);
            });
            return total;
        } else {
            // For parent expenses that might also have their own amount/frequency,
            // ensure they are included if subExpenses is empty or not present.
            // Or, if parent's amount/frequency should be ignored if it has children,
            // this logic might need adjustment based on product decision.
            // Current assumption: A parent's amount is its own, children add to it if defined at parent.
            // For this version: if a parent has sub-expenses, its own amount/frequency are ignored for the total.
            // If it has NO sub-expenses, its own amount/frequency are used.
            return calculateAnnualAmount(expense.amount, expense.frequency);
        }
    }


    /**
     * Renders a single expense item and its sub-expenses.
     * @param {object} expense - The expense object to render.
     * @param {number} level - The nesting level (0 for top-level).
     * @param {HTMLElement} containerElement - The UL element to append this expense to.
     */
    function renderSingleExpense(expense, level, containerElement) {
        const li = document.createElement('li');
        li.style.marginLeft = `${level * 20}px`; // Indentation for hierarchy
        li.dataset.id = expense.id; // Set data-id attribute

        const actualAnnualAmount = getExpenseAnnualAmount(expense);

        // Display expense details
        if (expense.subExpenses && expense.subExpenses.length > 0) {
            li.textContent = `[${expense.category}] ${expense.name} - Annual: $${actualAnnualAmount.toLocaleString()}`;
            // Optionally, indicate that this is a parent item, e.g., add a class or specific text
        } else {
            li.textContent = `[${expense.category}] ${expense.name}: $${expense.amount.toLocaleString()} (${expense.frequency}) - Annual: $${actualAnnualAmount.toLocaleString()}`;
        }

        // "Delete" button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-expense-btn'); // Added class for event delegation
        deleteBtn.style.marginLeft = '5px';
        // Onclick handler will be managed by event delegation on expenseList
        li.appendChild(deleteBtn);

        // "Edit" button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('edit-expense-btn'); // Added class for event delegation
        editBtn.style.marginLeft = '5px';
        // Onclick handler will be managed by event delegation on expenseList
        li.appendChild(editBtn);

        // "Add Sub-expense" button
        const addSubBtn = document.createElement('button');
        addSubBtn.textContent = 'Add Sub-expense';
        addSubBtn.classList.add('add-sub-expense-btn'); // Added class for event delegation
        addSubBtn.style.marginLeft = '5px';
        // Onclick handler will be managed by event delegation on expenseList
        li.appendChild(addSubBtn);

        containerElement.appendChild(li);

        // Render sub-expenses
        if (expense.subExpenses && expense.subExpenses.length > 0) {
            const subUl = document.createElement('ul');
            li.appendChild(subUl); // Append sub-list to the parent li
            expense.subExpenses.forEach(subExpense => {
                renderSingleExpense(subExpense, level + 1, subUl);
            });
        }
    }


    function renderExpenses() {
        expenseList.innerHTML = '';
        let grandTotalAnnualCost = 0;

        // Calculate grand total first
        expenses.forEach(topLevelExpense => {
            grandTotalAnnualCost += getExpenseAnnualAmount(topLevelExpense);
        });

        // Then render each top-level expense, which will recursively render children
        expenses.forEach(expense => {
            renderSingleExpense(expense, 0, expenseList);
        });

        totalAnnualExpensesSpan.textContent = `$${grandTotalAnnualCost.toLocaleString()}`;
    }

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            const name = expenseNameInput.value.trim();
            const amount = parseFloat(expenseAmountInput.value);
            const frequency = expenseFrequencySelect.value;
            const category = expenseCategorySelect.value; // Get category

            // Basic validation for name (applies to all modes)
            if (name === '') {
                alert('Expense name cannot be empty.');
                return;
            }
            // Amount validation is now mode-specific below

            // Order of checks: editing, then adding sub-expense, then adding top-level
            if (editingExpenseId !== null) {
                // --- UPDATE EXISTING EXPENSE ---
                const expenseToUpdate = findExpenseById(editingExpenseId, expenses);
                if (expenseToUpdate) {
                    expenseToUpdate.name = name; // Name updated from form
                    expenseToUpdate.category = category; // Category updated from form

                    // Only update amount and frequency if it's a leaf node (form fields should be enabled)
                    if ((!expenseToUpdate.subExpenses || expenseToUpdate.subExpenses.length === 0) && !expenseAmountInput.disabled) {
                        const amountValue = parseFloat(expenseAmountInput.value);
                        if (isNaN(amountValue) || amountValue <= 0) {
                            alert('Expense amount must be a positive number for leaf expenses.');
                            return;
                        }
                        expenseToUpdate.amount = amountValue;
                        expenseToUpdate.frequency = expenseFrequencySelect.value;
                    }
                    // For parent nodes, their amount/frequency are derived and form fields are disabled by the edit listener.

                    showNotification(`Expense '${expenseToUpdate.name}' updated successfully.`, 'success');
                } else {
                    showNotification('Error: Expense to update not found.', 'error');
                }
                resetExpenseEditMode();

            } else if (currentParentIdForSubExpense !== null) {
                // --- ADD NEW SUB-EXPENSE ---
                const subExpenseAmount = parseFloat(expenseAmountInput.value);
                if (isNaN(subExpenseAmount) || subExpenseAmount <= 0) {
                     alert('Expense amount must be a positive number for sub-expenses.');
                     return;
                }
                const parentExpense = findExpenseById(currentParentIdForSubExpense, expenses);
                if (parentExpense) {
                    const newSubExpense = {
                        id: generateId(),
                        name, // Name from form
                        amount: subExpenseAmount, // Validated amount
                        frequency, // Frequency from form
                        category, // Category from form
                        subExpenses: []
                    };
                    parentExpense.subExpenses.push(newSubExpense);
                    showNotification(`Sub-expense '${name}' added to '${parentExpense.name}'.`, 'success');
                } else {
                    showNotification('Error: Parent expense not found for sub-expense.', 'error');
                }
                resetExpenseEditMode();

            } else {
                // --- ADD NEW TOP-LEVEL EXPENSE ---
                const topLevelAmount = parseFloat(expenseAmountInput.value);
                if (isNaN(topLevelAmount) || topLevelAmount <= 0) {
                    alert('Expense amount must be a positive number.');
                    return;
                }
                const newExpense = {
                    id: generateId(),
                    name, // Name from form
                    amount: topLevelAmount, // Validated amount
                    frequency, // Frequency from form
                    category, // Category from form
                    subExpenses: []
                };
                expenses.push(newExpense);
                showNotification(`Expense '${name}' added successfully.`, 'success');
                clearExpenseInputs(); // Standard clear for top-level add
                // resetExpenseEditMode() is not strictly needed here if clearExpenseInputs is sufficient
                // and we are sure editingExpenseId and currentParentIdForSubExpense are null.
                // However, calling it ensures a fully reset state.
                resetExpenseEditMode();
            }

            renderExpenses();
            saveExpenses(); // Save after any of the above actions
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

        // Ensure amount and frequency fields are enabled by default
        expenseAmountInput.disabled = false;
        expenseFrequencySelect.disabled = false;
    }

    /** Resets the expense form from edit mode to add mode. */
    function resetExpenseEditMode() {
        // editingExpenseIndex = null; // REPLACED
        editingExpenseId = null;
        currentParentIdForSubExpense = null; // Also reset parent ID for sub-expense mode
        addExpenseBtn.textContent = 'Add Expense'; // Reset button text

        clearExpenseInputs(); // This will also re-enable fields

        // Potentially, also remove any visual indication of parent expense near the form
        const parentInfoDiv = document.getElementById('parentExpenseInfo');
        if (parentInfoDiv) {
            parentInfoDiv.textContent = '';
            parentInfoDiv.style.display = 'none';
        }
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

    // Event listener for "Add Sub-expense" buttons (using event delegation)
    if(expenseList) {
        expenseList.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-sub-expense-btn')) {
                const listItem = event.target.closest('li[data-id]');
                if (listItem) {
                    const parentId = listItem.dataset.id;
                    const parentExpense = findExpenseById(parentId, expenses); // Fetch to display name

                    resetExpenseEditMode(); // Clear any existing edit state and parentId
                    currentParentIdForSubExpense = parentId;

                    addExpenseBtn.textContent = 'Confirm Sub-expense';
                    expenseNameInput.focus();

                    // Optional: Display parent expense info near the form
                    let parentInfoDiv = document.getElementById('parentExpenseInfo');
                    if (!parentInfoDiv) {
                        parentInfoDiv = document.createElement('div');
                        parentInfoDiv.id = 'parentExpenseInfo';
                        // Insert it before the form or in a suitable location
                        const formElement = expenseNameInput.closest('form') || expenseNameInput.parentElement;
                        formElement.parentNode.insertBefore(parentInfoDiv, formElement);
                    }
                    parentInfoDiv.textContent = `Adding sub-expense to: ${parentExpense ? parentExpense.name : 'Unknown Parent'}`;
                    parentInfoDiv.style.display = 'block';
                    parentInfoDiv.style.marginBottom = '10px';

                    showNotification(`Enter details for sub-expense under '${parentExpense ? parentExpense.name : parentId}'.`, 'success');
                }
            } else if (event.target.classList.contains('edit-expense-btn')) {
                const listItem = event.target.closest('li[data-id]');
                if (listItem) {
                    const expenseIdToEdit = listItem.dataset.id;
                    const expenseToEdit = findExpenseById(expenseIdToEdit, expenses);

                    if (expenseToEdit) {
                        resetExpenseEditMode(); // Clear any other modes
                        editingExpenseId = expenseIdToEdit;

                        // Populate form
                        expenseNameInput.value = expenseToEdit.name;
                        expenseCategorySelect.value = expenseToEdit.category;

                        if (expenseToEdit.subExpenses && expenseToEdit.subExpenses.length > 0) {
                            // Parent node: disable amount/frequency, they are derived
                            expenseAmountInput.value = ''; // Clear or set placeholder
                            expenseAmountInput.disabled = true;
                            expenseFrequencySelect.value = 'monthly'; // Reset or set placeholder
                            expenseFrequencySelect.disabled = true;
                            // Optionally, display text indicating these fields are not applicable
                            // e.g. expenseAmountInput.placeholder = "N/A - Parent Expense";
                        } else {
                            // Leaf node: enable and populate amount/frequency
                            expenseAmountInput.disabled = false;
                            expenseFrequencySelect.disabled = false;
                            expenseAmountInput.value = expenseToEdit.amount;
                            expenseFrequencySelect.value = expenseToEdit.frequency;
                        }

                        addExpenseBtn.textContent = 'Update Expense';
                        expenseNameInput.focus();
                        showNotification(`Editing expense: '${expenseToEdit.name}'.`, 'success');
                    } else {
                        showNotification('Error: Could not find expense to edit.', 'error');
                    }
                }
            } else if (event.target.classList.contains('delete-expense-btn')) {
                const listItem = event.target.closest('li[data-id]');
                if (listItem) {
                    const expenseIdToDelete = listItem.dataset.id;
                    const expenseToDelete = findExpenseById(expenseIdToDelete, expenses);
                    const expenseName = expenseToDelete ? expenseToDelete.name : "this expense";

                    if (confirm(`Are you sure you want to delete "${expenseName}" and all its sub-expenses?`)) {
                        const deleted = deleteExpenseById(expenseIdToDelete, expenses);
                        if (deleted) {
                            showNotification(`Expense '${expenseName}' and its sub-expenses deleted.`, 'success');

                            // If the currently edited expense or its ancestor was deleted, reset form
                            if (editingExpenseId && !findExpenseById(editingExpenseId, expenses)) {
                                resetExpenseEditMode();
                            }
                            // If the parent for a new sub-expense or its ancestor was deleted, reset form
                            if (currentParentIdForSubExpense && !findExpenseById(currentParentIdForSubExpense, expenses)) {
                                resetExpenseEditMode(); // Also clears currentParentIdForSubExpense
                            }

                            saveExpenses();
                            renderExpenses(); // Re-render the list
                        } else {
                            // This case should ideally not be reached if buttons are correctly linked to existing items
                            showNotification('Error: Expense not found for deletion.', 'error');
                        }
                    }
                }
            }
        });
    }
});
