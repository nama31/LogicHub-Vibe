"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-8">
      <h2 className="text-sm font-semibold text-foreground">
        {user ? `Добро пожаловать, ${user.name}` : "LogiHub"}
      </h2>

      <Button variant="ghost" size="sm" onClick={logout} className="text-foreground">
        <LogOut className="size-4" />
        Выйти
      </Button>
    </header>
  );
}
