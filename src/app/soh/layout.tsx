
import { Logo } from "@/components/icons/logo";
import Link from "next/link";

export default function SohStatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="mb-8">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      {children}
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} StockFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
