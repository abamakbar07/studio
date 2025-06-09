
import type { UserRole, FormStatus, STOProjectStatus, SOHDataReferenceStatus } from "./types";
import { 
  LayoutDashboard, UploadCloud, FileText, Users, Settings, Printer, Edit3, 
  CheckCircle2, ShieldCheck, Database, BarChart3, FolderKanban, ListChecks, 
  PlayCircle, ScanLine, Archive, Hourglass, AlertCircle, Briefcase, FileCheck2
} from "lucide-react";

// NAV_LINKS is now a function that accepts the current user's role
export const NAV_LINKS = (role?: UserRole, projectSelected?: boolean) => { // Added projectSelected
  const allLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["superuser", "admin_input", "admin_doc_control", "admin_verification"] as UserRole[], requiresProject: false },
    { href: "/dashboard/projects", label: "STO Projects", icon: FolderKanban, roles: ["superuser"] as UserRole[], requiresProject: false },
    { href: "/dashboard/select-project", label: "Select Project", icon: Briefcase, roles: ["admin_input", "admin_doc_control", "admin_verification"] as UserRole[], requiresProject: false, adminOnly: true },
    { href: "/dashboard/upload-soh", label: "SOH Data Upload", icon: UploadCloud, roles: ["superuser", "admin_doc_control"] as UserRole[], requiresProject: true },
    { href: "/dashboard/forms", label: "Forms Management", icon: FileText, roles: ["superuser", "admin_doc_control", "admin_verification", "admin_input"] as UserRole[], requiresProject: true },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["superuser", "admin_verification"] as UserRole[], requiresProject: true},
    { href: "/dashboard/admin/user-management", label: "User Management", icon: Users, roles: ["superuser"] as UserRole[], requiresProject: false },
    // { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["superuser", "admin_input", "admin_doc_control", "admin_verification"] as UserRole[] },
  ];

  if (!role) return []; 

  return allLinks.filter(link => {
    if (!link.roles.includes(role)) return false;
    if (link.adminOnly && role === 'superuser') return false; // Hide "Select Project" for superuser
    if (role !== 'superuser' && link.requiresProject && !projectSelected) return false; // Hide project-specific links if no project selected by admin
    return true;
  });
};


export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "superuser", label: "Super User" },
  { value: "admin_input", label: "Admin Input" },
  { value: "admin_doc_control", label: "Admin Document Control" },
  { value: "admin_verification", label: "Admin Verification" },
];

export const FORM_STATUSES: FormStatus[] = ["Printed", "Process Counting", "Finish Counting", "Verified", "Inputted"];

export const FORM_STATUS_ICONS: Record<FormStatus, React.ElementType> = {
  "Printed": Printer,
  "Process Counting": Edit3,
  "Finish Counting": CheckCircle2,
  "Verified": ShieldCheck,
  "Inputted": Database,
};

export const STO_PROJECT_STATUS_LIST: STOProjectStatus[] = ["Planning", "Active", "Counting", "Verification", "Completed", "Archived"];

export const STO_PROJECT_STATUS_ICONS: Record<STOProjectStatus, React.ElementType> = {
  "Planning": ListChecks,
  "Active": PlayCircle,
  "Counting": ScanLine,
  "Verification": ShieldCheck,
  "Completed": CheckCircle2,
  "Archived": Archive,
};

export const SOH_DATA_REFERENCE_STATUS_ICONS: Record<SOHDataReferenceStatus, React.ElementType> = {
  "Pending": Hourglass,
  "Uploading": UploadCloud,
  "Processing": Edit3, // Using Edit3 as a generic processing icon
  "Validating": ShieldCheck,
  "Storing": Database,
  "Completed": CheckCircle2,
  "ValidationError": AlertCircle,
  "StorageError": AlertCircle,
  "UploadError": AlertCircle,
  "SystemError": AlertCircle,
  "Pending Deletion": Hourglass, 
};


export const getStatusColor = (status: STOProjectStatus | FormStatus | SOHDataReferenceStatus) => {
  switch (status) {
    // Project Statuses
    case "Planning": return "bg-blue-100 text-blue-700";
    case "Active": return "bg-green-100 text-green-700";
    case "Counting": return "bg-yellow-100 text-yellow-700";
    case "Verification": return "bg-purple-100 text-purple-700"; // Project Verification
    case "Completed": return "bg-teal-100 text-teal-700"; // Project Completed
    case "Archived": return "bg-gray-100 text-gray-700";
    
    // Form Statuses
    case "Printed": return "bg-sky-100 text-sky-700";
    case "Process Counting": return "bg-amber-100 text-amber-700";
    case "Finish Counting": return "bg-lime-100 text-lime-700";
    // "Verified" for forms (using a different color to distinguish from project verification if needed)
    // For now, assume it can share if context is clear or use a distinct one like:
    // case "Verified": return "bg-indigo-100 text-indigo-700"; 
    case "Inputted": return "bg-emerald-100 text-emerald-700";

    // SOH Data Reference Statuses
    case "Pending": return "bg-gray-100 text-gray-600";
    case "Uploading": return "bg-blue-100 text-blue-600";
    case "Processing": return "bg-blue-100 text-blue-600";
    case "Validating": return "bg-blue-100 text-blue-600";
    case "Storing": return "bg-blue-100 text-blue-600";
    // "Completed" for SOH will use a dynamic check for errorMessage for green/yellow
    case "ValidationError": return "bg-red-100 text-red-600";
    case "StorageError": return "bg-red-100 text-red-600";
    case "UploadError": return "bg-red-100 text-red-600";
    case "SystemError": return "bg-red-100 text-red-600";
    case "Pending Deletion": return "bg-orange-100 text-orange-600";

    default: return "bg-gray-100 text-gray-700";
  }
};

export const getSohRefStatusClass = (status: SOHDataReferenceStatus, errorMessage?: string | null) => {
  if (status === "Completed") {
    return errorMessage ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
  }
  return getStatusColor(status);
};

export const getSohRefStatusIcon = (status: SOHDataReferenceStatus, errorMessage?: string | null) => {
  if (status === "Completed") {
    return errorMessage ? AlertTriangle : CheckCircle2;
  }
  // Ensure FileCheck2 is imported or handled if SOH_DATA_REFERENCE_STATUS_ICONS isn't exhaustive
  return SOH_DATA_REFERENCE_STATUS_ICONS[status] || AlertCircle;
};
