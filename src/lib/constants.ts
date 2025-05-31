
import type { UserRole, FormStatus } from "./types";
import { LayoutDashboard, UploadCloud, FileText, Users, Settings, Printer, Edit3, CheckCircle2, ShieldCheck, Database, BarChart3 } from "lucide-react";

// NAV_LINKS is now a function that accepts the current user's role
export const NAV_LINKS = (role?: UserRole) => {
  const allLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["superuser", "admin_input", "admin_doc_control", "admin_verification"] as UserRole[] },
    { href: "/dashboard/upload-soh", label: "SOH Data Upload", icon: UploadCloud, roles: ["superuser", "admin_doc_control"] as UserRole[] },
    { href: "/dashboard/forms", label: "Forms Management", icon: FileText, roles: ["superuser", "admin_doc_control", "admin_verification", "admin_input"] as UserRole[] },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["superuser", "admin_verification"] as UserRole[]},
    { href: "/dashboard/admin/user-management", label: "User Management", icon: Users, roles: ["superuser"] as UserRole[] },
    // { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["superuser", "admin_input", "admin_doc_control", "admin_verification"] as UserRole[] },
  ];

  if (!role) return []; // Or a default set of links for non-logged-in if needed

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
