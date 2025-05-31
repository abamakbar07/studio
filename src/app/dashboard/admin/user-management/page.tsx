
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@/lib/constants";
import type { User } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, CheckCircle, ShieldAlert, AlertCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const usersCollectionRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const fetchedUsers: User[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(fetchedUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Failed to load users from database.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [toast]);

  const handleApproveUser = async (userId: string) => {
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { 
        approved: true,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "User Approved", description: `User has been approved successfully.` });
    } catch (error) {
      console.error("Error approving user:", error);
      toast({ title: "Error", description: "Failed to approve user.", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userDocRef = doc(db, "users", userId);
    try {
      await deleteDoc(userDocRef);
      toast({ title: "User Deleted", description: `User has been deleted successfully.` });
      // Users state will update via onSnapshot
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    }
  };
  
  const openEditUserDialog = (user: User) => {
    toast({ title: "Edit User (Placeholder)", description: `Editing user ${user.email}. This feature is not yet fully implemented with Firestore.`});
    // Placeholder: Actual implementation would involve a dialog and Firestore update logic.
  }
  const openAddUserDialog = () => {
    toast({ title: "Add User (Placeholder)", description: `Adding new user. This feature is not yet fully implemented with Firestore.`});
     // Placeholder: Actual implementation would involve a dialog and Firestore creation logic.
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
            <CardDescription>Manage admin users and their roles. Superuser approvals are handled here.</CardDescription>
          </div>
          <Button onClick={openAddUserDialog}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add New User
          </Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground">No users found in the database.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status / Superuser</TableHead>
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
                    <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
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
                                  This action cannot be undone. This will permanently delete the user <strong className="text-foreground">{user.email}</strong>.
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
