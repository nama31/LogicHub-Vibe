"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOrders } from "@/hooks/useOrders";
import { useUsers } from "@/hooks/useUsers";
import { useRoutes } from "@/hooks/useRoutes";
import type { Order } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedStop {
  order: Order;
  sequence: number;
}

function OrderPickerRow({
  order,
  isSelected,
  onToggle,
}: {
  order: Order;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all",
        isSelected
          ? "border-ocean bg-ocean/5 cursor-pointer"
          : "border-beige/40 hover:border-ocean/30 hover:bg-white/80"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
          isSelected ? "border-ocean bg-ocean" : "border-beige"
        )}
      >
        {isSelected && (
          <svg viewBox="0 0 12 9" fill="none" className="w-3 h-3">
            <path d="M1 4l3 3 7-7" stroke="#EEE8DF" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ocean truncate">
          #{order.id} — {order.delivery_address}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {order.customer_name ?? "Без имени"} · {(order as any).product?.title ?? "Товар"}
        </p>
      </div>
    </button>
  );
}

function StopSequenceItem({
  stop,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  stop: SelectedStop;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/80 border border-beige/40 rounded-xl">
      <GripVertical size={16} className="text-beige shrink-0" />
      <div className="w-6 h-6 rounded-full bg-ocean text-cream text-xs font-bold flex items-center justify-center shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ocean truncate">#{stop.order.id}</p>
        <p className="text-xs text-muted-foreground truncate">{stop.order.delivery_address}</p>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 rounded-lg hover:bg-beige/40 disabled:opacity-30 transition-all"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 rounded-lg hover:bg-beige/40 disabled:opacity-30 transition-all"
        >
          <ArrowDown size={14} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function NewRoutePage() {
  const router = useRouter();
  const { orders, loading: ordersLoading } = useOrders({ status: "new" });
  const { users: couriers, loading: couriersLoading } = useUsers({ role: "courier", isActive: true });
  const { createRoute } = useRoutes();

  const [label, setLabel] = useState("");
  const [courierId, setCourierId] = useState("");
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOrderIds = new Set(selectedStops.map((s) => s.order.id));

  const toggleOrder = useCallback(
    (order: Order) => {
      setSelectedStops((prev) => {
        if (prev.some((s) => s.order.id === order.id)) {
          return prev.filter((s) => s.order.id !== order.id).map((s, i) => ({ ...s, sequence: i + 1 }));
        } else {
          return [...prev, { order, sequence: prev.length + 1 }];
        }
      });
    },
    []
  );

  const moveStop = useCallback((index: number, direction: "up" | "down") => {
    setSelectedStops((prev) => {
      const next = [...prev];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      return next.map((s, i) => ({ ...s, sequence: i + 1 }));
    });
  }, []);

  const removeStop = useCallback((orderId: number) => {
    setSelectedStops((prev) =>
      prev.filter((s) => s.order.id !== orderId).map((s, i) => ({ ...s, sequence: i + 1 }))
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courierId) { setError("Выберите курьера"); return; }
    if (selectedStops.length === 0) { setError("Добавьте хотя бы одну остановку"); return; }

    setSubmitting(true);
    try {
      const route = await createRoute({
        courier_id: courierId,
        label: label || undefined,
        order_ids: selectedStops.map((s) => s.order.id),
      });
      router.push(`/routes/${route.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Ошибка создания маршрута");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/routes">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-beige/40">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#2C365A] tracking-tight">Новый маршрут</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Выберите заказы и определите порядок остановок
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Settings + Order picker */}
          <div className="space-y-5">
            {/* Route settings */}
            <div className="bg-white/70 border border-beige/40 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-ocean">Настройки маршрута</h2>

              <div className="space-y-2">
                <Label htmlFor="route-label">Название рейса (необязательно)</Label>
                <Input
                  id="route-label"
                  placeholder="Например: Утренний рейс"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="rounded-xl border-beige focus:border-ocean"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="courier-select">Курьер *</Label>
                <select
                  id="courier-select"
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-beige bg-white text-sm focus:outline-none focus:border-ocean transition-colors"
                  disabled={couriersLoading}
                >
                  <option value="">Выберите курьера...</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `· ${c.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order picker */}
            <div className="bg-white/70 border border-beige/40 rounded-2xl p-5">
              <h2 className="font-bold text-ocean mb-3">
                Нераспределённые заказы
                {orders.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({orders.length} доступно)
                  </span>
                )}
              </h2>
              {ordersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-beige/30 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Нет доступных заказов для маршрута
                </p>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <OrderPickerRow
                      key={order.id}
                      order={order}
                      isSelected={selectedOrderIds.has(order.id)}
                      onToggle={() => toggleOrder(order)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Stop sequence */}
          <div className="space-y-5">
            <div className="bg-white/70 border border-beige/40 rounded-2xl p-5">
              <h2 className="font-bold text-ocean mb-3">
                Порядок остановок
                {selectedStops.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({selectedStops.length} выбрано)
                  </span>
                )}
              </h2>

              {selectedStops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-beige rounded-xl">
                  <Plus size={24} className="text-beige mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Выберите заказы слева, чтобы добавить остановки
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedStops.map((stop, index) => (
                    <StopSequenceItem
                      key={stop.order.id}
                      stop={stop}
                      index={index}
                      total={selectedStops.length}
                      onMoveUp={() => moveStop(index, "up")}
                      onMoveDown={() => moveStop(index, "down")}
                      onRemove={() => removeStop(stop.order.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting || selectedStops.length === 0 || !courierId}
              className="w-full bg-[#2C365A] text-[#EEE8DF] hover:bg-[#2C365A]/90 rounded-xl h-12 font-bold text-base shadow-lg transition-all active:scale-95 disabled:opacity-50 gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Создание маршрута...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Создать маршрут ({selectedStops.length} остановок)
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
