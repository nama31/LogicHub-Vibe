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
import type { ApiError } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Проверка", className: "border-beige bg-beige/30 text-ocean" },
  new: { label: "Ожидает", className: "bg-beige/60 text-ocean" },
  assigned: { label: "Назначен", className: "border-ocean bg-ocean text-cream" },
  in_transit: { label: "В пути", className: "border-beige bg-beige/30 text-ocean" },
  delivered: { label: "Доставлено", className: "border-beige bg-background text-ocean" },
  failed: { label: "Не доставлено", className: "border-ocean bg-ocean/10 text-ocean" },
};

const ROUTE_STATUS_CONFIG: Record<RouteStatus, { label: string; color: string }> = {
  pending: { label: "Проверка", color: "text-ocean" },
  draft: { label: "Черновик", color: "text-ocean" },
  active: { label: "Активный", color: "text-ocean" },
  completed: { label: "Завершён", color: "text-ocean" },
  cancelled: { label: "Отменён", color: "text-ocean" },
};

function StopIcon({ status }: { status: string }) {
  if (status === "delivered") return <CheckCircle size={20} className="text-ocean shrink-0" />;
  if (status === "failed") return <XCircle size={20} className="text-ocean shrink-0" />;
  if (status === "in_transit") return <Map size={20} className="text-ocean shrink-0 animate-pulse" />;
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
            ? "border-ocean bg-ocean/10 shadow-sm"
            : stop.status === "delivered"
            ? "border-beige bg-background/60 opacity-80"
            : stop.status === "failed"
            ? "border-ocean/30 bg-ocean/5 opacity-80"
            : "border-beige bg-card"
        )}
      >
        {/* Sequence number */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
              stop.status === "delivered"
                ? "bg-beige text-ocean"
                : stop.status === "failed"
                ? "bg-ocean/10 text-ocean"
                : isActive
                ? "bg-ocean text-cream"
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
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-xl border", statusCfg.className)}>
              {statusCfg.label}
            </span>
            {isActive && (
              <span className="text-xs font-bold text-ocean bg-beige/30 px-2 py-0.5 rounded-xl animate-pulse">
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
            <p className="text-xs text-muted-foreground italic bg-beige/30 rounded-xl px-3 py-1.5">
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
        <AlertCircle size={32} className="text-ocean mb-3" />
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
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      setActionError(apiError.message ?? "Ошибка активации маршрута");
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
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      setActionError(apiError.message ?? "Ошибка отмены маршрута");
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
          <h1 className="text-2xl font-bold text-ocean truncate">
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
          { label: "Доставлено", value: route.stops_delivered, color: "text-ocean" },
          { label: "Не доставлено", value: route.stops_failed, color: "text-ocean" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-beige rounded-2xl p-4 text-center shadow-sm"
          >
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      {route.stops_total > 0 && (
        <div className="bg-card border border-beige rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-ocean">Прогресс</span>
            <span className="text-muted-foreground">
              {route.stops_delivered + route.stops_failed} из {route.stops_total}
            </span>
          </div>
          <div className="h-3 w-full bg-beige/40 rounded-full overflow-hidden">
            <div className="h-full flex transition-all duration-700">
              <div
                className="bg-ocean"
                style={{ width: `${(route.stops_delivered / route.stops_total) * 100}%` }}
              />
              <div
                className="bg-beige"
                style={{ width: `${(route.stops_failed / route.stops_total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2 text-sm text-ocean bg-card border border-beige px-4 py-3 rounded-xl shadow-sm">
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
              className="flex-1 h-11 gap-2"
            >
              <UserPlus size={16} />
              Назначить курьера
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={actionLoading}
              className="flex-1 h-11 gap-2"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Активировать маршрут
            </Button>
          )}
          
          <Button
            onClick={handleCancel}
            disabled={actionLoading}
            variant="outline"
            className="h-11 gap-2 flex-1 sm:flex-none"
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
