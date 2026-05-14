# LogiHub — Master AI Context & Architecture Guidelines

## 1. Project Identity & Stack
LogiHub is a micro-CRM and dispatch management system for a middle-tier distributor[cite: 1]. 
*   **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.x (async), Alembic, PostgreSQL 15[cite: 1].
*   **Frontend:** Next.js 14 (App Router), TypeScript, shadcn/ui, TailwindCSS[cite: 1].
*   **Bot:** aiogram 3.x (Telegram)[cite: 1].
*   **Auth:** JWT (HS256) for Admin web panel; `tg_id` verification for couriers via Bot[cite: 1].

## 2. Global Business Rules (CRITICAL)
*   **Money:** All monetary values (purchase_price, sale_price, courier_fee) MUST be stored as integers in `tiyins` (1 сом = 10,000 тыйын) in the database to prevent float precision bugs[cite: 3].
*   **Data Integrity:** NO CASCADE deletes. Products and users are never hard-deleted; use `is_active = false`[cite: 1].
*   **Profit Formula:** Net Profit = (Sale Price to Customer) - (Purchase Price from Head Company) - (Courier Fee)[cite: 1].
*   **Single Responsibility:** When generating code, strictly isolate changes to the requested domain. Do not modify adjacent routers or components unless explicitly instructed[cite: 3].

## 3. Database Schema (4 Core Tables)
The system uses the following schema[cite: 1]. Do not hallucinate additional tables without permission.

*   `users`: id (UUID), name (TEXT), role ('admin' | 'courier'), tg_id (BIGINT, UNIQUE), password_hash, phone, is_active (BOOL)[cite: 1].
*   `products`: id (UUID), title (TEXT), purchase_price (INT, tiyins), stock_quantity (INT), unit (TEXT)[cite: 1].
*   `orders`: id (UUID), product_id (FK), courier_id (FK, nullable), quantity (INT), sale_price (INT, tiyins), courier_fee (INT, tiyins), customer_name, customer_phone, delivery_address, status, note[cite: 1].
*   `order_status_log`: id (UUID), order_id (FK), changed_by (FK), old_status, new_status, changed_at[cite: 1].

## 4. State Machines & Statuses
*   **Valid Order Statuses:** `new`, `assigned`, `in_transit`, `delivered`, `failed`[cite: 1].
*   **Allowed Transitions:**
    *   `new` -> `assigned`, `deleted`[cite: 1]
    *   `assigned` -> `in_transit`, `new`[cite: 1]
    *   `in_transit` -> `delivered`, `failed`[cite: 1]
*   **Side Effects:** ANY change to an order status MUST append a record to `order_status_log`[cite: 1]. Creating an order MUST decrement `products.stock_quantity`[cite: 1].

## 5. Frontend Design System (Strict Palette)
All UI components in Next.js must strictly use the following color palette. Do not use generic tailwind colors (like `bg-blue-500` or `text-gray-900`) unless mapping to these exact hex values[cite: 2]:
*   **Cream:** `#EEE8DF` — App background, light underlays[cite: 2].
*   **Beige:** `#C4BCB0` — Secondary elements, borders, inactive states[cite: 2].
*   **Deep Ocean:** `#2C365A` — Text, accents, primary buttons, active states[cite: 2].
*   **Vibe:** Premium, modern, welcoming, and easy to use (rounded corners, soft shadows)[cite: 2].

## 6. API Surface Area (Reference)
The backend exposes 18 endpoints[cite: 1]. Adhere to standard REST patterns:
*   `/auth/*`: Login (`tg_id` or `password`) and session validation[cite: 1].
*   `/products/*`: Inventory CRUD. `GET` accepts `low_stock` and `search` queries[cite: 1].
*   `/orders/*`: Order management. Includes specific `POST /orders/:id/assign` for dispatch[cite: 1].
*   `/users/*`: Admin management of courier accounts[cite: 1].
*   `/analytics/*`: Dashboard data (`/summary` and `/profit`)[cite: 1].
*   `/bot/*`: Webhook and internal bot status update endpoints (protected by `X-Bot-Secret`)[cite: 1].