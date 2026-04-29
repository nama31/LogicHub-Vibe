# LogiHub - Master Context

## 1. Project Goal
LogiHub is a micro-CRM and dispatch management system for a middle-tier distributor. It eliminates manual dispatching by automating order assignments to couriers via a Telegram bot, manages warehouse inventory, and calculates net profit margins in real-time.

## 2. Tech Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.x (async), Alembic, PostgreSQL 15.
- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui.
- **Telegram Bot:** Python, aiogram 3.x.
- **Infrastructure:** Docker, Docker Compose.

## 3. Core Rules (CRITICAL FOR AI AGENTS)
- **Monetary Values:** ALL prices and financial calculations MUST be stored and processed as integers in tiyins (1 Som = 10,000 tiyins). NEVER use floats for money in the database or backend logic.
- **Development Flow:** Always implement features in this strict order: 1) Database Models & Alembic Migrations -> 2) Pydantic Schemas -> 3) FastAPI Routers/Services -> 4) Frontend or Bot integration.
- **File System Strictness:** DO NOT create new files or directories outside of the approved `Directory Structure` defined below. If a component or router is needed, place it in the existing designated folder.
- **No Fake Data:** Do not hallucinate or mock database relationships. Strictly follow the provided database schema.

## 4. Database Schema
There are 4 core tables in the PostgreSQL database.

*   **`users`**
    *   `id` (UUID, PK)
    *   `name` (Text)
    *   `role` (Enum: 'admin', 'courier')
    *   `tg_id` (BigInt, Unique, Nullable) - Telegram ID
    *   `password_hash` (Text, Nullable)
    *   `phone` (Text, Nullable)
    *   `is_active` (Boolean, Default True)
    *   `created_at` (Timestamp)
*   **`products`**
    *   `id` (UUID, PK)
    *   `title` (Text)
    *   `purchase_price` (Integer) - In tiyins
    *   `stock_quantity` (Integer)
    *   `unit` (Text)
    *   `created_at` (Timestamp)
    *   `updated_at` (Timestamp)
*   **`orders`**
    *   `id` (UUID, PK)
    *   `product_id` (UUID, FK -> products.id)
    *   `courier_id` (UUID, FK -> users.id, Nullable)
    *   `quantity` (Integer)
    *   `sale_price` (Integer) - In tiyins
    *   `courier_fee` (Integer) - In tiyins
    *   `customer_name` (Text, Nullable)
    *   `customer_phone` (Text, Nullable)
    *   `delivery_address` (Text)
    *   `status` (Enum: 'new', 'assigned', 'in_transit', 'delivered', 'failed')
    *   `note` (Text, Nullable)
    *   `created_at` (Timestamp)
    *   `updated_at` (Timestamp)
*   **`order_status_log`**
    *   `id` (UUID, PK)
    *   `order_id` (UUID, FK -> orders.id)
    *   `changed_by` (UUID, FK -> users.id)
    *   `old_status` (Text, Nullable)
    *   `new_status` (Text)
    *   `changed_at` (Timestamp)

## 5. Directory Structure
The repository is a monorepo. Agents must respect this layout:
```text
logihub/
├── docker-compose.yml
├── .env
├── README.md
├── CONTEXT.md                  # This file
│
├── backend/                    # FastAPI Application
│   ├── main.py
│   ├── core/                   # Config, DB connection, Security
│   ├── models/                 # SQLAlchemy ORM Models
│   ├── schemas/                # Pydantic Schemas
│   ├── routers/                # API Endpoints
│   ├── services/               # Business Logic
│   ├── constants/              # Enums and fixed values
│   └── migrations/             # Alembic versions
│
├── frontend/                   # Next.js 14 Admin Panel
│   ├── src/
│   │   ├── app/                # App Router (Pages & Layouts)
│   │   ├── components/         # UI, Layout, Dashboard, Orders, Products
│   │   ├── hooks/              # Custom React Hooks
│   │   ├── lib/                # API Client, Utils
│   │   └── types/              # TypeScript Interfaces
│   ├── tailwind.config.ts
│   └── components.json
│
└── bot/                        # aiogram 3.x Telegram Bot
    ├── main.py
    ├── core/                   # Bot config & HTTP client
    ├── handlers/               # Command & Callback handlers
    ├── keyboards/              # Inline & Reply keyboards
    ├── services/               # API requests to backend
    └── middlewares/            # Auth & Validation