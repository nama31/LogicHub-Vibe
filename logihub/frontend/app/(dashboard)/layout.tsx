import type { ReactNode } from "react";

// TODO: import Sidebar, TopBar, AuthGuard

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex" }}>
      {/* <Sidebar /> */}
      <div style={{ flex: 1 }}>
        {/* <TopBar /> */}
        <main>{children}</main>
      </div>
    </div>
  );
}
