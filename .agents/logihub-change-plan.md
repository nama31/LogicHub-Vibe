# LogiHub — Change Plan & Implementation Prompts

> Based on Gemini codebase analysis. Four features planned, zero code written yet.
> Use the prompts below sequentially in your AI session after this plan is confirmed.

---

## What the Analysis Found

| Area | Finding |
|---|---|
| User roles | `Enum(admin, courier, client)` — no superuser field |
| Data isolation | `Route` has `created_by`, but `Order`, `Product`, `User` have **no** `admin_id` FK |
| Courier identity | `User` model has both `phone` (String, unique) and `tg_id` (BigInteger, unique) ✅ |
| Order approval | `POST /{id}/assign` in `routers/orders.py` → `assign_order()` in `services/order_service.py` |
| Notification system | `services/notification_service.py` — aiogram.Bot inside FastAPI `BackgroundTasks` ✅ exists |
| Bot registration | `bot/handlers/registration.py` → `contact_handler` → phone → `POST /bot/register` — **works but no phone normalization** |

---

## Change 1 — Superuser-only Admin Creation

**Problem:** Any admin can currently create other admins via `POST /users`.

### Plan

1. **DB Migration** — Add `is_superuser: BOOLEAN DEFAULT FALSE` to the `users` table.
2. **Backend** — In `backend/routers/users.py`, on `create_user` and `update_user`: if payload `role == "admin"`, assert `current_user.is_superuser == True`, else return `403 Forbidden`.
3. **Script** — Update `backend/create_superuser.py` to set `is_superuser = True` on the bootstrap user.
4. **Frontend** — In `src/components/couriers/UserModal.tsx`, hide the `"Админ"` option in `<SelectContent>` unless the auth context contains `is_superuser: true`. The `/me` endpoint must return this field.

### Files to touch
- `backend/models/user.py`
- `backend/routers/users.py`
- `backend/create_superuser.py`
- `src/components/couriers/UserModal.tsx`
- New Alembic migration file

---

## Change 2 — Data Isolation per Admin

**Problem:** All admins see all orders, products, couriers, and routes. There is no ownership concept.

### Plan

1. **DB Migration** — Add `admin_id UUID REFERENCES users(id) NULLABLE` to:
   - `orders`
   - `products`
   - `users` (for couriers/clients created by that admin)
   - `routes`

   Nullable for backward compatibility with existing rows.

2. **Backend — Filter all reads** — In each service, if `current_user.is_superuser == False`, append `.where(Model.admin_id == current_user.id)`:
   - `services/order_service.py` → `get_orders()`
   - `services/product_service.py` → `get_products()`
   - `services/user_service.py` → `get_users()`
   - `services/route_service.py` → `get_routes()`

3. **Backend — Stamp on create** — All `create_*` service functions must set `admin_id = current_user.id` automatically.

4. **Superuser bypass** — `is_superuser == True` skips the filter and sees everything.

5. **Frontend** — No changes needed. Filtering is transparent.

### Files to touch
- `backend/models/order.py`, `product.py`, `user.py`, `route.py`
- `backend/services/order_service.py`, `product_service.py`, `user_service.py`, `route_service.py`
- New Alembic migration file (combine with Change 1 migration)

---

## Change 3 — Telegram Notification to Courier on Order Approval

**Problem:** When a client approves an order in the dashboard, the assigned courier receives no Telegram notification.

### Plan

1. **Trigger point** — `backend/routers/orders.py` → `assign_order()` → already calls `background_tasks.add_task(send_courier_notification, order)`. The hook exists.

2. **Fix the notification content** — In `backend/services/notification_service.py`, update `_build_courier_notification()` to send a message that clearly states the order has been approved and assigned to the courier. Include order ID and delivery address.

3. **Guard: missing tg_id** — Before dispatch in `send_courier_notification`, add an explicit check: if `order.courier.tg_id is None`, log a warning and return early. Do not raise an exception.

4. **Dispatch method** — Keep the current architecture (direct aiogram.Bot HTTP call inside BackgroundTasks). No Redis pub/sub needed — the mechanism already works.

### Files to touch
- `backend/services/notification_service.py`
- `backend/routers/orders.py` (verify the background task is wired to the approval transition, not just assignment)

---

## Change 4 — Bot Registration by Phone Number

**Problem:** Phone numbers from Telegram contacts arrive in inconsistent formats (`996...` vs `+996...`), causing lookup failures when matching against the database which stores numbers as `+996 XXX...`.

> **Note:** The core flow (share contact → extract phone → call `/bot/register` → match by phone → save `tg_id`) already exists and is correct.

### Plan

1. **Phone normalization** — In `backend/routers/bot.py`, before calling `get_user_by_phone()`, normalize the incoming phone:
   - Strip all non-digit characters
   - Prepend `+`
   - Result: `+996XXXXXXXXX`

2. **Error messages** — In `bot/handlers/registration.py`, update `contact_handler` to send a clear user-facing message if the backend returns 404 (phone not found in system).

3. **No structural changes** — The Telegram handler, backend endpoint, and DB fields all exist and are correct. This is purely a normalization fix.

### Files to touch
- `backend/routers/bot.py`
- `bot/handlers/registration.py`

---

## Execution Order

Run in this sequence to avoid broken dependencies:

