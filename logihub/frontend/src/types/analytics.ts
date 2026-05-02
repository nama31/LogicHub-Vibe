export interface DayBreakdown {
  date: string;
  orders: number;
  revenue_som: number;
  cost_som: number;
  courier_fees_som: number;
  profit_som: number;
}

export interface ProfitOut {
  period: { from: string; to: string };
  total_profit_som: number;
  breakdown: DayBreakdown[];
}

export interface OpenOrderCounts {
  new: number;
  assigned: number;
  in_transit: number;
}

export interface StockAlert {
  product_id: string;
  title: string;
  stock_quantity: number;
}

export interface Summary {
  today: {
    orders_created: number;
    orders_delivered: number;
    net_profit_som: number;
  };
  this_week: {
    orders_created: number;
    orders_delivered: number;
    net_profit_som: number;
  };
  stock_alerts: StockAlert[];
  open_orders: OpenOrderCounts;
}

export interface CourierStat {
  courier_id: string;
  name: string;
  routes_count: number;
  stops_total: number;
  stops_delivered: number;
  stops_failed: number;
  total_fee_som: number;
}

export interface ProductMargin {
  product_id: string;
  title: string;
  total_sold: number;
  revenue_som: number;
  cost_som: number;
  profit_som: number;
  margin_percentage: number;
}

export interface TrendItem {
  date: string;
  orders_count: number;
  profit_som: number;
}

export interface FailedReason {
  reason: string;
  count: number;
}
