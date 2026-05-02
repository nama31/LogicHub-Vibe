// Route type definitions

export type RouteStatus = "draft" | "active" | "completed" | "cancelled";

export interface RouteCourier {
  id: string;
  name: string;
  tg_id?: number | null;
  phone?: string | null;
}

export interface Stop {
  id: number;
  stop_sequence: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address: string;
  product_title?: string | null;
  quantity: number;
  status: string;
  note?: string | null;
}

export interface Route {
  id: string;
  label?: string | null;
  status: RouteStatus;
  courier?: RouteCourier | null;
  created_by: string;
  stops: Stop[];
  stops_total: number;
  stops_delivered: number;
  stops_failed: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface RouteListItem {
  id: string;
  label?: string | null;
  status: RouteStatus;
  courier?: RouteCourier | null;
  stops_total: number;
  stops_delivered: number;
  stops_failed: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface RouteListResponse {
  total: number;
  routes: RouteListItem[];
}

export interface RouteCreate {
  courier_id: string;
  label?: string;
  order_ids: number[];
}

export interface RouteUpdate {
  label?: string;
  courier_id?: string;
}
