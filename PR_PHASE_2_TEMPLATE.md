## Summary

Executes Phase 2 of `BACKEND_OPTIMIZATION_PLAN.md` for database optimization only.

## Query and Locking Improvements

- Bulk-loads route creation orders in one query with product eager loading while preserving requested stop order and validation semantics.
- Bulk-loads client batch-order products in one locked query, aggregates duplicate product IDs, validates stock before creating orders, and preserves the existing response shape.
- Adds row-level product locks with `SELECT ... FOR UPDATE` before stock decrements in admin order creation/update and bot client order creation paths.
- Replaces active-route bot lookup with one filtered eager query by courier Telegram ID.
- Replaces route-list stop counting via loaded rows with SQL aggregate counters.
- Adds bounded `limit`/`offset` pagination to orders, products, users, and routes list endpoints without changing response schemas.

## Analytics Optimizations

- Replaces `func.date(Order.created_at)` predicates with timezone-aware UTC datetime range filters while preserving grouped date output.
- Fixes courier analytics row multiplication by joining separate route and order aggregate subqueries.
- Adds Redis cache error handling for `/analytics/summary` so Redis outages fall back to database computation.

## Migration Changes

- Adds `0009_add_phase_2_hot_path_indexes.py` with hot-path indexes:
  - `orders(status, created_at DESC)`
  - `orders(courier_id, status, created_at DESC)`
  - `orders(product_id)`
  - `orders(customer_phone)`
  - `order_status_log(order_id, changed_at)`
  - `routes(status, created_at DESC)`
  - `routes(courier_id, status)`
  - `products(stock_quantity, title)`
- Removes the erroneous `ix_orders_route_id_stop_sequence` creation from the downgrade block in `5235152486c5_make_route_courier_nullable_and_add_.py`.
- Does not recreate the existing `ix_orders_route_id_stop_sequence` index from `0005_create_routes.py`.

## Verification

- `python -m py_compile` passed for all modified backend Python files and migrations.
- Import smoke check passed for modified routers/services with `PYTHONPATH=logihub/backend`.
- `alembic upgrade head --sql` rendered successfully and includes the new Phase 2 indexes.
- No backend Pydantic schema files were modified.

## Scope Guard

- Phase 3 background-task lifecycle/concurrency changes were intentionally not implemented.
- Frontend and Telegram bot UI code were not modified.
- API request/response schemas were not changed.
