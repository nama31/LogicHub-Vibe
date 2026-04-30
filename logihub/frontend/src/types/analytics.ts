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
