
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { SOHDataReference, STOProject, User } from "@/lib/types";
import { UploadCloud, CheckCircle, XCircle, FileCheck2, AlertCircle, FolderKanban, Info } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/app/dashboard/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export default function UploadSohPage() {
  const { currentUser, selectedProject, isLoadingUser } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadedReferences, setUploadedReferences] = useState<SOHDataReference[]>([]);
  const [userProjects, setUserProjects] = useState<STOProject[]>([]);
  const [projectForUpload, setProjectForUpload] = useState<string | undefined>(undefined); // For superuser selection
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const { toast } = useToast();

  const fetchSuperuserProjects = useCallback(async () => {
    if (currentUser?.role === 'superuser') {
      setIsLoadingProjects(true);
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const projects: STOProject[] = await response.json();
        setUserProjects(projects);
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch your projects for selection.", variant: "destructive" });
        setUserProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    }
  }, [currentUser?.role, toast]);

  useEffect(() => {
    if (currentUser?.role === 'superuser') {
      fetchSuperuserProjects();
    }
  }, [currentUser, fetchSuperuserProjects]);

  useEffect(() => {
    // If admin has a selected project, set it as the projectForUpload automatically
    if (currentUser?.role !== 'superuser' && selectedProject) {
      setProjectForUpload(selectedProject.id);
    } else if (currentUser?.role === 'superuser') {
      setProjectForUpload(undefined); // Superuser needs to select
    }
  }, [currentUser?.role, selectedProject]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "Error", description: "File size exceeds 100MB limit.", variant: "destructive" });
        setSelectedFile(null);
        return;
      }
      if (!file.name.endsWith(".xlsx")) {
        toast({ title: "Error", description: "Invalid file type. Only .xlsx files are allowed.", variant: "destructive" });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadProgress(0);
      setUploadStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Error", description: "No file selected.", variant: "destructive" });
      return;
    }
    if (!projectForUpload) {
      toast({ title: "Error", description: "Please select a project to upload the SOH data for.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);

    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      await new Promise(resolve => setTimeout(resolve, 200)); 
      setUploadProgress(((i + 1) / totalChunks) * 100);
    }
    
    // Simulate actual upload and backend processing
    const currentProjectName = currentUser?.role === 'superuser' 
        ? userProjects.find(p => p.id === projectForUpload)?.name 
        : selectedProject?.name;

    setTimeout(() => {
      setIsUploading(false);
      setUploadStatus("success");
      toast({ 
        title: "SOH Upload (Simulated)", 
        description: `${selectedFile.name} 'uploaded' for project: ${currentProjectName || projectForUpload}. Actual data processing and storage not yet implemented.` 
      });
      
      const newReference: SOHDataReference = {
        id: crypto.randomUUID(),
        filename: selectedFile.name,
        uploadedAt: new Date().toISOString(),
        rowCount: Math.floor(Math.random() * 1000) + 500, 
        status: "Completed", 
        stoProjectId: projectForUpload,
      };
      setUploadedReferences(prev => [newReference, ...prev].sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
      setSelectedFile(null); 
      // For superusers, reset project selection for next upload, or keep it? For now, let's keep it.
      // if (currentUser?.role === 'superuser') setProjectForUpload(undefined); 
    }, 500);
  };
  
  const getProjectNameById = (projectId?: string): string => {
    if (!projectId) return "N/A";
    if (currentUser?.role !== 'superuser' && selectedProject?.id === projectId) return selectedProject.name;
    const project = userProjects.find(p => p.id === projectId);
    return project?.name || projectId;
  }

  const canUpload = (currentUser?.role === 'superuser' && projectForUpload && selectedFile) || 
                    (currentUser?.role !== 'superuser' && selectedProject && selectedFile);


  if (isLoadingUser) {
    return <div className="flex justify-center items-center h-64"><p>Loading user session...</p></div>;
  }
  if (currentUser?.role !== 'superuser' && !selectedProject) {
     return (
        <Alert variant="default" className="border-yellow-500 text-yellow-700">
            <Info className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="font-headline">Project Selection Required</AlertTitle>
            <AlertDescription>
            Admin users must first select an STO Project from the "Select Project" page or sidebar link to upload SOH data.
            </AlertDescription>
        </Alert>
     );
  }


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <UploadCloud className="mr-2 h-6 w-6 text-primary" />
            Upload Stock On Hand (SOH) Data
          </CardTitle>
          <CardDescription>
            Upload SOH data from XLSX files. Max file size: 100MB. All uploads are currently simulated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser?.role === 'superuser' && (
            <div className="space-y-2">
              <label htmlFor="project-select" className="block text-sm font-medium text-foreground">
                Select Project for SOH Upload <span className="text-destructive">*</span>
              </label>
              <Select 
                value={projectForUpload} 
                onValueChange={setProjectForUpload}
                disabled={isLoadingProjects || userProjects.length === 0}
              >
                <SelectTrigger id="project-select">
                  <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : (userProjects.length === 0 ? "No projects created yet" : "Select a project")} />
                </SelectTrigger>
                <SelectContent>
                  {userProjects.map(proj => (
                    <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userProjects.length === 0 && !isLoadingProjects && (
                <p className="text-xs text-muted-foreground">
                  You need to <Link href="/dashboard/projects" className="underline text-primary">create an STO project</Link> first.
                </p>
              )}
            </div>
          )}

          {currentUser?.role !== 'superuser' && selectedProject && (
             <Alert variant="default" className="bg-primary/5 border-primary/30">
                <FolderKanban className="h-5 w-5 text-primary" />
                <AlertTitle className="font-headline text-primary">Uploading for Project: {selectedProject.name}</AlertTitle>
                <AlertDescription>
                SOH data uploaded will be associated with this currently active project.
                </AlertDescription>
            </Alert>
          )}

          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-foreground mb-1">
              Select XLSX File
            </label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              disabled={isUploading || (currentUser?.role === 'superuser' && !projectForUpload && userProjects.length > 0) }
            />
            {selectedFile && <p className="mt-2 text-sm text-muted-foreground">Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full h-3" />
              <p className="text-sm text-primary text-center">Uploading... {uploadProgress.toFixed(0)}%</p>
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" />
              <p>Upload simulation complete! File processed for the designated project.</p>
            </div>
          )}
          {uploadStatus === "error" && (
            <div className="flex items-center text-destructive">
              <XCircle className="mr-2 h-5 w-5" />
              <p>Upload failed. Please try again.</p>
            </div>
          )}

        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={!canUpload || isUploading}>
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
             <FileCheck2 className="mr-2 h-5 w-5 text-accent" />
            Uploaded SOH Data References (Simulated)
          </CardTitle>
          <CardDescription>List of SOH files 'uploaded' and their (simulated) status and project association.</CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedReferences.length === 0 ? (
            <p className="text-muted-foreground">No SOH data files have been 'uploaded' yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Row Count</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedReferences.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.filename}</TableCell>
                    <TableCell className="text-sm">{getProjectNameById(ref.stoProjectId)}</TableCell>
                    <TableCell>{new Date(ref.uploadedAt).toLocaleString()}</TableCell>
                    <TableCell>{ref.rowCount}</TableCell>
                    <TableCell>
                      <span className={`flex items-center px-2 py-1 text-xs rounded-full ${
                        ref.status === "Completed" ? "bg-green-100 text-green-700" : 
                        ref.status === "Processing" ? "bg-blue-100 text-blue-700" : 
                        ref.status === "Error" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {ref.status === "Completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {ref.status === "Error" && <AlertCircle className="mr-1 h-3 w-3" />}
                        {ref.status}
                      </span>
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
