
import type { UserRole, FormStatus, STOProjectStatus } from "./types";
import { 
  LayoutDashboard, UploadCloud, FileText, Users, Settings, Printer, Edit3, 
  CheckCircle2, ShieldCheck, Database, BarChart3, FolderKanban, ListChecks, 
  PlayCircle, ScanLine, Archive 
} from "lucide-react";

// NAV_LINKS is now a function that accepts the current user's role
export const NAV_LINKS = (role?: UserRole) => {
  const allLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["superuser", "admin_input", "admin_doc_control", "admin_verification"] as UserRole[] },
    { href: "/dashboard/projects", label: "STO Projects", icon: FolderKanban, roles: ["superuser"] as UserRole[] },
    { href: "/dashboard/upload-soh", label: "SOH Data Upload", icon: UploadCloud, roles: ["superuser", "admin_doc_control"] as UserRole[] },
    { href: "/dashboard/forms", label: "Forms Management", icon: FileText, roles: ["superuser", "admin_doc_control", "admin_verification", "admin_input"] as UserRole[] },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["superuser", "admin_verification"] as UserRole[]},
    { href: "/dashboard/admin/user-management", label: "User Management", icon: Users, roles: ["superuser"] as UserRole[] },
    // { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["superuser", "admin_input", "admin_doc_control", "admin_verification"] as UserRole[] },
  ];

  if (!role) return []; 

  return allLinks.filter(link => link.roles.includes(role));
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

export const getStatusColor = (status: STOProjectStatus | FormStatus) => {
  switch (status) {
    case "Planning": return "bg-blue-100 text-blue-700";
    case "Active": return "bg-green-100 text-green-700";
    case "Counting": return "bg-yellow-100 text-yellow-700";
    case "Verification": return "bg-purple-100 text-purple-700";
    case "Completed": return "bg-teal-100 text-teal-700";
    case "Archived": return "bg-gray-100 text-gray-700";
    case "Printed": return "bg-sky-100 text-sky-700";
    case "Process Counting": return "bg-amber-100 text-amber-700";
    case "Finish Counting": return "bg-lime-100 text-lime-700";
    case "Verified": return "bg-indigo-100 text-indigo-700"; // Differentiating from project verification
    case "Inputted": return "bg-emerald-100 text-emerald-700";
    default: return "bg-gray-100 text-gray-700";
  }
};
