# FIRECalc

FIRECalc is a simple, client-side web application to help you track your financial assets, log expenses, and simulate basic withdrawal strategies for Financial Independence, Retire Early (FIRE) planning.

## Features

*   **Portfolio Tracking:**
    *   Add, edit, and delete financial assets (e.g., stocks, crypto, real estate).
    *   Specify asset name, current market value, and type (Stocks, Crypto, Real Estate, Cash, Other).
    *   Automatically calculates and displays the total portfolio value.
    *   Data is saved to your browser's LocalStorage, so it persists between sessions on the same browser.

*   **Expense Input:**
    *   Log your recurring expenses with details like name, amount, and category (Housing, Food, Transport, Entertainment, Healthcare, Utilities, Other).
    *   Specify expense frequency (Daily, Weekly, Monthly, Yearly).
    *   Automatically calculates and displays the total estimated annual expenses.
    *   Data is saved to your browser's LocalStorage.

*   **Withdrawal Simulation:**
    *   Simulate portfolio longevity based on a fixed percentage withdrawal strategy.
    *   Configure the annual withdrawal rate (%) and the desired simulation period (in years).
    *   **Optional Simple Guardrail Strategy:** If enabled, the withdrawal amount is reduced by 10% for any year where the portfolio's starting value is less than 50% of its initial value at the beginning of the simulation.
    *   Displays year-by-year simulation results in a clear table format: Year, Start Value, Withdrawal Amount (notes if adjusted by guardrail), and End Value.
    *   Provides a summary message indicating if the portfolio survived the simulation period or in which year it was depleted.

## How to Run

1.  **Clone this repository:**
    ```bash
    git clone https://github.com/TheWaler/FIRECalc.git
    ```
2.  **Navigate to the directory:**
    ```bash
    cd FIRECalc
    ```
    (Or whatever the directory name is.)
3.  **Open `index.html`:**
    Open the `index.html` file directly in your preferred web browser (e.g., Chrome, Firefox, Safari, Edge).

As this is a client-side application, no special server setup is required.

## Key Functionality & UI

*   **Clear Layout:** The application is organized into distinct sections for Portfolio Tracking, Expense Input, and Withdrawal Simulation, each with guiding icons.
*   **Interactive Forms:** Easy-to-use forms for data entry with input validation to ensure data integrity.
*   **User Feedback:** Visual notifications for actions like adding, updating, or deleting assets and expenses.
*   **Responsive Design:** The layout adapts to different screen sizes, improving usability on tablets and mobile devices.
*   **Data Persistence:** Your portfolio and expense data are saved locally in your browser using LocalStorage, allowing you to close and reopen the application without losing your data (on the same browser).

## Style Guidelines

The application follows these general style principles:

*   **Primary color:** Teal (#008080) for a sense of financial stability and growth.
*   **Secondary color:** Light gray (#F0F0F0) for a clean and modern background.
*   **Accent color:** Gold (#FFD700) to highlight key metrics and interactive elements (like input focus).
*   Clear, section-based dashboard layout.
*   Use of financial-themed icons for visual clarity.
*   Subtle transitions on interactive elements for a smoother user experience.

## Known Limitations / Future Improvements

*   **Basic Simulation Model:**
    *   The current simulation does not account for investment returns or growth on the portfolio value over time.
    *   Inflation is not factored into expenses or withdrawal amounts (except for the very basic adjustment in the Simple Guardrail strategy).
    *   Tax implications (capital gains, income tax on withdrawals, etc.) are not considered.
*   **LocalStorage Data:** All data is stored in the browser's LocalStorage. This means data is specific to that browser and device, and can be lost if browser data is cleared.
*   **No Backend:** There is no server-side component for user accounts or persistent data storage across multiple devices/browsers.
*   **Potential Enhancements:**
    *   Incorporate options for average investment return rates in simulations.
    *   Add inflation adjustments for expenses and withdrawals.
    *   Introduce more sophisticated withdrawal strategies (e.g., dynamic withdrawal percentages based on remaining portfolio, more complex guardrail rules).
    *   Visualize simulation results or portfolio allocation with charts.
    *   Conduct more extensive cross-browser testing on a wider range of devices.
    *   Implement data import/export functionality (e.g., CSV).
