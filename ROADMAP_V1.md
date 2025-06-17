# Roadmap V1.0: Financial Planning Application

## Introduction

The purpose of V1.0 is to enhance the existing financial planning application with key features that improve its functionality, user experience, and data management capabilities. This version aims to provide users with a more comprehensive and user-friendly tool for managing their financial future.

## Current State Summary

The application currently provides basic financial projection capabilities. Users can input their current age, retirement age, current savings, monthly contributions, and expected investment rate of return. The application then projects the future value of their savings. However, it lacks features like accounting for inflation, data persistence, advanced UX elements like notifications, and a clear visual representation of the projections.

## V1.0 Goals

The primary goals for V1.0 are:

*   **Enhance Core Functionality:** Introduce calculations for investment returns adjusted for inflation.
*   **Improve Data Management:** Allow users to export and import their financial data.
*   **Elevate User Experience:** Implement UI improvements for better clarity, notifications, and an optional chart for visualizing projections.
*   **Ensure Reliability:** Focus on thorough testing to guarantee data integrity and a smooth user experience across different browsers.

## Core Functionality Enhancements

### Investment Returns Adjusted for Inflation

*   **Objective:** Provide a more realistic projection of future wealth by factoring in the eroding effect of inflation on investment returns.
*   **Details:**
    *   Introduce a new input field for "Expected Annual Inflation Rate".
    *   Calculate and display both nominal and real (inflation-adjusted) returns.
    *   The formula for real rate of return will be: `((1 + Nominal Rate) / (1 + Inflation Rate)) - 1`.
    *   **Status: Implemented**
    *   **Summary of Changes:**
        *   Added an input field for "Expected Annual Inflation Rate (%)" in the UI.
        *   The simulation now calculates and displays "Projected Savings (Nominal)" and "Projected Savings (Real, Inflation-Adjusted)".
        *   The inflation rate is now included in the data export and import functionality.
        *   Input validation was added for the inflation rate (must be a non-negative number).

#### UI Changes (index.html)

*   Add a new input field for "Expected Annual Inflation Rate (%)" with appropriate labels and default values (e.g., 2%).
*   Modify the results display area to show both "Projected Savings (Nominal)" and "Projected Savings (Real, Inflation-Adjusted)".

#### Logic Changes (js/app.js)

*   Update the `calculateProjection` function (or equivalent) to:
    *   Retrieve the inflation rate from the new input field.
    *   Calculate the real rate of return.
    *   Calculate projections using both nominal and real rates.
    *   Update the display with both nominal and real projection results.
*   Ensure input validation for the inflation rate (e.g., must be a positive number).

## Data Management

### Export/Import Financial Data as JSON

*   **Objective:** Allow users to save their financial inputs and retrieve them later, providing data persistence and convenience.
*   **Details:**
    *   Implement functionality to export all user inputs into a JSON file.
    *   Implement functionality to import data from a previously exported JSON file, populating the input fields.

#### UI Changes (index.html)

*   Add an "Export Data" button.
*   Add an "Import Data" button (likely a file input element styled as a button).

#### Logic Changes (js/app.js)

*   **Export:**
    *   Create a function `exportData()` that:
        *   Collects all current input values (age, retirement age, savings, contributions, investment rate, inflation rate).
        *   Constructs a JSON object with this data.
        *   Triggers a download of this JSON object as a file (e.g., `financial_plan_data.json`).
*   **Import:**
    *   Create a function `importData(event)` that:
        *   Reads the content of the selected JSON file.
        *   Parses the JSON data.
        *   Populates the corresponding input fields in the UI with the imported values.
        *   Includes error handling for invalid file types or malformed JSON.
    *   Add an event listener to the "Import Data" button to trigger this function.

## User Experience (UX) and UI Improvements

### Notifications, Clarity, and Optional Chart

