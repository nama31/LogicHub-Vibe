# LogiHub — Product Roadmap: MVP → Production-Ready
## From 70% to a Product People Actually Love

---

## The Honest Diagnosis

You're at the "70% wall." Everything works, but nothing feels complete. The backend runs, the bot responds, the frontend renders — but it doesn't feel like a *product* yet. It feels like a demo. The gap between a working demo and a product someone depends on daily is exactly what this document addresses.

**What's missing isn't more features. It's depth in the right places.**

The three things you flagged are exactly correct:
1. Orders are isolated actions — they should be a **delivery route**
2. The Telegram bot is functional but feels like a terminal — it should feel like a **tool couriers want to use**
3. Analytics show you numbers — they should tell you **what to do next**

Here's the plan to fix all three, plus the invisible 30% that separates a demo from a product.

---

## Part 1: The Route Model (Biggest Architectural Change)

### The Problem With Single Orders

Right now: 1 order = 1 delivery = 1 stop. A courier gets sent to the warehouse, picks up one box, delivers it, comes back. In real logistics, a courier takes 5–10 deliveries in one trip. The current model forces the admin to assign every order individually and gives the courier no sense of their day's work.

### What a Route Is

A **route** is a named, sequenced collection of orders assigned to one courier for one trip. The courier sees their full list, works through it stop by stop, and the admin sees progress in real time.

```
Route #12 — Бекзат — Понедельник, 9:00
├── Stop 1: ул. Ленина 15 — Продукт А × 2       [✓ Доставлен]
├── Stop 2: пр. Манаса 44 — Продукт Б × 1       [🚗 В пути]
├── Stop 3: ул. Токтогула 8 — Продукт А × 3     [⏳ Ожидает]
└── Stop 4: мкр. Джал, ул. 5 — Продукт В × 2   [⏳ Ожидает]
```

### Database Changes Required

**New table: `routes`**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `courier_id` | UUID | FK → users(id) |
| `created_by` | UUID | FK → users(id), the admin who built this route |
| `label` | TEXT | Optional name, e.g. "Утренний рейс" |
| `status` | TEXT | `draft` → `active` → `completed` → `cancelled` |
| `started_at` | TIMESTAMP | When courier tapped "Start Route" |
| `completed_at` | TIMESTAMP | When last stop was done |
| `created_at` | TIMESTAMP | |

**Changes to `orders` table:**

Add two columns:
- `route_id` UUID NULLABLE FK → routes(id)
- `stop_sequence` INTEGER NULLABLE — The order within a route (1, 2, 3...)

**New route status transitions:**
```
draft → active (courier starts the route)
active → completed (all stops done)
active → cancelled (admin cancels mid-route)
```

**Order status within a route:**
- Orders still use the same `new → assigned → in_transit → delivered / failed` machine
- The difference: `in_transit` now means "this specific stop is being served right now"
- Only one stop can be `in_transit` at a time per route (enforced by the backend)
- The courier can only advance to the next stop after resolving the current one

### Backend Changes

**New endpoints:**

| Method | Path | Purpose |
|---|---|---|
| POST | `/routes` | Admin creates a route, adds order IDs, assigns courier |
| GET | `/routes` | Admin lists all routes with filters |
| GET | `/routes/:id` | Full route with all stops and current statuses |
| PATCH | `/routes/:id` | Edit label, reassign courier (only if `draft`) |
| DELETE | `/routes/:id` | Cancel a draft route, returns all orders to `new` |
| POST | `/routes/:id/start` | Courier starts the route → bot calls this |
| PATCH | `/bot/routes/:id/stop/:stop_id/complete` | Courier marks a stop done → advances to next |

**The key rule:** `POST /orders` still creates a single order. You then build a route by grouping orders. This keeps the existing order flow intact and makes routes optional — a single unrouted order can still be dispatched solo.

### Frontend Changes

**New page: `/routes`**

- Route builder: drag-and-drop interface to add orders to a route, reorder stops
- Route list: show all routes with progress bars (e.g., "3 of 5 stops done")
- Route detail: live map-like sequential view of all stops with statuses

**Changes to `/orders`:**

- Each order row shows if it belongs to a route (badge: "В маршруте #12")
- Orders in a route cannot be individually assigned — they're managed via the route
- Filter: show only "unrouted" orders when building a route

