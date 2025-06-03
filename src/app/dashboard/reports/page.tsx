
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FilePieChart, Activity, FolderKanban, Info } from 'lucide-react';
import { useUser } from "@/app/dashboard/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const sampleVarianceData = [
  { name: 'Item A', soh: 100, physical: 95, variance: -5 },
  { name: 'Item B', soh: 50, physical: 52, variance: 2 },
  { name: 'Item C', soh: 75, physical: 70, variance: -5 },
  { name: 'Item D', soh: 200, physical: 200, variance: 0 },
  { name: 'Item E', soh: 120, physical: 110, variance: -10 },
  { name: 'Item F', soh: 80, physical: 85, variance: 5 },
];

const sampleCompletionData = [
  { name: 'Printed', value: 5 },
  { name: 'Process Counting', value: 10 },
  { name: 'Finish Counting', value: 8 },
  { name: 'Verified', value: 6 },
  { name: 'Inputted', value: 4 },
];


export default function ReportsPage() {
  const { currentUser, selectedProject, isLoadingUser } = useUser();

  if (isLoadingUser) {
    return <div className="flex justify-center items-center h-64"><p>Loading user session...</p></div>;
  }

  if (currentUser?.role !== 'superuser' && !selectedProject) {
     return (
        <Alert variant="default" className="border-yellow-500 text-yellow-700">
            <Info className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="font-headline">Project Selection Required</AlertTitle>
            <AlertDescription>
            Admin users must first select an STO Project to view reports. Please use the "Select Project" page or sidebar link.
            </AlertDescription>
        </Alert>
     );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
             <FilePieChart className="mr-2 h-6 w-6 text-primary" />
            Stock Reports
          </CardTitle>
          <CardDescription>
            Analyze stock data, variances, and operational efficiency. 
            {currentUser?.role === 'superuser' && " (Data shown is sample data. Select a project to view specific reports in the future)."}
          </CardDescription>
          {currentUser?.role !== 'superuser' && selectedProject && (
            <p className="text-sm text-muted-foreground mt-1">
                Currently viewing sample data. Reports for project: <strong className="text-primary">{selectedProject.name}</strong> will be shown here once implemented.
            </p>
          )}
        </CardHeader>
      </Card>

      <Alert variant="default" className="border-blue-500 text-blue-700 bg-blue-50">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="font-headline">Placeholder Data</AlertTitle>
          <AlertDescription>
          The charts below currently display sample data. Full integration with project-specific data is under development.
          </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Stock Variance Analysis</CardTitle>
            <CardDescription>Comparison of Stock on Hand (SOH) vs. Physical Count.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sampleVarianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="soh" fill="hsl(var(--primary))" name="SOH Quantity" />
                <Bar dataKey="physical" fill="hsl(var(--accent))" name="Physical Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Form Completion Status</CardTitle>
            <CardDescription>Overview of forms by their current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sampleCompletionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip 
                 contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                 itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--secondary))" name="Number of Forms" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Operational Metrics (Placeholder)
            </CardTitle>
            <CardDescription>Key performance indicators for stock take operations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-background">
                    <h3 className="text-sm font-medium text-muted-foreground">Average Count Time</h3>
                    <p className="text-2xl font-bold font-headline">3.5 hrs</p>
                </div>
                <div className="p-4 border rounded-lg bg-background">
                    <h3 className="text-sm font-medium text-muted-foreground">Overall Variance %</h3>
                    <p className="text-2xl font-bold font-headline text-red-500">-2.1%</p>
                </div>
                <div className="p-4 border rounded-lg bg-background">
                    <h3 className="text-sm font-medium text-muted-foreground">Forms Processed This Week</h3>
                    <p className="text-2xl font-bold font-headline">23</p>
                </div>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
