"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-ocean border-t-transparent" />
          <span className="text-sm text-ocean/60">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-red-100 p-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-ocean">Доступ запрещен</h2>
          <p className="text-ocean/70">
            Этот дашборд предназначен только для администраторов. <br />
            Пожалуйста, используйте Telegram бота.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              router.replace("/login");
            }}
            className="mt-4 rounded-xl bg-ocean px-6 py-2 text-white hover:bg-ocean/90"
          >
            Выйти и войти под другим аккаунтом
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
