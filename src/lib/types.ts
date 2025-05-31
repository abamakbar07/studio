export type UserRole = "superuser" | "admin_input" | "admin_doc_control" | "admin_verification";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  approved?: boolean; // For superuser
  superuserEmail?: string; // For admin registration
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
