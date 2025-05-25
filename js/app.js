// Basic JavaScript for the project
console.log("JavaScript file loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // --- Portfolio Tracking ---
    const assetNameInput = document.getElementById('assetName');
    const assetValueInput = document.getElementById('assetValue');
    const addAssetBtn = document.getElementById('addAssetBtn');
    const portfolioList = document.getElementById('portfolioList');
    const totalPortfolioValueSpan = document.getElementById('totalPortfolioValue');

    let portfolio = [];

    function renderPortfolio() {
        portfolioList.innerHTML = ''; // Clear existing list
        let totalValue = 0;

        portfolio.forEach((asset, index) => {
            const li = document.createElement('li');
            li.textContent = `${asset.name}: $${asset.value.toLocaleString()}`;
            
            // Add a delete button for each asset
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.onclick = () => {
                portfolio.splice(index, 1);
                renderPortfolio();
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
            const value = parseFloat(assetValueInput.value);

            if (name && !isNaN(value) && value > 0) {
                portfolio.push({ name, value });
                renderPortfolio();
                assetNameInput.value = '';
                assetValueInput.value = '';
            } else {
                alert('Please enter a valid asset name and value.');
            }
        });
    } else {
        console.error('Add Asset button not found');
    }

    // --- Expense Input ---
    const expenseNameInput = document.getElementById('expenseName');
    const expenseAmountInput = document.getElementById('expenseAmount');
    const expenseFrequencySelect = document.getElementById('expenseFrequency');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const expenseList = document.getElementById('expenseList');
    const totalAnnualExpensesSpan = document.getElementById('totalAnnualExpenses');

    let expenses = [];

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
        expenseList.innerHTML = ''; // Clear existing list
        let totalAnnualCost = 0;

        expenses.forEach((expense, index) => {
            const li = document.createElement('li');
            const annualAmount = calculateAnnualAmount(expense.amount, expense.frequency);
            li.textContent = `${expense.name}: $${expense.amount.toLocaleString()} (${expense.frequency}) - Annual: $${annualAmount.toLocaleString()}`;
            
            // Add a delete button for each expense
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.onclick = () => {
                expenses.splice(index, 1);
                renderExpenses();
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

            if (name && !isNaN(amount) && amount > 0) {
                expenses.push({ name, amount, frequency });
                renderExpenses();
                expenseNameInput.value = '';
                expenseAmountInput.value = '';
                expenseFrequencySelect.value = 'monthly'; // Reset to default
            } else {
                alert('Please enter a valid expense name and amount.');
            }
        });
    } else {
        console.error('Add Expense button not found');
    }

    // --- Withdrawal Simulation ---
    const withdrawalRateInput = document.getElementById('withdrawalRate');
    const simulationYearsInput = document.getElementById('simulationYears');
    const runSimulationBtn = document.getElementById('runSimulationBtn');
    const simulationResultsDiv = document.getElementById('simulationResults');

    if (runSimulationBtn) {
        runSimulationBtn.addEventListener('click', () => {
            console.log("Run Simulation button clicked.");
            console.log("Withdrawal Rate:", withdrawalRateInput.value);
            console.log("Simulation Years:", simulationYearsInput.value);
            console.log("Simulation logic to be implemented.");
            simulationResultsDiv.textContent = "Simulation results will appear here. (Logic not yet implemented)";
        });
    } else {
        console.error('Run Simulation button not found');
    }

    // Initial renders if there's any default data (not applicable here yet)
    renderPortfolio();
    renderExpenses();
});
