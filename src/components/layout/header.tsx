
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar"; 
import { LogOut, Settings, Briefcase, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User, SimplifiedSelectedProject } from "@/lib/types";
import Cookies from 'js-cookie';
import { useUser } from "@/app/dashboard/layout"; // Import useUser

interface HeaderProps {
  pageTitle: string;
  user: User | null;
  selectedProject?: SimplifiedSelectedProject | null; // Make selectedProject optional for superuser
}

export function Header({ pageTitle, user, selectedProject }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logoutUser } = useUser(); // Get logoutUser from context

  const handleLogout = () => {
    logoutUser(); // Use context's logout function
  };

  const userRoleDisplay = user?.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "User";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex-1 flex flex-col">
        <h1 className="font-headline text-xl md:text-2xl font-semibold">{pageTitle}</h1>
        {user?.role !== 'superuser' && selectedProject && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3 mr-1.5" />
            <span>Project: {selectedProject.name}</span>
            {pathname !== '/dashboard/select-project' && (
                <Button variant="link" size="sm" className="h-auto p-0 ml-2 text-xs" onClick={() => router.push('/dashboard/select-project')}>
                    <ArrowLeftRight className="h-3 w-3 mr-1" /> Switch
                </Button>
            )}
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="user avatar" />
              <AvatarFallback>{user?.name?.substring(0,2).toUpperCase() || user?.email?.substring(0,2).toUpperCase() || 'SF'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name || "StockFlow User"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || "user@stockflow.com"}
              </p>
              <p className="text-xs leading-none text-muted-foreground capitalize pt-1">
                Role: {userRoleDisplay}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings (Placeholder)</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
