# LogiHub — Full Project Architecture

## Table of Contents

1. Project Overview
2. System Architecture Diagram
3. Tech Stack
4. Database Schema (4 tables)
5. Backend API — Endpoint Index (18 endpoints)
6. Auth Endpoints
7. Product (Inventory) Endpoints
8. Order Endpoints
9. User / Courier Endpoints
10. Analytics Endpoints
11. Telegram Bot — Command & Flow Map
12. Frontend (Next.js) — Page Map
13. Error Response Format
14. Enums and Constants
15. Docker Deployment Structure
16. Implementation Notes

---

## 1. Project Overview

**LogiHub** is a micro-CRM and dispatch management system for a middle-tier distributor who operates between a head supply company and end customers.

**Three actors in the system:**

| Actor | Interface | Role |
|---|---|---|
| **Admin (Manager)** | Next.js Web App | Creates orders, manages inventory, tracks profit, assigns couriers |
| **Courier** | Telegram Bot | Picks up orders, updates delivery statuses, no access to finances |
| **End Customer** | (No interface) | Receives optional SMS/WhatsApp notification when order is dispatched |

**Core problem solved:** The admin currently acts as a human router — manually dispatching orders via messenger, calculating profits in Excel, and tracking couriers by phone. LogiHub automates all of that.

**Profit formula (automated by the system):**
```
Net Profit = (Sale Price to Customer) - (Purchase Price from Head Company) - (Courier Fee)
```

---

## 2. System Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                        │
│                                                            │
│   ┌──────────────────────┐    ┌────────────────────────┐   │
│   │  Next.js Web Admin   │    │    Telegram Bot        │   │
│   │  (Manager / Admin)   │    │    (Couriers)          │   │
│   └──────────┬───────────┘    └───────────┬────────────┘   │
└──────────────┼────────────────────────────┼────────────────┘
               │ REST (JSON)                │ Webhook / Polling
               ▼                            ▼
┌────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                         │
│                                                            │
│              FastAPI Application (Python)                  │
│         ┌──────────┬──────────┬──────────┐                 │
│         │  Auth    │  Orders  │ Analytics│                 │
│         │  Router  │  Router  │  Router  │                 │
│         └──────────┴──────────┴──────────┘                 │
│                        │                                   │
│              SQLAlchemy ORM + Alembic Migrations           │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                      DATA LAYER                            │
│                                                            │
│                  PostgreSQL Database                       │
│         users │ products │ orders │ order_status_log       │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Backend** | Python 3.11 + FastAPI | Async, auto-generates Swagger docs |
| **ORM** | SQLAlchemy 2.x (async) | Declarative models |
| **Migrations** | Alembic | Version-controlled schema changes |
| **Database** | PostgreSQL 15 | Prices stored as integers (tiyins) |
| **Auth** | JWT (HS256) + bcrypt | 7-day tokens for admin; bot uses `tg_id` |
| **Frontend** | Next.js 14 (App Router) | TypeScript |
| **UI Components** | shadcn/ui + TailwindCSS | Radix primitives |
| **Telegram Bot** | aiogram 3.x | Async, webhook-based in production |
| **Containerization** | Docker + Docker Compose | One command deploy |
| **Env config** | python-dotenv + `.env` | Never committed to git |

---

## 4. Database Schema

### Table: `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `name` | TEXT | NOT NULL | 2–100 chars |
| `role` | TEXT | NOT NULL | `'admin'` \| `'courier'` |
| `tg_id` | BIGINT | UNIQUE, NULLABLE | Telegram user ID; required for couriers |
| `password_hash` | TEXT | NULLABLE | Only for admin (web login); couriers use tg_id |
| `phone` | TEXT | NULLABLE | For display purposes |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft-disable without deleting |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

**Indexes:** unique on `tg_id` (partial, where NOT NULL).

---

### Table: `products`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `title` | TEXT | NOT NULL | Product name |
| `purchase_price` | INTEGER | NOT NULL | In tiyins (e.g. 5000000 = 500 сом). ≥ 0 |
| `stock_quantity` | INTEGER | NOT NULL, DEFAULT 0 | Current units in stock. ≥ 0 |
| `unit` | TEXT | NOT NULL, DEFAULT `'шт'` | e.g. шт, кг, л |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Auto-updated on write |

