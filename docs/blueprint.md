# **App Name**: StockFlow

## Core Features:

- SOH Data Upload: Allows the superuser to upload stock on hand (SOH) data from XLSX files using chunked upload to handle large files, updating a status of completeness of loading the entire data.  The uploaded filename is stored as a data reference. Ensure data integrity between uploaded file and database.
- Form Generation: Generate and print forms for physical stock counting based on uploaded SOH data. Allow to update the form status from printed to 'Process Counting'.
- Form Status Tracking: Enable tracking of form progress through different stages: Printed, Process Counting, Finish Counting, Verified, and Inputted.
- Direct Data Input: Facilitate direct input of physical count data from completed forms and setting null values for blank data, which is distinct from imported SOH data.
- User Role Management: Implement user role management for different admin roles (Admin Input, Admin Document Control, Admin Verification).
- Admin Registration: Superusers registration requires email approval from a super administrator (dev@akbarafriansyah.my.id), and admin users need to enter the superuser email during registration to grant them role.
- Data Reference Selection: Allows users to select which uploaded data reference should be used for a specific STO process.

## Style Guidelines:

- Deep blue (#3F51B5), inspired by reliability and operational efficiency, which is highly saturated to feel contemporary.
- Light gray (#F0F2F5), very desaturated.
- Purple (#7E57C2), creating visual contrast without disrupting the calm tone of the overall palette.
- Headline font: 'Space Grotesk' (sans-serif) for a computerized feel; use 'Inter' (sans-serif) for body text.
- A clean and structured layout to manage data flow, enhance operational visibility, and improve user experience.
- Use distinct icons for each process stage to visualize the workflow and state of stock take operation forms.
- Use subtle transitions when changing the form status or updating data records.