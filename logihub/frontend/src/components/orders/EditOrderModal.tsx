"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderForm } from "./OrderForm";
import { useOrders } from "@/hooks/useOrders";
import { toast } from "sonner";
import type { Order } from "@/types/order";

interface EditOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  approveAfterUpdate?: boolean;
}

export function EditOrderModal({ order, isOpen, onClose, onUpdated, approveAfterUpdate }: EditOrderModalProps) {
  const { updateOrder } = useOrders();

  const handleUpdate = async (values: any) => {
    try {
      // If we are approving, we also change the status to "new"
      const payload = {
        ...values,
        ...(approveAfterUpdate ? { status: "new" as const } : {}),
      };

      await updateOrder(order.id, payload);
      toast.success(approveAfterUpdate ? "Заказ одобрен" : "Заказ обновлен");
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error("Ошибка при обновлении заказа");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] border-beige bg-cream p-0 shadow-2xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-3xl font-black text-ocean tracking-tight">
            {approveAfterUpdate ? "Одобрение заказа" : "Редактирование заказа"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 sm:p-8">
            <OrderForm 
                orderId={String(order.id)}
                initialData={{
                    product_id: order.product?.id,
                    quantity: order.quantity,
                    sale_price_som: order.sale_price_som,
                    courier_fee_som: order.courier_fee_som,
                    courier_id: order.courier?.id || "none",
                    customer_name: order.customer_name || "",
                    customer_phone: order.customer_phone || "",
                    delivery_address: order.delivery_address,
                    note: order.note || "",
                }}
                onSubmit={handleUpdate}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
