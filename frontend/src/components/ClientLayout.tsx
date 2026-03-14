"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppProvider } from "@/store/useAppStore";
import Sidebar from "@/components/Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Don't show sidebar on the landing page (OAuth login)
  const isLandingPage = pathname === "/";

  return (
    <AppProvider>
      {isLandingPage ? (
        children
      ) : (
        <div className="flex min-h-screen" style={{ background: "var(--bg-deep)" }}>
          <Sidebar />
          <main className="flex-1 ml-[4.5rem] min-h-screen">
            {children}
          </main>
        </div>
      )}
    </AppProvider>
  );
}
