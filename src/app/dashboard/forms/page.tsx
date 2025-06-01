
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function FormsManagementPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Construction className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Forms Management</CardTitle>
          <CardDescription>
            This page is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The functionality to generate, track, and input data for stock count forms will be available here soon.
            Thank you for your patience!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
