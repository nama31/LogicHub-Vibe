"use client";

import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const { summary, loading } = useAnalytics();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-ocean tracking-tight">Рабочая панель</h1>
          <p className="text-muted-foreground">Добро пожаловать в LogiHub. Вот что происходит в системе сегодня.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/orders/new">
            <Button className="h-11 px-5">
              Новый заказ
            </Button>
          </Link>
        </div>
      </div>

      {isAdmin && <SummaryCards summary={summary} loading={loading} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-beige bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold text-ocean mb-6">Быстрый доступ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickLink 
                href="/orders" 
                title="Все заказы" 
                desc="Управление доставками" 
                icon={Package} 
              />
              <QuickLink 
                href="/couriers" 
                title="Курьеры" 
                desc="Статус и назначение" 
                icon={Truck} 
              />
              <QuickLink 
                href="/analytics" 
                title="Аналитика" 
                desc="Прибыль и отчеты" 
                icon={CheckCircle} 
              />
              <QuickLink 
                href="/products" 
                title="Склад" 
                desc="Остатки товаров" 
                icon={Package} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isAdmin ? (
            <div className="bg-ocean text-cream rounded-2xl p-6 shadow-md relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-cream/10 blur-2xl transition-all group-hover:bg-cream/20" />
              <h2 className="text-xl font-bold mb-2">Минимальный остаток</h2>
              <p className="text-cream/70 text-sm mb-6">
                Список товаров с наименьшим количеством на складе для контроля наличия.
              </p>
              <div className="space-y-3">
                {summary?.stock_alerts.slice(0, 3).map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between rounded-xl border border-cream/20 bg-cream/10 p-3">
                    <span className="text-sm font-medium truncate max-w-[150px]">{item.title}</span>
                    <span className="rounded-xl border border-cream/20 bg-cream/20 px-2 py-1 text-xs font-bold text-cream">
                      {item.stock_quantity} шт
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/products">
                <Button variant="ghost" className="w-full mt-6 text-cream hover:bg-cream/10 hover:text-cream font-bold gap-2">
                  Смотреть склад <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-beige bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-ocean mb-2">Ваш статус</h2>
              <p className="text-muted-foreground text-sm">
                Вы вошли как <span className="font-bold text-ocean">{user?.role}</span>. 
                У вас есть доступ к управлению закрепленными за вами заказами.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type QuickLinkProps = {
  href: string;
  title: string;
  desc: string;
  icon: ComponentType<{ size?: number }>;
};

function QuickLink({ href, title, desc, icon: Icon }: QuickLinkProps) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-4 rounded-2xl border border-beige bg-background p-4 transition-all group cursor-pointer hover:border-ocean/40 hover:bg-beige/20 hover:shadow-md">
        <div className="rounded-xl border border-beige bg-beige/20 p-3 text-ocean transition-transform group-hover:scale-105">
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-ocean">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
