
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
}

export interface SOHDataReference {
  id: string;
  filename: string;
  uploadedAt: string;
  rowCount: number;
  status: "Pending" | "Processing" | "Completed" | "Error";
}

export interface StockItem {
  id: string;
  sku: string;
  description: string;
  sohQuantity: number; // From uploaded SOH
  physicalCount?: number | null; // From direct input
  variance?: number;
}
