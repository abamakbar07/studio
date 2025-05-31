
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
import Cookies from 'js-cookie'; // For client-side cookie access

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Client-side check for session cookie
    const sessionCookie = Cookies.get('stockflow-session');
    let userData = null;
    if (sessionCookie) {
      try {
        userData = JSON.parse(sessionCookie);
      } catch (e) {
        console.error("Failed to parse session cookie:", e);
        Cookies.remove('stockflow-session', { path: '/' }); // Remove invalid cookie
      }
    }
    
    if (userData?.id) {
      setCurrentUser(userData);
    } else {
      // If no session, try localStorage as a fallback (from previous login logic)
      // This helps with transition if users were logged in before cookie implementation
      const storedUser = localStorage.getItem('stockflow-user');
      if (storedUser) {
        try {
          userData = JSON.parse(storedUser);
          if (userData?.id) {
            setCurrentUser(userData);
            // Optionally, re-set the cookie here if it was missing but localStorage had it
            // For now, we'll assume API login sets the cookie primarily.
          } else {
            localStorage.removeItem('stockflow-user'); // Clean up invalid localStorage
            router.push("/auth/login");
          }
        } catch (e) {
          console.error("Failed to parse localStorage user:", e);
          localStorage.removeItem('stockflow-user');
          router.push("/auth/login");
        }
      } else {
         router.push("/auth/login");
      }
    }
    setIsLoading(false);
  }, [router]);

  const getCurrentPageTitle = () => {
    const currentLink = NAV_LINKS(currentUser?.role).find(link => pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href)));
    if (pathname.includes("/forms/") && pathname.includes("/input")) return "Input Form Data";
    return currentLink ? currentLink.label : "Dashboard";
  };

  const handleLogout = async () => {
    // Clear client-side session
    localStorage.removeItem('stockflow-user');
    Cookies.remove('stockflow-session', { path: '/' });
    setCurrentUser(null);

    // Optionally: Call a backend logout endpoint to invalidate server-side session/cookie if needed
    // await fetch('/api/auth/logout', { method: 'POST' });

    router.push("/auth/login");
  };

  if (isLoading) {
     return <div className="flex items-center justify-center min-h-screen"><p>Loading session...</p></div>;
  }

  if (!currentUser && !pathname.startsWith('/auth')) {
     // This case should ideally be handled by the useEffect redirect,
     // but as a fallback, prevent rendering children if no user and not on auth page.
     return null;
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
