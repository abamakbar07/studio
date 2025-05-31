import type { UserRole, FormStatus } from "./types";
import { LayoutDashboard, UploadCloud, FileText, Users, Settings, Printer, Edit3, CheckCircle2, ShieldCheck, Database, BarChart3 } from "lucide-react";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["superuser", "admin_input", "admin_doc_control", "admin_verification"] },
  { href: "/dashboard/upload-soh", label: "SOH Data Upload", icon: UploadCloud, roles: ["superuser", "admin_doc_control"] },
  { href: "/dashboard/forms", label: "Forms Management", icon: FileText, roles: ["superuser", "admin_doc_control", "admin_verification", "admin_input"] },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["superuser", "admin_verification"]},
  { href: "/dashboard/admin/user-management", label: "User Management", icon: Users, roles: ["superuser"] },
  // { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["superuser", "admin_input", "admin_doc_control", "admin_verification"] },
];

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
