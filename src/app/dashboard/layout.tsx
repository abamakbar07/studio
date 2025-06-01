
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionCookie = Cookies.get('stockflow-session');
    let userData = null;
    if (sessionCookie) {
      try {
        userData = JSON.parse(sessionCookie);
      } catch (e) {
        Cookies.remove('stockflow-session', { path: '/' }); 
      }
    }
    
    if (userData?.id) {
      setCurrentUser(userData);
    } else {
      const storedUser = localStorage.getItem('stockflow-user');
      if (storedUser) {
        try {
          userData = JSON.parse(storedUser);
          if (userData?.id) {
            setCurrentUser(userData);
          } else {
            localStorage.removeItem('stockflow-user'); 
            router.push("/auth/login");
          }
        } catch (e) {
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
    localStorage.removeItem('stockflow-user');
    Cookies.remove('stockflow-session', { path: '/' });
    setCurrentUser(null);
    router.push("/auth/login");
  };

  if (isLoading) {
     return <div className="flex items-center justify-center min-h-screen"><p>Loading session...</p></div>;
  }

  if (!currentUser && !pathname.startsWith('/auth')) {
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
