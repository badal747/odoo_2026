import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth-context";
import RouteGuard from "@/components/RouteGuard";

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
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <RouteGuard>
              {children}
            </RouteGuard>
          </main>
          <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
              PeoplePay360 &copy; 2026 &bull; Integrated HR & Payroll Platform &bull; Built with FastAPI, MongoDB Atlas, Next.js & Three.js
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
