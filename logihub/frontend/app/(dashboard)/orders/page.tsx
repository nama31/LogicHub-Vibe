"use client";

import { OrderTable } from "@/components/orders/OrderTable";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { AssignModal } from "@/components/orders/AssignModal";
import { useState } from "react";
import { toast } from "sonner";
import type { Order } from "@/types/order";

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { orders, loading, refetch, exportOrders } = useOrders({ status: statusFilter || undefined });
  const router = useRouter();
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      order.customer_name?.toLowerCase().includes(query) ||
      order.delivery_address.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 p-1 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-ocean tracking-tight">Заказы</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Управление доставками и отслеживание прибыли.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              try {
                await exportOrders();
                toast.success("Экспорт успешно завершен");
              } catch (err) {
                toast.error("Ошибка при экспорте заказов");
              }
            }}
            variant="outline"
            className="border-beige text-ocean hover:bg-beige/20 h-12 px-4 rounded-xl font-semibold transition-all active:scale-95"
          >
            Экспорт CSV
          </Button>
          <Button
            onClick={() => router.push("/orders/new")}
            className="bg-ocean text-cream hover:bg-ocean/90 h-12 px-6 rounded-xl font-bold shadow-lg shadow-ocean/20 transition-all active:scale-95"
          >
            <Plus className="mr-2 size-5" /> Новый заказ
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ID или адресу..."
            className="pl-11 h-12 bg-card border-beige rounded-xl focus-visible:ring-ocean/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 border border-beige bg-cream rounded-xl px-4 text-ocean font-semibold focus:ring-ocean/10 outline-none cursor-pointer min-w-[140px]"
          >
            <option value="" className="bg-cream">Все статусы</option>
            <option value="new" className="bg-cream">Новые</option>
            <option value="assigned" className="bg-cream">Назначены</option>
            <option value="in_transit" className="bg-cream">В пути</option>
            <option value="delivered" className="bg-cream">Доставлены</option>
            <option value="failed" className="bg-cream">Ошибка</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 w-full bg-beige/5 animate-pulse rounded-2xl border border-beige/10" />
          ))}
        </div>
      ) : (
        <OrderTable
          orders={filteredOrders}
          onAssign={(order) => setAssignOrder(order)}
        />
      )}

      {assignOrder && (
        <AssignModal
          isOpen={!!assignOrder}
          orderId={assignOrder.id}
          onClose={() => setAssignOrder(null)}
          onAssigned={refetch}
        />
      )}
    </div>
  );
}
