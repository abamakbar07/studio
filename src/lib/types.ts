
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

export type SOHDataReferenceStatus = 
  | "Pending"          // Initial state after file select, before upload/processing starts
  | "Uploading"        // File is being uploaded to server
  | "Processing"       // Server received file, initial parsing started
  | "Validating"       // Server is validating data structure and content
  | "Storing"          // Server is writing valid data to Firestore
  | "Completed"        // All data successfully stored
  | "ValidationError"  // Data failed validation checks
  | "StorageError"     // Error occurred during Firestore write
  | "UploadError"      // Error during file upload itself
  | "SystemError";     // Generic server-side error during processing

export interface SOHDataReference {
  id: string; // Firestore document ID
  filename: string;
  originalFilename?: string; // If we rename it on server
  uploadedBy: string; // User ID or email
  uploadedAt: string; // ISO string - when upload initiated client-side
  processedAt?: string; // ISO string - when server finished processing
  rowCount: number; // Number of valid items processed and stored
  status: SOHDataReferenceStatus;
  stoProjectId: string; // Link to the STO Project
  errorMessage?: string; // If status is Error, ValidationError, or StorageError
  contentType?: string; // e.g., application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  size?: number; // file size in bytes
}


export interface StockItem {
  id: string; // Firestore document ID (can be auto-generated or SKU if unique per project+soh_ref)
  sku: string;
  description: string;
  sohQuantity: number; // From uploaded SOH
  location?: string; // Optional, from SOH
  physicalCount?: number | null; // From direct input
  variance?: number;
  stoProjectId: string; // Link to the STO Project
  sohDataReferenceId: string; // Link to the SOHDataReference document
  formId?: string; // Link to the StockForm if item is on a count sheet
  // Potentially: unitOfMeasure, category, etc.
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
  assignedAdminUserIds?: string[]; // Array of User IDs for assigned admin users
}

export interface SimplifiedSelectedProject {
  id: string;
  name: string;
}
