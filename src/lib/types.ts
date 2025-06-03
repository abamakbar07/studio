
export type UserRole = "superuser" | "admin_input" | "admin_doc_control" | "admin_verification";

export interface User {
  id: string; // Firestore document ID
  email: string;
  password?: string; // Store hashed password in a real app
  role: UserRole;
  name?: string;
  
  emailVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: string | null; // ISO string

  approved?: boolean; // For superuser status & admin approval
  approvalToken?: string | null;
  approvalTokenExpires?: string | null; // ISO string for superuser approval link

  isActive?: boolean; // For admin activation after approval

  superuserEmail?: string; // For admin registration, linking to a superuser
  
  createdAt: string; // ISO string representation of Timestamp
  updatedAt?: string; // ISO string representation of Timestamp
}

export type FormStatus = "Printed" | "Process Counting" | "Finish Counting" | "Verified" | "Inputted";

export interface StockForm {
  id: string;
  formName: string;
  dataReference: string; // Filename of uploaded SOH
  status: FormStatus;
  createdAt: string;
  updatedAt: string;
  itemCount?: number; // Number of items in this form
  stoProjectId?: string; // Link to the STO Project
}

export interface SOHDataReference {
  id: string;
  filename: string;
  uploadedAt: string;
  rowCount: number;
  status: "Pending" | "Processing" | "Completed" | "Error";
  stoProjectId?: string; // Link to the STO Project
}

export interface StockItem {
  id: string;
  sku: string;
  description: string;
  sohQuantity: number; // From uploaded SOH
  physicalCount?: number | null; // From direct input
  variance?: number;
  stoProjectId?: string; // Link to the STO Project
  formId?: string; // Link to the StockForm
}

// STO Project Management
export const STO_PROJECT_STATUSES = ["Planning", "Active", "Counting", "Verification", "Completed", "Archived"] as const;
export type STOProjectStatus = typeof STO_PROJECT_STATUSES[number];

export interface STOProject {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  status: STOProjectStatus;
  clientName?: string;
  departmentName?: string;
  settingsNotes?: string; // General notes for project-specific settings
  createdBy: string; // Email of the superuser who created the project
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
