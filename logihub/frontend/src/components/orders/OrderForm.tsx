"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useCouriers } from "@/hooks/useCouriers";
import type { OrderCreate } from "@/types/order";

const orderSchema = z.object({
  product_id: z.string().min(1, "Выберите товар"),
  quantity: z.number().min(1, "Минимум 1"),
  sale_price_som: z.number().min(0, "Цена не может быть отрицательной"),
  courier_fee_som: z.number().min(0, "Комиссия не может быть отрицательной"),
  delivery_address: z.string().min(1, "Введите адрес"),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  courier_id: z.string().optional(),
  note: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  orderId?: string;
  onSuccess?: () => void;
  onSubmit: (data: OrderCreate) => Promise<void>;
}

export function OrderForm({ orderId, onSuccess, onSubmit }: OrderFormProps) {
  const { products } = useProducts();
  const { couriers } = useCouriers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: 1,
      sale_price_som: 0,
      courier_fee_som: 0,
    },
  });

  const onFormSubmit = async (values: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      // Clean up empty strings or "none" values
      const payload = {
        ...values,
        courier_id: values.courier_id === "none" ? undefined : values.courier_id,
        customer_name: values.customer_name || undefined,
        customer_phone: values.customer_phone || undefined,
        note: values.note || undefined,
      };
      await onSubmit(payload as OrderCreate);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to submit order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-w-2xl mx-auto p-8 bg-card rounded-3xl border border-border shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Товар</label>
          <Select onValueChange={(val) => setValue("product_id", val)}>
            <SelectTrigger className="w-full bg-cream/30 border-beige text-ocean h-11 rounded-xl">
              <SelectValue placeholder="Выберите товар" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title} ({p.stock_quantity} шт.)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.product_id && <p className="text-xs text-destructive ml-1">{errors.product_id.message}</p>}
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Количество</label>
          <Input
            type="number"
            {...register("quantity", { valueAsNumber: true })}
            className="bg-cream/30 border-beige text-ocean h-11 rounded-xl"
          />
          {errors.quantity && <p className="text-xs text-destructive ml-1">{errors.quantity.message}</p>}
        </div>

        {/* Sale Price */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Цена продажи (сом)</label>
          <Input
            type="number"
            {...register("sale_price_som", { valueAsNumber: true })}
            className="bg-cream/30 border-beige text-ocean h-11 rounded-xl"
          />
          {errors.sale_price_som && <p className="text-xs text-destructive ml-1">{errors.sale_price_som.message}</p>}
        </div>

        {/* Courier Fee */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Оплата курьеру (сом)</label>
          <Input
            type="number"
            {...register("courier_fee_som", { valueAsNumber: true })}
            className="bg-cream/30 border-beige text-ocean h-11 rounded-xl"
          />
          {errors.courier_fee_som && <p className="text-xs text-destructive ml-1">{errors.courier_fee_som.message}</p>}
        </div>

        {/* Customer Info */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Имя клиента</label>
          <Input
            {...register("customer_name")}
            placeholder="Иван Иванов"
            className="bg-cream/30 border-beige text-ocean h-11 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Телефон клиента</label>
          <Input
            {...register("customer_phone")}
            placeholder="+996 ..."
            className="bg-cream/30 border-beige text-ocean h-11 rounded-xl"
          />
        </div>

        {/* Address */}
        <div className="col-span-full space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Адрес доставки</label>
          <Input
            {...register("delivery_address")}
            placeholder="Улица, дом, кв..."
            className="bg-cream/30 border-beige text-ocean h-11 rounded-xl"
          />
          {errors.delivery_address && <p className="text-xs text-destructive ml-1">{errors.delivery_address.message}</p>}
        </div>

        {/* Note */}
        <div className="col-span-full space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Примечание</label>
          <Input
            {...register("note")}
            placeholder="Комментарий к заказу..."
            className="bg-cream/30 border-beige text-ocean h-11 rounded-xl"
          />
        </div>

        {/* Courier Assignment (Optional at creation) */}
        <div className="col-span-full space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Назначить курьера (необязательно)</label>
          <Select onValueChange={(val) => setValue("courier_id", val)}>
            <SelectTrigger className="w-full bg-cream/30 border-beige text-ocean h-11 rounded-xl">
              <SelectValue placeholder="Выберите курьера" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="none">Без курьера</SelectItem>
              {couriers.filter(c => c.is_active).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-6 flex justify-center">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-ocean text-cream hover:bg-ocean/90 px-12 py-7 h-auto text-xl font-semibold rounded-2xl transition-all active:scale-95 shadow-xl shadow-ocean/20 w-full sm:w-auto"
        >
          {isSubmitting ? "Создание..." : orderId ? "Сохранить изменения" : "Оформить заказ"}
        </Button>
      </div>
    </form>
  );
}