---

### Table: `orders`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `product_id` | UUID | NOT NULL, FK → products(id) | No CASCADE |
| `courier_id` | UUID | NULLABLE, FK → users(id) | Assigned courier; nullable until assigned |
| `quantity` | INTEGER | NOT NULL | > 0 |
| `sale_price` | INTEGER | NOT NULL | Price charged to customer (tiyins) |
| `courier_fee` | INTEGER | NOT NULL, DEFAULT 0 | Courier's payout (tiyins) |
| `customer_name` | TEXT | NULLABLE | For display |
| `customer_phone` | TEXT | NULLABLE | For optional notification |
| `delivery_address` | TEXT | NOT NULL | |
| `status` | TEXT | NOT NULL, DEFAULT `'new'` | See Status Enum |
| `note` | TEXT | NULLABLE | Admin's internal note |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

**Computed (not stored):**
```
net_profit = (sale_price - purchase_price) * quantity - courier_fee
```

**Indexes:**
- `(courier_id, status)` — courier's active orders
- `(status, created_at DESC)` — admin order list

---

### Table: `order_status_log`

Append-only audit trail for every status change.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `order_id` | UUID | NOT NULL, FK → orders(id) | |
| `changed_by` | UUID | NOT NULL, FK → users(id) | Who triggered the change |
| `old_status` | TEXT | NULLABLE | NULL for initial creation |
| `new_status` | TEXT | NOT NULL | |
| `changed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

**Indexes:** `(order_id, changed_at DESC)` — order timeline.

---

### Schema Diagram

```
users
  └─< orders (as courier_id)
        └─< order_status_log

products
  └─< orders (as product_id)
```

**No CASCADE deletes.** Products and users are never hard-deleted; use `is_active = false` or soft-disable.

---

## 5. Backend API — Endpoint Index

### Public (no auth)
| # | Method | Path |
|---|---|---|
| 1 | POST | `/auth/login` |
| 2 | POST | `/bot/webhook` |

### Protected — Admin only (JWT required, role = admin)
| # | Method | Path |
|---|---|---|
| 3 | GET | `/auth/me` |
| 4 | GET | `/products` |
| 5 | POST | `/products` |
| 6 | PATCH | `/products/:id` |
| 7 | DELETE | `/products/:id` |
| 8 | GET | `/orders` |
| 9 | POST | `/orders` |
| 10 | PATCH | `/orders/:id` |
| 11 | DELETE | `/orders/:id` |
| 12 | POST | `/orders/:id/assign` |
| 13 | GET | `/users` |
| 14 | POST | `/users` |
| 15 | PATCH | `/users/:id` |
| 16 | GET | `/analytics/summary` |
| 17 | GET | `/analytics/profit` |

### Internal — Bot only (shared secret header)
| # | Method | Path |
|---|---|---|
| 18 | PATCH | `/bot/orders/:id/status` |

> **Bot auth:** Telegram bot authenticates with `X-Bot-Secret: <BOT_SECRET>` header (env variable). This is NOT a JWT — it's a shared secret known only to the bot service.

---

## 6. Auth Endpoints

### 6.1 `POST /auth/login`

Web admin login. Returns a JWT.

**Auth:** None

**Request:**
```json
{
  "tg_id": 123456789
}
```

> Admin can also log in via Telegram by sharing their `tg_id` if they choose not to use a password. Alternatively:

```json
{
  "password": "secret1234"
}
```

Backend accepts either. At least one must be present and match a user with `role = 'admin'`.

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Акмат",
    "role": "admin"
  },
  "token": "eyJhbGci..."
}
```

**Errors:**
- `401` invalid credentials
- `403` user not active (`is_active = false`)

---

### 6.2 `GET /auth/me`

Validate current session, return user object.

