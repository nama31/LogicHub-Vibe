export type UserRole = "admin" | "courier" | "client";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  tg_id?: number | null;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface UserCreate {
  name: string;
  role: UserRole;
  tg_id?: number;
  phone?: string;
}

export interface UserUpdate {
  name?: string;
  phone?: string;
  is_active?: boolean;
}
