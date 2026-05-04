"use client";

import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProfitChart } from "@/components/analytics/ProfitChart";
import { CourierLeaderboard } from "@/components/analytics/CourierLeaderboard";
import { ProductMarginTable } from "@/components/analytics/ProductMarginTable";
import { TrendComparison } from "@/components/analytics/TrendComparison";
import { FailedDeliveryChart } from "@/components/analytics/FailedDeliveryChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, TrendingUp, Wallet, ShoppingCart, Users, Package, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

import { useAuth } from "@/hooks/useAuth";

function getDefaultDateRange() {
  return {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  };
}

const TABS = [
  { id: "overview", label: "Обзор", icon: TrendingUp },
  { id: "couriers", label: "Курьеры", icon: Users },
  { id: "products", label: "Товары", icon: Package },
  { id: "trends", label: "Тренды", icon: TrendingUp },
  { id: "failures", label: "Отказы", icon: AlertCircle },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const { profit, couriers, products, trends, failures, loading } = useAnalytics(dateRange);

  const formatMoney = (val: number = 0) => {
    return val.toLocaleString("ru-RU") + " сом";
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-beige/20 rounded-full">
          <TrendingUp size={48} className="text-ocean opacity-20" />
        </div>
        <h1 className="text-2xl font-bold text-ocean">Доступ ограничен</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Только администраторы могут просматривать финансовую аналитику. 
          Пожалуйста, обратитесь к руководству для повышения прав доступа.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-ocean tracking-tight">Аналитика</h1>
          <p className="text-muted-foreground">Глубокий анализ финансовых и операционных показателей.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-card p-2 rounded-2xl border border-beige shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2">
            <Calendar size={18} className="text-ocean/50" />
            <input 
              type="date" 
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="bg-transparent border-none text-sm font-bold text-ocean focus:ring-0 cursor-pointer"
            />
            <span className="text-ocean/30">—</span>
            <input 
              type="date" 
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="bg-transparent border-none text-sm font-bold text-ocean focus:ring-0 cursor-pointer"
            />
          </div>
          <Button variant="ghost" size="icon" className="text-ocean">
            <Download size={20} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-ocean text-cream shadow-sm"
                  : "bg-card text-ocean border border-beige hover:border-ocean/30"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {loading ? (
          <div className="h-[400px] bg-beige/20 border border-beige rounded-2xl animate-pulse" />
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3 overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-ocean">Динамика прибыли</h2>
                      <p className="text-sm text-muted-foreground">Суммарная чистая прибыль по дням</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Итого за период</p>
                      <p className="text-2xl font-black text-ocean">
                        {formatMoney(profit?.total_profit_som)}
                      </p>
                    </div>
                  </div>
                  <ProfitChart data={profit} />
                </Card>

                <div className="space-y-6">
                  <StatMiniCard 
                    title="Оборот" 
                    value={formatMoney(profit?.breakdown.reduce((acc, curr) => acc + curr.revenue_som, 0))}
                    icon={TrendingUp}
                  />
                  <StatMiniCard 
                    title="Заказы" 
                    value={profit?.breakdown.reduce((acc, curr) => acc + curr.orders, 0) ?? 0}
                    icon={ShoppingCart}
                  />
                  <StatMiniCard 
                    title="Комиссии курьерам" 
                    value={formatMoney(profit?.breakdown.reduce((acc, curr) => acc + curr.courier_fees_som, 0))}
                    icon={Wallet}
                  />
                </div>
              </div>
            )}

            {activeTab === "couriers" && (
              <Card className="overflow-hidden">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-ocean">Лидерборд курьеров</h2>
                  <p className="text-sm text-muted-foreground">Эффективность курьеров и их заработок за всё время</p>
                </div>
                <CourierLeaderboard data={couriers} />
              </Card>
            )}

            {activeTab === "products" && (
              <Card className="overflow-hidden">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-ocean">Маржинальность товаров</h2>
                  <p className="text-sm text-muted-foreground">Анализ рентабельности по каждому товару</p>
                </div>
                <ProductMarginTable data={products} />
              </Card>
            )}

            {activeTab === "trends" && (
              <Card className="overflow-hidden">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-ocean">Тренды за 30 дней</h2>
                  <p className="text-sm text-muted-foreground">Сравнение количества заказов и чистой прибыли</p>
                </div>
                <TrendComparison data={trends} />
              </Card>
            )}

            {activeTab === "failures" && (
              <Card className="overflow-hidden">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-ocean">Причины отказов</h2>
                  <p className="text-sm text-muted-foreground">Распределение причин недоставленных заказов</p>
                </div>
                <FailedDeliveryChart data={failures} />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

type StatMiniCardProps = {
  title: string;
  value: string | number;
  icon: ComponentType<{ size?: number }>;
};

function StatMiniCard({ title, value, icon: Icon }: StatMiniCardProps) {
  return (
    <Card className="group transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl border border-beige bg-beige/20 text-ocean group-hover:scale-105 transition-transform">
          <Icon size={24} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-lg font-bold text-ocean">{value}</p>
        </div>
      </div>
    </Card>
  );
}
