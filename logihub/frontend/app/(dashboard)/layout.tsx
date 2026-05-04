"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useRealTime } from "@/hooks/useRealTime";
import { Toaster } from "@/components/ui/sonner";

function RealTimeWrapper({ children }: { children: ReactNode }) {
  useRealTime();
  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <RealTimeWrapper>
          <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <TopBar />
              <main className="flex-1 px-8 py-8">{children}</main>
            </div>
          </div>
          <Toaster position="top-center" richColors />
        </RealTimeWrapper>
      </AuthGuard>
    </AuthProvider>
  );
}
