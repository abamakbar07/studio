
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/dashboard/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Briefcase, LogOut } from 'lucide-react';
import type { SimplifiedSelectedProject, STOProject } from '@/lib/types';
import Cookies from 'js-cookie';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Logo } from '@/components/icons/logo';

interface AssignedProject extends Pick<STOProject, 'id' | 'name' | 'status' | 'clientName' | 'departmentName'> {}

export default function SelectProjectPage() {
  const { currentUser, isLoadingUser, setSelectedProject, selectedProject: currentSelectedProject, logoutUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedProjects = useCallback(async () => {
    if (!currentUser || currentUser.role === 'superuser') {
      setIsLoadingProjects(false);
      return; // Superusers don't select projects this way
    }
    setIsLoadingProjects(true);
    setError(null);
    try {
      const response = await fetch('/api/projects/assigned');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch assigned projects');
      }
      const projects: AssignedProject[] = await response.json();
      setAssignedProjects(projects);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error Loading Projects',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProjects(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (isLoadingUser) return;

    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    if (currentUser.role === 'superuser') {
      router.push('/dashboard'); // Superusers don't use this page
      return;
    }
    
    // If admin already has a project selected from cookie/context and somehow landed here, redirect them.
    if (currentSelectedProject) {
        router.push('/dashboard');
        return;
    }

    fetchAssignedProjects();
  }, [currentUser, isLoadingUser, router, fetchAssignedProjects, currentSelectedProject]);

  const handleSelectProject = (project: AssignedProject) => {
    const projectToStore: SimplifiedSelectedProject = { id: project.id, name: project.name };
    setSelectedProject(projectToStore); // Update context
    // Cookie is already set by setSelectedProject in layout via useUser hook
    toast({
      title: 'Project Selected',
      description: `You are now working on project: ${project.name}`,
    });
    router.push('/dashboard');
  };
  
  if (isLoadingUser || isLoadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="items-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="font-headline text-2xl text-center">Error Loading Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-destructive-foreground">{error}</p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Please try again later or contact your superuser if the issue persists.
            </p>
          </CardContent>
           <CardFooter className="flex flex-col gap-2">
             <Button onClick={fetchAssignedProjects} className="w-full">Try Again</Button>
             <Button variant="outline" onClick={logoutUser} className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Logout
             </Button>
           </CardFooter>
        </Card>
      </div>
    );
  }

  if (assignedProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4 text-center">
         <div className="mb-8"><Logo /></div>
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="items-center">
             <Briefcase className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="font-headline text-2xl">No Projects Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You are not currently assigned to any Stock Take Operation (STO) projects.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please contact your superuser to get assigned to a project before you can proceed.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
             <Button variant="outline" onClick={logoutUser} className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Logout
             </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="mb-8"><Logo /></div>
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Select Your STO Project</CardTitle>
          <CardDescription className="text-center">
            Choose the Stock Take Operation project you will be working on.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignedProjects.map((project) => (
            <Card 
                key={project.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectProject(project)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectProject(project)}
            >
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                    <Briefcase className="mr-2 h-5 w-5 text-primary" />
                    {project.name}
                </CardTitle>
                <CardDescription>
                    Status: <span className="font-medium">{project.status}</span>
                    {project.clientName && ` | Client: ${project.clientName}`}
                    {project.departmentName && ` | Dept: ${project.departmentName}`}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={(e) => {e.stopPropagation(); handleSelectProject(project);}}>
                  Select Project
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
         <CardFooter className="mt-4 border-t pt-4">
            <Button variant="link" onClick={logoutUser} className="w-full text-muted-foreground">
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
         </CardFooter>
      </Card>
    </div>
  );
}