---

## Part 2: The Telegram Bot — Redesigned for Real Use

### The Problem

Right now the bot is a status-update terminal. The courier types a command, sees a list, taps a button. It works but it doesn't guide the courier through their day. The goal: the bot should feel like a co-pilot, not a form.

### The New Bot UX Principles

**1. The bot speaks first.** When a route is assigned, the bot pushes a message proactively. Couriers shouldn't have to ask "do I have work?"

**2. One screen at a time.** The courier should never need to navigate menus during a delivery. The current active stop is always one tap away.

**3. Messages that look like cards, not text dumps.** Use Telegram's MarkdownV2 formatting intentionally.

---

### Message Design System

**Route assignment notification (pushed by backend when route is activated):**

```
📦 *Новый маршрут назначен*

Маршрут \#12 · 4 остановки
Создан: Акмат \(менеджер\)

Нажми кнопку ниже, чтобы начать\.

[🚀 Начать маршрут]
```

**Active stop card (shown after courier starts or completes a stop):**

```
🗺 *Маршрут \#12 · Остановка 2 из 4*
━━━━━━━━━━━━━━━━
📍 пр\. Манаса 44, кв\. 12
👤 Айгуль Асанова · \+996 700 123 456
📦 Продукт А × 3 коробки

💬 _Позвонить за 30 минут_
━━━━━━━━━━━━━━━━
⏳ Осталось: 3 остановки
```

```
[📞 Позвонить]  [🗺 Навигатор]
[✅ Доставлено]  [⚠️ Проблема]
```

**Key design decisions:**
- `📞 Позвонить` opens the phone dialer with the customer's number pre-filled (using `tel:` link)
- `🗺 Навигатор` opens Yandex Maps / Google Maps with the address pre-filled
- `⚠️ Проблема` asks for a reason before marking failed (short inline keyboard: "Не открывает дверь" / "Неверный адрес" / "Клиент отказался")

**Completion card (after all stops done):**

```
🎉 *Маршрут завершён\!*

Маршрут \#12 · Сегодня
✅ Доставлено: 3 из 4
⚠️ Не доставлено: 1

Время в пути: 2ч 15м

Отличная работа, Бекзат\!
```

**Daily summary (sent at end of shift, e.g., 19:00):**

```
📊 *Итоги дня · 28 апреля*

Маршрутов: 2
Доставлено: 7 из 8 остановок
Не доставлено: 1

Твоя статистика за неделю: 34 доставки ✅
```

---

### Bot Flow Map (Updated)

```
/start
  └─ Check tg_id in DB
       ├─ Not found → "Обратитесь к менеджеру"
       └─ Found → Main menu

Main menu (persistent keyboard, not inline):
  [📦 Активный маршрут]  [📋 История]
  [❓ Помощь]

📦 Активный маршрут:
  ├─ No active route → "Активных маршрутов нет. Ждите назначения."
  └─ Has active route → Show current stop card

✅ Доставлено (on current stop):
  └─ Backend marks stop delivered
       ├─ More stops → Show next stop card automatically
       └─ Last stop → Show route completion card

⚠️ Проблема:
  └─ Inline keyboard: choose reason
       └─ Backend marks stop failed, moves to next
```

---

### Technical Implementation for Bot

**New bot handlers to build:**

```
handlers/
  routes.py      — "Активный маршрут", show current stop
  navigation.py  — Phone/maps deep link generation
  daily_summary.py — Scheduled message via aiogram scheduler
```

**Proactive notifications from backend:**

When the admin creates/activates a route, the FastAPI `notification_service.py` (already exists!) should call the Telegram Bot API directly:

```python
# In notification_service.py
async def notify_route_assigned(courier_tg_id: int, route: Route):
    await bot.send_message(
        chat_id=courier_tg_id,
        text=format_route_card(route),
        reply_markup=start_route_keyboard(route.id),
        parse_mode="MarkdownV2"
    )
```

**Deep link for address navigation:**

```python
def make_maps_link(address: str) -> str:
    encoded = urllib.parse.quote(address)
    return f"https://yandex.com/maps/?text={encoded}"
```

---

