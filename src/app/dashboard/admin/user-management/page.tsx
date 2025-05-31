"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@/lib/constants";
import type { User, UserRole } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, CheckCircle, ShieldAlert } from "lucide-react";
import React, { useState } from "react";
// Dialog components for add/edit user - not implemented in this pass for brevity
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; 

const initialUsers: User[] = [
  { id: "user-1", email: "superuser@example.com", name: "Main Superuser", role: "superuser", approved: true },
  { id: "user-2", email: "input_admin@example.com", name: "Data Input Admin", role: "admin_input", superuserEmail: "superuser@example.com" },
  { id: "user-3", email: "doc_control@example.com", name: "Doc Control Admin", role: "admin_doc_control", superuserEmail: "superuser@example.com" },
  { id: "user-4", email: "verify_admin@example.com", name: "Verification Admin", role: "admin_verification", superuserEmail: "superuser@example.com" },
  { id: "user-5", email: "pending_superuser@example.com", name: "Pending Approval", role: "superuser", approved: false },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const { toast } = useToast();

  const handleApproveUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? {...u, approved: true} : u));
    toast({ title: "User Approved", description: `User ${userId} has been approved.`});
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({ title: "User Deleted", description: `User ${userId} has been deleted.`});
  };
  
  // Placeholder for edit/add user functionality
  const openEditUserDialog = (user: User) => {
    toast({ title: "Edit User", description: `Editing user ${user.email} (UI placeholder).`});
  }
  const openAddUserDialog = () => {
    toast({ title: "Add User", description: `Adding new user (UI placeholder).`});
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">User Management</CardTitle>
            <CardDescription>Manage admin users and their roles. Superuser approvals are handled here.</CardDescription>
          </div>
          <Button onClick={openAddUserDialog}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add New User
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status / Superuser</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                        {USER_ROLES.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.role === 'superuser' ? (
                        user.approved ? (
                          <span className="flex items-center text-green-600"><CheckCircle className="mr-1 h-4 w-4" /> Approved</span>
                        ) : (
                          <span className="flex items-center text-orange-500"><ShieldAlert className="mr-1 h-4 w-4" /> Pending Approval</span>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">{user.superuserEmail || 'N/A'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role === 'superuser' && !user.approved && (
                             <DropdownMenuItem onClick={() => handleApproveUser(user.id)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve Superuser
                              </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEditUserDialog(user)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
