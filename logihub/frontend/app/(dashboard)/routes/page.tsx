"use client";

import { useState } from "react";
import Link from "next/link";
import { useRoutes } from "@/hooks/useRoutes";
import type { RouteListItem, RouteStatus } from "@/types/route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Map, CheckCircle, Clock, AlertCircle, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<RouteStatus, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: "Черновик", icon: Clock, className: "bg-beige/60 text-ocean" },
  active: { label: "Активный", icon: Map, className: "bg-blue-100 text-blue-700" },
  completed: { label: "Завершён", icon: CheckCircle, className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Отменён", icon: XCircle, className: "bg-red-100 text-red-700" },
};

function ProgressBar({ delivered, total, failed }: { delivered: number; total: number; failed: number }) {
  const successPct = total > 0 ? (delivered / total) * 100 : 0;
  const failedPct = total > 0 ? (failed / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{delivered} из {total} выполнено</span>
        {failed > 0 && <span className="text-red-500">{failed} не доставлено</span>}
      </div>
      <div className="h-2 w-full bg-beige/50 rounded-full overflow-hidden">
        <div className="h-full flex">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${successPct}%` }}
          />
          <div
            className="bg-red-400 transition-all duration-500"
            style={{ width: `${failedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: RouteListItem }) {
  const cfg = STATUS_CONFIG[route.status];
  const Icon = cfg.icon;
  const date = new Date(route.created_at).toLocaleDateString("ru-RU", {
    day: "numeric", month: "short",
  });

  return (
    <Link href={`/routes/${route.id}`}>
      <div className="group bg-white/70 border border-beige/40 rounded-2xl p-5 hover:border-ocean/30 hover:shadow-lg transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Left: Label + Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", cfg.className)}>
                <Icon size={11} />
                {cfg.label}
              </span>
            </div>
            <h3 className="font-bold text-ocean text-sm truncate">
              {route.label ?? `Маршрут #${route.id.slice(0, 8)}`}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {route.courier?.name ?? "Курьер не назначен"} · {date}
            </p>
          </div>
          {/* Right: chevron */}
          <ChevronRight
            size={16}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 mt-1"
          />
        </div>

        {/* Progress */}
        <ProgressBar
          delivered={route.stops_delivered}
          total={route.stops_total}
          failed={route.stops_failed}
        />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-ocean/10 flex items-center justify-center mb-4">
        <Map size={28} className="text-ocean" />
      </div>
      <h3 className="text-lg font-bold text-ocean mb-2">Маршрутов пока нет</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Создайте первый маршрут, чтобы начать управлять доставками маршрутами.
      </p>
      <Link href="/routes/new">
        <Button className="bg-[#2C365A] text-[#EEE8DF] hover:bg-[#2C365A]/90 rounded-xl font-bold gap-2">
          <Plus size={16} />
          Создать маршрут
        </Button>
      </Link>
    </div>
  );
}

const STATUS_FILTERS: { label: string; value: string | undefined }[] = [
  { label: "Все", value: undefined },
  { label: "Черновики", value: "draft" },
  { label: "Активные", value: "active" },
  { label: "Завершённые", value: "completed" },
];

export default function RoutesPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { routes, total, loading, error, refetch } = useRoutes({ route_status: statusFilter });

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C365A] tracking-tight">Маршруты</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total > 0 ? `${total} маршрутов` : "Управление маршрутами доставки"}
          </p>
        </div>
        <Link href="/routes/new">
          <Button className="bg-[#2C365A] text-[#EEE8DF] hover:bg-[#2C365A]/90 rounded-xl px-5 h-11 font-bold shadow-lg transition-all active:scale-95 gap-2">
            <Plus size={16} />
            Новый маршрут
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              statusFilter === f.value
                ? "bg-[#2C365A] text-[#EEE8DF] shadow-md"
                : "bg-white/60 text-ocean border border-beige/40 hover:border-ocean/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-white/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
            Повторить
          </Button>
        </div>
      ) : routes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((r) => (
            <RouteCard key={r.id} route={r} />
          ))}
        </div>
      )}
    </div>
  );
}
