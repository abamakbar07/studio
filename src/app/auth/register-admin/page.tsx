
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USER_ROLES } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

const registerAdminSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  superuserEmail: z.string().email({ message: "Enter a valid superuser email."}),
  role: z.enum(["admin_input", "admin_doc_control", "admin_verification"], {
    errorMap: () => ({ message: "Please select a valid admin role." }),
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type RegisterAdminFormValues = z.infer<typeof registerAdminSchema>;

export default function RegisterAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<RegisterAdminFormValues>({
    resolver: zodResolver(registerAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      superuserEmail: "",
    },
  });

  const adminRoles = USER_ROLES.filter(role => role.value !== "superuser");

  const onSubmit = async (data: RegisterAdminFormValues) => {
    try {
      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: data.name, 
          email: data.email, 
          role: data.role,
          superuserEmail: data.superuserEmail,
          // password: data.password // Password not directly stored in Firestore for user info, but sent for potential Firebase Auth integration
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Failed to register admin user');
      }

      toast({
        title: "Admin Registration Submitted",
        description: "Admin account created. You can now log in.",
        duration: 5000,
      });
      
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);

    } catch (error) {
      console.error("Admin registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Registration Error",
        description: `Failed to register admin: ${errorMessage}. Please ensure the superuser email is correct and approved.`,
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Register as Admin User</CardTitle>
        <CardDescription>Create your StockFlow admin account. Requires a valid, approved superuser email for association.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Admin Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="superuserEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Superuser Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="superuser@example.com" {...field} />
                  </FormControl>
                  <FormDescription>Enter the email of an existing, approved superuser to associate this admin account.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an admin role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {adminRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Registering..." : "Register Admin"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
