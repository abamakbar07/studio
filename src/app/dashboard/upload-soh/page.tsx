"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { SOHDataReference } from "@/lib/types";
import { UploadCloud, CheckCircle, XCircle, FileCheck2, AlertCircle } from "lucide-react";
import React, { useState } from "react";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export default function UploadSohPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadedReferences, setUploadedReferences] = useState<SOHDataReference[]>([]);
  const { toast } = useToast();

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

    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);

    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);

    // Simulate chunked upload
    for (let i = 0; i < totalChunks; i++) {
      // const chunk = selectedFile.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      // In a real app, you would send this chunk to the server
      // await uploadChunkToServer(chunk, i, selectedFile.name); 
      
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
      setUploadProgress(((i + 1) / totalChunks) * 100);
    }
    
    // Simulate completion
    // In a real app, the server would confirm completion and data integrity checks
    setTimeout(() => {
      setIsUploading(false);
      setUploadStatus("success");
      toast({ title: "Success", description: `${selectedFile.name} uploaded successfully. Data integrity checks initiated.` });
      
      const newReference: SOHDataReference = {
        id: crypto.randomUUID(),
        filename: selectedFile.name,
        uploadedAt: new Date().toISOString(),
        rowCount: Math.floor(Math.random() * 1000) + 500, // Placeholder
        status: "Completed", // Assume it's completed for now
      };
      setUploadedReferences(prev => [newReference, ...prev]);
      setSelectedFile(null); // Clear selection
    }, 500);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <UploadCloud className="mr-2 h-6 w-6 text-primary" />
            Upload Stock On Hand (SOH) Data
          </CardTitle>
          <CardDescription>
            Upload SOH data from XLSX files. Large files are handled using chunked uploads. Max file size: 100MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              disabled={isUploading}
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
              <p>Upload complete! File is being processed.</p>
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
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
             <FileCheck2 className="mr-2 h-5 w-5 text-accent" />
            Uploaded Data References
          </CardTitle>
          <CardDescription>List of SOH files uploaded and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedReferences.length === 0 ? (
            <p className="text-muted-foreground">No SOH data files have been uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Row Count</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedReferences.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.filename}</TableCell>
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
