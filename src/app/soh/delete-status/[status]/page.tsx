
"use client";

import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function SohDeletionStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const status = params.status as string;
  const message = searchParams.get('message');
  const filename = searchParams.get('filename');
  const itemsDeleted = searchParams.get('items_deleted');


  let title = "SOH Deletion Status";
  let description = "Processing your SOH data reference deletion...";
  let IconComponent = AlertTriangle;
  let cardVariant: "default" | "success" | "destructive" | "warning" = "default";

  if (status === "success") {
    title = "Deletion Successful";
    description = `The SOH data reference ${filename ? `'${decodeURIComponent(filename)}'` : ''} and its ${itemsDeleted || 'associated'} stock items have been successfully deleted.`;
    IconComponent = CheckCircle;
    cardVariant = "success";
  } else if (status === "invalid") {
    title = "Invalid or Expired Link";
    description = `This deletion confirmation link is invalid, has expired, or the reference has already been processed. ${message ? `Details: ${message.replace(/_/g, ' ')}.` : 'Please contact support or the requesting superuser if you believe this is an error.'}`;
    IconComponent = XCircle;
    cardVariant = "destructive";
  } else if (status === "error") {
    title = "Deletion Error";
    description = "An unexpected error occurred while processing the deletion. Please try again later or contact support.";
    IconComponent = AlertTriangle;
    cardVariant = "warning";
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <Card className={`w-full max-w-lg shadow-2xl 
        ${cardVariant === "success" ? "border-green-500" : ""}
        ${cardVariant === "destructive" ? "border-red-500" : ""}
        ${cardVariant === "warning" ? "border-yellow-500" : ""
      }`}>
        <CardHeader className="text-center">
          <IconComponent className={`mx-auto h-16 w-16 mb-4 
            ${cardVariant === "success" ? "text-green-500" : ""}
            ${cardVariant === "destructive" ? "text-red-500" : ""}
            ${cardVariant === "warning" ? "text-yellow-500" : "text-primary"
          }`} />
          <CardTitle className="font-headline text-3xl">{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