**Auth:** Required (JWT)

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Акмат",
    "role": "admin",
    "created_at": "2026-04-24T14:35:22Z"
  }
}
```

---

## 7. Product (Inventory) Endpoints

### 7.1 `GET /products`

**Auth:** Admin JWT

**Query params (all optional):**

| Param | Type | Notes |
|---|---|---|
| `low_stock` | boolean | If `true`, return only products with `stock_quantity < 5` |
| `search` | string | Substring match on `title` |

**Response 200:**
```json
{
  "products": [
    {
      "id": "uuid",
      "title": "Продукт А",
      "purchase_price": 5000000,
      "purchase_price_som": 500.00,
      "stock_quantity": 24,
      "unit": "шт",
      "created_at": "2026-04-24T14:35:22Z"
    }
  ]
}
```

> `purchase_price_som` is a computed field: `purchase_price / 10000`. Never stored.

---

### 7.2 `POST /products`

**Auth:** Admin JWT

**Request:**
```json
{
  "title": "Продукт А",
  "purchase_price_som": 500.00,
  "stock_quantity": 24,
  "unit": "шт"
}
```

**Validation:**
- `title`: 1–200 chars
- `purchase_price_som`: float ≥ 0
- `stock_quantity`: integer ≥ 0
- `unit`: 1–20 chars

**Response 201:** Full product object (same as GET item).

---

### 7.3 `PATCH /products/:id`

Partial update. Same validation as POST; all fields optional.

Used for:
- Adjusting stock after receiving shipment from head company
- Correcting purchase price

**Response 200:** Updated product object.

---

### 7.4 `DELETE /products/:id`

Cannot delete a product that has open (non-completed) orders. Returns `409` in that case.

**Response 204:** No Content.

---

## 8. Order Endpoints

### 8.1 `GET /orders`

**Auth:** Admin JWT

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `status` | string | — | Filter by status |
| `courier_id` | UUID | — | Filter by assigned courier |
| `from` | date | — | ISO date, inclusive |
| `to` | date | — | ISO date, inclusive |
| `limit` | integer | 50 | Max 200 |
| `offset` | integer | 0 | Pagination |

**Response 200:**
```json
{
  "total": 120,
  "count": 50,
  "orders": [
    {
      "id": "uuid",
      "product": { "id": "uuid", "title": "Продукт А" },
      "courier": { "id": "uuid", "name": "Бекзат" },
      "quantity": 3,
      "sale_price_som": 700.00,
      "courier_fee_som": 50.00,
      "net_profit_som": 550.00,
      "delivery_address": "ул. Ленина, 15",
      "customer_phone": "+996700123456",
      "status": "in_transit",
      "created_at": "2026-04-24T14:35:22Z"
    }
  ]
}
```

---

### 8.2 `POST /orders`

Create a new order. Decrements `stock_quantity` on the product automatically.

**Auth:** Admin JWT

**Request:**
```json
{
  "product_id": "uuid",
  "quantity": 3,
  "sale_price_som": 700.00,
  "courier_fee_som": 50.00,
  "delivery_address": "ул. Ленина, 15",
  "customer_name": "Айгуль",
  "customer_phone": "+996700123456",
  "courier_id": "uuid",
  "note": "Позвонить за 30 минут"
}
```

**Validation:**
- `product_id`: must exist
- `quantity`: integer > 0, must not exceed current `stock_quantity`
- `sale_price_som`: float > 0
- `courier_fee_som`: float ≥ 0
- `delivery_address`: 5–500 chars
- `courier_id`: optional; if provided, must exist and be active courier

**Side effects:**
- `products.stock_quantity -= quantity`
- `order_status_log` row inserted with `old_status = null`, `new_status = 'new'`
- If `courier_id` provided → `status` set to `'assigned'` and log entry inserted

**Response 201:** Full order object.

---

### 8.3 `PATCH /orders/:id`

Admin updates order details (address, note, courier fee, etc.). Status cannot be changed via this endpoint — use `/assign` or the bot webhook.

**Response 200:** Updated order.

---

### 8.4 `DELETE /orders/:id`

Only deletable if `status = 'new'` or `'assigned'`. Returns stock back.

**Response 204:** No Content.

---

### 8.5 `POST /orders/:id/assign`

Assign (or reassign) a courier to an order.

**Auth:** Admin JWT

**Request:**
```json
{ "courier_id": "uuid" }
```

**Side effects:**
- Sets `orders.courier_id`
- Sets `status = 'assigned'`
- Appends to `order_status_log`
- Sends a Telegram message to the courier via bot (fire-and-forget)

**Response 200:** Updated order object.

---

## 9. User / Courier Endpoints

### 9.1 `GET /users`

**Auth:** Admin JWT

**Query params:**

| Param | Type | Notes |
|---|---|---|
| `role` | string | `admin` \| `courier` |
| `is_active` | boolean | Default: only active users |

**Response 200:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Бекзат",
      "role": "courier",
      "tg_id": 987654321,
      "phone": "+996555000001",
      "is_active": true
    }
  ]
}
```

