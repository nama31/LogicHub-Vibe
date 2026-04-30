export interface Product {
  id: string;
  title: string;
  /** Stored in tiyins on the server; returned as computed field */
  purchase_price_som: number;
  stock_quantity: number;
  unit: string;
  created_at: string;
}

export interface ProductCreate {
  title: string;
  purchase_price_som: number;
  stock_quantity: number;
  unit: string;
}

export type ProductUpdate = Partial<ProductCreate>;
