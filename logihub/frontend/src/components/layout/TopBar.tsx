"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#C4BCB0] bg-[#EEE8DF] px-6">
      <h2 className="text-sm font-semibold text-[#2C365A]">
        {user ? `Добро пожаловать, ${user.name}` : "LogiHub"}
      </h2>

      <Button variant="ghost" size="sm" onClick={logout} className="text-[#2C365A] hover:bg-[#C4BCB0]/40">
        <LogOut className="size-4" />
        Выйти
      </Button>
    </header>
  );
}