---

### 9.2 `POST /users`

Admin creates a courier account. The courier's `tg_id` is required so the bot can identify them.

**Request:**
```json
{
  "name": "Бекзат",
  "role": "courier",
  "tg_id": 987654321,
  "phone": "+996555000001"
}
```

**Response 201:** User object.

**Errors:**
- `409` tg_id already registered

---

### 9.3 `PATCH /users/:id`

Update name, phone, or toggle `is_active`. Role cannot be changed after creation.

**Response 200:** Updated user.

---

## 10. Analytics Endpoints

### 10.1 `GET /analytics/summary`

Dashboard summary cards.

**Auth:** Admin JWT

**Response 200:**
```json
{
  "today": {
    "orders_created": 5,
    "orders_delivered": 3,
    "net_profit_som": 4500.00
  },
  "this_week": {
    "orders_created": 28,
    "orders_delivered": 24,
    "net_profit_som": 31200.00
  },
  "stock_alerts": [
    { "product_id": "uuid", "title": "Продукт А", "stock_quantity": 2 }
  ],
  "open_orders": {
    "new": 2,
    "assigned": 4,
    "in_transit": 6
  }
}
```

---

### 10.2 `GET /analytics/profit`

Profit breakdown over a date range.

**Auth:** Admin JWT

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `from` | date | 7 days ago | ISO date |
| `to` | date | today | ISO date |
| `group_by` | string | `day` | `day` \| `week` \| `courier` \| `product` |

**Response 200 (group_by=day):**
```json
{
  "period": { "from": "2026-04-17", "to": "2026-04-24" },
  "total_profit_som": 31200.00,
  "breakdown": [
    { "date": "2026-04-24", "orders": 5, "revenue_som": 3500.00, "cost_som": 1500.00, "courier_fees_som": 250.00, "profit_som": 1750.00 },
    { "date": "2026-04-23", "orders": 8, "revenue_som": 5600.00, "cost_som": 2400.00, "courier_fees_som": 400.00, "profit_som": 2800.00 }
  ]
}
```

---

## 11. Telegram Bot — Command & Flow Map

### Bot auth flow for couriers

```
Courier sends /start
    │
    ▼
Bot checks: is tg_id in users table with role='courier'?
    │
    ├─ YES → Welcome! Show main menu.
    └─ NO  → "Вы не зарегистрированы. Обратитесь к менеджеру."
```

Admin registers couriers manually via the web panel (creates user with their `tg_id`). No self-registration in the bot.

---

### Command map

| Command / Button | Action |
|---|---|
| `/start` | Auth check → show main menu |
| `📦 Мои заказы` | List orders assigned to this courier with status `assigned` or `in_transit` |
| `🔔 Новые заказы` | List orders with status `assigned` to this courier that haven't been picked up yet |
| Order card → `[Взял в работу]` | `PATCH /bot/orders/:id/status` → `in_transit` |
| Order card → `[Доставлено]` | `PATCH /bot/orders/:id/status` → `delivered` |
| Order card → `[Проблема]` | `PATCH /bot/orders/:id/status` → `failed` + prompt for note |
| `/help` | Show help text |

### Status update flow

