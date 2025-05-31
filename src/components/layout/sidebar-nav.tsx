
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/types";

interface SidebarNavProps {
  currentUserRole?: UserRole;
}

export function SidebarNav({ currentUserRole }: SidebarNavProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar(); 

  // If no role, show no links or a minimal set.
  // For now, an empty array if no role, effectively hiding links until role is loaded.
  const filteredNavLinks = currentUserRole ? NAV_LINKS(currentUserRole) : [];

  return (
    <SidebarMenu>
      {filteredNavLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild={false}
                isActive={isActive}
                variant="default"
                size="default"
                className="w-full justify-start"
                onClick={() => setOpenMobile(false)} 
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