## Part 3: Analytics — Tell the Story Behind the Numbers

### What's Missing Now

The current analytics tells you: "You made X сом today." That's a score, not insight. A good analytics dashboard answers questions the admin didn't know they had.

### The Questions a Real Admin Asks

Here's what a distributor actually wants to know:

- **"Who's my best courier?"** — not just most deliveries, but delivery success rate, speed, failed rate
- **"Which product makes me the most money?"** — not revenue, but margin per unit
- **"Is Monday or Friday better for routes?"** — operational planning
- **"Why did I lose money last Tuesday?"** — anomaly explanation
- **"Am I growing?"** — week over week, month over month comparison

### New Analytics Endpoints

**`GET /analytics/couriers`** — Courier performance table

```json
{
  "period": { "from": "2026-04-01", "to": "2026-04-28" },
  "couriers": [
    {
      "id": "uuid",
      "name": "Бекзат",
      "routes_completed": 12,
      "stops_total": 48,
      "stops_delivered": 45,
      "stops_failed": 3,
      "success_rate": 0.9375,
      "avg_stops_per_route": 4.0,
      "total_courier_fees_som": 3600.00
    }
  ]
}
```

**`GET /analytics/products`** — Product profitability table

```json
{
  "products": [
    {
      "id": "uuid",
      "title": "Продукт А",
      "units_sold": 84,
      "revenue_som": 58800.00,
      "cogs_som": 42000.00,
      "gross_profit_som": 16800.00,
      "margin_percent": 28.6,
      "avg_units_per_order": 2.4
    }
  ]
}
```

**`GET /analytics/trends`** — Week-over-week and month-over-month comparisons

```json
{
  "this_week": { "revenue_som": 45000, "profit_som": 12000, "deliveries": 28 },
  "last_week": { "revenue_som": 38000, "profit_som": 9800, "deliveries": 24 },
  "wow_change": { "revenue_pct": 18.4, "profit_pct": 22.4, "deliveries_pct": 16.7 },
  "this_month": { "revenue_som": 180000, "profit_som": 48000 },
  "last_month": { "revenue_som": 152000, "profit_som": 39000 },
  "mom_change": { "revenue_pct": 18.4, "profit_pct": 23.1 }
}
```

**`GET /analytics/heatmap`** — Delivery density by day of week and hour

```json
{
  "heatmap": [
    { "day_of_week": 1, "hour": 9, "deliveries": 12, "avg_profit_som": 4500 },
    { "day_of_week": 1, "hour": 10, "deliveries": 8, "avg_profit_som": 3200 }
  ]
}
```

This tells the admin: "Your best time slot is Monday 9–11am. Consider running fewer routes on Friday afternoons."

**`GET /analytics/failed`** — Why deliveries fail

```json
{
  "period": "this_month",
  "total_failed": 7,
  "by_reason": [
    { "reason": "Не открывает дверь", "count": 3 },
    { "reason": "Неверный адрес", "count": 2 },
    { "reason": "Клиент отказался", "count": 2 }
  ],
  "by_courier": [
    { "name": "Бекзат", "failed": 1 },
    { "name": "Санжар", "failed": 6 }
  ]
}
```

This tells the admin immediately: "Санжар has a problem, look into it."

---

### New Frontend Analytics Pages

**Redesign `/analytics` into tabs:**

```
[ Обзор ] [ Курьеры ] [ Товары ] [ Тренды ] [ Сбои ]
```

**Tab: Обзор (Overview)**
- 4 big KPI cards: Revenue today, Profit today, Active routes, Stock alerts
- Profit line chart (keep existing, just improve it)
- "Compared to last week" delta under each number (green/red)

**Tab: Курьеры (Couriers)**
- Sortable table: Name, Routes, Deliveries, Success %, Fees paid
- Clicking a courier row opens a sidebar with their month history
- Bar chart: deliveries per courier (visual ranking)

**Tab: Товары (Products)**
- Sortable table: Product, Units sold, Revenue, COGS, Profit, Margin %
- Color-coded margin column: high margin = Deep Ocean, low margin = Beige
- "Sold out" indicator for products with 0 stock

**Tab: Тренды (Trends)**
- Side-by-side: This week vs Last week bar chart
- Month-over-month growth card with big number and arrow
- "Best day of the week" card based on heatmap data

