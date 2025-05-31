
# StockFlow: Next Development Plan

This document outlines potential future enhancements and features for the StockFlow application.

## I. Security Enhancements

*   **Robust Session Management:**
    *   Implement a comprehensive session management solution (e.g., `next-auth` or a custom JWT-based system with refresh tokens and secure cookie handling).
*   **Firebase Security Rules:**
    *   Conduct a thorough review and strengthening of Firebase Security Rules for Firestore to ensure least-privilege access to data based on user roles and ownership.
*   **Input Validation & Sanitization:**
    *   Implement comprehensive server-side and client-side input validation and sanitization for all user inputs, API requests, and forms to prevent XSS, injection attacks, and other vulnerabilities.
*   **API Rate Limiting & Security Headers:**
    *   Implement rate limiting on critical API endpoints.
    *   Add security headers (e.g., CSP, HSTS, X-Frame-Options).
*   **Two-Factor Authentication (2FA):**
    *   Consider adding 2FA for an extra layer of security, especially for Super User accounts.

## II. Core Functionality Improvements

*   **SOH Data Processing & Storage:**
    *   Implement actual parsing of uploaded `.xlsx` SOH data files.
    *   Validate SOH data structure and content.
    *   Store processed stock items (SKU, description, initial SOH quantity) in a dedicated Firestore collection, linked to the SOH data reference.
*   **Dynamic Form Generation:**
    *   Allow Super Users or Admin Document Control to select specific SOH data references when generating new stock count forms.
    *   Provide options to filter or select specific ranges/categories of items from the SOH data to be included in a form.
    *   Store form definitions and their associated item lists in Firestore.
*   **Physical Count Data Persistence:**
    *   Securely save physical counts entered on the "Input Data" page for each form item to Firestore.
    *   Link these counts back to the specific form and the original stock item.
    *   Timestamp count entries and record the user who made the input.
*   **Automated Variance Calculation & Reporting:**
    *   Automatically calculate variance (Physical Count - SOH Quantity) once physical counts are submitted and verified for a form.
    *   Store variance data.
    *   Develop detailed variance reports, allowing filtering by form, date, item category, variance magnitude, etc.
    *   Option to export variance reports (e.g., to CSV/Excel).
*   **Dashboard Enhancements:**
    *   Implement a dynamic "Recent Activity" feed on the main dashboard page, showing key actions like form creations, status changes, SOH uploads, and user approvals.
    *   Display key operational metrics based on real-time data (e.g., forms in progress, total variance, count accuracy).
*   **User Management Enhancements:**
    *   Implement full "Edit User" functionality for Super Users to modify details of their Admin Users (e.g., name, role - with appropriate safeguards).
    *   Implement "Add New User" functionality directly from the User Management page, allowing Super Users to create Admin Users without them going through the public registration page.
    *   Implement a secure "Forgot Password" / "Password Reset" flow for all users.
    *   Option for Super Users to resend verification emails to unverified Admin Users or resend approval notification emails (if applicable).

## III. Operational & UX Features

*   **Form Printing:**
    *   Implement actual PDF generation for stock count forms, formatted for printing. This could involve server-side PDF generation (e.g., using `pdfmake` or `puppeteer`) or client-side libraries.
*   **Notifications System:**
    *   Develop an in-app notification system for Super Users regarding pending admin approvals, form status changes needing attention, etc.
    *   Consider email notifications for critical alerts.
*   **Audit Trails:**
    *   Implement a logging system to record key user actions (e.g., user creation, approval, activation, SOH upload, form generation, count submission, verification) for accountability and troubleshooting.
*   **Advanced Reporting & Analytics:**
    *   Introduce more sophisticated charting and data visualization for reports.
    *   Potentially a custom report builder for users to create tailored views of stock data.
    *   Trend analysis over time for stock levels, variances, and count efficiency.
*   **UI/UX Refinements:**
    *   Conduct user testing and gather feedback to refine workflows and UI elements.
    *   Improve loading states, progress indicators, and user feedback across the application.
    *   Ensure consistent design language.
    *   Perform an accessibility (A11y) review and make necessary improvements.
*   **Data Import/Export:**
    *   Provide more robust options for exporting various data sets (user lists, form data, SOH data).

## IV. GenAI Integration (Future Consideration)

*   **Anomaly Detection:**
    *   Use Genkit to analyze stock count data and identify potential anomalies or unusual patterns in variances.
*   **Predictive Insights:**
    *   Explore using AI to predict stock discrepancies or suggest areas for focused counting based on historical data.
*   **Natural Language Queries:**
    *   Allow users to query stock data or reports using natural language.

## V. Testing & Quality Assurance

*   **Unit Tests:**
    *   Write comprehensive unit tests for critical API route logic, utility functions, and complex components.
*   **Integration Tests:**
    *   Test interactions between different parts of the system (e.g., API and database).
*   **End-to-End (E2E) Tests:**
    *   Implement E2E tests for key user flows (registration, login, form creation, data input, approval processes) using tools like Playwright or Cypress.

## VI. Deployment & Infrastructure

*   **CI/CD Pipeline:**
    *   Set up a Continuous Integration/Continuous Deployment pipeline (e.g., using GitHub Actions, GitLab CI, or Firebase Hosting's GitHub integration) for automated testing and deployment.
*   **Scalability Review:**
    *   Periodically review Firebase usage and query patterns to ensure scalability as data and user load grows.
    *   Optimize Firestore queries and data structures.
*   **Backup and Restore Strategy:**
    *   Define and test a backup and restore strategy for Firestore data.

This plan provides a roadmap for evolving StockFlow into a more robust, feature-rich, and secure application. Prioritization of these items will depend on business needs and resources.
