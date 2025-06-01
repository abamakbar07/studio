
"use client";

import { Logo } from "@/components/icons/logo";
import { Header } from "@/components/layout/header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { NAV_LINKS } from "@/lib/constants";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import Cookies from 'js-cookie';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined); // undefined means loading
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionCookie = Cookies.get('stockflow-session');
    let userData = null;

    if (sessionCookie) {
      try {
        userData = JSON.parse(sessionCookie);
        if (userData?.id && userData?.email && userData?.role) {
          setCurrentUser(userData);
        } else {
          // Invalid cookie structure
          setCurrentUser(null);
          Cookies.remove('stockflow-session', { path: '/' }); 
        }
      } catch (e) {
        // Error parsing cookie
        setCurrentUser(null);
        Cookies.remove('stockflow-session', { path: '/' }); 
      }
    } else {
      // No cookie found
      setCurrentUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Redirect if loading is complete and no user is found, and not on an auth page
    if (!isLoading && !currentUser && !pathname.startsWith('/auth')) {
      router.push("/auth/login");
    }
  }, [currentUser, isLoading, pathname, router]);

  const getCurrentPageTitle = () => {
    const currentLink = NAV_LINKS(currentUser?.role).find(link => pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href)));
    if (pathname.includes("/forms/") && pathname.includes("/input")) return "Input Form Data";
    return currentLink ? currentLink.label : "Dashboard";
  };

  const handleLogout = async () => {
    localStorage.removeItem('stockflow-user'); // Good to clear this as a legacy item if present
    Cookies.remove('stockflow-session', { path: '/' });
    setCurrentUser(null); // Update state immediately
    router.push("/auth/login");
  };

  if (isLoading || currentUser === undefined) {
     return <div className="flex items-center justify-center min-h-screen"><p>Loading session...</p></div>;
  }

  // If after loading, there's still no currentUser, and we are on a dashboard page,
  // the redirect in the second useEffect should handle it.
  // We render children only if currentUser is present, or if it's an auth page (though layout doesn't wrap auth typically).
  if (!currentUser && !pathname.startsWith('/auth')) {
     // This state should ideally be brief as the redirect kicks in.
     // Or, if you have public dashboard pages, adjust this logic.
     return <div className="flex items-center justify-center min-h-screen"><p>Redirecting to login...</p></div>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Logo className="h-8 w-auto group-data-[collapsible=icon]:h-7" />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav currentUserRole={currentUser?.role} />
        </SidebarContent>
        <SidebarFooter className="p-2">
           <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-3 group-data-[collapsible=icon]:mr-0" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header pageTitle={getCurrentPageTitle()} user={currentUser} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
