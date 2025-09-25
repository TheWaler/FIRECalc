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
            userNotificationDiv.textContent = '';
        }, 3000); // Notification visible for 3 seconds
    }

    /**
     * Generates a normally distributed random number using the Box-Muller transform.
     * @param {number} mean - The mean of the distribution.
     * @param {number} stdDev - The standard deviation of the distribution.
     * @returns {number} A random number drawn from N(mean, stdDev^2).
     */
    function randomNormal(mean = 0, stdDev = 1) {
        let u1 = 0;
        let u2 = 0;
        while (u1 === 0) {
            u1 = Math.random();
        }
        while (u2 === 0) {
            u2 = Math.random();
        }
        const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + stdDev * randStdNormal;
    }

    /**
     * Calculates the percentile value for a sorted array.
     * @param {Array<number>} sortedArray - Array sorted in ascending order.
     * @param {number} percentile - Percentile value between 0 and 100.
     * @returns {number} The interpolated percentile value.
     */
    function calculatePercentile(sortedArray, percentile) {
        if (!sortedArray.length) {
            return 0;
        }
        if (percentile <= 0) {
            return sortedArray[0];
        }
        if (percentile >= 100) {
            return sortedArray[sortedArray.length - 1];
        }

        const index = (sortedArray.length - 1) * (percentile / 100);
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);

        if (lowerIndex === upperIndex) {
            return sortedArray[lowerIndex];
        }

        const weight = index - lowerIndex;
        return sortedArray[lowerIndex] * (1 - weight) + sortedArray[upperIndex] * weight;
    }

    /**
     * Runs a Monte Carlo simulation using the provided inputs.
     * @param {object} inputs - Validated simulation inputs.
     * @param {object} [options] - Optional configuration for the Monte Carlo simulation.
     * @param {number} [options.iterations=1000] - Number of Monte Carlo iterations.
     * @param {number} [options.returnStdDev=12] - Standard deviation for annual returns (percentage points).
     * @param {number} [options.baseAnnualWithdrawal] - Base annual withdrawal amount before inflation adjustments.
     * @param {boolean} [options.usingExpenses=false] - Indicates whether the withdrawal amount is derived from expenses.
     * @returns {object} Summary statistics from the Monte Carlo simulation.
     */
    function runMonteCarloSimulation(inputs, options = {}) {
        const iterations = typeof options.iterations === 'number' && options.iterations > 0 ? Math.floor(options.iterations) : 1000;
        const returnStdDev = typeof options.returnStdDev === 'number' && options.returnStdDev >= 0 ? options.returnStdDev : 12;
        const fallbackWithdrawal = inputs.initialPortfolioValue * (inputs.withdrawalRate / 100);
        const baseAnnualWithdrawal = (typeof options.baseAnnualWithdrawal === 'number' && options.baseAnnualWithdrawal > 0)
            ? options.baseAnnualWithdrawal
            : fallbackWithdrawal;
        const usingExpenses = Boolean(options.usingExpenses && baseAnnualWithdrawal !== fallbackWithdrawal);

        const inflationRateDecimal = inputs.expectedInflationRate / 100;

        const endingBalances = [];
        const depletionYears = [];
        let successCount = 0;

        for (let iteration = 0; iteration < iterations; iteration++) {
            let portfolioValue = inputs.initialPortfolioValue;
            const guardrailReferenceInitialValue = inputs.initialPortfolioValue;
            let depletedYear = -1;

            for (let year = 0; year < inputs.simulationYears; year++) {
                const startOfYearValue = portfolioValue;
                let targetWithdrawal = baseAnnualWithdrawal * Math.pow(1 + inflationRateDecimal, year);

                if (inputs.useGuardrail && startOfYearValue < (guardrailReferenceInitialValue * 0.50)) {
                    targetWithdrawal *= 0.90;
                }

                const actualWithdrawal = Math.min(targetWithdrawal, portfolioValue);
                portfolioValue -= actualWithdrawal;

                if (portfolioValue <= 0) {
                    portfolioValue = 0;
                    depletedYear = year + 1;
                    break;
                }

                const annualReturn = Math.max(-100, randomNormal(inputs.nominalReturnRate, returnStdDev));
                portfolioValue *= (1 + (annualReturn / 100));

                if (portfolioValue <= 0) {
                    portfolioValue = 0;
                    depletedYear = year + 1;
                    break;
                }
            }

            if (depletedYear === -1) {
                successCount += 1;
            }

            endingBalances.push(portfolioValue);
            depletionYears.push(depletedYear);
        }

        endingBalances.sort((a, b) => a - b);
        const endingBalancesTotal = endingBalances.reduce((sum, value) => sum + value, 0);

        const failedYears = depletionYears.filter(year => year !== -1);
        const averageDepletionYear = failedYears.length
            ? failedYears.reduce((sum, value) => sum + value, 0) / failedYears.length
            : null;

        return {
            iterations,
            usingExpenses,
            baseAnnualWithdrawal,
            successCount,
            successRate: (successCount / iterations) * 100,
            failureRate: 100 - ((successCount / iterations) * 100),
            medianEndingBalance: calculatePercentile(endingBalances, 50),
            percentile10EndingBalance: calculatePercentile(endingBalances, 10),
            percentile90EndingBalance: calculatePercentile(endingBalances, 90),
            averageEndingBalance: endingBalancesTotal / iterations,
            averageDepletionYear,
            simulationYears: inputs.simulationYears
        };
    }

    /**
     * Displays the Monte Carlo simulation summary in the UI.
     * @param {object} results - Summary statistics from runMonteCarloSimulation.
     * @param {object} inputs - Simulation inputs for contextual messaging.
     */
    function displayMonteCarloResults(results, inputs) {
        if (!monteCarloResultsDiv || !results) {
            return;
        }

        monteCarloResultsDiv.innerHTML = '';

        const heading = document.createElement('h3');
        heading.textContent = `Monte Carlo Simulation (${results.iterations} runs)`;
        heading.classList.add('results-title');
        monteCarloResultsDiv.appendChild(heading);

        const baseWithdrawalFormatted = `$${results.baseAnnualWithdrawal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const spendingParagraph = document.createElement('p');
        spendingParagraph.textContent = results.usingExpenses
            ? `Annual spending is based on your recorded expenses (${baseWithdrawalFormatted}) and is adjusted for inflation each year.`
            : `Annual spending is based on a ${inputs.withdrawalRate}% withdrawal rate (${baseWithdrawalFormatted}) and is adjusted for inflation each year.`;
        monteCarloResultsDiv.appendChild(spendingParagraph);

        const successParagraph = document.createElement('p');
        successParagraph.textContent = `Success Rate: ${results.successRate.toFixed(1)}% (${results.successCount} of ${results.iterations} simulations sustained ${results.simulationYears} years).`;
        monteCarloResultsDiv.appendChild(successParagraph);

        if (results.averageDepletionYear) {
            const failureParagraph = document.createElement('p');
            failureParagraph.textContent = `Average depletion year for unsuccessful runs: Year ${results.averageDepletionYear.toFixed(1)}.`;
            monteCarloResultsDiv.appendChild(failureParagraph);
        }

        const statsList = document.createElement('ul');

        const medianItem = document.createElement('li');
        medianItem.textContent = `Median ending balance: $${results.medianEndingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        statsList.appendChild(medianItem);

        const percentile10Item = document.createElement('li');
        percentile10Item.textContent = `10th percentile ending balance: $${results.percentile10EndingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        statsList.appendChild(percentile10Item);

        const percentile90Item = document.createElement('li');
        percentile90Item.textContent = `90th percentile ending balance: $${results.percentile90EndingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        statsList.appendChild(percentile90Item);

        const averageItem = document.createElement('li');
        averageItem.textContent = `Average ending balance: $${results.averageEndingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        statsList.appendChild(averageItem);

        monteCarloResultsDiv.appendChild(statsList);
    }

    /**
     * Runs the deterministic simulation and accompanying Monte Carlo simulation.
     * @param {object} [options]
     * @param {boolean} [options.suppressNotifications=false] - When true, validation errors do not trigger UI notifications.
     * @param {boolean} [options.triggeredByAuto=false] - Indicates if the run was triggered automatically.
     */
    function runSimulationAndMonteCarlo({ suppressNotifications = false, triggeredByAuto = false } = {}) {
        const inputs = getSimulationInputs(suppressNotifications);
        if (!inputs) {
            return;
        }

        const simulationResults = performSimulationLogic(inputs);
        displaySimulationResults(simulationResults, inputs.simulationYears, inputs);

        const chartLabels = ['Year 0'];
        const chartDataPointsNominal = [inputs.initialPortfolioValue];
        const chartDataPointsReal = [inputs.initialPortfolioValue];

        const inflationRateDecimal = inputs.expectedInflationRate / 100;
        simulationResults.simulationData.forEach(data => {
            chartLabels.push(`Year ${data.year}`);
            chartDataPointsNominal.push(data.endValue);

            const realEndValue = data.endValue / Math.pow(1 + inflationRateDecimal, data.year);
            chartDataPointsReal.push(realEndValue);
        });

        const chartWasHidden = chartContainer ? chartContainer.hasAttribute('hidden') : true;
        const toggleWasExpanded = toggleChartBtn ? toggleChartBtn.getAttribute('aria-expanded') === 'true' : false;

        if (toggleChartBtn) {
            toggleChartBtn.style.display = 'inline-block';
        }

        updateChart(chartLabels, chartDataPointsNominal, chartDataPointsReal, inputs);

        if (triggeredByAuto) {
            if (chartContainer) {
                if (!chartWasHidden || toggleWasExpanded) {
                    chartContainer.removeAttribute('hidden');
                } else {
                    chartContainer.setAttribute('hidden', '');
                }
            }
            if (toggleChartBtn) {
                const expanded = !chartWasHidden || toggleWasExpanded;
                toggleChartBtn.textContent = expanded ? 'Hide Chart' : 'Show Chart';
                toggleChartBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            }
        } else {
            if (chartContainer) {
                chartContainer.setAttribute('hidden', '');
            }
            if (toggleChartBtn) {
                toggleChartBtn.textContent = 'Show Chart';
                toggleChartBtn.setAttribute('aria-expanded', 'false');
            }
            if (!suppressNotifications) {
                showNotification('Simulation complete.', 'success');
            }
        }

        const annualExpensesValue = parseFloat(totalAnnualExpensesSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        const initialAnnualWithdrawalNominal = inputs.initialPortfolioValue * (inputs.withdrawalRate / 100);
        const baseAnnualWithdrawal = annualExpensesValue > 0 ? annualExpensesValue : initialAnnualWithdrawalNominal;
        const usingExpenses = annualExpensesValue > 0;

        const monteCarloResults = runMonteCarloSimulation(inputs, {
            baseAnnualWithdrawal,
            usingExpenses
        });

        displayMonteCarloResults(monteCarloResults, inputs);
    }

    /**
     * Automatically runs simulations when new data is available and inputs are valid.
     */
    function autoRunSimulationsIfPossible() {
        const totalPortfolioValue = parseFloat(totalPortfolioValueSpan.textContent.replace(/[^0-9.-]+/g, '')) || 0;
        if (totalPortfolioValue <= 0) {
            if (monteCarloResultsDiv) {
                monteCarloResultsDiv.innerHTML = '';
            }
            return;
        }
        runSimulationAndMonteCarlo({ suppressNotifications: true, triggeredByAuto: true });
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
        autoRunSimulationsIfPossible();
    }

    if (addAssetBtn) {
        addAssetBtn.addEventListener('click', () => {
            const name = assetNameInput.value.trim();
            const rawValue = assetValueInput.value; // Keep raw value for specific NaN check
            const type = assetTypeSelect.value; // Get asset type

            // Validate asset name
            if (name === '') {
                showNotification('Asset name cannot be empty.', 'error');
                return; // Stop execution if validation fails
            }

            // Validate asset value
            const value = parseFloat(rawValue);

            if (isNaN(value)) {
                // This catches empty string, non-numeric strings
                showNotification('Asset value must be a valid number.', 'error');
                return; // Stop execution if validation fails
            }

            if (value <= 0) {
                showNotification('Asset value must be a positive number.', 'error');
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
        autoRunSimulationsIfPossible();
    }

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            const name = expenseNameInput.value.trim();
            const amount = parseFloat(expenseAmountInput.value);
            const frequency = expenseFrequencySelect.value;
            const category = expenseCategorySelect.value; // Get category

            // Basic validation for name (applies to all modes)
            if (name === '') {
                showNotification('Expense name cannot be empty.', 'error');
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
                            showNotification('Expense amount must be a positive number for leaf expenses.', 'error');
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
                     showNotification('Expense amount must be a positive number for sub-expenses.', 'error');
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
                    showNotification('Expense amount must be a positive number.', 'error');
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
    const returnRateInput = document.getElementById('returnRate'); // Added for investment return rate
    const enableGuardrailCheckbox = document.getElementById('enableGuardrail');
    const expectedInflationRateInput = document.getElementById('inflationRate'); // Matches index.html field
    const runSimulationBtn = document.getElementById('runSimulationBtn');
    const simulationResultsDiv = document.getElementById('simulationResults');
    const toggleChartBtn = document.getElementById('toggleChartBtn'); // Chart button
    const chartContainer = document.getElementById('chartContainer'); // Chart container div
    const simulationChartCanvas = document.getElementById('simulationChart'); // Canvas element
    const monteCarloResultsDiv = document.getElementById('monteCarloResults');

    let currentChart = null; // To hold the chart instance

    /**
     * Gathers and validates inputs for the withdrawal simulation.
     * @returns {object|null} An object with simulation parameters or null if validation fails.
     */
    function getSimulationInputs(suppressNotifications = false) {
        const rawPortfolioValue = totalPortfolioValueSpan.textContent.replace(/[^0-9.-]+/g, "");
        const initialPortfolioValue = parseFloat(rawPortfolioValue);
        const withdrawalRate = parseFloat(withdrawalRateInput.value); // This is the SWR
        const simulationYears = parseInt(simulationYearsInput.value, 10);
        const nominalReturnRate = parseFloat(returnRateInput.value); // Nominal investment return rate
        const expectedInflationRate = parseFloat(expectedInflationRateInput.value);
        const useGuardrail = enableGuardrailCheckbox.checked;

        // Validate that the portfolio has a value before simulation
        if (isNaN(initialPortfolioValue) || initialPortfolioValue <= 0) { // Check for <=0 for meaningful simulation
            if (!suppressNotifications) {
                showNotification('Initial portfolio value must be positive. Please add assets to your portfolio.', 'error');
            }
            return null;
        }
        if (isNaN(withdrawalRate) || withdrawalRate <= 0) {
            if (!suppressNotifications) {
                showNotification('Withdrawal rate must be a positive number.', 'error');
            }
            return null;
        }
        if (isNaN(simulationYears) || simulationYears <= 0) {
            if (!suppressNotifications) {
                showNotification('Simulation years must be a positive integer.', 'error');
            }
            return null;
        }
        // Validation for Expected Annual Inflation Rate: must be a number and not negative.
        if (isNaN(expectedInflationRate)) {
            if (!suppressNotifications) {
                showNotification('Expected inflation rate must be a valid number.', 'error');
            }
            return null;
        }
        if (expectedInflationRate < 0) {
            if (!suppressNotifications) {
                showNotification('Expected inflation rate cannot be negative. Please enter a non-negative number.', 'error');
            }
            return null;
        }
        if (isNaN(nominalReturnRate) || nominalReturnRate < 0) { // Allow 0% return
            if (!suppressNotifications) {
                showNotification('Expected investment rate of return must be a non-negative number.', 'error');
            }
            return null;
        }
        return { initialPortfolioValue, withdrawalRate, simulationYears, useGuardrail, nominalReturnRate, expectedInflationRate };
    }

    /**
     * Performs the withdrawal simulation based on the provided inputs.
     * @param {object} inputs - The validated simulation parameters.
     * @returns {object} An object containing simulationData (array of yearly results) and depletedYear (number or -1).
     */
    function performSimulationLogic(inputs) {
        let currentPortfolioValueNominal = inputs.initialPortfolioValue;
        const guardrailReferenceInitialValue = inputs.initialPortfolioValue;
        const simulationData = [];
        let depletedYear = -1;

        const nominalReturnRateDecimal = inputs.nominalReturnRate / 100;
        const inflationRateDecimal = inputs.expectedInflationRate / 100;
        // const realReturnRateDecimal = ((1 + nominalReturnRateDecimal) / (1 + inflationRateDecimal)) - 1; // Not directly used for portfolio growth if withdrawals are inflation-adjusted separately

        const initialAnnualWithdrawalNominal = inputs.initialPortfolioValue * (inputs.withdrawalRate / 100);

        for (let i = 0; i < inputs.simulationYears; i++) {
            const yearNumber = i + 1;
            const portfolioAtStartOfYearNominal = currentPortfolioValueNominal;
            let isAdjusted = false;

            // 1. Calculate current year's withdrawal amount (adjusts with inflation)
            let targetWithdrawalAmountNominal = initialAnnualWithdrawalNominal * Math.pow(1 + inflationRateDecimal, i);

            // 2. Apply Guardrail if enabled (based on nominal values)
            if (inputs.useGuardrail && portfolioAtStartOfYearNominal < (guardrailReferenceInitialValue * 0.50)) {
                targetWithdrawalAmountNominal *= 0.90;
                isAdjusted = true;
            }

            // Ensure withdrawal does not exceed current portfolio value
            const actualWithdrawalAmountNominal = Math.min(targetWithdrawalAmountNominal, currentPortfolioValueNominal);

            // 3. Subtract withdrawal
            currentPortfolioValueNominal -= actualWithdrawalAmountNominal;

            // 4. Apply investment return to the remaining balance
            currentPortfolioValueNominal *= (1 + nominalReturnRateDecimal);

            // Ensure end value doesn't go negative if withdrawals exceed growth + principal
            currentPortfolioValueNominal = Math.max(0, currentPortfolioValueNominal);


            const yearData = {
                year: yearNumber,
                startValue: portfolioAtStartOfYearNominal,
                withdrawal: actualWithdrawalAmountNominal,
                endValue: currentPortfolioValueNominal,
                isAdjusted: isAdjusted
            };
            simulationData.push(yearData);

            if (currentPortfolioValueNominal <= 0) {
                depletedYear = yearNumber;
                // Ensure the final entry reflects exact depletion
                simulationData[simulationData.length - 1].endValue = 0;
                break;
            }
        }
        return { simulationData, depletedYear, finalNominalValue: currentPortfolioValueNominal }; // Return finalNominalValue
    }

    /**
     * Displays the simulation results in a table format.
     * @param {object} results - The results from performSimulationLogic ({ simulationData, depletedYear, finalNominalValue }).
     * @param {number} simulationYears - The total number of years the simulation was run for.
     * @param {object} inputs - The simulation input parameters, including expectedInflationRate and nominalReturnRate.
     */
    function displaySimulationResults(results, simulationYears, inputs) {
        // Clear previous results, but preserve the dedicated divs for nominal/real projections
        if (simulationResultsDiv.querySelector('table')) {
            simulationResultsDiv.querySelector('table').remove();
        }
        // Remove previous messages like "Portfolio depleted..."
        const existingMessages = simulationResultsDiv.querySelectorAll('p.simulation-message, h3.results-title, p.inflation-note');
        existingMessages.forEach(msg => msg.remove());


        const resultsTitle = document.createElement('h3');
        resultsTitle.textContent = 'Simulation Results';
        resultsTitle.classList.add('results-title');
        resultsTitle.id = 'simulation-results-title';
        simulationResultsDiv.appendChild(resultsTitle);

        if (inputs && typeof inputs.expectedInflationRate !== 'undefined') {
            const inflationNote = document.createElement('p');
            inflationNote.textContent = `Withdrawal amounts are adjusted for an annual inflation rate of ${inputs.expectedInflationRate}%.`;
            inflationNote.style.fontStyle = 'italic';
            inflationNote.style.marginBottom = '10px';
            inflationNote.classList.add('inflation-note');
            inflationNote.id = 'simulation-inflation-note';
            simulationResultsDiv.appendChild(inflationNote);
        }

        // Ensure projectedSavingsNominal and projectedSavingsReal divs are present (they should be from HTML)
        let projectedSavingsNominalEl = document.getElementById('projectedSavingsNominal');
        let projectedSavingsRealEl = document.getElementById('projectedSavingsReal');

        if (!projectedSavingsNominalEl) {
            projectedSavingsNominalEl = document.createElement('div');
            projectedSavingsNominalEl.id = 'projectedSavingsNominal';
            simulationResultsDiv.insertBefore(projectedSavingsNominalEl, simulationResultsDiv.firstChild); // Add at top if missing
        }
        if (!projectedSavingsRealEl) {
            projectedSavingsRealEl = document.createElement('div');
            projectedSavingsRealEl.id = 'projectedSavingsReal';
            simulationResultsDiv.insertBefore(projectedSavingsRealEl, projectedSavingsNominalEl.nextSibling); // Add after nominal if missing
        }

        projectedSavingsNominalEl.innerHTML = ''; // Clear previous content
        projectedSavingsRealEl.innerHTML = ''; // Clear previous content


        const table = document.createElement('table');
        table.setAttribute('aria-labelledby', 'simulation-results-title');
        if (inputs && typeof inputs.expectedInflationRate !== 'undefined') {
            table.setAttribute('aria-describedby', 'simulation-inflation-note');
        } else {
            table.removeAttribute('aria-describedby');
        }
        const caption = table.createCaption();
        caption.textContent = 'Year-by-year withdrawal results';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');
        ['Year', 'Start Value', 'Withdrawal Amount', 'End Value'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            th.scope = 'col';
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
        messageElement.classList.add('simulation-message'); // Add class for easier removal
        messageElement.setAttribute('role', 'status');
        messageElement.setAttribute('aria-live', 'polite');

        if (results.depletedYear !== -1) {
            messageElement.style.color = 'red';
            messageElement.textContent = `Portfolio depleted in Year ${results.depletedYear}.`;
            projectedSavingsNominalEl.textContent = 'Projected Savings (Nominal): $0.00 (Depleted)';
            projectedSavingsRealEl.textContent = 'Projected Savings (Real): $0.00 (Depleted)';
        } else {
            messageElement.style.color = 'green';
            messageElement.textContent = `Portfolio survived ${simulationYears} years.`;

            const finalNominalValue = results.finalNominalValue;
            const inflationRateDecimal = inputs.expectedInflationRate / 100;
            const finalRealValue = finalNominalValue / Math.pow(1 + inflationRateDecimal, simulationYears);

            projectedSavingsNominalEl.textContent = `Projected Savings (Nominal): $${finalNominalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            projectedSavingsRealEl.textContent = `Projected Savings (Real, Inflation-Adjusted): $${finalRealValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        // Append the message after the table and projection divs
        simulationResultsDiv.appendChild(messageElement);
    }

    if (runSimulationBtn) {
        runSimulationBtn.addEventListener('click', () => {
            runSimulationAndMonteCarlo({ suppressNotifications: false, triggeredByAuto: false });
        });
    } else {
        console.error('Run Simulation button not found');
    }

    /**
     * Updates or creates the simulation chart.
     * @param {Array<string>} labels - Array of labels for the X-axis (e.g., ['Year 0', 'Year 1', ...]).
     * @param {Array<number>} dataPoints - Array of data points for the Y-axis (portfolio values).
     * @param {object} inputs - The simulation input parameters for context in chart title or labels.
     */
    function updateChart(labels, nominalDataPoints, realDataPoints, inputs) {
        if (currentChart) {
            currentChart.destroy(); // Destroy existing chart instance before creating a new one
        }

        const ctx = simulationChartCanvas.getContext('2d');
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `Portfolio Value (Nominal, Investment Return: ${inputs.nominalReturnRate}%)`,
                        data: nominalDataPoints,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1,
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: `Portfolio Value (Real, Inflation Adjusted at ${inputs.expectedInflationRate}%)`,
                        data: realDataPoints,
                        borderColor: 'rgb(255, 159, 64)',
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        tension: 0.1,
                        borderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow chart to not be square
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Portfolio Value ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += '$' + context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    if (toggleChartBtn) {
        toggleChartBtn.addEventListener('click', () => {
            if (!chartContainer) {
                return;
            }

            const isHidden = chartContainer.hasAttribute('hidden');
            if (isHidden) {
                chartContainer.removeAttribute('hidden');
            } else {
                chartContainer.setAttribute('hidden', '');
            }

            toggleChartBtn.textContent = isHidden ? 'Hide Chart' : 'Show Chart';
            toggleChartBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');

            if (isHidden && currentChart) {
                // Optional: could call currentChart.resize() if container size changes visibility behavior
            }
        });
    } else {
        console.error("Toggle Chart button not found");
    }


    // --- Data Management ---
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataInput = document.getElementById('importDataInput');

    function exportData() {
        const dataToExport = {
            portfolio: portfolio,
            expenses: expenses,
            simulationSettings: {
                withdrawalRate: withdrawalRateInput.value,
                simulationYears: simulationYearsInput.value,
                nominalReturnRate: returnRateInput.value, // Added in a previous step, ensure it's here
                expectedInflationRate: expectedInflationRateInput.value, // This is the target field
                enableGuardrail: enableGuardrailCheckbox.checked
            }
        };

        const jsonString = JSON.stringify(dataToExport, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'firecalc_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Data exported successfully!', 'success');
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) {
            showNotification('No file selected for import.', 'error');
            return;
        }

        if (file.type !== "application/json") {
            showNotification('Invalid file type. Please select a JSON file.', 'error');
            importDataInput.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // Validate top-level keys
                if (!importedData || typeof importedData !== 'object' ||
                    !importedData.hasOwnProperty('portfolio') ||
                    !importedData.hasOwnProperty('expenses') ||
                    !importedData.hasOwnProperty('simulationSettings')) {
                    showNotification('Invalid data structure in JSON file.', 'error');
                    importDataInput.value = ''; // Reset file input
                    return;
                }

                // Basic validation for array types (more detailed validation could be added)
                if (!Array.isArray(importedData.portfolio)) {
                    showNotification('Invalid portfolio data in JSON file.', 'error');
                    importDataInput.value = ''; // Reset file input
                    return;
                }
                if (!Array.isArray(importedData.expenses)) {
                    showNotification('Invalid expenses data in JSON file.', 'error');
                    importDataInput.value = ''; // Reset file input
                    return;
                }
                if (typeof importedData.simulationSettings !== 'object' || importedData.simulationSettings === null) {
                    showNotification('Invalid simulation settings in JSON file.', 'error');
                    importDataInput.value = ''; // Reset file input
                    return;
                }


                // Apply imported data
                // Portfolio
                portfolio = importedData.portfolio.map(asset => ({ // Basic mapping, ensure structure if needed
                    name: asset.name || 'Unknown Asset',
                    value: parseFloat(asset.value) || 0,
                    type: asset.type || 'Other'
                }));
                savePortfolio(); // Save to localStorage
                renderPortfolio(); // Update UI

                // Expenses
                // Add IDs if missing from imported data (similar to loadExpenses)
                expenses = importedData.expenses.map(expense => {
                    let currentExpense = { ...expense };
                    if (!currentExpense.id) {
                        currentExpense.id = generateId();
                    }
                    if (!currentExpense.subExpenses) {
                        currentExpense.subExpenses = [];
                    }
                     // Ensure amount is a number, default to 0 if not valid
                    currentExpense.amount = parseFloat(currentExpense.amount) || 0;
                    return currentExpense;
                });
                saveExpenses(); // Save to localStorage
                renderExpenses(); // Update UI

                // Simulation Settings
                const { withdrawalRate, simulationYears, nominalReturnRate, expectedInflationRate, enableGuardrail } = importedData.simulationSettings;
                withdrawalRateInput.value = withdrawalRate || '4';
                simulationYearsInput.value = simulationYears || '30';
                returnRateInput.value = nominalReturnRate || '7'; // Added in a previous step
                expectedInflationRateInput.value = expectedInflationRate || '2'; // Target field
                enableGuardrailCheckbox.checked = typeof enableGuardrail === 'boolean' ? enableGuardrail : false;

                showNotification('Data imported successfully!', 'success');
            } catch (error) {
                console.error("Error processing imported file:", error);
                showNotification('Error processing JSON file. Ensure it is valid.', 'error');
            } finally {
                importDataInput.value = ''; // Reset file input regardless of outcome
            }
        };
        reader.onerror = () => {
            showNotification('Error reading file.', 'error');
            importDataInput.value = ''; // Reset file input
        };
        reader.readAsText(file);
    }

    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    } else {
        console.error("Export Data button not found");
    }

    if (importDataInput) {
        importDataInput.addEventListener('change', importData);
    } else {
        console.error("Import Data input not found");
    }


    // --- Initialization ---
    // Load data from LocalStorage and render initial UI state
    loadPortfolio();
    renderPortfolio();
    loadExpenses();
    renderExpenses();

    // --- New Export Financial Plan Data Function ---
    /**
     * Exports financial planning data to a JSON file.
     */
    function exportSimulationInputs() {
        // Get values from the input fields
        const currentAge = document.getElementById('current-age')?.value;
        const retirementAge = document.getElementById('retirement-age')?.value;
        const currentSavings = document.getElementById('current-savings')?.value;
        const monthlyContribution = document.getElementById('monthly-contribution')?.value;
        const annualRoi = document.getElementById('returnRate')?.value; // Changed from 'annual-roi'
        const inflationRate = document.getElementById('inflationRate')?.value; // Matches ID in index.html simulation section

        // Create an object with the data
        const financialData = {
            currentAge: currentAge ? parseInt(currentAge) : null,
            retirementAge: retirementAge ? parseInt(retirementAge) : null,
            currentSavings: currentSavings ? parseFloat(currentSavings) : null,
            monthlyContribution: monthlyContribution ? parseFloat(monthlyContribution) : null,
            returnRate: annualRoi ? parseFloat(annualRoi) : null, // Changed key from annualRoi
            inflationRate: inflationRate ? parseFloat(inflationRate) : null
        };

        // Convert the object to a JSON string
        const jsonString = JSON.stringify(financialData, null, 2); // Pretty print

        // Create a Blob object
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a temporary URL for the Blob
        const url = URL.createObjectURL(blob);

        // Create a temporary <a> element to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'financial_plan_data.json'; // Suggested filename

        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Revoke the temporary URL
        URL.revokeObjectURL(url);

        showNotification('Simulation inputs exported successfully!', 'success');
    }

    /**
     * Imports financial simulation data from a JSON file.
     * @param {Event} event - The file input change event.
     */
    function importSimulationInputs(event) {
        const file = event.target.files[0];

        if (!file) {
            showNotification('No file selected for import.', 'error');
            return;
        }

        if (file.type !== "application/json") {
            showNotification('Invalid file type. Please select a JSON file.', 'error');
            event.target.value = null; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // Validate expected keys
                // currentSavings is removed, annualRoi is replaced by returnRate
                const requiredKeys = ['currentAge', 'retirementAge', 'monthlyContribution', 'returnRate', 'inflationRate'];
                const missingKeys = requiredKeys.filter(key => {
                    if (key === 'returnRate') {
                        return !(importedData.hasOwnProperty('returnRate') || importedData.hasOwnProperty('annualRoi'));
                    }
                    return !importedData.hasOwnProperty(key);
                });

                if (missingKeys.length > 0) {
                    showNotification(`Invalid data structure. Missing keys: ${missingKeys.join(', ')}`, 'error');
                    event.target.value = null; // Reset file input
                    return;
                }

                // Populate input fields
                document.getElementById('current-age').value = importedData.currentAge;
                document.getElementById('retirement-age').value = importedData.retirementAge;
                // current-savings line is now fully removed
                document.getElementById('monthly-contribution').value = importedData.monthlyContribution;
                // Use returnRate key, fallback to annualRoi for backward compatibility
                document.getElementById('returnRate').value = importedData.returnRate || importedData.annualRoi;
                document.getElementById('inflationRate').value = importedData.inflationRate; // Matches ID in index.html

                showNotification('Simulation inputs imported successfully!', 'success');
            } catch (error) {
                console.error("Error processing imported simulation file:", error);
                showNotification('Error processing JSON file. Ensure it is valid.', 'error');
            } finally {
                event.target.value = null; // Reset file input regardless of outcome
            }
        };
        reader.onerror = () => {
            showNotification('Error reading file.', 'error');
            event.target.value = null; // Reset file input
        };
        reader.readAsText(file);
    }

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

    // Add event listener for the new financial plan export button
    const newFinancialPlanExportButton = document.getElementById('export-button');
    if (newFinancialPlanExportButton) {
        newFinancialPlanExportButton.addEventListener('click', exportSimulationInputs);
    } else {
        console.error("New Financial Plan Export Data button (export-button) not found.");
    }

    // Add event listener for the new simulation data import input
    const importSimulationInputEl = document.getElementById('import-simulation-input');
    if (importSimulationInputEl) {
        importSimulationInputEl.addEventListener('change', importSimulationInputs);
    } else {
        console.error("Import Simulation Input element (import-simulation-input) not found.");
    }
});
