
# StockFlow: Next Development Plan

This document outlines potential future enhancements and features for the StockFlow application. The primary goal of StockFlow is to support the Stock Take process within warehouse operations.
**A core architectural direction is to evolve StockFlow into a Project-Based system.** This means Super Users will be able to manage multiple distinct **Stock Take Operation (STO) Projects** (or "Events"). Each project will encapsulate its own SOH data, forms, physical counts, variances, and potentially assigned Admin Users, allowing for better organization and data segregation for different clients, departments, or specific stock-take initiatives.

Future developments should align with improving accuracy, transparency, and efficiency within this project-based framework.

## I. Security Enhancements (Project-Aware)

*   **Robust Session Management:**
    *   Implement a more comprehensive session management solution (e.g., `next-auth` with JWTs, refresh tokens, and secure cookie handling) to replace or augment the current basic cookie system.
*   **Project-Scoped Firebase Security Rules:**
    *   Conduct a thorough review and strengthening of Firebase Security Rules for Firestore to ensure least-privilege access. **[Initial rules conceptualized for STO Projects, needs full implementation and testing]**
    *   Rules must be **project-aware**, ensuring users (Super Users and Admin Users) can only access data related to projects they own or are assigned to.
    *   Define data ownership clearly: Super User owns STO Projects; Admin Users are assigned to projects.
*   **Input Validation & Sanitization:**
    *   Implement comprehensive server-side and client-side input validation and sanitization for all user inputs, API requests, and forms to prevent XSS, injection attacks, and other vulnerabilities. This is especially important for data related to stock counts and SOH uploads *within specific projects*. **[Basic validation implemented for STO Project creation/update]**
*   **API Rate Limiting & Security Headers:**
    *   Implement rate limiting on critical API endpoints (e.g., login, registration, data upload, project creation).
    *   Add security headers (e.g., Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Frame-Options).
*   **Two-Factor Authentication (2FA):**
    *   Consider adding 2FA for an extra layer of security, especially for Super User accounts.

## II. Project-Based STO: Core Functionality Enhancements

The following core functionality improvements are central to the project-based architecture.

*   **A. STO Project Management (Foundation):**
    *   **Project Creation & Lifecycle:** Super Users can create, name, describe, and manage the lifecycle (e.g., Planning, Active, Counting, Verification, Completed, Archived) of STO Projects. **[DONE - Initial implementation: Superusers can create projects with name, description, client/department, notes, and update status. API and UI in place.]**
    *   **Project Association:** Ability to associate projects with specific clients, internal departments, or other relevant entities. **[DONE - Basic free-text fields for client and department names implemented.]**
    *   **Project-Specific Settings:** Define project-specific parameters or configurations if needed. **[DONE - Basic notes field for settings implemented.]**
    *   **Admin User Assignment to Projects:** Super Users can assign their Admin Users to one or more STO Projects, thereby scoping their access and tasks.
*   **B. SOH Data Processing & Storage (Per Project):**
    *   SOH data uploads are now **scoped to a specific STO Project**.
    *   A project can have multiple SOH data references (e.g., initial SOH, supplementary SOH).
    *   Implement actual parsing of uploaded `.xlsx` SOH data files (currently simulated) for the selected project.
    *   Validate SOH data structure, content, and data types upon upload within the project context.
    *   Store processed stock items (SKU, description, initial SOH quantity, location/bin if available) in a dedicated Firestore collection, linked to the SOH data reference, the STO Project, and subsequently to forms.
    *   Handle potential errors during SOH processing and provide user feedback.
*   **C. Dynamic Form Generation & Item Selection (Within Projects):**
    *   Forms are generated **within the context of a selected STO Project**.
    *   Super Users or Admin Document Control select specific SOH data references *belonging to the current project* when generating new stock count forms.
    *   Provide options to filter or select specific ranges/categories of items (e.g., by location, product category, high-value items) from the project's SOH data to be included in a form.
    *   Store form definitions and their associated item lists (or queries) in Firestore, linked to the parent STO Project.
*   **D. Physical Count Data Persistence & Validation (Project-Scoped):**
    *   Securely save physical counts entered on the "Input Data" page for each form item to Firestore, **scoped to the specific STO Project**.
    *   Link these counts back to the specific form, the original stock item from the project's SOH, and the STO Project itself.
    *   Timestamp count entries and record the user who made the input for auditability.
    *   Implement validation rules for physical counts (e.g., non-negative, numeric).
*   **E. Automated Variance Calculation & Reporting (Project-Level):**
    *   Automatically calculate variance (Physical Count - SOH Quantity) once physical counts are submitted and verified for a form *within a project*.
    *   Store variance data per item, per form, all under the umbrella of the STO Project.
    *   Develop detailed variance reports, allowing filtering by form, date, item category, variance magnitude, location, etc., **primarily at the project level**.
    *   Option for Super Users to view aggregate reports or comparisons across projects they own.
    *   Option to export project-specific variance reports (e.g., to CSV/Excel).
