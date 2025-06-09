
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
  | "Pending"
  | "Uploading"
  | "Processing"
  | "Validating"
  | "Storing"
  | "Completed"
  | "ValidationError"
  | "StorageError"
  | "UploadError"
  | "SystemError";

export interface SOHDataReference {
  id: string; // Firestore document ID
  filename: string;
  originalFilename?: string;
  uploadedBy: string; // User ID or email
  uploadedAt: string; // ISO string
  processedAt?: string; // ISO string
  rowCount: number;
  status: SOHDataReferenceStatus;
  stoProjectId: string;
  errorMessage?: string | null; // Allow null for Firestore
  contentType?: string;
  size?: number;
  isLocked?: boolean; // New field for locking
}


export interface StockItem {
  id: string; // Firestore document ID
  sku: string; // Essential
  sku_description: string; // Essential
  qty_on_hand: number; // Essential
  
  form_no?: string | null;
  storerkey?: string;
  loc?: string;
  lot?: string;
  item_id?: string;
  qty_allocated?: number;
  qty_available?: number;
  lottable01?: string;
  project_scope?: string;
  lottable10?: string;
  project_id?: string; // This is project_id from the file, not to be confused with stoProjectId
  wbs_element?: string;
  skugrp?: string;
  received_date?: string; // Store as ISO string e.g., YYYY-MM-DD
  huid?: string;
  owner_id?: string;
  stdcube?: number;

  physicalCount?: number | null;
  variance?: number;
  
  stoProjectId: string; // Link to the STO Project this item belongs to
  sohDataReferenceId: string; // Link to the SOHDataReference document this item came from
  formId?: string; // Link to the StockForm if item is on a count sheet
}

export const STO_PROJECT_STATUSES = ["Planning", "Active", "Counting", "Verification", "Completed", "Archived"] as const;
export type STOProjectStatus = typeof STO_PROJECT_STATUSES[number];

export interface STOProject {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  status: STOProjectStatus;
  clientName?: string;
  departmentName?: string;
  settingsNotes?: string;
  createdBy: string; // superuser's email
  createdAt: string;
  updatedAt: string;
  assignedAdminUserIds?: string[];
}

export interface SimplifiedSelectedProject {
  id: string;
  name: string;
}

