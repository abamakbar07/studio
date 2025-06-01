
# StockFlow: Next Development Plan

This document outlines potential future enhancements and features for the StockFlow application. The primary goal of StockFlow is to support the Stock Take process within warehouse operations by assisting Admin teams in managing stock count forms, inputting physical count results, and monitoring real-time progress. Future developments should align with improving accuracy, transparency, and efficiency in these areas.

## I. Security Enhancements

*   **Robust Session Management:**
    *   Implement a more comprehensive session management solution (e.g., `next-auth` with JWTs, refresh tokens, and secure cookie handling) to replace or augment the current basic cookie system.
*   **Firebase Security Rules:**
    *   Conduct a thorough review and strengthening of Firebase Security Rules for Firestore to ensure least-privilege access to data based on user roles, data ownership (e.g., admin users only accessing forms related to their superuser), and specific operations.
*   **Input Validation & Sanitization:**
    *   Implement comprehensive server-side and client-side input validation and sanitization for all user inputs, API requests, and forms to prevent XSS, injection attacks, and other vulnerabilities. This is especially important for data related to stock counts and SOH uploads.
*   **API Rate Limiting & Security Headers:**
    *   Implement rate limiting on critical API endpoints (e.g., login, registration, data upload).
    *   Add security headers (e.g., Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Frame-Options).
*   **Two-Factor Authentication (2FA):**
    *   Consider adding 2FA for an extra layer of security, especially for Super User accounts.

## II. Core Functionality Improvements (Focus on Stock-Take Process)

*   **SOH Data Processing & Storage:**
    *   Implement actual parsing of uploaded `.xlsx` SOH data files (currently simulated).
    *   Validate SOH data structure, content, and data types upon upload.
    *   Store processed stock items (SKU, description, initial SOH quantity, location/bin if available) in a dedicated Firestore collection, linked to the SOH data reference and the STO event/form.
    *   Handle potential errors during SOH processing and provide feedback to the user.
*   **Dynamic Form Generation & Item Selection:**
    *   Allow Super Users or Admin Document Control to select specific SOH data references when generating new stock count forms.
    *   Provide options to filter or select specific ranges/categories of items (e.g., by location, product category, high-value items) from the SOH data to be included in a form.
    *   Store form definitions and their associated item lists (or queries) in Firestore.
*   **Physical Count Data Persistence & Validation:**
    *   Securely save physical counts entered on the "Input Data" page for each form item to Firestore (currently simulated saving).
    *   Link these counts back to the specific form, the original stock item from SOH, and the STO event.
    *   Timestamp count entries and record the user who made the input for auditability.
    *   Implement validation rules for physical counts (e.g., non-negative, numeric).
*   **Automated Variance Calculation & Reporting:**
    *   Automatically calculate variance (Physical Count - SOH Quantity) once physical counts are submitted and verified for a form.
    *   Store variance data per item, per form.
    *   Develop detailed variance reports, allowing filtering by form, date, item category, variance magnitude, location, etc.
    *   Option to export variance reports (e.g., to CSV/Excel).
*   **Dashboard Enhancements for Real-time Monitoring:**
    *   Implement a dynamic "Recent Activity" feed on the main dashboard page, showing key actions like form creations, status changes, SOH uploads, and user approvals.
    *   Display key operational metrics based on real-time data (e.g., forms in progress, total items counted, overall variance percentage, count accuracy per team/user, progress towards STO completion).
*   **User Management Enhancements:**
    *   Implement full "Edit User" functionality for Super Users to modify details of their Admin Users (e.g., name, role - with appropriate safeguards).
    *   [DONE] Implement "Add New User" functionality directly from the User Management page, allowing Super Users to create Admin Users without them going through the public registration page (streamlining admin team setup).
    *   Implement a secure "Forgot Password" / "Password Reset" flow for all users.
    *   Option for Super Users to resend verification emails to unverified Admin Users or resend approval notification emails to themselves (if applicable).

## III. Operational & UX Features

*   **Form Printing:**
    *   Implement actual PDF generation for stock count forms, formatted for printing. This could involve server-side PDF generation (e.g., using `pdfmake` or `puppeteer`) or client-side libraries, ensuring forms are clear and easy to use for physical counting.
*   **Notifications System:**
    *   Develop an in-app notification system for Super Users regarding pending admin approvals, forms ready for verification, significant variances detected, etc.
    *   Consider email notifications for critical alerts or summaries.
*   **Audit Trails:**
    *   Implement a comprehensive logging system (audit trail) to record key user actions and data changes (e.g., user creation, approval, activation, SOH upload, form generation, count submission, status changes, verification) for accountability, troubleshooting, and ensuring process integrity.
*   **Advanced Reporting & Analytics:**
    *   Introduce more sophisticated charting and data visualization for reports (e.g., trend analysis of count accuracy over time, variance by item category/location).
    *   Potentially a custom report builder for users to create tailored views of stock data and operational performance.
*   **UI/UX Refinements:**
    *   Conduct user testing with Admin team members and gather feedback to refine workflows and UI elements related to form management and data input.
    *   Improve loading states, progress indicators, and user feedback across the application, especially during data-intensive operations.
    *   Ensure consistent design language and intuitive navigation.
    *   Perform an accessibility (A11y) review and make necessary improvements for all user roles.
*   **Data Import/Export:**
    *   Provide more robust options for exporting various data sets (user lists, form data with counts, SOH data, variance reports) in standard formats like CSV or Excel.
*   **STO Event Management:**
    *   Introduce a concept of a "Stock Take Operation (STO) Event" to group related SOH uploads, forms, and results. This would allow for managing multiple STOs over time.

## IV. GenAI Integration (Future Consideration for Accuracy & Efficiency)

*   **Anomaly Detection in Counts:**
    *   Use Genkit to analyze physical count data against SOH and historical patterns to identify potential anomalies or unusual variances that might indicate count errors or other issues.
*   **Predictive Insights for Stock Discrepancies:**
    *   Explore using AI to predict stock discrepancies or suggest areas for focused recounting based on historical data, item velocity, or other factors.
*   **Natural Language Queries for Reports:**
    *   Allow users to query stock data or reports using natural language (e.g., "Show me forms with variance greater than 10% for Area A").

## V. Testing & Quality Assurance

*   **Unit Tests:**
    *   Write comprehensive unit tests for critical API route logic (authentication, data manipulation), utility functions, and complex components.
*   **Integration Tests:**
    *   Test interactions between different parts of the system (e.g., API and Firestore database, form generation based on SOH data).
*   **End-to-End (E2E) Tests:**
    *   Implement E2E tests for key user flows (registration, login, SOH upload, form generation, physical count input, approval processes, report viewing) using tools like Playwright or Cypress.

## VI. Deployment & Infrastructure

*   **CI/CD Pipeline:**
    *   Set up a Continuous Integration/Continuous Deployment pipeline (e.g., using GitHub Actions, GitLab CI, or Firebase Hosting's GitHub integration) for automated testing and deployment to staging/production environments.
*   **Scalability Review:**
    *   Periodically review Firebase usage and query patterns to ensure scalability as data (SOH, forms, counts) and user load grows.
    *   Optimize Firestore queries and data structures for performance.
*   **Backup and Restore Strategy:**
    *   Define and test a backup and restore strategy for Firestore data critical to stock-take operations.

This plan provides a roadmap for evolving StockFlow into a more robust, feature-rich, and secure application, specifically tailored to enhancing warehouse stock-take processes. Prioritization of these items will depend on business needs and available resources.

