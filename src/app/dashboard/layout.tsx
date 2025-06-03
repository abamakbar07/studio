
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
import { LogOut, Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, createContext, useContext, ReactNode, useCallback } from "react";
import type { User, UserRole, SimplifiedSelectedProject } from "@/lib/types";
import Cookies from 'js-cookie';
import { useToast } from "@/hooks/use-toast";


interface UserContextType {
  currentUser: User | null | undefined; // undefined: loading, null: no user, User: logged in
  isLoadingUser: boolean;
  selectedProject: SimplifiedSelectedProject | null | undefined; // undefined: not checked, null: no project, Project: selected
  setSelectedProject: (project: SimplifiedSelectedProject | null) => void;
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
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [selectedProject, setSelectedProjectState] = useState<SimplifiedSelectedProject | null | undefined>(undefined);


  const logoutUser = useCallback(() => {
    Cookies.remove('stockflow-session', { path: '/' });
    Cookies.remove('stockflow-selected-project', { path: '/' });
    setCurrentUser(null);
    setSelectedProjectState(null);
    router.push("/auth/login");
    toast({ title: "Logged Out", description: "You have been successfully logged out."});
  }, [router, toast]);

  const setSelectedProject = useCallback((project: SimplifiedSelectedProject | null) => {
    if (project) {
      Cookies.set('stockflow-selected-project', JSON.stringify(project), { path: '/', expires: 7 });
      setSelectedProjectState(project);
       console.log('[DashboardLayout] Project selected and cookie set:', project);
      if (pathname === '/dashboard/select-project') {
         router.push('/dashboard');
      }
    } else {
      Cookies.remove('stockflow-selected-project', { path: '/' });
      setSelectedProjectState(null);
      console.log('[DashboardLayout] Project selection cleared.');
    }
  }, [router, pathname]);


  useEffect(() => {
    const sessionCookie = Cookies.get('stockflow-session');
    let userData: User | null = null;
    console.log('[DashboardLayout] Initializing User Context. Cookie:', sessionCookie);

    if (sessionCookie) {
      try {
        userData = JSON.parse(sessionCookie);
        if (userData?.id && userData?.email && userData?.role) {
          setCurrentUser(userData);
          if (userData.role !== 'superuser') {
            const projectCookie = Cookies.get('stockflow-selected-project');
            if (projectCookie) {
              try {
                const projectData = JSON.parse(projectCookie);
                setSelectedProjectState(projectData);
                console.log('[DashboardLayout] Admin user, loaded project from cookie:', projectData);
              } catch (e) {
                console.error('[DashboardLayout] Error parsing project cookie:', e);
                setSelectedProjectState(null);
                Cookies.remove('stockflow-selected-project', { path: '/' });
              }
            } else {
              setSelectedProjectState(null); // No project selected initially for admin
               console.log('[DashboardLayout] Admin user, no project cookie found.');
            }
          } else {
             setSelectedProjectState(null); // Superusers don't use global selected project context
             console.log('[DashboardLayout] Superuser, no global project selection.');
          }
        } else {
          setCurrentUser(null);
          setSelectedProjectState(null);
          logoutUser(); // Clears cookies and redirects
          console.log('[DashboardLayout] Invalid user cookie structure, logging out.');
        }
      } catch (e) {
        setCurrentUser(null);
        setSelectedProjectState(null);
        logoutUser(); // Clears cookies and redirects
        console.error('[DashboardLayout] Error parsing user cookie, logging out:', e);
      }
    } else {
      setCurrentUser(null);
      setSelectedProjectState(null);
      console.log('[DashboardLayout] No session cookie found, user set to null.');
    }
    setIsLoadingUser(false);
  }, [logoutUser]);


  useEffect(() => {
    if (isLoadingUser) return;

    if (!currentUser && !pathname.startsWith('/auth')) {
      console.log('[DashboardLayout] No user & not on auth page, redirecting to login.');
      router.push("/auth/login");
      return;
    }

    if (currentUser && currentUser.role !== 'superuser' && !selectedProject && pathname !== '/dashboard/select-project' && !pathname.startsWith('/api')) {
      console.log('[DashboardLayout] Admin user, no project selected, not on select-project page. Redirecting.');
      router.push('/dashboard/select-project');
    }
  }, [currentUser, isLoadingUser, selectedProject, pathname, router]);

  const getCurrentPageTitle = () => {
    // Special handling for select-project page title
    if (pathname === '/dashboard/select-project') {
        return "Select STO Project";
    }
    const currentLink = NAV_LINKS(currentUser?.role, !!selectedProject).find(link => pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href)));
    if (pathname.includes("/forms/") && pathname.includes("/input")) return "Input Form Data";
    return currentLink ? currentLink.label : "Dashboard";
  };


  if (isLoadingUser || currentUser === undefined) {
     return <div className="flex items-center justify-center min-h-screen bg-background"><p className="text-lg text-muted-foreground">Loading session...</p></div>;
  }
  
  // If admin is on select-project page, render it without full layout
  if (currentUser && currentUser.role !== 'superuser' && pathname === '/dashboard/select-project') {
    return (
       <UserContext.Provider value={{ currentUser, isLoadingUser, selectedProject, setSelectedProject, logoutUser }}>
         <div className="min-h-screen bg-background">{children}</div>
      </UserContext.Provider>
    );
  }


  // If admin has no project selected and isn't on select-project page (middleware should catch, but as a fallback)
  if (currentUser && currentUser.role !== 'superuser' && !selectedProject && pathname !== '/dashboard/select-project') {
    return <div className="flex items-center justify-center min-h-screen bg-background"><p className="text-lg text-muted-foreground">Redirecting to project selection...</p></div>;
  }


  const userContextValue: UserContextType = {
    currentUser,
    isLoadingUser,
    selectedProject,
    setSelectedProject,
    logoutUser,
  };

  const projectIsSelectedForAdmin = currentUser?.role !== 'superuser' ? !!selectedProject : true;


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
            <SidebarNav 
              currentUserRole={currentUser?.role} 
              projectSelected={projectIsSelectedForAdmin}
            />
          </SidebarContent>
          <SidebarFooter className="p-2">
             <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square" onClick={logoutUser}>
              <LogOut className="h-5 w-5 mr-3 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <Header 
            pageTitle={getCurrentPageTitle()} 
            user={currentUser} 
            selectedProject={userContextValue.selectedProject}
          />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {/* For admins, only render children if a project is selected or they are on the select-project page (handled above) */}
            {currentUser?.role === 'superuser' || (currentUser?.role !== 'superuser' && selectedProject) ? (
                children
            ) : currentUser?.role !== 'superuser' && !selectedProject ? (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Please select a project to continue.</p>
                 </div>
            ) : (
                children // Fallback for superuser or other cases
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserContext.Provider>
  );
}