```
Courier taps [Взял в работу]
    │
    ▼
Bot calls: PATCH /bot/orders/:id/status
  { "new_status": "in_transit", "tg_id": 987654321 }
    │
    ▼
Backend validates:
  - tg_id matches order's courier
  - transition is allowed (assigned → in_transit)
    │
    ▼
Backend updates orders + appends order_status_log
    │
    ▼
Backend notifies admin via bot push (optional)
    │
    ▼
Bot replies: "✅ Заказ #123 взят в работу!"
```

### Push notifications to couriers

When admin assigns an order (via `POST /orders/:id/assign`), the FastAPI backend calls the Telegram Bot API directly:

```python
# Called inside the assign endpoint handler
await bot.send_message(
    chat_id=courier.tg_id,
    text=f"📦 Новый заказ!\n\nАдрес: {order.delivery_address}\nТовар: {product.title} × {order.quantity}\n\nОткрой бота, чтобы взять в работу."
)
```

---

## 12. Frontend (Next.js) — Page Map

### Route structure

```
app/
├── (auth)/
│   └── login/            → /login     — Admin login page
├── (dashboard)/
│   ├── layout.tsx         → Sidebar + top bar layout (auth guard)
│   ├── page.tsx           → /          → Dashboard (summary cards + open orders)
│   ├── orders/
│   │   ├── page.tsx       → /orders    → Orders table (filters: status, courier, date)
│   │   ├── new/
│   │   │   └── page.tsx   → /orders/new → Create order form
│   │   └── [id]/
│   │       └── page.tsx   → /orders/:id → Order detail + status timeline
│   ├── products/
│   │   └── page.tsx       → /products  → Inventory table + add/edit modal
│   ├── couriers/
│   │   └── page.tsx       → /couriers  → Courier list + add courier form
│   └── analytics/
│       └── page.tsx       → /analytics → Profit charts + date picker
```

### Key components

| Component | Location | Purpose |
|---|---|---|
| `<OrderTable>` | `components/orders/` | Filterable table with status badges |
| `<OrderForm>` | `components/orders/` | Create/edit form with product/courier dropdowns |
| `<StatusTimeline>` | `components/orders/` | Visual audit trail from `order_status_log` |
| `<StockCard>` | `components/products/` | Product card with stock level indicator |
| `<ProfitChart>` | `components/analytics/` | Line/bar chart using Recharts |
| `<SummaryCards>` | `components/dashboard/` | Today's orders, profit, open counts |
| `<AssignModal>` | `components/orders/` | Courier picker inline modal |

### State management

Simple fetch-based approach (no Redux needed for this scope):
- SWR or React Query for data fetching + cache invalidation
- Optimistic updates on status changes

---

## 13. Error Response Format

All errors follow this shape:

```json
{
  "error": "validation_error",
  "message": "Human-readable description",
  "details": {
    "field_name": "Specific reason"
  }
}
```

**`error` code values:**

| Code | HTTP | When |
|---|---|---|
| `validation_error` | 400/422 | Field validation failed |
| `unauthorized` | 401 | Missing/invalid JWT or bot secret |
| `forbidden` | 403 | Valid auth but action not allowed (e.g. wrong role) |
| `not_found` | 404 | Resource doesn't exist |
| `conflict` | 409 | Duplicate tg_id or deleting product with open orders |
| `insufficient_stock` | 422 | Order quantity exceeds product stock |
| `invalid_transition` | 422 | Bot tried an illegal status change |
| `account_inactive` | 403 | User is deactivated (`is_active = false`) |
| `server_error` | 500 | Unexpected backend error |

---

## 14. Enums and Constants

### Order statuses

```python
ORDER_STATUSES = ["new", "assigned", "in_transit", "delivered", "failed"]

# Allowed transitions
STATUS_TRANSITIONS = {
    "new":        ["assigned", "deleted"],
    "assigned":   ["in_transit", "new"],   # reassignment returns to 'new' then re-assigns
    "in_transit": ["delivered", "failed"],
    "delivered":  [],   # terminal
    "failed":     [],   # terminal
}

STATUS_LABELS_RU = {
    "new":        "Новый",
    "assigned":   "Назначен",
    "in_transit": "В пути",
    "delivered":  "Доставлен",
    "failed":     "Не доставлен",
}
```

