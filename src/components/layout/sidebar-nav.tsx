"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/types"; // Assuming UserRole is defined elsewhere

// Placeholder for current user role - replace with actual auth logic
const currentUserRole: UserRole = "superuser"; 

export function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar(); // To close mobile sidebar on nav

  const filteredNavLinks = NAV_LINKS.filter(link => 
    link.roles.includes(currentUserRole)
  );

  return (
    <SidebarMenu>
      {filteredNavLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild={false} // Important: SidebarMenuButton should not be asChild if Link is wrapping it
                isActive={isActive}
                variant="default"
                size="default"
                className="w-full justify-start"
                onClick={() => setOpenMobile(false)} // Close mobile sidebar on click
                tooltip={link.label}
              >
                <link.icon className="h-5 w-5 mr-3" />
                <span className="truncate">{link.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
