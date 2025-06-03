
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/app/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadFormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { STOProject, STOProjectStatus, User as AppUser } from "@/lib/types";
import { STO_PROJECT_STATUS_LIST, STO_PROJECT_STATUS_ICONS, getStatusColor } from "@/lib/constants";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, FolderKanban, Users2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

type PageStatus = 'loading-session' | 'loading-data' | 'authorized' | 'no-data' | 'error-fetching' | 'unauthorized';

interface AssignableUser extends Pick<AppUser, 'id' | 'name' | 'email' | 'role'> {}

const projectFormSchema = z.object({
  name: z.string().min(3, { message: "Project name must be at least 3 characters." }).max(100),
  description: z.string().max(500).optional().nullable(),
  clientName: z.string().max(100).optional().nullable(),
  departmentName: z.string().max(100).optional().nullable(),
  settingsNotes: z.string().max(1000).optional().nullable(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const assignUsersFormSchema = z.object({
    assignedAdminUserIds: z.array(z.string()).optional(),
});
type AssignUsersFormValues = z.infer<typeof assignUsersFormSchema>;


export default function STOProjectsPage() {
  const { currentUser, isLoadingUser } = useUser();
  const [projects, setProjects] = useState<STOProject[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading-session');
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isAssignUsersDialogOpen, setIsAssignUsersDialogOpen] = useState(false);
  const [currentProjectForAssignment, setCurrentProjectForAssignment] = useState<STOProject | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [isLoadingAssignableUsers, setIsLoadingAssignableUsers] = useState(false);
  const { toast } = useToast();

  const createProjectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: "", description: "", clientName: "", departmentName: "", settingsNotes: "" },
  });

  const assignUsersForm = useForm<AssignUsersFormValues>({
    resolver: zodResolver(assignUsersFormSchema),
    defaultValues: { assignedAdminUserIds: [] },
  });

  const fetchProjects = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'superuser') {
      setPageStatus('unauthorized');
      return;
    }
    setPageStatus('loading-data');
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch projects');
      const data: STOProject[] = await response.json();
      setProjects(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setPageStatus(data.length === 0 ? 'no-data' : 'authorized');
    } catch (error) {
      toast({ title: "Error Fetching Projects", description: (error as Error).message, variant: "destructive" });
      setPageStatus('error-fetching');
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (isLoadingUser) setPageStatus('loading-session');
    else if (!currentUser) setPageStatus('unauthorized');
    else if (currentUser.role === 'superuser') fetchProjects();
    else setPageStatus('unauthorized');
  }, [currentUser, isLoadingUser, fetchProjects]);

  const onCreateProjectSubmit = async (data: ProjectFormValues) => {
    try {
      const response = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to create project.');
      toast({ title: "Success", description: "STO Project created successfully." });
      setIsCreateProjectDialogOpen(false);
      createProjectForm.reset();
      fetchProjects();
    } catch (error) {
      toast({ title: "Error Creating Project", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleChangeProjectStatus = async (projectId: string, newStatus: STOProjectStatus) => {
    try {
      const response = await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, status: newStatus }) });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to update project status.');
      toast({ title: "Success", description: `Project status updated to ${newStatus}.` });
      fetchProjects();
    } catch (error) {
      toast({ title: "Error Updating Status", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const handleOpenAssignUsersDialog = async (project: STOProject) => {
    setCurrentProjectForAssignment(project);
    setIsAssignUsersDialogOpen(true);
    setIsLoadingAssignableUsers(true);
    try {
      const response = await fetch('/api/admin/assignable-users');
      if (!response.ok) throw new Error((await response.json()).message || "Failed to fetch assignable users.");
      const users: AssignableUser[] = await response.json();
      setAssignableUsers(users);
      assignUsersForm.reset({ assignedAdminUserIds: project.assignedAdminUserIds || [] });
    } catch (error) {
      toast({ title: "Error", description: `Could not load users: ${(error as Error).message}`, variant: "destructive" });
      setAssignableUsers([]);
    } finally {
      setIsLoadingAssignableUsers(false);
    }
  };

  const onAssignUsersSubmit = async (data: AssignUsersFormValues) => {
    if (!currentProjectForAssignment) return;
    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectForAssignment.id, assignedAdminUserIds: data.assignedAdminUserIds || [] }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to assign users.');
      toast({ title: "Success", description: "User assignments updated successfully." });
      setIsAssignUsersDialogOpen(false);
      fetchProjects(); // Refresh project list to show updated assignment info (if displayed)
    } catch (error) {
      toast({ title: "Error Assigning Users", description: (error as Error).message, variant: "destructive" });
    }
  };

  const renderContent = () => {
    switch (pageStatus) {
      case 'loading-session': return <div className="flex justify-center items-center h-64"><p>Loading session...</p></div>;
      case 'loading-data': return <div className="flex justify-center items-center h-64"><p>Loading projects...</p></div>;
      case 'unauthorized': return <p className="text-muted-foreground p-4 text-center">You are not authorized to view this page.</p>;
      case 'no-data': return <p className="text-muted-foreground p-4 text-center">No STO Projects found. Click "Create New STO Project" to get started.</p>;
      case 'error-fetching': return <p className="text-destructive p-4 text-center">Could not load projects. Please try again later.</p>;
      case 'authorized':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const StatusIcon = STO_PROJECT_STATUS_ICONS[project.status];
                return (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {project.assignedAdminUserIds && project.assignedAdminUserIds.length > 0 ? `${project.assignedAdminUserIds.length} user(s)` : 'None'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(project.status)} border-current`}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(project.createdAt), "PPp")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleOpenAssignUsersDialog(project)}>
                             <Users2 className="mr-2 h-4 w-4" /> Manage Assignments
                           </DropdownMenuItem>
                           <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                            <DropdownMenuPortal><DropdownMenuSubContent>
                                {STO_PROJECT_STATUS_LIST.map(status => (
                                    <DropdownMenuItem key={status} disabled={project.status === status} onClick={() => handleChangeProjectStatus(project.id, status)}>{status}</DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent></DropdownMenuPortal>
                           </DropdownMenuSub>
                          <DropdownMenuItem disabled><Edit2 className="mr-2 h-4 w-4" /> Edit Details (Soon)</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled className="text-destructive hover:!text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Project (Soon)</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        );
      default: return <div className="flex justify-center items-center h-64"><p>Loading...</p></div>;
    }
  };

  const isCreateButtonDisabled = pageStatus !== 'authorized' && pageStatus !== 'no-data' ;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2"><FolderKanban className="h-7 w-7 text-primary" />
            <div><CardTitle className="font-headline text-2xl">STO Project Management</CardTitle><CardDescription>Create, view, and manage your Stock Take Operation projects.</CardDescription></div>
          </div>
          <Button onClick={() => setIsCreateProjectDialogOpen(true)} disabled={isCreateButtonDisabled}><PlusCircle className="mr-2 h-5 w-5" /> Create New STO Project</Button>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>

      <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-headline text-xl">Create New STO Project</DialogTitle><DialogDescription>Fill in the details for your new Stock Take Operation project. Initial status will be 'Planning'.</DialogDescription></DialogHeader>
          <Form {...createProjectForm}><form onSubmit={createProjectForm.handleSubmit(onCreateProjectSubmit)} className="space-y-4 py-2">
              <FormField control={createProjectForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Project Name <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g., Q4 Warehouse Audit, Client XYZ Stocktake" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={createProjectForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Brief overview of the project scope, goals, or specific instructions." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={createProjectForm.control} name="clientName" render={({ field }) => (<FormItem><FormLabel>Client Name (Optional)</FormLabel><FormControl><Input placeholder="Client company or individual name" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={createProjectForm.control} name="departmentName" render={({ field }) => (<FormItem><FormLabel>Internal Department (Optional)</FormLabel><FormControl><Input placeholder="e.g., Logistics, Warehouse A" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={createProjectForm.control} name="settingsNotes" render={({ field }) => (<FormItem><FormLabel>Project Specific Notes/Settings (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Default currency: USD, Specific counting zones, Key contacts" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter className="pt-4"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={createProjectForm.formState.isSubmitting}>{createProjectForm.formState.isSubmitting ? "Creating Project..." : "Create Project"}</Button></DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignUsersDialogOpen} onOpenChange={setIsAssignUsersDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="font-headline text-xl">Assign Users to: {currentProjectForAssignment?.name}</DialogTitle>
                <DialogDescription>Select admin users to assign to this project. Only active and approved admins are listed.</DialogDescription>
            </DialogHeader>
            <Form {...assignUsersForm}>
                <form onSubmit={assignUsersForm.handleSubmit(onAssignUsersSubmit)} className="space-y-4 py-2">
                    {isLoadingAssignableUsers ? (
                        <p>Loading users...</p>
                    ) : assignableUsers.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No active admin users available to assign.</p>
                    ) : (
                        <ScrollArea className="h-60">
                            <FormField
                                control={assignUsersForm.control}
                                name="assignedAdminUserIds"
                                render={({ field }) => (
                                    <FormItem>
                                        {assignableUsers.map((user) => (
                                            <FormField
                                                key={user.id}
                                                control={assignUsersForm.control}
                                                name="assignedAdminUserIds"
                                                render={({ field: itemField }) => {
                                                    return (
                                                        <FormItem key={user.id} className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={itemField.value?.includes(user.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? itemField.onChange([...(itemField.value || []), user.id])
                                                                            : itemField.onChange( (itemField.value || []).filter((value) => value !== user.id) );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-normal">{user.name} ({user.email})</FormLabel>
                                                                <ShadFormDescription className="text-xs">{user.role}</ShadFormDescription>
                                                            </div>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </FormItem>
                                )}
                            />
                        </ScrollArea>
                    )}
                    <DialogFooter className="pt-4">
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={assignUsersForm.formState.isSubmitting || isLoadingAssignableUsers || assignableUsers.length === 0}>
                            {assignUsersForm.formState.isSubmitting ? "Saving..." : "Save Assignments"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
