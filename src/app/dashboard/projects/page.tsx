
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/app/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { STOProject, STOProjectStatus } from "@/lib/types";
import { STO_PROJECT_STATUS_LIST, STO_PROJECT_STATUS_ICONS, getStatusColor } from "@/lib/constants";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, FolderKanban } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

type PageStatus = 'loading-session' | 'loading-data' | 'authorized' | 'no-data' | 'error-fetching' | 'unauthorized';

const projectFormSchema = z.object({
  name: z.string().min(3, { message: "Project name must be at least 3 characters." }).max(100),
  description: z.string().max(500).optional().nullable(),
  clientName: z.string().max(100).optional().nullable(),
  departmentName: z.string().max(100).optional().nullable(),
  settingsNotes: z.string().max(1000).optional().nullable(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function STOProjectsPage() {
  const { currentUser, isLoadingUser } = useUser();
  const [projects, setProjects] = useState<STOProject[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading-session');
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const { toast } = useToast();

  const createProjectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      clientName: "",
      departmentName: "",
      settingsNotes: "",
    },
  });

  const fetchProjects = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'superuser') {
      setPageStatus('unauthorized');
      return;
    }
    setPageStatus('loading-data');
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch projects');
      }
      const data: STOProject[] = await response.json();
      setProjects(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setPageStatus(data.length === 0 ? 'no-data' : 'authorized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({ title: "Error Fetching Projects", description: errorMessage, variant: "destructive" });
      setPageStatus('error-fetching');
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (isLoadingUser) {
      setPageStatus('loading-session');
      return;
    }
    if (!currentUser) {
      setPageStatus('unauthorized');
      return;
    }
    if (currentUser.role === 'superuser') {
      fetchProjects();
    } else {
      setPageStatus('unauthorized');
    }
  }, [currentUser, isLoadingUser, fetchProjects]);

  const onCreateProjectSubmit = async (data: ProjectFormValues) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create project.');
      }
      toast({ title: "Success", description: "STO Project created successfully." });
      setIsCreateProjectDialogOpen(false);
      createProjectForm.reset();
      fetchProjects(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ title: "Error Creating Project", description: errorMessage, variant: "destructive" });
    }
  };

  const handleChangeProjectStatus = async (projectId: string, newStatus: STOProjectStatus) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, status: newStatus }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update project status.');
      }
      toast({ title: "Success", description: `Project status updated to ${newStatus}.` });
      fetchProjects(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ title: "Error Updating Status", description: errorMessage, variant: "destructive" });
    }
  };
  
  const renderContent = () => {
    switch (pageStatus) {
      case 'loading-session':
        return <div className="flex justify-center items-center h-64"><p>Loading session...</p></div>;
      case 'loading-data':
        return <div className="flex justify-center items-center h-64"><p>Loading projects...</p></div>;
      case 'unauthorized':
        return <p className="text-muted-foreground p-4 text-center">You are not authorized to view this page.</p>;
      case 'no-data':
        return <p className="text-muted-foreground p-4 text-center">No STO Projects found. Click "Create New STO Project" to get started.</p>;
      case 'error-fetching':
        return <p className="text-destructive p-4 text-center">Could not load projects. Please try again later.</p>;
      case 'authorized':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Client / Department</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{project.description || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {project.clientName || project.departmentName ? `${project.clientName || ''}${project.clientName && project.departmentName ? ' / ' : ''}${project.departmentName || ''}` : '-'}
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                               Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                {STO_PROJECT_STATUS_LIST.map(status => (
                                    <DropdownMenuItem 
                                    key={status} 
                                    disabled={project.status === status}
                                    onClick={() => handleChangeProjectStatus(project.id, status)}
                                    >
                                    {status}
                                    </DropdownMenuItem>
                                ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                           </DropdownMenuSub>
                          <DropdownMenuItem disabled>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Details (Soon)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled className="text-destructive hover:!text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Project (Soon)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        );
      default:
        return <div className="flex justify-center items-center h-64"><p>Loading...</p></div>;
    }
  };

  const isCreateButtonDisabled = pageStatus === 'loading-session' || pageStatus === 'loading-data' || pageStatus === 'unauthorized' || isLoadingUser || (currentUser?.role !== 'superuser');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl">STO Project Management</CardTitle>
              <CardDescription>Create, view, and manage your Stock Take Operation projects.</CardDescription>
            </div>
          </div>
          <Button onClick={() => setIsCreateProjectDialogOpen(true)} disabled={isCreateButtonDisabled}>
            <PlusCircle className="mr-2 h-5 w-5" /> Create New STO Project
          </Button>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Create New STO Project</DialogTitle>
            <DialogDescription>
              Fill in the details for your new Stock Take Operation project. Initial status will be 'Planning'.
            </DialogDescription>
          </DialogHeader>
          <Form {...createProjectForm}>
            <form onSubmit={createProjectForm.handleSubmit(onCreateProjectSubmit)} className="space-y-4 py-2">
              <FormField
                control={createProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q4 Warehouse Audit, Client XYZ Stocktake" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createProjectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief overview of the project scope, goals, or specific instructions." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createProjectForm.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Client company or individual name" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createProjectForm.control}
                name="departmentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Department (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Logistics, Warehouse A" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createProjectForm.control}
                name="settingsNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Specific Notes/Settings (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Default currency: USD, Specific counting zones, Key contacts" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createProjectForm.formState.isSubmitting}>
                  {createProjectForm.formState.isSubmitting ? "Creating Project..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
