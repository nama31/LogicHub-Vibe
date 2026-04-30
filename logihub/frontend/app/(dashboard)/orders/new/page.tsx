"use client";

import { OrderForm } from "@/components/orders/OrderForm";
import { useOrders } from "@/hooks/useOrders";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const { createOrder } = useOrders();
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/orders");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-ocean">Новый заказ</h1>
        <p className="text-muted-foreground">Оформите новый заказ, и система автоматически уменьшит остаток на складе.</p>
      </div>
      
      <OrderForm onSubmit={createOrder} onSuccess={handleSuccess} />
    </div>
  );
}
