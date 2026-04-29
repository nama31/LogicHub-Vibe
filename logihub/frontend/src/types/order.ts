export type OrderStatus = "new" | "assigned" | "in_transit" | "delivered" | "failed";

export interface Order {
  id: string;
  product: { id: string; title: string };
  courier?: { id: string; name: string } | null;
  quantity: number;
  sale_price_som: number;
  courier_fee_som: number;
  net_profit_som: number;
  delivery_address: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: OrderStatus;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCreate {
  product_id: string;
  quantity: number;
  sale_price_som: number;
  courier_fee_som: number;
  delivery_address: string;
  customer_name?: string;
  customer_phone?: string;
  courier_id?: string;
  note?: string;
}

export interface OrderUpdate {
  delivery_address?: string;
  note?: string;
  courier_fee_som?: number;
}

export interface OrderListOut {
  total: number;
  count: number;
  orders: Order[];
}