**Tab: Сбои (Failed deliveries)**
- Pie chart: breakdown by failure reason
- Table: failed deliveries by courier
- Quick action: "Retry" button to re-route a failed delivery

---

## Part 4: The Invisible 30% (Production Hardening)

These aren't features. Users don't see them. But without them, the product breaks when it matters.

### 4.1 Real-Time Updates (WebSocket — Already in the Codebase)

You already have `backend/core/websocket.py`. Use it. The frontend should not require a manual refresh to see a courier's status change.

**What to connect via WebSocket:**
- Route status changes (courier starts, completes a stop)
- Order status badge on `/orders` page updates live
- Dashboard summary numbers refresh automatically

**Simple implementation:**
```python
# In websocket.py — broadcast when any order status changes
async def broadcast_order_update(order_id: str, new_status: str):
    message = {"type": "order_update", "order_id": order_id, "status": new_status}
    await manager.broadcast(json.dumps(message))
```

```typescript
// In frontend — useOrders.ts
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:8000/ws`);
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'order_update') mutate(); // SWR re-fetch
  };
  return () => ws.close();
}, []);
```

### 4.2 Stock Management — Beyond Just Decrementing

**Current behavior:** Creating an order decrements stock. That's it.

**What's missing:**
- **Restocking:** Admin receives a new shipment from the head company → increment stock. Currently there's no UI for this — the admin would have to use PATCH on a product.
- **Low stock alerts:** Show a red banner on the dashboard when any product hits below a threshold (e.g., 5 units). The `/analytics/summary` endpoint already returns `stock_alerts` — just make the UI act on it with a visible alert, not a subtle table row.
- **Stock history:** A simple log of when stock went up (restock) or down (order) and by how much.

**Quick fix:** Add a `POST /products/:id/restock` endpoint that takes `{ quantity, note }`, increments stock, and logs the event. Add a "Пополнить склад" button on the products page.

### 4.3 Error States and Loading States (Often Skipped)

A product needs to handle failure gracefully. Right now, if the backend is down, the frontend probably shows a blank page or an infinite spinner.

**For every data-fetching component, define three states:**
- **Loading:** Skeleton UI (shadcn/ui has `<Skeleton>`)
- **Error:** Friendly message + retry button, not a raw error object
- **Empty:** Explanatory message + call-to-action (e.g., "Нет заказов. Создать первый?")

### 4.4 Optimistic UI for the Admin

When the admin assigns a courier to an order, they should see the change instantly — the row should update before the API responds. If the API fails, roll back with a toast notification.

This is the difference between a form that feels like a government portal and one that feels like a modern app.

### 4.5 Data Export

Admins need to report to the head company. Add a single button:

`GET /analytics/export?from=2026-04-01&to=2026-04-30` → returns a CSV with:
- Date, Order ID, Product, Quantity, Purchase Price, Sale Price, Courier, Profit

No new DB work needed — it's just a query with a CSV response header.

---

## Revised File Structure (New Files Only)

```
backend/
  models/
    route.py                 ← NEW
  routers/
    routes.py                ← NEW
  schemas/
    route.py                 ← NEW
  services/
    route_service.py         ← NEW
  migrations/versions/
    0005_create_routes.py    ← NEW

frontend/
  app/(dashboard)/
    routes/
      page.tsx               ← NEW (route list)
      new/
        page.tsx             ← NEW (route builder)
      [id]/
        page.tsx             ← NEW (route detail with live stops)
    analytics/
      page.tsx               ← REPLACE (add tabs)
  src/
    components/
      routes/
        RouteBuilder.tsx     ← NEW
        RouteCard.tsx        ← NEW
        StopTimeline.tsx     ← NEW
      analytics/
        CourierLeaderboard.tsx ← NEW
        ProductMarginTable.tsx ← NEW
        TrendComparison.tsx  ← NEW
        FailedDeliveryChart.tsx ← NEW
    hooks/
      useRoutes.ts           ← NEW
      useAnalytics.ts        ← EXTEND (add 4 new endpoints)

