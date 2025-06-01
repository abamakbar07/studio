
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { StockItem } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const stockItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  description: z.string(),
  sohQuantity: z.number(),
  physicalCount: z.string().transform(val => val === '' ? null : Number(val)).nullable().refine(val => val === null || (val >= 0 && Number.isInteger(val)), "Must be a non-negative integer or blank"),
});

const formSchema = z.object({
  items: z.array(stockItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

const fetchFormItems = async (formId: string): Promise<StockItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 500)); 
  return [
    { id: "item-1", sku: "SKU001", description: "Item A - Blue Widget", sohQuantity: 100 },
    { id: "item-2", sku: "SKU002", description: "Item B - Red Gadget", sohQuantity: 50 },
    { id: "item-3", sku: "SKU003", description: "Item C - Green Gizmo", sohQuantity: 75, physicalCount: 70 },
    { id: "item-4", sku: "SKU004", description: "Item D - Yellow Thingamajig", sohQuantity: 200 },
  ];
};


export default function FormInputPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const formId = params.formId as string;
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (formId) {
      setIsLoading(true);
      fetchFormItems(formId).then(data => {
        form.reset({ items: data.map(item => ({...item, physicalCount: item.physicalCount === undefined ? '' : String(item.physicalCount)})) });
        setIsLoading(false);
      }).catch(err => {
        toast({ title: "Error", description: "Failed to load form items.", variant: "destructive"});
        setIsLoading(false);
      });
    }
  }, [formId, form, toast]);

  const onSubmit = (data: FormValues) => {
    toast({
      title: "Data Saved",
      description: `Physical counts for form ${formId} have been saved.`,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p>Loading form data...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/forms">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forms
          </Link>
        </Button>
        <h1 className="font-headline text-2xl">Input Data for Form: {formId}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Physical Count Input</CardTitle>
          <CardDescription>
            Enter the physical stock counts for each item. Leave blank if not counted (will be treated as null).
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">SOH Qty</TableHead>
                      <TableHead className="text-right w-40">Physical Count</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const soh = form.watch(`items.${index}.sohQuantity`);
                      const physicalCountStr = form.watch(`items.${index}.physicalCount`);
                      const physicalCount = physicalCountStr === null || physicalCountStr === '' ? null : Number(physicalCountStr);
                      const variance = (physicalCount !== null && typeof physicalCount === 'number' && !isNaN(physicalCount)) ? physicalCount - soh : null;
                      
                      return (
                        <TableRow key={field.id}>
                          <TableCell>{field.sku}</TableCell>
                          <TableCell>{field.description}</TableCell>
                          <TableCell className="text-right">{field.sohQuantity}</TableCell>
                          <TableCell className="text-right">
                            <FormField
                              control={form.control}
                              name={`items.${index}.physicalCount`}
                              render={({ field: formField }) => (
                                <FormItem className="w-full">
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="Count" 
                                      className="text-right" 
                                      {...formField}
                                      value={formField.value === null ? '' : formField.value} 
                                      onChange={e => formField.onChange(e.target.value === '' ? '' : e.target.valueAsNumber)} 
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs text-right"/>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className={`text-right font-medium ${variance === null ? '' : variance < 0 ? 'text-red-500' : variance > 0 ? 'text-blue-500' : 'text-green-500'}`}>
                            {variance === null ? '-' : variance}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    <Save className="mr-2 h-4 w-4" /> {form.formState.isSubmitting ? "Saving..." : "Save Counts"}
                </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
