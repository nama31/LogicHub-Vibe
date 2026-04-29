"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import type { ReactNode } from "react";

// Redirects to /login if JWT is absent from localStorage

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}
