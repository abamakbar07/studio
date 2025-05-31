import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UploadCloud, FileText, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

const overviewCards = [
  { title: "Upload SOH Data", description: "Upload new stock on hand data files.", href: "/dashboard/upload-soh", icon: UploadCloud, cta: "Upload Now" },
  { title: "Manage Forms", description: "Generate, track, and input data for stock count forms.", href: "/dashboard/forms", icon: FileText, cta: "Go to Forms" },
  { title: "View Reports", description: "Analyze stock data and variances.", href: "/dashboard/reports", icon: BarChart3, cta: "View Reports" },
  { title: "User Management", description: "Manage admin users and roles (Superuser only).", href: "/dashboard/admin/user-management", icon: Users, cta: "Manage Users" },
];

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="font-headline text-3xl font-semibold text-primary">Welcome to StockFlow!</h2>
        <p className="text-muted-foreground mt-2">
          Here you can manage your stock take operations efficiently. Use the cards below or the sidebar to navigate.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <Card key={card.title} className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <card.icon className="h-6 w-6" />
                </div>
                <CardTitle className="font-headline text-xl">{card.title}</CardTitle>
              </div>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={card.href} passHref>
                <Button className="w-full">
                  {card.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Activity</CardTitle>
          <CardDescription>A summary of recent actions and form statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Recent activity feed will be displayed here.</p>
          {/* Placeholder for recent activity list */}
          <ul className="mt-4 space-y-2">
            <li className="text-sm">Form #123 status changed to 'Verified'.</li>
            <li className="text-sm">SOH data 'batch_2023_12.xlsx' uploaded.</li>
            <li className="text-sm">User 'admin_input@example.com' logged in.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
