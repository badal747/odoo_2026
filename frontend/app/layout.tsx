import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppLayoutShell from "@/components/AppLayoutShell";

export const metadata: Metadata = {
  title: "PeoplePay360: HR & Payroll Platform",
  description: "Integrated Human Resource and Payroll Operations Platform (Odoo Hackathon)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50/70 text-slate-900 antialiased flex flex-col font-sans">
        <AuthProvider>
          <AppLayoutShell>{children}</AppLayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