bot/
  handlers/
    routes.py                ← NEW (replaces old order flow)
    daily_summary.py         ← NEW
    navigation.py            ← NEW (maps/phone links)
  schedulers/
    daily_summary.py         ← NEW (aiogram scheduler)
```

---

## Build Order (Phase 11 → 16)

### Phase 11: Route Data Model
- Add `routes` table + migration
- Add `route_id`, `stop_sequence` to `orders`
- Write SQLAlchemy model
- Write Pydantic schemas

**AI Prompt context to include:** `architecture.md` (sections 4 and 8), `logihub/backend/models/order.py`, `logihub/backend/migrations/`

---

### Phase 12: Route Backend Logic
- `POST /routes` — create route, validate all orders exist and are unrouted
- `GET /routes`, `GET /routes/:id`
- `POST /routes/:id/start` — transitions route to `active`, sends Telegram notification to courier
- `PATCH /bot/routes/:id/stop/:stop_id/complete` — internal bot endpoint

**Key rule for AI:** Only one stop can be `in_transit` at a time per route. When a stop is completed, the next stop automatically moves from `new` to `assigned`. This must be atomic (one DB transaction).

---

### Phase 13: Bot Redesign
- Replace all old order handlers with route-based handlers
- Implement `format_route_card()`, `format_stop_card()`, `format_completion_card()` in `utils/formatters.py`
- Add maps deep link generator
- Add daily summary scheduler
- Keep `/start` and auth flow unchanged

**AI Prompt note:** Strictly use MarkdownV2 (escape special chars: `.`, `-`, `(`, `)`, etc.). Test every message format in a real Telegram chat before calling it done.

---

### Phase 14: Route Frontend
- Route builder page: order picker + drag-to-reorder stops
- Route list: progress bars, courier badges
- Route detail: sequential stop view with live WebSocket status

---

### Phase 15: Analytics Expansion
- Add 4 new backend endpoints (couriers, products, trends, heatmap, failed)
- Refactor `/analytics` page into tabs
- Build `CourierLeaderboard`, `ProductMarginTable`, `TrendComparison`, `FailedDeliveryChart`

---

### Phase 16: Production Hardening
- Connect WebSocket to order/route status updates in frontend
- Add `POST /products/:id/restock` endpoint + UI button
- Add CSV export endpoint
- Add loading/error/empty states to every page
- Docker compose health checks
- Environment validation on startup (fail fast if `JWT_SECRET` not set)

---

## Priority Matrix

| Change | Impact | Effort | Do First? |
|---|---|---|---|
| Route model (DB + backend) | 🔴 High | 🔴 High | Yes — blocks everything |
| Bot message redesign | 🔴 High | 🟡 Medium | Yes — courier experience |
| Analytics tabs + courier data | 🟡 Medium | 🟡 Medium | Yes — admin needs this |
| WebSocket real-time updates | 🟡 Medium | 🟡 Medium | After routes |
| Restock flow | 🟡 Medium | 🟢 Low | Quick win |
| CSV export | 🟢 Low | 🟢 Low | Quick win |
| Daily summary bot message | 🟢 Low | 🟢 Low | Nice to have |
| Heatmap analytics | 🟢 Low | 🟡 Medium | Later |

---

## What "Done" Looks Like (E2E Test for v1.0)

1. Admin logs into web panel
2. Admin creates a restock entry: +50 units of Продукт А
3. Admin creates 4 orders for different customers
4. Admin opens "Маршруты" → builds a route with all 4 orders, sets stop sequence
5. Admin assigns the route to Бекзат
6. **Бекзат's Telegram immediately receives:** "📦 Новый маршрут назначен — 4 остановки"
7. Бекзат taps "Начать маршрут" → sees Stop 1 card with address, name, phone
8. Бекзат taps 🗺 — opens Yandex Maps with the address
9. Бекзат delivers, taps ✅ → sees Stop 2 card automatically
10. Stop 3 fails (client not home) → Бекзат taps ⚠️ → picks reason → moves to Stop 4
11. Admin's `/routes` page shows live progress: "3 of 4 complete"
12. Route ends → Admin sees `/analytics/couriers` tab: Бекзат's success rate = 75% today
13. Admin checks `/analytics/products` — sees Продукт А has 28% margin, highest in the catalog
14. Admin exports this month's data to CSV → sends to head company
