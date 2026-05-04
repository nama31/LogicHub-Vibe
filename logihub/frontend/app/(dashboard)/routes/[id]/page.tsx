"use client";

import { use, useState } from "react";

import Link from "next/link";
import { useRoute, useRoutes } from "@/hooks/useRoutes";
import type { Stop, RouteStatus } from "@/types/route";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Map,
  XCircle,
  AlertCircle,
  Loader2,
  Phone,
  MapPin,
  Package,
  User,
  Play,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AssignCourierModal } from "@/components/routes/AssignCourierModal";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Проверка", className: "bg-amber-100 text-amber-700" },
  new: { label: "Ожидает", className: "bg-beige/60 text-ocean" },
  assigned: { label: "Назначен", className: "bg-blue-100 text-blue-700" },
  in_transit: { label: "В пути", className: "bg-amber-100 text-amber-700" },
  delivered: { label: "Доставлено", className: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Не доставлено", className: "bg-red-100 text-red-700" },
};

const ROUTE_STATUS_CONFIG: Record<RouteStatus, { label: string; color: string }> = {
  pending: { label: "Проверка", color: "text-amber-600" },
  draft: { label: "Черновик", color: "text-ocean" },
  active: { label: "Активный", color: "text-blue-600" },
  completed: { label: "Завершён", color: "text-emerald-600" },
  cancelled: { label: "Отменён", color: "text-red-500" },
};

function StopIcon({ status }: { status: string }) {
  if (status === "delivered") return <CheckCircle size={20} className="text-emerald-500 shrink-0" />;
  if (status === "failed") return <XCircle size={20} className="text-red-500 shrink-0" />;
  if (status === "in_transit") return <Map size={20} className="text-amber-500 shrink-0 animate-pulse" />;
  return <Clock size={20} className="text-beige shrink-0" />;
}

