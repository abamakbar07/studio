
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@/lib/constants";
import type { User, UserRole } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, CheckCircle, ShieldAlert, MailWarning, UserCheck, UserX } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import Cookies from 'js-cookie';
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

type PageStatus = 'loading-session' | 'loading-data' | 'authorized' | 'unauthorized' | 'no-data' | 'error-fetching';

export default function UserManagementPage() {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading-session');
  const { toast } = useToast();

  // Effect 1: Determine loggedInUser from session cookie
  useEffect(() => {
    console.log("[UserManagement] Effect 1: Checking session cookie.");
    const sessionCookie = Cookies.get('stockflow-session');
    console.log("[UserManagement] Effect 1: Raw sessionCookie string:", sessionCookie);

    if (sessionCookie) {
      try {
        const userData = JSON.parse(sessionCookie) as User;
        console.log("[UserManagement] Effect 1: Parsed userData from cookie:", userData);
        if (userData?.id && userData?.email && userData?.role) {
          setLoggedInUser(userData);
          console.log("[UserManagement] Effect 1: setLoggedInUser successful with:", userData);
        } else {
          console.warn("[UserManagement] Effect 1: Session cookie data is incomplete or invalid:", userData);
          setLoggedInUser(null);
        }
      } catch (e) {
        console.error("[UserManagement] Effect 1: Failed to parse session cookie:", e);
        setLoggedInUser(null);
      }
    } else {
      console.log("[UserManagement] Effect 1: No session cookie found.");
      setLoggedInUser(null);
    }
  }, []); // Runs once on mount to establish loggedInUser

  const fetchUsers = useCallback(async (superuserEmailToFilterBy: string) => {
    console.log(`[UserManagement] fetchUsers: Fetching users for superuser: ${superuserEmailToFilterBy}`);
    const usersCollectionRef = collection(db, "users");
    const q = query(
      usersCollectionRef,
      where('role', '!=', 'superuser'),
      where('superuserEmail', '==', superuserEmailToFilterBy)
    );

    try {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedUsers: User[] = snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() } as User));
        setUsers(fetchedUsers);
        console.log("[UserManagement] fetchUsers: Fetched users:", fetchedUsers);
        if (fetchedUsers.length === 0) {
          setPageStatus('no-data');
          console.log("[UserManagement] fetchUsers: setPageStatus to 'no-data'");
        } else {
          setPageStatus('authorized');
          console.log("[UserManagement] fetchUsers: setPageStatus to 'authorized'");
        }
      }, (error) => {
        console.error("[UserManagement] fetchUsers: Error fetching users snapshot:", error);
        toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
        setPageStatus('error-fetching');
        console.log("[UserManagement] fetchUsers: setPageStatus to 'error-fetching' due to snapshot error");
      });
      return unsubscribe;
    } catch (error) {
        console.error("[UserManagement] fetchUsers: Error setting up user fetch snapshot:", error);
        toast({ title: "Error", description: "Failed to initialize user data fetching.", variant: "destructive" });
        setPageStatus('error-fetching');
        console.log("[UserManagement] fetchUsers: setPageStatus to 'error-fetching' due to setup error");
        return () => {};
    }
  }, [toast]); // Removed setPageStatus from dependencies as it's managed internally or by callers

  // Effect 2: Handle page status transitions and trigger data fetching
  useEffect(() => {
    console.log(`[UserManagement] Effect 2: Current pageStatus: ${pageStatus}, loggedInUser:`, loggedInUser);
    let unsubscribe = () => {};

    if (pageStatus === 'loading-session') {
      if (loggedInUser === null) {
        // This condition implies Effect 1 has run and found no user or an invalid one.
        // It might also mean Effect 1 hasn't set loggedInUser yet if it's the very first run of Effect 2.
        // Let's wait for loggedInUser to be explicitly null or set.
        // console.log("[UserManagement] Effect 2: In 'loading-session', loggedInUser is null. Waiting or will set to unauthorized if it remains null.");
        // If Effect 1 sets loggedInUser to null, this effect will re-run due to `loggedInUser` dependency.
        // If it's still null then, it's truly no user.
        if (loggedInUser === null && Cookies.get('stockflow-session') === undefined) { // A more definitive check for no session
            console.log("[UserManagement] Effect 2: No cookie and loggedInUser is null. Setting 'unauthorized'.");
            setPageStatus('unauthorized');
        } else if (loggedInUser === null && Cookies.get('stockflow-session') !== undefined) {
            // Cookie exists but parsing failed or data incomplete, loggedInUser became null.
             console.log("[UserManagement] Effect 2: Cookie exists but loggedInUser is null (parse fail/incomplete). Setting 'unauthorized'.");
             setPageStatus('unauthorized');
        }

      } else if (loggedInUser?.role === 'superuser' && loggedInUser?.email) {
        console.log("[UserManagement] Effect 2: Valid superuser identified. Setting pageStatus to 'loading-data'.");
        setPageStatus('loading-data');
      } else if (loggedInUser) {
        console.log("[UserManagement] Effect 2: User is logged in but not a superuser. Setting pageStatus to 'unauthorized'. Role:", loggedInUser?.role);
        setPageStatus('unauthorized');
      }
    } else if (pageStatus === 'loading-data') {
      if (loggedInUser?.role === 'superuser' && loggedInUser?.email) {
        console.log("[UserManagement] Effect 2: pageStatus is 'loading-data'. Fetching users.");
        fetchUsers(loggedInUser.email).then(unsub => { unsubscribe = unsub || (() => {}) });
      } else {
        console.warn("[UserManagement] Effect 2: pageStatus 'loading-data' but no valid superuser. This shouldn't happen. Setting 'unauthorized'. loggedInUser:", loggedInUser);
        setPageStatus('unauthorized');
      }
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        console.log("[UserManagement] Effect 2: Cleaning up Firestore listener.");
        unsubscribe();
      }
    };
  }, [loggedInUser, pageStatus, fetchUsers]);


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
    const message = `Admin user ${USER_ROLES.find(r=>r.value===role)?.label || userId} approved. They can now be activated.`;
    updateUserField(userId, { approved: true }, message);
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

  const renderContent = () => {
    console.log("[UserManagement] renderContent called with pageStatus:", pageStatus);
    switch (pageStatus) {
      case 'loading-session':
        return <div className="flex justify-center items-center h-64"><p>Loading session...</p></div>;
      case 'loading-data':
        return <div className="flex justify-center items-center h-64"><p>Loading user data...</p></div>;
      case 'unauthorized':
        return <p className="text-muted-foreground p-4 text-center">You are not authorized to view this page or manage users.</p>;
      case 'no-data':
        return <p className="text-muted-foreground p-4 text-center">No admin users found associated with your account. You can register new admin users via the registration page.</p>;
      case 'error-fetching':
        return <p className="text-destructive p-4 text-center">Could not load user data. Please try again later.</p>;
      case 'authorized':
        if (users.length === 0 && loggedInUser?.role === 'superuser') {
             return <p className="text-muted-foreground p-4 text-center">No admin users found associated with your account. You can register new admin users via the registration page.</p>;
        }
        if (users.length === 0) {
            return <p className="text-muted-foreground p-4 text-center">No users to display.</p>;
        }
        return (
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
                    <Badge variant={"secondary"} className="capitalize">
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
                      {user.emailVerified && !user.approved && (
                        <Badge variant="outline" className="text-orange-600 border-orange-500">
                          <ShieldAlert className="mr-1 h-3 w-3" /> Pending Approval
                        </Badge>
                      )}
                      {user.emailVerified && user.approved && !user.isActive && (
                         <Badge variant="outline" className="text-blue-600 border-blue-500">
                           <UserX className="mr-1 h-3 w-3" /> Pending Activation
                         </Badge>
                      )}
                      {user.emailVerified && user.approved && user.isActive && (
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
                        {user.role !== 'superuser' && user.emailVerified && !user.approved && (
                           <DropdownMenuItem onClick={() => handleApproveUser(user.id, user.role)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve User
                            </DropdownMenuItem>
                        )}
                        {user.role !== 'superuser' && user.emailVerified && user.approved && !user.isActive && (
                           <DropdownMenuItem onClick={() => handleActivateUser(user.id)}>
                              <UserCheck className="mr-2 h-4 w-4 text-blue-500" /> Activate User
                            </DropdownMenuItem>
                        )}
                        {user.role !== 'superuser' && user.approved && user.isActive && (
                           <DropdownMenuItem onClick={() => handleDeactivateUser(user.id)} className="text-orange-600 hover:!text-orange-600 focus:text-orange-600">
                              <UserX className="mr-2 h-4 w-4" /> Deactivate User
                            </DropdownMenuItem>
                        )}
                        { (user.role !== 'superuser' && (!user.approved || !user.isActive)) && <DropdownMenuSeparator />}
                        <DropdownMenuItem onClick={() => openEditUserDialog(user)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit User (Placeholder)
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive hover:!text-destructive focus:text-destructive">
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
        );
      default:
        return <div className="flex justify-center items-center h-64"><p>Loading...</p></div>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">User Management</CardTitle>
            <CardDescription>Manage admin users associated with your superuser account.</CardDescription>
          </div>
          <Button onClick={openAddUserDialog} disabled={pageStatus !== 'authorized' && pageStatus !== 'no-data'}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add New User (Placeholder)
          </Button>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

    