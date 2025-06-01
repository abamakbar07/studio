
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FORM_STATUSES, FORM_STATUS_ICONS } from "@/lib/constants";
import type { StockForm, FormStatus, SOHDataReference } from "@/lib/types";
import { PlusCircle, MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

const initialForms: StockForm[] = [
  { id: "form-001", formName: "Area A - Section 1", dataReference: "soh_batch_01.xlsx", status: "Printed", itemCount: 120, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date().toISOString() },
  { id: "form-002", formName: "Area B - High Value", dataReference: "soh_batch_01.xlsx", status: "Process Counting", itemCount: 45, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: "form-003", formName: "Warehouse Zone C", dataReference: "soh_batch_02.xlsx", status: "Finish Counting", itemCount: 350, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const availableSohReferences: SOHDataReference[] = [
  { id: "ref-001", filename: "soh_batch_01.xlsx", uploadedAt: new Date().toISOString(), rowCount: 1500, status: "Completed" },
  { id: "ref-002", filename: "soh_batch_02.xlsx", uploadedAt: new Date().toISOString(), rowCount: 2200, status: "Completed" },
];

export default function FormsManagementPage() {
  const [forms, setForms] = useState<StockForm[]>(initialForms);
  const [selectedSohRef, setSelectedSohRef] = useState<string | undefined>(availableSohReferences[0]?.id);
  const { toast } = useToast();

  const handleGenerateForm = () => {
    if (!selectedSohRef) {
      toast({ title: "Error", description: "Please select an SOH data reference.", variant: "destructive" });
      return;
    }
    const refFilename = availableSohReferences.find(r => r.id === selectedSohRef)?.filename || "Unknown Reference";
    const newFormId = `form-${String(forms.length + 1).padStart(3, '0')}`;
    const newForm: StockForm = {
      id: newFormId,
      formName: `New Form - ${new Date().toLocaleTimeString()}`,
      dataReference: refFilename,
      status: "Printed",
      itemCount: Math.floor(Math.random() * 200) + 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setForms(prev => [newForm, ...prev]);
    toast({ title: "Success", description: `Form "${newForm.formName}" generated and printed (simulated).` });
  };

  const updateFormStatus = (formId: string, newStatus: FormStatus) => {
    setForms(prevForms =>
      prevForms.map(form =>
        form.id === formId ? { ...form, status: newStatus, updatedAt: new Date().toISOString() } : form
      )
    );
    toast({ title: "Status Updated", description: `Form ${formId} status changed to ${newStatus}.` });
  };

  const deleteForm = (formId: string) => {
    setForms(prevForms => prevForms.filter(form => form.id !== formId));
    toast({ title: "Form Deleted", description: `Form ${formId} has been deleted.` });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Generate New Form</CardTitle>
            <CardDescription>Select SOH data and generate a form for physical counting.</CardDescription>
          </div>
          <Button onClick={handleGenerateForm} disabled={!selectedSohRef}>
            <PlusCircle className="mr-2 h-5 w-5" /> Generate & Print Form
          </Button>
        </CardHeader>
        <CardContent>
          <Select value={selectedSohRef} onValueChange={setSelectedSohRef}>
            <SelectTrigger className="w-full md:w-1/2">
              <SelectValue placeholder="Select SOH Data Reference" />
            </SelectTrigger>
            <SelectContent>
              {availableSohReferences.map(ref => (
                <SelectItem key={ref.id} value={ref.id}>
                  {ref.filename} (Uploaded: {new Date(ref.uploadedAt).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Form Status Tracking</CardTitle>
          <CardDescription>Monitor and update the progress of stock count forms.</CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <p className="text-muted-foreground">No forms found. Generate a new form to begin.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form ID</TableHead>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Data Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form) => {
                    const StatusIcon = FORM_STATUS_ICONS[form.status];
                    return (
                      <TableRow key={form.id} className="hover:bg-muted/50 transition-colors duration-150">
                        <TableCell className="font-medium">{form.id}</TableCell>
                        <TableCell>{form.formName}</TableCell>
                        <TableCell>{form.dataReference}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-2 capitalize">
                                <StatusIcon className="h-4 w-4" /> {form.status}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {FORM_STATUSES.map(status => (
                                <DropdownMenuItem key={status} onClick={() => updateFormStatus(form.id, status)} className="capitalize">
                                  {FORM_STATUS_ICONS[status] && <FORM_STATUS_ICONS[status] className="mr-2 h-4 w-4" />}
                                  {status}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>{form.itemCount}</TableCell>
                        <TableCell>{new Date(form.updatedAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/forms/${form.id}/input`}>
                                  <Edit className="mr-2 h-4 w-4" /> Input Data
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteForm(form.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Form
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
