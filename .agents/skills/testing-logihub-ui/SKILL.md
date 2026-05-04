---
name: testing-logihub-ui
description: Test the LogiHub frontend end-to-end with the local Docker stack. Use when verifying dashboard, orders, inventory, users, routes, analytics, forms, modals, or design-system changes.
---

# LogiHub UI E2E Testing

## Devin Secrets Needed

- No external secrets are needed for local Docker-backed testing.
- Use local admin credentials only after creating/confirming them in the local backend container: username `aman`, password `admin`.

## Local Environment

- Repo root: `/home/ubuntu/repos/LogicHub-Vibe`
- Frontend app: `logihub/frontend`
- Frontend URL: `http://localhost:3000`
- Backend URL: `http://localhost:8000`
- Health check: `http://localhost:8000/health` should return `{"status":"ok"}`

If dependencies are stale, follow the repo environment maintenance command: `cd logihub/frontend && pnpm install`.

## Setup Checklist

1. Confirm Docker services are running for database, Redis, backend, and frontend.
2. Confirm the backend health endpoint responds successfully.
3. Create or confirm a local admin account with the backend helper script if needed.
4. Seed deterministic test data before visual checks when verifying dashboard/analytics states:
   - low-stock products for dashboard inventory alerts
   - failed orders with distinct notes for analytics failed-reason bars
   - at least one active courier for assign-modal checks
5. Verify login through the browser at `/login` before starting the main test flow.

## Recommended Browser Test Flow

Record the browser session when testing visual UI changes and annotate major assertions.

1. Login validation:
   - Submit invalid credentials.
   - Confirm destructive validation text is visually distinct from normal labels.
   - Login with the local admin account.
2. Dashboard:
   - Confirm cards use the Cream/Beige/Deep Ocean palette.
   - Confirm seeded low-stock products appear in the low-stock panel.
3. Analytics:
   - Open `/analytics` and switch to the failed-delivery tab.
   - Confirm all seeded failed-reason bars are visible against the card background.
4. Products:
   - Open the products page.
   - Open add-product modal and submit empty fields to check validation styling.
   - Open restock modal for a seeded product and compare dialog/button/input styling.
5. Orders:
   - Open orders list and verify filters/table/status styling.
   - Open new-order form and submit invalid data to check validation styling.
   - Create a minimal unassigned order if an assign-modal trigger is needed.
   - Open assign modal and verify its dialog/button/select styling.
6. Users:
   - Switch between couriers and clients tabs.
   - Open add-user modal and submit empty fields to check validation styling.
7. Routes:
   - Open routes page and switch status filters.
   - Confirm empty state/cards/buttons use the unified palette.

## Evidence and Reporting

- Capture full-screen screenshots of key pass/fail states.
- Stop the recording and attach it to the final report if browser testing was performed.
- Include any browser console warnings in the report, even if non-blocking.
- Post one concise PR comment with runtime E2E results when testing a PR.

## Notes

- The frontend may emit local dev-server Fast Refresh or WebSocket reconnect logs; report them if seen, but do not treat them as failures unless they block the flow.
- Recharts may briefly warn about `width(-1) and height(-1)` during refresh/HMR; verify the chart visually before deciding whether this is a runtime failure.