*   **Objective:** Make the application more intuitive, informative, and visually appealing.
*   **Details:**
    *   Implement a notification system for actions like successful data export/import or input errors.
    *   Improve the clarity of labels, instructions, and results display.
    *   Integrate an optional chart to visualize the projected savings over time.

#### UI Changes (index.html)

*   Add a dedicated area for displaying notifications (e.g., a dismissible alert box at the top or bottom of the form).
*   Review and refine all text labels and instructions for clarity.
*   Add a "Show/Hide Chart" button or a toggle switch.
*   Add a `canvas` element (or a `div` container for the chart library) to render the chart.

#### Logic Changes (js/app.js)

*   **Notifications:**
    *   Create a helper function `showNotification(message, type)` (where type could be 'success', 'error', 'info') to display messages in the notification area.
    *   Call this function after export/import operations, input validation failures, etc.
*   **Chart Integration:**
    *   Implement a function `updateChart()` that:
        *   Takes the projection data (e.g., year-by-year balance for nominal and real projections).
        *   Uses the chosen chart library to render or update a line chart showing the growth of savings over time.
        *   The chart should clearly distinguish between nominal and real value projections.
    *   Call `updateChart()` after `calculateProjection()` is successfully executed.
    *   Implement logic for the "Show/Hide Chart" button to control the visibility of the chart container.

#### Chart Library Suggestion

*   **Chart.js:** A simple yet flexible JavaScript charting library. It's relatively easy to integrate and offers various chart types, including line charts suitable for this application. Other alternatives include Plotly.js or Google Charts. The final choice will depend on ease of use and feature set.

## Testing and Reliability for V1.0

*   **Objective:** Ensure the application is robust, calculations are accurate, and the user experience is consistent.

*   **Manual Test Cases:**
    *   **Core Functionality:**
        *   Verify calculations for nominal projections with various inputs.
        *   Verify calculations for real (inflation-adjusted) projections with various inputs.
        *   Test edge cases (e.g., retirement age same as current age, zero contribution, zero savings, high/low inflation rates).
        *   Test input validation (e.g., non-numeric inputs, negative values where not allowed).
    *   **Data Management:**
        *   Test data export: ensure the downloaded JSON file contains all correct input values.
        *   Test data import:
            *   Ensure correct population of fields with a valid JSON file.
            *   Test with malformed JSON files (should show an error notification and not break the app).
            *   Test with JSON files containing unexpected fields or missing fields.
    *   **UX/UI:**
        *   Verify notification messages appear correctly for different actions (success, error).
        *   Check clarity of all labels and instructions.
        *   Test chart generation: ensure it displays correctly and updates with new calculations.
        *   Test "Show/Hide Chart" functionality.

*   **Cross-Browser Testing:**
    *   Manually test the application on the latest versions of major browsers (e.g., Chrome, Firefox, Safari, Edge) to ensure consistent behavior and appearance.

*   **Data Integrity:**
    *   Ensure that calculations are mathematically correct.
    *   Verify that data entered by the user is accurately reflected in calculations and exports.

*   **Usability Testing:**
    *   Perform informal usability tests (e.g., ask a friend or colleague to use the application) to gather feedback on ease of use, clarity, and overall experience.

## Future Considerations (Post-V1.0)

*   **Advanced User Accounts:** Allow users to create accounts and save their plans on a server.
*   **Multiple Scenarios:** Enable users to create and compare different financial scenarios.
*   **Detailed Expense Tracking:** Integrate options for tracking different types of expenses.
*   **Taxation:** Incorporate options for estimating tax impacts on investments and income.
*   **More Sophisticated Investment Models:** Allow for variable rates of return or different asset allocation strategies.
*   **Automated Testing:** Introduce unit tests and integration tests for core logic.
*   **Localization/Internationalization (i18n):** Support for multiple languages and currencies.
*   **Accessibility (a11y) Enhancements:** Ensure the application is usable by people with disabilities, following WCAG guidelines.
*   **Mobile Responsiveness:** Improve the layout and usability on mobile devices.
