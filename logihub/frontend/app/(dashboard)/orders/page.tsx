"use client";

import { OrderTable } from "@/components/orders/OrderTable";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { AssignModal } from "@/components/orders/AssignModal";
import { useState } from "react";
import type { Order } from "@/types/order";

export default function OrdersPage() {
  const { orders, loading, refetch } = useOrders();
  const router = useRouter();
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);

  return (
    <div className="space-y-8 p-1 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-ocean tracking-tight">Заказы</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Управление доставками и отслеживание прибыли.</p>
        </div>
        <Button 
          onClick={() => router.push("/orders/new")}
          className="bg-ocean text-cream hover:bg-ocean/90 h-12 px-6 rounded-xl font-bold shadow-lg shadow-ocean/20 transition-all active:scale-95"
        >
          <Plus className="mr-2 size-5" /> Новый заказ
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по ID или адресу..." 
            className="pl-11 h-12 bg-card border-beige rounded-xl focus-visible:ring-ocean/10"
          />
        </div>
        <Button variant="outline" className="h-12 border-beige rounded-xl text-ocean px-6 font-semibold hover:bg-beige/20 w-full sm:w-auto">
          <Filter className="mr-2 size-4" /> Фильтры
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 w-full bg-beige/5 animate-pulse rounded-2xl border border-beige/10" />
          ))}
        </div>
      ) : (
        <OrderTable 
          orders={orders} 
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
