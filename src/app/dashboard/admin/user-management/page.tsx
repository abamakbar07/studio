
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Added AlertDialogTrigger here
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@/app/dashboard/layout";

type PageStatus = 'loading-session' | 'loading-data' | 'authorized' | 'unauthorized' | 'no-data' | 'error-fetching';

const addAdminUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  role: z.enum(["admin_input", "admin_doc_control", "admin_verification"], {
    errorMap: () => ({ message: "Please select a valid admin role." }),
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type AddAdminUserFormValues = z.infer<typeof addAdminUserSchema>;

export default function UserManagementPage() {
  const { currentUser, isLoadingUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading-session');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { toast } = useToast();

  const addUserForm = useForm<AddAdminUserFormValues>({
    resolver: zodResolver(addAdminUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
    },
  });

  const adminRolesForSelect = USER_ROLES.filter(role => role.value !== "superuser");

  const fetchUsers = useCallback(async (superuserEmailToFilterBy: string) => {
    const usersCollectionRef = collection(db, "users");
    
    const adminRoleValues = USER_ROLES
      .filter(role => role.value !== 'superuser')
      .map(role => role.value as string);

    if (adminRoleValues.length === 0) {
      setUsers([]);
      setPageStatus('no-data'); 
      return () => {}; 
    }
    
    const q = query(
      usersCollectionRef,
      where('role', 'in', adminRoleValues),
      where('superuserEmail', '==', superuserEmailToFilterBy)
    );

    let unsubscribeSnapshot = () => {};
    try {
      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const fetchedUsers: User[] = snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() } as User));
        setUsers(fetchedUsers);
        if (fetchedUsers.length === 0) {
          setPageStatus('no-data');
        } else {
          setPageStatus('authorized');
        }
      }, (error) => {
        toast({ title: "Error Loading Users", description: `Failed to load users: ${error.message}. Ensure Firestore indexes are configured if prompted.`, variant: "destructive", duration: 10000 });
        setPageStatus('error-fetching');
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: "Error Initializing Fetch", description: `Failed to initialize user data fetching: ${errorMessage}`, variant: "destructive" });
      setPageStatus('error-fetching');
    }
    return unsubscribeSnapshot;
  }, [toast]);


  useEffect(() => {
    let unsubscribe = () => {};

    if (isLoadingUser) {
      setPageStatus('loading-session');
      return;
    }

    if (!currentUser) {
      setPageStatus('unauthorized');
    } else if (currentUser.role === 'superuser' && currentUser.email) {
      if (pageStatus === 'loading-session' || pageStatus === 'unauthorized' || pageStatus === 'loading-data' ) { 
         if(pageStatus !== 'loading-data') setPageStatus('loading-data');
         fetchUsers(currentUser.email).then(unsub => { unsubscribe = unsub || (() => {}) });
      }
    } else if (currentUser.role !== 'superuser') {
      setPageStatus('unauthorized');
    } else if (!currentUser.email) {
        setPageStatus('error-fetching');
        toast({title: "Error", description:"Superuser email missing in session.", variant: "destructive"});
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser, isLoadingUser, fetchUsers, pageStatus, toast]);


  const updateUserField = async (userId: string, field: Partial<User>, successMessage: string) => {
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { ...field, updatedAt: new Date().toISOString() });
      toast({ title: "Success", description: successMessage });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: "Error", description: `Failed to update user. ${errorMessage}`, variant: "destructive" });
    }
  };

  const handleApproveUser = (userId: string, role: UserRole) => {
    const message = `Admin user ${USER_ROLES.find(r => r.value === role)?.label || userId} approved. They can now be activated.`;
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
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: "Error", description: `Failed to delete user. ${errorMessage}`, variant: "destructive" });
    }
  };

  const openEditUserDialog = (user: User) => {
    toast({ title: "Edit User (Placeholder)", description: `Editing user ${user.email}. This feature is not yet implemented.` });
  };

  const onAddUserSubmit = async (data: AddAdminUserFormValues) => {
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create admin user.');
      }
      toast({ title: "Success", description: result.message });
      setIsAddUserDialogOpen(false);
      addUserForm.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };


  const renderContent = () => {
    switch (pageStatus) {
      case 'loading-session':
        return <div className="flex justify-center items-center h-64"><p>Loading session...</p></div>;
      case 'loading-data':
        return <div className="flex justify-center items-center h-64"><p>Loading user data...</p></div>;
      case 'unauthorized':
        return <p className="text-muted-foreground p-4 text-center">You are not authorized to view this page or manage users.</p>;
      case 'no-data':
         if (currentUser?.role === 'superuser') {
           return <p className="text-muted-foreground p-4 text-center">No admin users found associated with your account. Click "Add New User" to create one.</p>;
         }
         return <p className="text-muted-foreground p-4 text-center">No users to display.</p>;
      case 'error-fetching':
        return <p className="text-destructive p-4 text-center">Could not load user data. Please check console for errors and ensure Firestore indexes are set up if required.</p>;
      case 'authorized':
        if (users.length === 0 && currentUser?.role === 'superuser') {
          return <p className="text-muted-foreground p-4 text-center">No admin users found associated with your account. Click "Add New User" to create one.</p>;
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

  const isButtonDisabled = !(pageStatus === 'authorized' || pageStatus === 'no-data' || (pageStatus === 'error-fetching' && currentUser?.role === 'superuser'));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">User Management</CardTitle>
            <CardDescription>Manage admin users associated with your superuser account.</CardDescription>
          </div>
          <Button onClick={() => setIsAddUserDialogOpen(true)} disabled={isButtonDisabled}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add New User
          </Button>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">Add New Admin User</DialogTitle>
            <DialogDescription>
              Create a new admin user. They will be associated with your superuser account and activated immediately.
            </DialogDescription>
          </DialogHeader>
          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4 py-4">
              <FormField
                control={addUserForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Admin User's Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an admin role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adminRolesForSelect.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={addUserForm.formState.isSubmitting}>
                  {addUserForm.formState.isSubmitting ? "Adding User..." : "Add User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    