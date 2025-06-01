
# StockFlow Project Structure

This document outlines the directory and file structure of the StockFlow application. StockFlow is built with Next.js (App Router), React, TypeScript, ShadCN UI, Tailwind CSS, Firebase, and Genkit.

## Root Directory (`/`)

-   **`.env.local`**: Local environment variables (Firebase keys, email config, etc.). Not committed to Git.
-   **`.gitignore`**: Specifies intentionally untracked files that Git should ignore.
-   **`apphosting.yaml`**: Configuration for Firebase App Hosting.
-   **`components.json`**: ShadCN UI configuration file.
-   **`middleware.ts`**: Next.js middleware for handling request processing (e.g., authentication checks, redirects).
-   **`next.config.ts`**: Next.js configuration file (e.g., image optimization, build options).
-   **`NEXT_DEVELOPMENT.md`**: Document outlining future development plans and feature enhancements, focusing on a Project-Based STO architecture.
-   **`package.json`**: Lists project dependencies, scripts (dev, build, start), and project metadata.
-   **`PROJECT_STRUCTURE.md`**: This file, detailing the project's structure.
-   **`README.md`**: Provides an overview of the project, setup instructions, and key features.
-   **`tailwind.config.ts`**: Tailwind CSS configuration file (theme, plugins).
-   **`tsconfig.json`**: TypeScript configuration file for the project.

## Source Directory (`src/`)

This is the main directory containing the application's source code.

### `src/app/`

Contains the core application logic, routing, and UI using the Next.js App Router.

-   **`globals.css`**: Global styles, Tailwind CSS directives, and ShadCN theme CSS variables.
-   **`layout.tsx`**: The root layout component for the entire application.
-   **`page.tsx`**: The main landing page component (homepage).

-   **`(auth)/`**: Route group for authentication-related pages.
    -   `auth/login/page.tsx`: Login page.
    -   `auth/register/page.tsx`: Superuser registration page.
    -   `auth/register-admin/page.tsx`: Admin user registration page.
    -   `auth/verify-email/[status]/page.tsx`: Page to display email verification status.
    -   `auth/approval/[status]/page.tsx`: Page to display superuser approval status.
    -   `layout.tsx`: Layout specific to authentication pages.

-   **`dashboard/`**: Route group for authenticated user dashboard sections.
    -   `layout.tsx`: Layout for the dashboard (includes sidebar, header, user context).
    -   `page.tsx`: Main dashboard overview page.
    -   `admin/user-management/page.tsx`: Page for superusers to manage admin users.
    -   `forms/`: Directory for forms management.
        -   `page.tsx`: Main forms management page (currently placeholder).
        -   `[formId]/input/page.tsx`: Page for inputting data into a specific form.
    -   `reports/page.tsx`: Page for displaying reports and analytics.
    -   `upload-soh/page.tsx`: Page for uploading Stock On Hand (SOH) data.
    -   *(`settings/page.tsx` - placeholder, if implemented)*

-   **`api/`**: Directory for Next.js API routes (backend logic).
    -   `auth/`: Authentication-related API endpoints.
        -   `login/route.ts`: Handles user login.
        -   `register-superuser/route.ts`: Handles superuser registration.
        -   `register-admin/route.ts`: Handles admin user registration by users.
        -   `verify-email/[token]/route.ts`: Handles email verification via token.
        -   `approve-superuser/[token]/route.ts`: Handles superuser account approval by administrator.
    -   `admin/`: Admin-specific API endpoints.
        -   `create-user/route.ts`: Allows superusers to create admin users directly.
    -   `test-email-config/route.ts`: Endpoint to test email environment variable configuration.

### `src/components/`

Contains reusable UI components.

-   **`ui/`**: ShadCN UI components (e.g., `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `sidebar.tsx`, etc.). These are generally installed/generated via the ShadCN CLI.
-   **`icons/`**: Custom SVG icons or icon components (e.g., `logo.tsx`).
-   **`layout/`**: Components specific to the application's layout structure.
    -   `header.tsx`: The main header component for the dashboard.
    -   `sidebar-nav.tsx`: Navigation component within the sidebar.

### `src/lib/`

Contains utility functions, constants, type definitions, and library configurations.

-   **`constants.ts`**: Application-wide constants (e.g., navigation links, user roles, form statuses).
-   **`firebase/`**: Firebase related configurations.
    -   `config.ts`: Firebase app initialization and service exports (Firestore, Auth).
-   **`types.ts`**: TypeScript type definitions and interfaces used throughout the application (e.g., `User`, `StockForm`).
-   **`utils.ts`**: General utility functions (e.g., `cn` for classnames, token generation).

### `src/hooks/`

Contains custom React hooks.

-   **`use-toast.ts`**: Hook for managing and displaying toast notifications.
-   **`use-mobile.ts`**: Hook to detect if the application is being viewed on a mobile-sized screen.

### `src/ai/`

Contains Genkit related files for AI functionalities.

-   **`genkit.ts`**: Genkit global `ai` object initialization and configuration.
-   **`dev.ts`**: Entry point for running Genkit flows in development mode (`genkit start`).
-   **`flows/`**: (Directory for Genkit flow definitions - currently empty but planned for future AI features).

## Public Directory (`public/`)

Contains static assets that are served directly (e.g., images, favicons, manifest files). Files in this directory are accessible from the root of your site (e.g., `/image.png` maps to `public/image.png`).
*(Currently, no specific critical assets noted here, but this is the standard location.)*

This structure provides a modular and organized way to manage the application's codebase, separating concerns and making it easier to navigate and maintain.
