"use client";
/* eslint-disable react-hooks/incompatible-library */

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
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useUsers } from "@/hooks/useUsers";
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
  initialData?: Partial<OrderFormValues>;
  onSuccess?: () => void;
  onSubmit: (data: OrderCreate) => Promise<unknown>;
}

export function OrderForm({ orderId, initialData, onSuccess, onSubmit }: OrderFormProps) {
  const { products } = useProducts();
  const { users: couriers } = useUsers({ role: "courier" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      product_id: initialData?.product_id || "",
      quantity: initialData?.quantity || 1,
      sale_price_som: initialData?.sale_price_som || 0,
      courier_fee_som: initialData?.courier_fee_som || 0,
      courier_id: initialData?.courier_id || "none",
      customer_name: initialData?.customer_name || "",
      customer_phone: initialData?.customer_phone || "",
      delivery_address: initialData?.delivery_address || "",
      note: initialData?.note || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        product_id: initialData.product_id || "",
        quantity: initialData.quantity || 1,
        sale_price_som: initialData.sale_price_som || 0,
        courier_fee_som: initialData.courier_fee_som || 0,
        courier_id: initialData.courier_id || "none",
        customer_name: initialData.customer_name || "",
        customer_phone: initialData.customer_phone || "",
        delivery_address: initialData.delivery_address || "",
        note: initialData.note || "",
      });
    }
  }, [initialData, reset]);

  const selectedProductId = watch("product_id");
  const selectedCourierId = watch("courier_id");

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedCourier = couriers.filter((courier) => courier.is_active).find((courier) => courier.id === selectedCourierId);

  // Auto-populate sale price when product is selected
  useEffect(() => {
    if (selectedProduct && !orderId) {
      setValue("sale_price_som", selectedProduct.selling_price_som, { shouldValidate: true });
    }
  }, [selectedProduct, orderId, setValue]);

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
    <form onSubmit={handleSubmit(onFormSubmit)} className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Товар</label>
          <Select
            value={selectedProductId}
            onValueChange={(val) => setValue("product_id", val as string, { shouldDirty: true, shouldValidate: true })}
          >
            <SelectTrigger className="w-full text-ocean">
              <span className="truncate">
                {selectedProduct ? selectedProduct.title : "Выберите товар"}
              </span>
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
            className="text-ocean"
          />
          {errors.quantity && <p className="text-xs text-destructive ml-1">{errors.quantity.message}</p>}
        </div>

        {/* Sale Price */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Цена продажи (сом)</label>
          <Input
            type="number"
            {...register("sale_price_som", { valueAsNumber: true })}
            className="text-ocean"
          />
          {errors.sale_price_som && <p className="text-xs text-destructive ml-1">{errors.sale_price_som.message}</p>}
        </div>

        {/* Courier Fee */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Оплата курьеру (сом)</label>
          <Input
            type="number"
            {...register("courier_fee_som", { valueAsNumber: true })}
            className="text-ocean"
          />
          {errors.courier_fee_som && <p className="text-xs text-destructive ml-1">{errors.courier_fee_som.message}</p>}
        </div>

        {/* Customer Info */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Имя клиента</label>
          <Input
            {...register("customer_name")}
            placeholder="Иван Иванов"
            className="text-ocean"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Телефон клиента</label>
          <Input
            {...register("customer_phone")}
            placeholder="+996 ..."
            className="text-ocean"
          />
        </div>

        {/* Address */}
        <div className="col-span-full space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Адрес доставки</label>
          <Input
            {...register("delivery_address")}
            placeholder="Улица, дом, кв..."
            className="text-ocean"
          />
          {errors.delivery_address && <p className="text-xs text-destructive ml-1">{errors.delivery_address.message}</p>}
        </div>

        {/* Note */}
        <div className="col-span-full space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Примечание</label>
          <Input
            {...register("note")}
            placeholder="Комментарий к заказу..."
            className="text-ocean"
          />
        </div>

        {/* Courier Assignment (Optional at creation) */}
        <div className="col-span-full space-y-2">
          <label className="text-sm font-medium text-ocean ml-1">Назначить курьера (необязательно)</label>
          <Select
            value={selectedCourierId}
            onValueChange={(val) => setValue("courier_id", val as string, { shouldDirty: true, shouldValidate: true })}
          >
            <SelectTrigger className="w-full text-ocean">
              <span className="truncate">
                {selectedCourierId === "none"
                  ? "Без курьера"
                  : selectedCourier?.name ?? "Выберите курьера"}
              </span>
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

      <div className="flex justify-end border-t border-beige pt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-8 sm:w-auto"
        >
          {isSubmitting ? "Создание..." : orderId ? "Сохранить изменения" : "Оформить заказ"}
        </Button>
      </div>
    </form>
  );
}
