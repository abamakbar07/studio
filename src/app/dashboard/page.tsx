
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UploadCloud, FileText, Users, BarChart3, Info, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/app/dashboard/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function DashboardOverviewPage() {
  const { currentUser, selectedProject } = useUser();

  const overviewCards = [
    { title: "STO Projects", description: "Manage your Stock Take Operation projects.", href: "/dashboard/projects", icon: FolderKanban, cta: "Manage Projects", roles: ["superuser"] },
    { title: "Upload SOH Data", description: "Upload new stock on hand data files for projects.", href: "/dashboard/upload-soh", icon: UploadCloud, cta: "Upload Now", roles: ["superuser", "admin_doc_control"] },
    { title: "Manage Forms", description: "Generate, track, and input data for stock count forms within a project.", href: "/dashboard/forms", icon: FileText, cta: "Go to Forms", roles: ["superuser", "admin_doc_control", "admin_verification", "admin_input"] },
    { title: "View Reports", description: "Analyze stock data and variances for selected projects.", href: "/dashboard/reports", icon: BarChart3, cta: "View Reports", roles: ["superuser", "admin_verification"]},
    { title: "User Management", description: "Manage admin users and their project assignments.", href: "/dashboard/admin/user-management", icon: Users, cta: "Manage Users", roles: ["superuser"] },
  ];

  const availableCards = overviewCards.filter(card => currentUser && card.roles.includes(currentUser.role));

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="font-headline text-3xl font-semibold text-primary">Welcome to StockFlow, {currentUser?.name || 'User'}!</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
            Efficiently manage your stock take operations. Use the cards below or the sidebar to navigate.
            {currentUser?.role !== 'superuser' && selectedProject && (
                <span className="block mt-1">
                    <Info className="inline h-4 w-4 mr-1.5 text-blue-600" />
                    You are currently working within project: <strong className="text-primary">{selectedProject.name}</strong>.
                </span>
            )}
            {currentUser?.role !== 'superuser' && !selectedProject && (
                <span className="block mt-1 text-destructive">
                    <Info className="inline h-4 w-4 mr-1.5" />
                    Please select a project to access project-specific features.
                </span>
            )}
            </CardDescription>
        </CardHeader>
      </Card>

      <div className={`grid gap-6 md:grid-cols-2 ${availableCards.length > 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2' } xl:grid-cols-3`}>
        {availableCards.map((card) => {
          const isDisabledForAdminWithoutProject = currentUser?.role !== 'superuser' && !selectedProject && 
                                                (card.href === "/dashboard/upload-soh" || card.href === "/dashboard/forms" || card.href === "/dashboard/reports");
          return (
            <Card key={card.title} className={`flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 ${isDisabledForAdminWithoutProject ? 'opacity-60 bg-muted/50' : ''}`}>
                <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                    <div className={`p-3 rounded-full ${isDisabledForAdminWithoutProject ? 'bg-muted-foreground/20 text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    <card.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-headline text-xl">{card.title}</CardTitle>
                </div>
                <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                <Button asChild className="w-full" disabled={isDisabledForAdminWithoutProject}>
                    <Link href={isDisabledForAdminWithoutProject ? "#" : card.href}>
                    {card.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                {isDisabledForAdminWithoutProject && (
                    <p className="text-xs text-center text-destructive mt-2">Select a project first.</p>
                )}
                </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Activity (Placeholder)</CardTitle>
          <CardDescription>A summary of recent actions and form statuses within the selected project context.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="border-blue-500 text-blue-700 bg-blue-50">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="font-headline">Coming Soon</AlertTitle>
            <AlertDescription>
            The recent activity feed will be implemented here, showing project-specific events.
            </AlertDescription>
          </Alert>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground opacity-50">
            <li>Form #123 status changed to 'Verified'.</li>
            <li>SOH data 'batch_2023_12.xlsx' uploaded for Project Alpha.</li>
            <li>User 'admin_input@example.com' logged in.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
