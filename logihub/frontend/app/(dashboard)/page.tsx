"use client";

import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const { summary, loading } = useAnalytics();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#2C365A] tracking-tight">Рабочая панель</h1>
          <p className="text-muted-foreground">Добро пожаловать в LogiHub. Вот что происходит в системе сегодня.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/orders/new">
            <Button className="bg-[#2C365A] text-[#EEE8DF] hover:bg-[#2C365A]/90 rounded-xl px-5 h-11 font-bold shadow-lg shadow-ocean/20 transition-all active:scale-95">
              Новый заказ
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {isAdmin && <SummaryCards summary={summary} loading={loading} />}

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity or Quick Links */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/50 border border-beige/40 rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-ocean mb-6">Быстрый доступ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickLink 
                href="/orders" 
                title="Все заказы" 
                desc="Управление доставками" 
                icon={Package} 
                color="bg-blue-50 text-blue-600"
              />
              <QuickLink 
                href="/couriers" 
                title="Курьеры" 
                desc="Статус и назначение" 
                icon={Truck} 
                color="bg-purple-50 text-purple-600"
              />
              <QuickLink 
                href="/analytics" 
                title="Аналитика" 
                desc="Прибыль и отчеты" 
                icon={CheckCircle} 
                color="bg-emerald-50 text-emerald-600"
              />
              <QuickLink 
                href="/products" 
                title="Склад" 
                desc="Остатки товаров" 
                icon={Package} 
                color="bg-orange-50 text-orange-600"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Alerts/Notifications */}
        <div className="space-y-6">
          {isAdmin ? (
            <div className="bg-[#2C365A] text-[#EEE8DF] rounded-3xl p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
              <h2 className="text-xl font-bold mb-2">Минимальный остаток</h2>
              <p className="text-[#EEE8DF]/70 text-sm mb-6">
                Список товаров с наименьшим количеством на складе для контроля наличия.
              </p>
              <div className="space-y-3">
                {summary?.stock_alerts.slice(0, 3).map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between bg-white/10 p-3 rounded-xl border border-white/5">
                    <span className="text-sm font-medium truncate max-w-[150px]">{item.title}</span>
                    <span className="text-xs font-bold bg-amber-500/20 text-amber-200 px-2 py-1 rounded-lg">
                      {item.stock_quantity} шт
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/products">
                <Button variant="ghost" className="w-full mt-6 text-cream hover:bg-white/10 hover:text-cream font-bold gap-2">
                  Смотреть склад <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white/50 border border-beige/40 rounded-3xl p-8 backdrop-blur-sm">
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

function QuickLink({ href, title, desc, icon: Icon, color }: any) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-beige/30 hover:border-ocean/30 hover:shadow-lg transition-all group cursor-pointer">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
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
