
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { SOHDataReference, STOProject, User, SOHDataReferenceStatus } from "@/lib/types";
import { UploadCloud, CheckCircle, XCircle, FileCheck2, AlertCircle, FolderKanban, Info, AlertTriangle, Loader2 } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/app/dashboard/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { format } from 'date-fns';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
// CHUNK_SIZE is not used for client-side actual chunking here, but for progress simulation.
// Actual server-side processing will handle the full file.

interface UploadResult {
  message: string;
  sohDataReferenceId?: string;
  itemsProcessed?: number;
  errors?: string[];
}


export default function UploadSohPage() {
  const { currentUser, selectedProject, isLoadingUser } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0); // For visual feedback
  const [isProcessing, setIsProcessing] = useState(false); // Combined uploading/server processing state
  const [currentStatusMessage, setCurrentStatusMessage] = useState<string | null>(null);
  const [uploadedReferences, setUploadedReferences] = useState<SOHDataReference[]>([]); // Will be fetched
  const [userProjects, setUserProjects] = useState<STOProject[]>([]);
  const [projectForUpload, setProjectForUpload] = useState<string | undefined>(undefined);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);

  const { toast } = useToast();

  const fetchSuperuserProjects = useCallback(async () => {
    if (currentUser?.role === 'superuser') {
      setIsLoadingProjects(true);
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const projects: STOProject[] = await response.json();
        setUserProjects(projects.sort((a,b) => a.name.localeCompare(b.name)));
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch your projects for selection.", variant: "destructive" });
        setUserProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    }
  }, [currentUser?.role, toast]);

  // Fetch SOH References for the current project context
  const fetchSohReferences = useCallback(async (projectId: string | undefined) => {
    if (!projectId) {
      setUploadedReferences([]);
      return;
    }
    setIsLoadingReferences(true);
    try {
      // This API endpoint needs to be created: GET /api/soh/references?stoProjectId=<id>
      // For now, we'll keep the local update logic after a successful upload.
      // const response = await fetch(`/api/soh/references?stoProjectId=${projectId}`);
      // if (!response.ok) throw new Error('Failed to fetch SOH references.');
      // const data: SOHDataReference[] = await response.json();
      // setUploadedReferences(data.sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
      console.log("Placeholder: Would fetch SOH references for project", projectId);
      // To clear simulation data if project changes:
      if (uploadedReferences.some(ref => ref.stoProjectId !== projectId)) {
        //setUploadedReferences([]); // Or filter based on actual fetched data
      }

    } catch (error) {
      toast({ title: "Error", description: "Could not fetch SOH references for the project.", variant: "destructive" });
    } finally {
      setIsLoadingReferences(false);
    }
  }, [toast, uploadedReferences]);


  useEffect(() => {
    if (currentUser?.role === 'superuser') {
      fetchSuperuserProjects();
    }
  }, [currentUser, fetchSuperuserProjects]);

  useEffect(() => {
    if (currentUser?.role !== 'superuser' && selectedProject) {
      setProjectForUpload(selectedProject.id);
      fetchSohReferences(selectedProject.id);
    } else if (currentUser?.role === 'superuser') {
      // Superuser selects project, so fetch references when projectForUpload changes
      fetchSohReferences(projectForUpload);
    } else {
        setUploadedReferences([]); // Clear if no project context
    }
  }, [currentUser?.role, selectedProject, projectForUpload, fetchSohReferences]);


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
      setCurrentStatusMessage("File selected. Ready to upload.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Error", description: "No file selected.", variant: "destructive" });
      return;
    }
    const currentStoProjectId = currentUser?.role === 'superuser' ? projectForUpload : selectedProject?.id;
    if (!currentStoProjectId) {
      toast({ title: "Error", description: "Please select a project to upload the SOH data for.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setCurrentStatusMessage("Uploading file...");
    setUploadProgress(0); // Reset progress

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('stoProjectId', currentStoProjectId);
    
    // Simulate initial upload part of progress
    let progressInterval = setInterval(() => {
        setUploadProgress(prev => {
            if (prev >= 50) { // Cap at 50% for upload part
                 clearInterval(progressInterval);
                 return 50;
            }
            return prev + 10;
        });
    }, 100);


    try {
      const response = await fetch('/api/soh/upload-process', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval); // Stop upload simulation
      setCurrentStatusMessage("File uploaded. Server is processing...");
      setUploadProgress(75); // Indicate server processing started

      const result: UploadResult = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Server responded with ${response.status}`);
      }
      
      setUploadProgress(100);
      setCurrentStatusMessage(`Processing complete! ${result.message}`);
      toast({ 
        title: "SOH Upload Successful", 
        description: result.message,
        duration: 7000,
      });

      // Add to local state (ideally this comes from a re-fetch)
      const newReference: SOHDataReference = {
        id: result.sohDataReferenceId || crypto.randomUUID(), // Use ID from response
        filename: selectedFile.name,
        uploadedBy: currentUser?.email || 'unknown',
        uploadedAt: new Date().toISOString(),
        rowCount: result.itemsProcessed || 0,
        status: result.errors && result.errors.length > 0 && result.itemsProcessed === 0 ? 'ValidationError' : result.errors && result.errors.length > 0 ? 'Completed' : 'Completed',
        stoProjectId: currentStoProjectId,
        errorMessage: result.errors ? result.errors.join('; ') : undefined,
        size: selectedFile.size,
        contentType: selectedFile.type,
      };
      setUploadedReferences(prev => [newReference, ...prev].sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
      
      setSelectedFile(null);
      // Optionally reset project for superuser: // if (currentUser?.role === 'superuser') setProjectForUpload(undefined); 

    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during upload.";
      setCurrentStatusMessage(`Error: ${errorMessage}`);
      setUploadProgress(0); // Or keep progress to show where it failed
      toast({
        title: "SOH Upload Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsProcessing(false);
      // Keep progress at 100 for success, or reset/show error progress
      // If error, you might want to setUploadProgress to a specific value or leave it.
    }
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
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading user session...</p></div>;
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
            Upload SOH data from XLSX files. Max file size: 100MB. Ensure columns: SKU, Description, SOH Quantity. Location is optional.
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
                onValueChange={(value) => {
                  setProjectForUpload(value);
                  // fetchSohReferences(value); // fetch references when project changes
                }}
                disabled={isLoadingProjects || userProjects.length === 0 || isProcessing}
              >
                <SelectTrigger id="project-select" className="disabled:opacity-70">
                  <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : (userProjects.length === 0 ? "No projects created yet" : "Select a project")} />
                </SelectTrigger>
                <SelectContent>
                  {userProjects.map(proj => (
                    <SelectItem key={proj.id} value={proj.id}>{proj.name} ({proj.status})</SelectItem>
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
              Select XLSX File <span className="text-destructive">*</span>
            </label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-70"
              disabled={isProcessing || (currentUser?.role === 'superuser' && !projectForUpload && userProjects.length > 0) }
            />
            {selectedFile && <p className="mt-2 text-sm text-muted-foreground">Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>

          {isProcessing && (
            <div className="space-y-2 pt-2">
              <Progress value={uploadProgress} className="w-full h-3" />
              <p className="text-sm text-primary text-center">{currentStatusMessage || `Processing... ${uploadProgress.toFixed(0)}%`}</p>
            </div>
          )}
          {!isProcessing && currentStatusMessage && !currentStatusMessage.startsWith("File selected") && (
             <p className={`text-sm ${currentStatusMessage.startsWith("Error:") ? "text-destructive" : "text-green-600"} text-center pt-2`}>{currentStatusMessage}</p>
          )}


        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={!canUpload || isProcessing}>
            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Processing...</> : <><UploadCloud className="mr-2 h-4 w-4"/>Upload & Process File</>}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
             <FileCheck2 className="mr-2 h-5 w-5 text-accent" />
            Uploaded SOH Data References
          </CardTitle>
          <CardDescription>List of SOH files processed and their status. 
            {/* Add a refresh button here later */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReferences ? (
            <div className="flex items-center justify-center py-4"> <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading references...</div>
          ) : uploadedReferences.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">No SOH data files have been processed for {
                currentUser?.role === 'superuser' ? (projectForUpload ? `project ${getProjectNameById(projectForUpload)}` : "the selected project context") : (selectedProject ? `project ${selectedProject.name}` : "your project")
            }.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedReferences.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium max-w-xs truncate" title={ref.filename}>{ref.filename}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate" title={getProjectNameById(ref.stoProjectId)}>{getProjectNameById(ref.stoProjectId)}</TableCell>
                    <TableCell>{ref.processedAt ? format(new Date(ref.processedAt), 'PPpp') : (ref.uploadedAt ? format(new Date(ref.uploadedAt), 'PPpp') : 'N/A')}</TableCell>
                    <TableCell>{ref.rowCount}</TableCell>
                    <TableCell>
                      <span className={`flex items-center px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                        ref.status === "Completed" ? "bg-green-100 text-green-700" : 
                        ref.status === "Processing" || ref.status === "Storing" || ref.status === "Validating" || ref.status === "Uploading" ? "bg-blue-100 text-blue-700" : 
                        ref.status === "ValidationError" || ref.status === "StorageError" || ref.status === "UploadError" || ref.status === "SystemError" ? "bg-red-100 text-red-700" : 
                        "bg-gray-100 text-gray-700" // Pending or other
                      }`}>
                        {ref.status === "Completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {(ref.status === "ValidationError" || ref.status === "StorageError" || ref.status === "SystemError") && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {(ref.status === "Processing" || ref.status === "Storing" || ref.status === "Validating" || ref.status === "Uploading") && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {ref.status}
                      </span>
                    </TableCell>
                     <TableCell className="text-xs text-muted-foreground max-w-md truncate" title={ref.errorMessage}>
                        {ref.errorMessage || (ref.status === "Completed" && ref.rowCount > 0 ? "Successfully processed." : "-")}
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
