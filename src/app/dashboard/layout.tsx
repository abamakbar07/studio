
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
import React, { useEffect, useState, createContext, useContext, ReactNode } from "react";
import type { User } from "@/lib/types";
import Cookies from 'js-cookie';

interface UserContextType {
  currentUser: User | null | undefined; // undefined: loading, null: no user, User: logged in
  isLoadingUser: boolean;
  logoutUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider (DashboardLayout)");
  }
  return context;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const sessionCookie = Cookies.get('stockflow-session');
    let userData: User | null = null;
    console.log('[DashboardLayout] Initializing User Context. Cookie:', sessionCookie);

    if (sessionCookie) {
      try {
        userData = JSON.parse(sessionCookie);
        if (userData?.id && userData?.email && userData?.role) {
          setCurrentUser(userData);
        } else {
          // Invalid cookie structure
          setCurrentUser(null);
          Cookies.remove('stockflow-session', { path: '/' });
          console.log('[DashboardLayout] Invalid cookie structure, user set to null.');
        }
      } catch (e) {
        setCurrentUser(null);
        Cookies.remove('stockflow-session', { path: '/' });
        console.error('[DashboardLayout] Error parsing cookie, user set to null:', e);
      }
    } else {
      setCurrentUser(null);
      console.log('[DashboardLayout] No session cookie found, user set to null.');
    }
    setIsLoadingUser(false);
  }, []);

  useEffect(() => {
    // Redirect if loading is complete and no user is found, and not on an auth page
    if (!isLoadingUser && !currentUser && !pathname.startsWith('/auth')) {
      console.log('[DashboardLayout] Redirecting to login. isLoadingUser:', isLoadingUser, 'currentUser:', currentUser);
      router.push("/auth/login");
    }
  }, [currentUser, isLoadingUser, pathname, router]);

  const getCurrentPageTitle = () => {
    const currentLink = NAV_LINKS(currentUser?.role).find(link => pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href)));
    if (pathname.includes("/forms/") && pathname.includes("/input")) return "Input Form Data";
    return currentLink ? currentLink.label : "Dashboard";
  };

  const handleLogout = () => {
    Cookies.remove('stockflow-session', { path: '/' });
    setCurrentUser(null); // Update context state immediately
    router.push("/auth/login");
  };

  // Display loading UI while session is being determined
  if (isLoadingUser || currentUser === undefined) { // currentUser === undefined also implies loading
     return <div className="flex items-center justify-center min-h-screen"><p>Loading session...</p></div>;
  }

  // This case should ideally be brief as the redirect effect kicks in.
  if (!currentUser && !pathname.startsWith('/auth')) {
     return <div className="flex items-center justify-center min-h-screen"><p>Redirecting to login...</p></div>;
  }

  const userContextValue: UserContextType = {
    currentUser,
    isLoadingUser,
    logoutUser: handleLogout,
  };

  return (
    <UserContext.Provider value={userContextValue}>
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
    </UserContext.Provider>
  );
}