function StopCard({ stop, isActive }: { stop: Stop; isActive: boolean }) {
  const statusCfg = STATUS_CONFIG[stop.status] ?? { label: stop.status, className: "" };

  return (
    <Link href={`/orders/${stop.id}`} className="block group/stop">
      <div
        className={cn(
          "relative flex gap-4 p-5 rounded-2xl border transition-all hover:border-ocean/20 hover:shadow-sm",
          isActive
            ? "border-amber-300 bg-amber-50/60 shadow-md shadow-amber-100"
            : stop.status === "delivered"
            ? "border-emerald-200/60 bg-emerald-50/30 opacity-80"
            : stop.status === "failed"
            ? "border-red-200/60 bg-red-50/30 opacity-80"
            : "border-beige/40 bg-white/60"
        )}
      >
        {/* Sequence number */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
              stop.status === "delivered"
                ? "bg-emerald-500 text-white"
                : stop.status === "failed"
                ? "bg-red-400 text-white"
                : isActive
                ? "bg-amber-500 text-white"
                : "bg-beige/60 text-ocean"
            )}
          >
            {stop.stop_sequence}
          </div>
          <StopIcon status={stop.status} />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", statusCfg.className)}>
              {statusCfg.label}
            </span>
            {isActive && (
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                Текущая
              </span>
            )}
          </div>

          <div className="flex items-start gap-2 text-sm">
            <MapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-ocean font-medium">{stop.delivery_address}</span>
          </div>

          {stop.customer_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User size={14} className="shrink-0" />
              <span>{stop.customer_name}</span>
              {stop.customer_phone && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1 text-ocean">
                    <Phone size={12} />
                    {stop.customer_phone}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package size={14} className="shrink-0" />
            <span>
              {stop.product_title ?? "Товар"} × {stop.quantity}
            </span>
          </div>

          {stop.note && (
            <p className="text-xs text-muted-foreground italic bg-beige/30 rounded-lg px-3 py-1.5">
              💬 {stop.note}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { route, loading, error, refetch } = useRoute(id);
  const { startRoute, cancelRoute } = useRoutes();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 size={32} className="text-ocean animate-spin mb-3" />
        <p className="text-muted-foreground">Загрузка маршрута...</p>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertCircle size={32} className="text-red-500 mb-3" />
        <p className="font-bold text-ocean mb-2">Маршрут не найден</p>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <Link href="/routes">
          <Button variant="outline" className="rounded-xl">Вернуться к маршрутам</Button>
        </Link>
      </div>
    );
  }

  const routeStatusCfg = ROUTE_STATUS_CONFIG[route.status];
  const stops = [...route.stops].sort((a, b) => a.stop_sequence - b.stop_sequence);
  const activeStop = stops.find((s) => s.status === "in_transit");
  const date = new Date(route.created_at).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });

  const handleStart = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await startRoute(route.id);
      await refetch();
      toast.success("Маршрут успешно активирован");
    } catch (err: any) {
      setActionError(err?.message ?? "Ошибка активации маршрута");
      toast.error("Ошибка активации маршрута");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Отменить маршрут? Все заказы вернутся в статус 'new'.")) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await cancelRoute(route.id);
      toast.success("Маршрут успешно отменен");
      window.location.href = "/routes";
    } catch (err: any) {
      setActionError(err?.message ?? "Ошибка отмены маршрута");
      toast.error("Ошибка отмены маршрута");
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/routes">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-beige/40 mt-1">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-sm font-bold", routeStatusCfg.color)}>
              {routeStatusCfg.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#2C365A] truncate">
            {route.label ?? `Маршрут #${route.id.slice(0, 8)}`}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {route.courier?.name ?? "Курьер не назначен"} · {date}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Всего", value: route.stops_total, color: "text-ocean" },
          { label: "Доставлено", value: route.stops_delivered, color: "text-emerald-600" },
          { label: "Не доставлено", value: route.stops_failed, color: "text-red-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/70 border border-beige/40 rounded-2xl p-4 text-center"
          >
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      {route.stops_total > 0 && (
        <div className="bg-white/70 border border-beige/40 rounded-2xl px-5 py-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-ocean">Прогресс</span>
            <span className="text-muted-foreground">
              {route.stops_delivered + route.stops_failed} из {route.stops_total}
            </span>
          </div>
          <div className="h-3 w-full bg-beige/40 rounded-full overflow-hidden">
            <div className="h-full flex transition-all duration-700">
              <div
                className="bg-emerald-500"
                style={{ width: `${(route.stops_delivered / route.stops_total) * 100}%` }}
              />
              <div
                className="bg-red-400"
                style={{ width: `${(route.stops_failed / route.stops_total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          <AlertCircle size={16} />
          {actionError}
        </div>
      )}

      {/* Actions */}
      {(route.status === "draft" || route.status === "pending") && (
        <div className="flex flex-col sm:flex-row gap-3">
          {!route.courier ? (
            <Button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex-1 bg-ocean text-cream hover:bg-ocean/90 rounded-xl h-11 font-bold gap-2 shadow-lg transition-all active:scale-95"
            >
              <UserPlus size={16} />
              Назначить курьера
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={actionLoading}
              className="flex-1 bg-[#2C365A] text-[#EEE8DF] hover:bg-[#2C365A]/90 rounded-xl h-11 font-bold gap-2 shadow-lg transition-all active:scale-95"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Активировать маршрут
            </Button>
          )}
          
          <Button
            onClick={handleCancel}
            disabled={actionLoading}
            variant="outline"
            className="rounded-xl h-11 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 gap-2 flex-1 sm:flex-none"
          >
            <Trash2 size={16} />
            Отменить
          </Button>
        </div>
      )}

      <AssignCourierModal
        routeId={route.id}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssigned={refetch}
      />

      {/* Stop timeline */}
      <div className="space-y-3">
        <h2 className="font-bold text-ocean text-lg">Остановки</h2>
        {stops.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            В маршруте нет остановок.
          </p>
        ) : (
          <div className="space-y-3">
            {stops.map((stop) => (
              <StopCard
                key={stop.id}
                stop={stop}
                isActive={activeStop?.id === stop.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


