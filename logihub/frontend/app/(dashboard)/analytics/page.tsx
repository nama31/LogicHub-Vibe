"use client";

import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProfitChart } from "@/components/analytics/ProfitChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, TrendingUp, Wallet, ShoppingCart } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const { profit, loading } = useAnalytics(dateRange);

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
    <div className="space-y-8 pb-10">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-ocean tracking-tight">Аналитика прибыли</h1>
          <p className="text-muted-foreground">Отслеживайте финансовые показатели вашего бизнеса.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white/50 p-2 rounded-2xl border border-beige/40 backdrop-blur-sm">
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
          <Button variant="ghost" size="icon" className="text-ocean rounded-xl hover:bg-beige/30">
            <Download size={20} />
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Chart Container */}
        <Card className="lg:col-span-3 p-8 bg-white border-beige/50 rounded-3xl shadow-sm overflow-hidden">
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

        {/* Sidebar Summaries */}
        <div className="space-y-6">
          <StatMiniCard 
            title="Оборот" 
            value={formatMoney(profit?.breakdown.reduce((acc, curr) => acc + curr.revenue_som, 0))}
            icon={TrendingUp}
            color="text-blue-600 bg-blue-50"
          />
          <StatMiniCard 
            title="Заказы" 
            value={profit?.breakdown.reduce((acc, curr) => acc + curr.orders, 0) ?? 0}
            icon={ShoppingCart}
            color="text-purple-600 bg-purple-50"
          />
          <StatMiniCard 
            title="Комиссии курьерам" 
            value={formatMoney(profit?.breakdown.reduce((acc, curr) => acc + curr.courier_fees_som, 0))}
            icon={Wallet}
            color="text-amber-600 bg-amber-50"
          />
          
          <div className="p-6 bg-ocean text-cream rounded-3xl shadow-xl">
            <h3 className="font-bold mb-4">Совет дня</h3>
            <p className="text-sm text-cream/70 leading-relaxed">
              Наибольшая прибыль наблюдается в дни с высоким количеством мелких заказов. Попробуйте оптимизировать курьерскую сетку.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMiniCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="p-6 bg-white border-beige/40 rounded-2xl shadow-sm group hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
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