```
Step 1 — Single DB Migration (blocking, do first)
  └── Add is_superuser to users
  └── Add admin_id to orders, products, users, routes
  └── Run: alembic revision --autogenerate -m "superuser_and_admin_isolation"
  └── Run: alembic upgrade head

Step 2 — Backend models (after migration)
  ├── Update user.py, order.py, product.py, route.py with new fields
  └── Update create_superuser.py

Step 3 — Backend logic (parallelizable after Step 2)
  ├── 3A: users.py — superuser guard on admin creation
  ├── 3B: *_service.py — admin_id filter + stamp on create
  ├── 3C: notification_service.py — fix message + tg_id guard
  └── 3D: bot.py — phone normalization

Step 4 — Frontend (after Step 3A, can be parallel with 3B/3C/3D)
  └── UserModal.tsx — hide Admin role option for non-superusers

Step 5 — Bot handler (independent)
  └── registration.py — improve error messages
```

### Dependency map

| Change | Depends on |
|---|---|
| Change 1 (superuser) | Migration ✅ |
| Change 2 (isolation) | Migration ✅, Change 1 (is_superuser field used in bypass logic) |
| Change 3 (notification) | No migration needed, independent |
| Change 4 (phone) | No migration needed, independent |

---

## Implementation Prompts

Use these prompts one by one after confirming this plan. Paste each into a new session or continue in the same session with the codebase loaded.

---

### Prompt A — Migration

```
You are implementing database migrations for LogiHub (FastAPI + Alembic + PostgreSQL).

Based on the existing models in backend/models/, generate one Alembic migration that:
1. Adds is_superuser (BOOLEAN, NOT NULL, DEFAULT FALSE) to the users table
2. Adds admin_id (UUID, NULLABLE, FOREIGN KEY to users.id) to: orders, products, users (self-referencing for couriers), routes

Also update the corresponding SQLAlchemy model files:
- backend/models/user.py — add is_superuser field
- backend/models/order.py — add admin_id FK
- backend/models/product.py — add admin_id FK
- backend/models/route.py — verify created_by exists, add admin_id if separate field is needed

Update backend/create_superuser.py to set is_superuser=True on the bootstrap user.

Do not change any routers or services yet. Migration and models only.
```

---

### Prompt B — Superuser Guard

```
You are implementing role-based access control in LogiHub's FastAPI backend.

The users table now has is_superuser (BOOLEAN). Implement the following:

In backend/routers/users.py:
- On the create_user endpoint: if the incoming payload has role == "admin" and current_user.is_superuser is False, raise HTTPException(403, "Only superusers can create admins")
- Apply the same guard to the update_user endpoint when role is being changed to "admin"

In backend/core/dependencies.py:
- Add a require_superuser dependency (similar to existing require_admin) that checks current_user.is_superuser == True

In backend/schemas/user.py (or wherever UserResponse is defined):
- Add is_superuser: bool to the response schema so the frontend can read it from /me

Do not touch services, migrations, or frontend yet.
```

---

### Prompt C — Data Isolation

```
You are implementing per-admin data isolation in LogiHub's FastAPI backend.

The models now have admin_id (UUID FK to users). Implement the following filtering logic:

In each service file, update the list/get-all functions:
- services/order_service.py → get_orders(): add .where(Order.admin_id == current_user.id) if not current_user.is_superuser
- services/product_service.py → get_products(): same pattern
- services/user_service.py → get_users(): same pattern (couriers/clients belong to their creating admin)
- services/route_service.py → get_routes(): same pattern

In each create function across all four services:
- Automatically set admin_id = current_user.id when creating any entity

Pass current_user into these service functions from the routers. If it is not currently passed, update the router calls accordingly.

Superuser (is_superuser == True) must bypass all filters and see all data.

Do not change migrations, models, or frontend.
```

---

### Prompt D — Courier Notification Fix

```
You are fixing the courier Telegram notification in LogiHub's FastAPI backend.

In backend/services/notification_service.py:
1. Find the _build_courier_notification function (or equivalent message builder)
2. Update the message to clearly state the order has been approved and assigned, including: order ID, delivery address, and a prompt to open the bot
3. In send_courier_notification (or the background task that dispatches the message): add an explicit guard — if order.courier is None or order.courier.tg_id is None, log a warning and return early without raising an exception

In backend/routers/orders.py:
- Verify the background task for courier notification is triggered specifically on the "approved/assigned" status transition, not on any other status change
- If it fires on all updates, add a condition to only dispatch when status transitions to "assigned"

Do not change migrations, models, or other services.
```

---

### Prompt E — Phone Normalization

```
You are fixing phone number normalization in LogiHub's Telegram bot backend integration.

In backend/routers/bot.py, find the /bot/register endpoint (or the function that calls get_user_by_phone):
1. Before the database lookup, normalize the incoming phone number:
   - Strip all non-digit characters
   - Prepend a "+" character
   - This produces the format +996XXXXXXXXX which matches how numbers are stored in the DB
2. If normalization produces a string shorter than 10 digits, return a 400 error with a clear message

In bot/handlers/registration.py, find contact_handler:
1. If the backend returns a 404 (courier not found), send the user a clear Telegram message: their phone number is not registered in the system and they should contact their admin
2. If the backend returns a 200, send a success confirmation message

Do not change migrations, models, or other handlers.
```

---

### Prompt F — Frontend Guard

```
You are updating the LogiHub Next.js frontend to hide the Admin role option for non-superusers.

In src/components/couriers/UserModal.tsx:
1. Read the currently authenticated user from the auth context (useAuth or equivalent hook)
2. In the role <Select> or <SelectContent>, only render the "Админ" / "admin" option if the current user has is_superuser: true
3. If the current user is not a superuser, the select should only show "Курьер" and "Клиент" options

Make sure the /me API response type (in your TypeScript types/interfaces) includes is_superuser: boolean — add it if missing.

Do not change backend files, only frontend TypeScript/TSX.
```

---

*Plan generated from Gemini 2.5 Pro codebase analysis. Confirm file paths match your local structure before running prompts.*
