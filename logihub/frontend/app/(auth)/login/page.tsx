"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiError } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [method, setMethod] = useState<"password" | "telegram">("password");
  const [password, setPassword] = useState("");
  const [tgId, setTgId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const credentials =
        method === "password"
          ? { password }
          : { tg_id: Number(tgId) };

      await login(credentials);
      router.push("/");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMsg(apiErr?.message ?? "Не удалось войти. Проверьте данные.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          LogiHub
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Система управления доставкой
        </p>
      </div>

      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Вход в систему</CardTitle>
          <CardDescription>
            Войдите, чтобы управлять заказами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="password"
            onValueChange={(val) => {
              setMethod(val as "password" | "telegram");
              setErrorMsg(null);
            }}
          >
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="password">Пароль</TabsTrigger>
              <TabsTrigger value="telegram">Telegram ID</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="password">
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={method === "password"}
                    autoComplete="current-password"
                    className="h-10"
                  />
                </div>
              </TabsContent>

              <TabsContent value="telegram">
                <div className="space-y-2">
                  <Label htmlFor="tg_id">Telegram ID</Label>
                  <Input
                    id="tg_id"
                    type="number"
                    placeholder="Например: 123456789"
                    value={tgId}
                    onChange={(e) => setTgId(e.target.value)}
                    required={method === "telegram"}
                    className="h-10"
                  />
                </div>
              </TabsContent>

              {errorMsg && (
                <p className="text-sm text-destructive">{errorMsg}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="h-10 w-full text-sm font-semibold"
              >
                {submitting ? "Вход..." : "Войти"}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
