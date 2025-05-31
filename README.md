
# StockFlow: Efficient Stock On Hand Management

StockFlow is an internal application developed to support the Stock Take process within warehouse operations. The main focus of the application is to assist Admin teams in managing stock count forms, inputting physical count results, and monitoring real-time progress of the Stock Take activities. With role-based access control and clear approval workflows, this tool is designed to improve accuracy, transparency, and efficiency throughout the stock-taking process.

## Key Features

*   **Role-Based Access Control:**
    *   **Super Administrator:** Configured via environment variables, primarily approves new Super User registrations through email links.
    *   **Super User:** Manages Admin Users, approves their registrations, and oversees their own set of Admin Users involved in stock-take operations.
    *   **Admin Users:** Specific roles (Admin Input, Admin Document Control, Admin Verification) with tailored permissions for different stages of the stock-take process.
*   **User Registration & Authentication:**
    *   Secure registration for Super Users and Admin Users.
    *   Email verification for all new user registrations.
    *   Password hashing using `bcryptjs` for secure credential storage.
    *   Database-driven login with session management via HTTP-only cookies.
*   **Approval Workflows:**
    *   New Super User registrations require approval from the Super Administrator via a unique URL sent by email.
    *   New Admin User registrations require approval and subsequent activation by their designated Super User through the User Management dashboard.
*   **SOH Data Management:**
    *   Allows upload of Stock On Hand (SOH) data files (e.g., `.xlsx`) as a baseline for stock counts.
    *   Tracks uploaded data references.
*   **Forms Management:**
    *   Generation of stock count forms based on selected SOH data.
    *   Tracking form statuses (Printed, Process Counting, Finish Counting, Verified, Inputted).
    *   Interface for inputting physical count data directly into forms.
*   **User Management Dashboard:**
    *   Super Users can view, approve, activate, deactivate, and delete Admin Users associated with them.
*   **Reporting (Initial):**
    *   Basic UI for displaying stock variance and form completion charts, supporting progress monitoring.

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI Components, Tailwind CSS
*   **Backend:** Next.js API Routes
*   **Database:** Firebase Firestore
*   **Authentication:** Custom logic with bcryptjs, HTTP-only cookies for session.
*   **Email:** Nodemailer
*   **GenAI (Planned):** Genkit (for potential future AI-driven insights to enhance accuracy and efficiency)

## Setup & Running Locally

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn

### Environment Variables

Create a `.env.local` file in the root of the project and populate it with the necessary Firebase configuration details, email server settings, and application-specific variables:

```env
# Firebase Configuration (replace with your project's credentials)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-xxxxxxxxxx

# Email Configuration (for Nodemailer)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
# This is the email address that receives approval requests for new Super Users
ADMINISTRATOR_EMAIL=dev@akbarafriansyah.my.id

# Application URL (important for generating verification/approval links)
# For local development:
NEXT_PUBLIC_APP_URL=http://localhost:9002
# For production, replace with your deployed app's URL
```

**Note:** The `ADMINISTRATOR_EMAIL` is crucial for the Super User approval workflow. The `NEXT_PUBLIC_APP_URL` is vital for generating correct email verification and approval links.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    # yarn install
    ```

### Running the Development Server

```bash
npm run dev
# or
# yarn dev
```

The application will typically be available at `http://localhost:9002` (or the port specified in your `package.json` dev script).

## Important Notes

*   **Password Security:** Passwords are now hashed using `bcryptjs`.
*   **Session Management:** The current session management uses HTTP-only cookies set by API routes. For enhanced security and features, consider `next-auth` for future development.
*   **Firebase Security Rules:** Ensure your Firestore database has appropriate security rules configured to protect user data and control access based on roles and data ownership.

## Copyright & License

© 2024 DSV Solutions Indonesia. All Rights Reserved.
Developed by muhamad.afriansyah@dsv.com.

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.
