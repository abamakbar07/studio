
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@/lib/constants";
import type { User } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, CheckCircle, ShieldAlert, AlertCircle, MailWarning, UserCheck, UserX } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(() => {
    setIsLoading(true);
    const usersCollectionRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const fetchedUsers: User[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(fetchedUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
      setIsLoading(false);
    });
    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchUsers();
    return () => unsubscribe();
  }, [fetchUsers]);

  const updateUserField = async (userId: string, field: Partial<User>, successMessage: string) => {
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { ...field, updatedAt: new Date().toISOString() });
      toast({ title: "Success", description: successMessage });
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      toast({ title: "Error", description: `Failed to update user. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    }
  };

  const handleApproveUser = (userId: string, role: UserRole) => {
    const message = role === 'superuser' 
      ? `Superuser ${userId} approved and activated.`
      : `Admin user ${userId} approved. They can now be activated.`;
    // Superusers are activated immediately upon approval. Admins need separate activation.
    const updates: Partial<User> = role === 'superuser' ? { approved: true, isActive: true } : { approved: true };
    updateUserField(userId, updates, message);
  };

  const handleActivateUser = (userId: string) => {
     updateUserField(userId, { isActive: true }, `User ${userId} has been activated.`);
  };
  
  const handleDeactivateUser = (userId: string) => {
    updateUserField(userId, { isActive: false }, `User ${userId} has been deactivated.`);
  };

  const handleDeleteUser = async (userId: string) => {
    const userDocRef = doc(db, "users", userId);
    try {
      await deleteDoc(userDocRef);
      toast({ title: "User Deleted", description: `User ${userId} has been deleted successfully.` });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    }
  };
  
  const openEditUserDialog = (user: User) => {
    toast({ title: "Edit User (Placeholder)", description: `Editing user ${user.email}. This feature is not yet implemented.`});
  }
  const openAddUserDialog = () => {
    toast({ title: "Add User (Placeholder)", description: `Adding new user. This feature is not yet implemented.`});
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p>Loading user data...</p></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">User Management</CardTitle>
            <CardDescription>Manage users, their roles, approval, and activation status.</CardDescription>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'superuser' ? "default" : "secondary"} className="capitalize">
                        {USER_ROLES.find(r => r.value === user.role)?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {!user.emailVerified && (
                          <Badge variant="outline" className="text-amber-600 border-amber-500">
                            <MailWarning className="mr-1 h-3 w-3" /> Email Unverified
                          </Badge>
                        )}
                        {!user.approved && (
                          <Badge variant="outline" className="text-orange-600 border-orange-500">
                            <ShieldAlert className="mr-1 h-3 w-3" /> Pending Approval
                          </Badge>
                        )}
                        {user.approved && !user.isActive && user.role !== 'superuser' && (
                           <Badge variant="outline" className="text-blue-600 border-blue-500">
                             <UserX className="mr-1 h-3 w-3" /> Pending Activation
                           </Badge>
                        )}
                        {user.approved && user.isActive && user.emailVerified && (
                           <Badge variant="outline" className="text-green-600 border-green-500">
                             <UserCheck className="mr-1 h-3 w-3" /> Active
                           </Badge>
                        )}
                         {user.role !== 'superuser' && user.superuserEmail && (
                           <span className="text-xs text-muted-foreground">Managed by: {user.superuserEmail}</span>
                         )}
                      </div>
                    </TableCell>
                    <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.approved && user.emailVerified && ( // Can only approve if email is verified
                             <DropdownMenuItem onClick={() => handleApproveUser(user.id, user.role)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve User
                              </DropdownMenuItem>
                          )}
                          {user.approved && !user.isActive && user.role !== 'superuser' && (
                             <DropdownMenuItem onClick={() => handleActivateUser(user.id)}>
                                <UserCheck className="mr-2 h-4 w-4 text-blue-500" /> Activate User
                              </DropdownMenuItem>
                          )}
                          {user.approved && user.isActive && user.role !== 'superuser' && (
                             <DropdownMenuItem onClick={() => handleDeactivateUser(user.id)} className="text-orange-600">
                                <UserX className="mr-2 h-4 w-4" /> Deactivate User
                              </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditUserDialog(user)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit User (Placeholder)
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the user <strong className="text-foreground">{user.email}</strong>. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
