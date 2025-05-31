import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Layers } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground">
            <Layers size={32} />
          </div>
          <CardTitle className="font-headline text-4xl">Welcome to StockFlow</CardTitle>
          <CardDescription className="text-lg">
            Efficiently manage your stock on hand data, generate count forms, and track progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/auth/login" passHref>
            <Button className="w-full" size="lg">
              Login <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            New superuser?{" "}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Admin user?{" "}
            <Link href="/auth/register-admin" className="font-medium text-primary hover:underline">
              Register as Admin
            </Link>
          </p>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} StockFlow. All rights reserved.</p>
        <p>Streamlining your stock take operations.</p>
      </footer>
    </div>
  );
}
