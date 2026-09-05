"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import RouteGuard from "@/components/RouteGuard";

export default function AppLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return (
      <RouteGuard>
        {children}
      </RouteGuard>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <RouteGuard>{children}</RouteGuard>
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          PeoplePay360 &copy; 2026 &bull; Integrated HR & Payroll Platform &bull; Built with FastAPI, MongoDB Atlas, Next.js & Three.js
        </div>
      </footer>
    </>
  );
}
