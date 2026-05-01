This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
logihub/
  backend/
    constants/
      __init__.py
      order_status.py
      price.py
      user_roles.py
    core/
      __init__.py
      config.py
      database.py
      dependencies.py
      exceptions.py
      security.py
      websocket.py
    migrations/
      versions/
        0001_create_users.py
        0002_create_products.py
        0003_create_orders.py
        0004_create_order_status_log.py
        cdd5b2320fde_init.py
      alembic.ini
      env.py
      script.py.mako
    models/
      __init__.py
      base.py
      order_status_log.py
      order.py
      product.py
      user.py
    routers/
      __init__.py
      analytics.py
      auth.py
      bot.py
      orders.py
      products.py
      users.py
    schemas/
      __init__.py
      analytics.py
      auth.py
      common.py
      order.py
      product.py
      user.py
    services/
      __init__.py
      analytics_service.py
      auth_service.py
      notification_service.py
      order_service.py
      product_service.py
      user_service.py
    .dockerignore
    .env
    .env.example
    create_superuser.py
    current_map.txt
    Dockerfile
    main.py
    requirements.txt
  bot/
    core/
      __init__.py
      config.py
      http_client.py
    handlers/
      __init__.py
      help.py
      my_orders.py
      new_orders.py
      registration.py
      start.py
      status_update.py
    keyboards/
      __init__.py
      main_menu.py
      order_actions.py
      registration.py
    middlewares/
      __init__.py
      courier_auth.py
    services/
      __init__.py
      auth_service.py
      order_service.py
    utils/
      __init__.py
      formatters.py
      validators.py
    .env.example
    Dockerfile
    main.py
    requirements.txt
  frontend/
    app/
      (auth)/
        login/
          page.tsx
        layout.tsx
      (dashboard)/
        analytics/
          page.tsx
        couriers/
          page.tsx
        orders/
          [id]/
            page.tsx
          new/
            page.tsx
          page.tsx
        products/
          page.tsx
        layout.tsx
        page.tsx
      favicon.ico
      globals.css
      layout.tsx
    public/
      file.svg
      globe.svg
      next.svg
      vercel.svg
      window.svg
    src/
      components/
        analytics/
          ProfitChart.tsx
        couriers/
          CourierModal.tsx
          CourierTable.tsx
        dashboard/
          SummaryCards.tsx
        layout/
          AuthGuard.tsx
          Sidebar.tsx
          TopBar.tsx
        orders/
          AssignModal.tsx
          OrderForm.tsx
          OrderTable.tsx
          StatusTimeline.tsx
        products/
          ProductModal.tsx
          ProductTable.tsx
          StockCard.tsx
        ui/
          badge.tsx
          button.tsx
          card.tsx
          dialog.tsx
          input.tsx
          label.tsx
          select.tsx
          skeleton.tsx
          table.tsx
          tabs.tsx
          toast.tsx
      hooks/
        useAnalytics.ts
        useAuth.tsx
        useCouriers.ts
        useOrders.ts
        useProducts.ts
      lib/
        api.ts
        auth.ts
        constants.ts
        formatters.ts
        utils.ts
      types/
        analytics.ts
        api.ts
        order.ts
        product.ts
        user.ts
    .dockerignore
    .gitignore
    AGENTS.md
    CLAUDE.md
    components.json
    Dockerfile
    eslint.config.mjs
    next.config.ts
    package.json
    postcss.config.mjs
    README.md
    tsconfig.json
  .dockerignore
  .env
  .env.example
  .gitignore
  docker-compose.yml
  README.md
architecture.md
CONTEXT.md
current_map.txt
file_tree.md.resolved
FIX_PLAN.md
requirements.txt
roadmap-2.md
ROADMAP.md
```
