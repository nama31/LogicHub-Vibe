"use client";

import { OrderTable } from "@/components/orders/OrderTable";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ocean tracking-tight">Заказы</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Управление доставками и отслеживание прибыли.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              try {
                await exportOrders();
                toast.success("Экспорт успешно завершен");
              } catch {
                toast.error("Ошибка при экспорте заказов");
              }
            }}
            variant="outline"
            className="h-11 px-4"
          >
            Экспорт CSV
          </Button>
          <Button
            onClick={() => router.push("/orders/new")}
            className="h-11 px-6"
          >
            <Plus className="mr-2 size-5" /> Новый заказ
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center rounded-2xl border border-beige bg-card p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ID или адресу..."
            className="pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 min-w-[160px] cursor-pointer rounded-xl border border-beige bg-background px-4 font-semibold text-ocean outline-none focus:border-ocean focus:ring-3 focus:ring-ocean/20"
          >
            <option value="" className="bg-cream">Все статусы</option>
            <option value="pending" className="bg-cream">На проверке</option>
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
