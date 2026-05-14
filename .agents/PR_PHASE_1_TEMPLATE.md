## Summary

Executes Phase 1 of `BACKEND_OPTIMIZATION_PLAN.md` for backend dead code elimination and consolidation only.

## Removed

- Deleted unused `logihub/backend/schemas/common.py` after verifying `ErrorResponse` and `PaginationParams` were unreferenced.
- Deleted placeholder `logihub/backend/core/exceptions.py` after verifying `core.exceptions` was unreferenced.
- Removed dead `urllib` imports from `logihub/backend/services/notification_service.py`.
- Removed unused `RouteListItem` import from `logihub/backend/routers/routes.py`.
- Removed unused batch-order notification locals from `logihub/backend/routers/bot.py`.
- Removed unreferenced `STATUS_LABELS_RU` from `logihub/backend/constants/order_status.py`.

## Consolidated

- Added `logihub/backend/services/serializers.py` for shared product/order price serialization.
- Updated product and order services to use shared serialization helpers while preserving response fields.
- Added `_get_order_with_relationships` in `logihub/backend/services/order_service.py` to replace repeated order reload blocks.
- Added `logihub/backend/services/bot_lookup_service.py` for repeated active client, active courier, admin, and client-by-phone lookups.
- Updated bot router and notification service to use shared lookup helpers without changing API routes or response shapes.

## Verification

- `python -m py_compile` passed for all modified backend Python files.
- Import smoke check passed for modified routers/services with `PYTHONPATH=logihub/backend`.
- Alembic migration files were left unchanged per Phase 1 item 1.8.

## Scope Guard

- Phase 2/3 database optimization, indexes, row locks, pagination, transaction boundaries, and security changes were intentionally not implemented.
- Frontend and Telegram bot UI code were not modified.