*   **F. Dashboard Enhancements for Project Monitoring:**
    *   The main dashboard should allow Super Users to **select an active STO Project** to view its specific details or an overview of all their projects.
    *   Implement a dynamic "Recent Activity" feed on the dashboard, filterable by project, showing key actions like project creations/status changes, form creations, SOH uploads, and user approvals related to the selected project.
    *   Display key operational metrics **per project** (e.g., forms in progress, total items counted, overall variance percentage for the project, count accuracy per team/user within the project, progress towards project completion).
*   **G. User Management Enhancements (Project Assignment Focus):**
    *   Implement full "Edit User" functionality for Super Users to modify details of their Admin Users, including managing their **assignments to STO Projects**.
    *   Implement "Add New User" functionality directly from the User Management page, allowing Super Users to create Admin Users without them going through the public registration page (streamlining admin team setup). **[DONE for basic creation; needs project assignment capability]**
    *   Admin Users' views and actions within the application (e.g., accessing forms, inputting data) are **restricted to the STO Projects they are assigned to**.
    *   Implement a secure "Forgot Password" / "Password Reset" flow for all users.
    *   Option for Super Users to resend verification emails or manage project assignment notifications.

## III. Operational & UX Features (Supporting Project-Based Workflow)

*   **Form Printing:**
    *   Implement actual PDF generation for stock count forms. **Printed forms must clearly indicate their parent STO Project.**
    *   Ensure forms are clear and easy to use for physical counting.
*   **Notifications System:**
    *   Develop an in-app notification system. Notifications can be **project-specific** (e.g., "Form ABC in Project XYZ is ready for verification," "Admin User John Doe assigned to Project XYZ").
    *   Consider email notifications for critical alerts or summaries, potentially filterable by project.
*   **Audit Trails:**
    *   Implement a comprehensive logging system (audit trail) to record key user actions and data changes. **All logs must capture the relevant Project ID for context.**
    *   Examples: project creation/modification, user assignment to project, SOH upload to project, form generation within project, count submission, status changes, verification.
*   **Advanced Reporting & Analytics:**
    *   Introduce more sophisticated charting and data visualization. **Reports must be primarily filterable by STO Project.**
    *   Provide options for Super Users to generate aggregate views or comparisons across multiple projects they manage.
    *   Potentially a custom report builder for users to create tailored views of stock data and operational performance *per project*.
*   **UI/UX Refinements:**
    *   **Project Context:** Ensure the current STO Project context is always clearly visible and navigable when users are working on project-specific data (forms, SOH, reports).
    *   Develop intuitive interfaces for Super Users to manage their STO Projects and assign users.
    *   Conduct user testing with Admin team members and gather feedback to refine project-based workflows.
    *   Improve loading states, progress indicators, and user feedback across the application.
    *   Ensure consistent design language.
    *   Perform an accessibility (A11y) review and make necessary improvements.
*   **Data Import/Export:**
    *   Provide more robust options for exporting various data sets (user lists, form data with counts, SOH data, variance reports), with clear options for **project-scoped exports**.
*   **Data Structures for Project-Based Architecture:**
    *   Firestore data structures (collections, documents) must be designed to efficiently support project-based querying and data isolation (e.g., using `projectId` as a key field in relevant documents). **[Initial structure for `sto_projects` collection implemented.]**

## IV. GenAI Integration (Leveraging Project Data)

*   **Anomaly Detection in Counts:**
    *   Use Genkit to analyze physical count data against SOH and historical patterns **within a specific STO Project** to identify potential anomalies or unusual variances.
    *   Consider cross-project analysis for identifying broader patterns if applicable and secure.
*   **Predictive Insights for Stock Discrepancies:**
    *   Explore using AI to predict stock discrepancies or suggest areas for focused recounting based on historical data from the current project or similar past projects.
*   **Natural Language Queries for Reports:**
    *   Allow users to query stock data or reports using natural language, potentially specifying the project (e.g., "Show me forms with variance greater than 10% for Project Alpha").

## V. Testing & Quality Assurance

*   **Unit Tests:**
    *   Write comprehensive unit tests for critical API route logic, utility functions, and complex components, including tests for project-based logic.
*   **Integration Tests:**
    *   Test interactions between different parts of the system (e.g., API and Firestore, form generation based on project-specific SOH data, project-scoped user access).
*   **End-to-End (E2E) Tests:**
    *   Implement E2E tests for key user flows, ensuring they correctly handle the project-based architecture (project selection, project-scoped data operations, user assignments to projects).

## VI. Deployment & Infrastructure

*   **CI/CD Pipeline:**
    *   Set up a Continuous Integration/Continuous Deployment pipeline for automated testing and deployment.
*   **Scalability Review:**
    *   Periodically review Firebase usage and query patterns to ensure scalability as the number of projects, data per project, and user load grows.
    *   Optimize Firestore queries (including project-scoped queries) and data structures for performance.
*   **Backup and Restore Strategy:**
    *   Define and test a backup and restore strategy for Firestore data, considering the project-based data organization.

This plan provides a roadmap for evolving StockFlow into a more robust, feature-rich, and secure application, specifically tailored to enhancing warehouse stock-take processes through a flexible project-based model. Prioritization of these items will depend on business needs and available resources.
