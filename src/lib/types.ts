
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

export const SOH_DATA_REFERENCE_STATUSES = [
  "Pending", 
  "Uploading", 
  "Processing", 
  "Validating", 
  "Storing", 
  "Completed", 
  "ValidationError", 
  "StorageError", 
  "UploadError", 
  "SystemError",
  "Pending Deletion" 
] as const;

export type SOHDataReferenceStatus = typeof SOH_DATA_REFERENCE_STATUSES[number];

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
  isLocked?: boolean;
  deleteApprovalToken?: string | null;
  deleteApprovalTokenExpires?: string | null; // ISO string
}


export interface StockItem {
  id?: string; // Firestore document ID (can be optional if we let Firestore generate it)
  sku: string; 
  sku_description: string;
  qty_on_hand: number;
  
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
  project_id?: string; 
  wbs_element?: string;
  skugrp?: string;
  received_date?: string; 
  huid?: string;
  owner_id?: string;
  stdcube?: number;

  physicalCount?: number | null;
  variance?: number;
  
  stoProjectId: string; 
  sohDataReferenceId: string; 
  formId?: string; 
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

