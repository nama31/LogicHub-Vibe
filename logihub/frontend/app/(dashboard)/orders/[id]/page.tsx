"use client";

import { useOrder } from "@/hooks/useOrders";
import { StatusTimeline } from "@/components/orders/StatusTimeline";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS_RU } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Phone, User, Package, Calendar, Info, Clock } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { AssignModal } from "@/components/orders/AssignModal";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { useState } from "react";
import { toast } from "sonner";
import { useOrders } from "@/hooks/useOrders";

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string };
  const { order, timeline, loading, refetch } = useOrder(id);
  const { updateOrder } = useOrders();
  const router = useRouter();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);

  const handleReject = async () => {
    if (!confirm("Вы уверены, что хотите отклонить этот заказ?")) return;
    try {
      await updateOrder(id, { status: "failed" });
      toast.success("Заказ отклонен");
      refetch();
    } catch (err) {
      toast.error("Ошибка при отклонении заказа");
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-10 w-48 bg-beige/20 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="h-64 bg-beige/10 rounded-2xl" />
            <div className="h-24 bg-beige/10 rounded-2xl" />
          </div>
          <div className="h-96 bg-beige/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-ocean">Заказ не найден</h2>
        <Button variant="outline" onClick={() => router.push("/orders")} className="rounded-xl border-beige text-ocean">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/orders")} className="rounded-full hover:bg-beige/30 size-11">
            <ArrowLeft className="size-6 text-ocean" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-ocean">Заказ #{order.id}</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
              <Calendar className="size-4" />
              {new Date(order.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {order.status === "pending" && (
            <>
              <Button
                onClick={() => setIsApproveOpen(true)}
                className="bg-ocean text-cream hover:bg-ocean/90 rounded-xl px-6 h-11 font-semibold shadow-lg shadow-ocean/10"
              >
                Проверить и одобрить
              </Button>
              <Button
                onClick={handleReject}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 rounded-xl px-6 h-11 font-semibold"
              >
                Отклонить
              </Button>
            </>
          )}
          {(order.status === "new" || order.status === "assigned") && (
            <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(true)}
                  className="border-beige text-ocean hover:bg-beige/20 rounded-xl px-6 h-11 font-semibold"
                >
                  Редактировать
                </Button>
                <Button
                  onClick={() => setIsAssignOpen(true)}
                  className="bg-ocean text-cream hover:bg-ocean/90 rounded-xl px-6 h-11 font-semibold transition-all active:scale-95 shadow-lg shadow-ocean/10"
                >
                  {order.courier ? "Переназначить" : "Назначить курьера"}
                </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Details Card */}
          <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="bg-beige/10 px-8 py-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-ocean flex items-center gap-2">
                <Package className="size-5" /> Детали заказа
              </h3>
              <Badge className={
                order.status === "pending" 
                  ? "bg-yellow-100 text-yellow-800 border-none px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  : "bg-ocean text-cream border-none px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              }>
                {STATUS_LABELS_RU[order.status] || order.status}
              </Badge>
            </div>

            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-ocean/5 p-3 rounded-2xl">
                    <Info className="size-5 text-ocean" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-1">Товар</p>
                    <p className="font-bold text-ocean text-xl leading-tight">{order.product?.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 bg-beige/20 inline-block px-2 py-0.5 rounded-md">
                      Кол-во: <span className="font-bold text-ocean">{order.quantity} шт.</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-ocean/5 p-3 rounded-2xl">
                    <User className="size-5 text-ocean" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-1">Клиент</p>
                    <p className="font-bold text-ocean text-lg">{order.customer_name || "Имя не указано"}</p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Phone className="size-3.5 text-ocean/60" /> {order.customer_phone || "Телефон не указан"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-ocean/5 p-3 rounded-2xl">
                    <MapPin className="size-5 text-ocean" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-1">Адрес доставки</p>
                    <p className="font-bold text-ocean leading-relaxed text-lg">{order.delivery_address}</p>
                  </div>
                </div>

                <div className="bg-cream/40 p-5 rounded-[2rem] space-y-3 border border-beige/30">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Сумма продажи:</span>
                    <span className="font-bold text-ocean text-base">{order.sale_price_som} сом</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Оплата курьеру:</span>
                    <span className="text-ocean/70 font-medium">{order.courier_fee_som} сом</span>
                  </div>
                  <div className="pt-3 mt-1 border-t border-beige/40 flex justify-between items-baseline">
                    <span className="font-black text-ocean text-xs uppercase tracking-wider">Чистая прибыль:</span>
                    <span className="font-black text-ocean text-2xl tracking-tighter">{order.net_profit_som} сом</span>
                  </div>
                </div>
              </div>

              {order.status === "failed" && order.note && (
                <div className="col-span-full bg-cream border-2 border-beige p-5 rounded-2xl shadow-sm">
                   <p className="text-[10px] text-ocean uppercase font-black tracking-widest mb-2">Problem Report / Причина недоставки</p>
                   <p className="text-ocean font-medium leading-relaxed">{order.note}</p>
                </div>
              )}
              {order.status !== "failed" && order.note && (
                <div className="col-span-full bg-muted/30 p-5 rounded-2xl border-l-4 border-ocean/40 shadow-inner">
                   <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-2">Примечание</p>
                   <p className="text-ocean/80 italic leading-relaxed">"{order.note}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Courier Card */}
          <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-ocean text-cream p-4 rounded-2xl shadow-lg shadow-ocean/20">
                <User className="size-7" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-0.5">Ответственный курьер</p>
                <p className="text-2xl font-black text-ocean tracking-tight">
                  {order.courier?.name || "Не назначен"}
                </p>
              </div>
            </div>
            {!order.courier ? (
              <Button onClick={() => setIsAssignOpen(true)} className="rounded-xl bg-ocean text-cream hover:bg-ocean/90 h-12 px-6 font-bold w-full sm:w-auto">
                Назначить сейчас
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsAssignOpen(true)} className="rounded-xl border-beige text-ocean hover:bg-beige/10 h-12 px-6 font-semibold w-full sm:w-auto">
                Изменить курьера
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-2xl font-black text-ocean mb-10 flex items-center gap-3 tracking-tight">
              <Clock className="size-6" /> История
            </h3>
            <StatusTimeline entries={timeline} />
          </div>
        </div>
      </div>

      <AssignModal
        orderId={order.id}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssigned={refetch}
      />

      <EditOrderModal
        order={order}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onUpdated={refetch}
      />

      <EditOrderModal
        order={order}
        isOpen={isApproveOpen}
        approveAfterUpdate
        onClose={() => setIsApproveOpen(false)}
        onUpdated={refetch}
      />
    </div>
  );
}
