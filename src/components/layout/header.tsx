
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar"; 
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import Cookies from 'js-cookie';

interface HeaderProps {
  pageTitle: string;
  user: User | null;
}

export function Header({ pageTitle, user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    localStorage.removeItem('stockflow-user');
    Cookies.remove('stockflow-session', { path: '/' });
    // await fetch('/api/auth/logout', { method: 'POST' }); // if you implement a backend logout
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex-1">
        <h1 className="font-headline text-xl md:text-2xl font-semibold">{pageTitle}</h1>
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
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name || "StockFlow User"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || "user@stockflow.com"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings"> 
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings (Placeholder)</span>
            </Link>
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