### User roles

```python
USER_ROLES = ["admin", "courier"]
```

### Price convention

```python
# All prices stored in tiyins (1 сом = 10,000 тыйын)
# Example: 500 сом → stored as 5_000_000
# Conversion helpers:
def som_to_tiyins(som: float) -> int:
    return round(som * 10_000)

def tiyins_to_som(tiyins: int) -> float:
    return tiyins / 10_000
```

### Profit formula

```python
def compute_net_profit(order, product) -> int:
    """Returns net profit in tiyins."""
    revenue = order.sale_price * order.quantity
    cost    = product.purchase_price * order.quantity
    return revenue - cost - order.courier_fee
```

---

## 15. Docker Deployment Structure

```
project-root/
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── Dockerfile
│   └── ...
├── bot/
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml
└── .env
```

### `docker-compose.yml` (outline)

```yaml
version: "3.9"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: logihub
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: logihub
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql+asyncpg://logihub:${DB_PASSWORD}@db:5432/logihub
      JWT_SECRET: ${JWT_SECRET}
      BOT_SECRET: ${BOT_SECRET}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}

  bot:
    build: ./bot
    depends_on: [backend]
    environment:
      BACKEND_URL: http://backend:8000
      BOT_SECRET: ${BOT_SECRET}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000

volumes:
  postgres_data:
```

### `.env` variables

| Variable | Description |
|---|---|
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | HS256 signing secret (32+ random chars) |
| `BOT_SECRET` | Shared secret between backend and bot service |
| `TELEGRAM_BOT_TOKEN` | Token from @BotFather |

---

## 16. Implementation Notes

### Phase 1 — Core (Start here)
1. Design DB schema → write SQLAlchemy models + Alembic migrations
2. Auth: `POST /auth/login`, `GET /auth/me`
3. Products CRUD
4. Orders CRUD (without courier logic yet)
5. Test everything via FastAPI's auto-generated Swagger UI at `/docs`

### Phase 2 — Dispatch
1. Add `POST /orders/:id/assign` endpoint
2. Build Telegram bot: `/start`, auth check, list assigned orders, `[Взял в работу]` button
3. `PATCH /bot/orders/:id/status` internal endpoint
4. Connect bot → backend via `BOT_SECRET`

### Phase 3 — Frontend
1. Scaffold Next.js + shadcn/ui
2. Login page
3. Dashboard + orders table
4. Create order form (product dropdown, courier dropdown)
5. Analytics page (profit chart)

### Phase 4 — Production
1. Write Dockerfiles for each service
2. Write `docker-compose.yml`
3. Deploy on VPS (DigitalOcean, Hetzner, or any Linux server)
4. Set up Telegram webhook (instead of polling) for production

### Vibe coding tips

When prompting an AI to generate code for this project, always share:

1. The **DB schema** from Section 4 — models everything
2. The **status transition table** from Section 14 — prevents logic errors
3. The **price convention** (tiyins) from Section 14 — prevents float precision bugs
4. The **tech stack** from Section 3 — keeps the AI on the right libraries

**Recommended first prompt:**
> "Create a FastAPI app with SQLAlchemy async models for these 4 tables: [paste schema]. Include Alembic migration setup, a Pydantic schema for creating an Order, and a CRUD router for orders at `/orders`. All prices are integers in tiyins."

---

## 17. Summary

| Dimension | Detail |
|---|---|
| **Tables** | 4 (users, products, orders, order_status_log) |
| **API endpoints** | 18 (2 public, 15 admin-protected, 1 bot-only) |
| **Interfaces** | 2 (Next.js admin web app + Telegram bot for couriers) |
| **Services** | 3 (FastAPI backend, Next.js frontend, aiogram bot) |
| **Deploy** | 1 `docker-compose up` command |
| **Core formula** | `profit = (sale_price − purchase_price) × qty − courier_fee` |

**The system removes 3 pain points:**
- Manual dispatch → replaced by one-click assign + bot notification
- Excel bookkeeping → replaced by real-time profit dashboard
- Courier check-in calls → replaced by status buttons in Telegram
