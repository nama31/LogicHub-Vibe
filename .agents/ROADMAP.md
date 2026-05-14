# LogiHub — Стратегический Roadmap Разработки (Vibe Coding)

Этот документ представляет собой пошаговый, атомарный план разработки проекта **LogiHub**, спроектированный специально для методологии "vibe coding" с использованием AI-агентов (Claude 3.5 Sonnet в Cursor, Devin, GitHub Copilot).

Ключевой принцип: **Каждый агент получает строго ограниченный контекст и решает только одну задачу (Single Responsibility).** Это исключает галлюцинации и поломки смежных модулей.

---

## Phase 1: База Данных (ORM модели и миграции)
*   **Цель:** Создать точные SQLAlchemy-модели для 4 таблиц и сгенерировать первую миграцию Alembic, гарантируя правильные типы данных (особенно `Integer` для денег).
*   **Идеальный агент:** Claude 3.5 Sonnet (через Cursor Composer).
*   **Необходимый контекст (Что подать на вход):** `CONTEXT.md`, `logihub/backend/models/`, `logihub/backend/migrations/env.py`, `logihub/backend/core/database.py`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Действуй как Senior Database Architect.
Твоя задача — реализовать 4 SQLAlchemy модели в папке `logihub/backend/models/` (user.py, product.py, order.py, order_status_log.py).
СТРОГИЕ ПРАВИЛА:
1. Опирайся на раздел "4. Database Schema" из CONTEXT.md.
2. Все денежные поля (`purchase_price`, `sale_price`, `courier_fee`) должны быть строго типа `Integer` (с комментарием `# tiyins`).
3. Настрой связи (relationship) без `CASCADE` удаления.
4. Настрой `core/database.py` для асинхронной работы с asyncpg.
5. Подключи модели в `migrations/env.py` (задай target_metadata).
Ничего не придумывай сверх схемы. Не пиши бизнес-логику и роутеры.
```
*   **Критерий приемки:** Выполнить в терминале `alembic revision --autogenerate -m "init"` и `alembic upgrade head`. База должна создаться без ошибок.

---

## Phase 2: Схемы Валидации (Pydantic)
*   **Цель:** Реализовать схемы запросов и ответов для всех сущностей, обеспечив строгую валидацию входящих данных.
*   **Идеальный агент:** Claude 3.5 Sonnet.
*   **Необходимый контекст:** `CONTEXT.md`, `logihub/backend/models/`, `logihub/backend/schemas/`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Действуй как Senior Backend Engineer.
Твоя задача — написать Pydantic-схемы в `logihub/backend/schemas/` для сущностей: auth, product, order, user, analytics.
СТРОГИЕ ПРАВИЛА:
1. Используй `Field(...)` для валидации (например, `ge=0` для цен и остатков).
2. Для DTO ответа используй `Config.from_attributes = True` (ORM режим).
3. Обрати внимание, что фронтенд присылает `purchase_price_som` (float), а в схемах создания/обновления (Create/Update) мы должны парсить это (или принимать в тийынах — сверься с CONTEXT.md). Строго следуй описанию эндпоинтов в разделе "7" и "8" CONTEXT.md (там сказано, что принимаются поля с суффиксом `_som`).
Не трогай файлы роутеров и сервисов.
```
*   **Критерий приемки:** Код проходит проверку типов (mypy) или `pylance`. Схемы содержат все поля из CONTEXT.md.

---

## Phase 3: Аутентификация и Пользователи (Backend CRUD)
*   **Цель:** Реализовать выдачу JWT токена, проверку прав (Admin) и управление курьерами.
*   **Идеальный агент:** Claude 3.5 Sonnet.
*   **Необходимый контекст:** `CONTEXT.md`, `logihub/backend/core/security.py`, `logihub/backend/core/dependencies.py`, `logihub/backend/services/auth_service.py`, `logihub/backend/services/user_service.py`, `logihub/backend/routers/auth.py`, `logihub/backend/routers/users.py`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — реализовать бизнес-логику и API-роутеры для `/auth` (login, me) и `/users` (CRUD).
СТРОГИЕ ПРАВИЛА:
1. Логин должен работать как по `tg_id`, так и по `password` (если задан), как описано в п. 6.1 CONTEXT.md.
2. В `core/dependencies.py` реализуй `get_current_user` и `require_admin`.
3. Все эндпоинты `/users` должны быть защищены `require_admin`.
4. Пароли хешируй через bcrypt (`core/security.py`).
Не пиши код для товаров и заказов.
```
*   **Критерий приемки:** Запустить сервер. В `/docs` (Swagger) можно дернуть `/auth/login` и получить валидный токен, а затем создать курьера через `POST /users`.

---

## Phase 4: Ядро Логики — Товары и Заказы (Backend)
*   **Цель:** Реализовать CRUD товаров и заказов с триггерами (списание остатков, логирование статусов).
*   **Идеальный агент:** Claude 3.5 Sonnet.
*   **Необходимый контекст:** `CONTEXT.md`, `logihub/backend/services/product_service.py`, `logihub/backend/services/order_service.py`, `logihub/backend/routers/products.py`, `logihub/backend/routers/orders.py`, `logihub/backend/constants/`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — реализовать эндпоинты и сервисы для `/products` и `/orders`.
Это САМАЯ ВАЖНАЯ ЧАСТЬ. Строго соблюдай правила:
1. При создании заказа (`POST /orders`) делай декремент `stock_quantity` у товара. Если остатка не хватает — кидай 422 ошибку.
2. При ЛЮБОМ изменении статуса заказа создавай запись в `order_status_log` с фиксацией `old_status` и `new_status` и `changed_by`.
3. Все расчеты денег строго в тийынах (`Integer`). Для конвертации используй утилиты из `constants/price.py`.
4. Реализуй эндпоинт `POST /orders/:id/assign`.
Не трогай аналитику и бота.
```
*   **Критерий приемки:** Успешное создание товара и заказа в Swagger. Остаток товара должен уменьшиться в базе.

---

## Phase 5: Аналитика и Агрегация (Backend)
*   **Цель:** Написать сложные SQL-запросы (или SQLAlchemy-агрегации) для подсчета чистой прибыли и дашборда.
*   **Идеальный агент:** Claude 3.5 Sonnet.
*   **Необходимый контекст:** `CONTEXT.md`, `logihub/backend/services/analytics_service.py`, `logihub/backend/routers/analytics.py`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — реализовать эндпоинты `/analytics/summary` и `/analytics/profit`.
СТРОГИЕ ПРАВИЛА:
1. Используй асинхронные функции SQLAlchemy (`func.sum`, `func.count`).
2. Чистая прибыль считается как: `sum((sale_price - purchase_price) * quantity - courier_fee)`. Не забывай, что purchase_price лежит в таблице products (нужен JOIN).
3. Соблюдай формат ответа, описанный в разделе 10 CONTEXT.md.
```
*   **Критерий приемки:** Эндпоинты в Swagger возвращают корректный JSON без 500 ошибок на тестовых данных.

---

## Phase 6: Telegram Бот (Инфраструктура и API)
*   **Цель:** Интеграция aiogram 3.x с FastAPI, обработка кнопок курьера.
*   **Идеальный агент:** Devin (или Claude 3.5 Sonnet).
*   **Необходимый контекст:** `CONTEXT.md`, вся папка `logihub/bot/`, `logihub/backend/routers/bot.py`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — реализовать логику Telegram-бота на aiogram 3.x и эндпоинт связи в FastAPI.
СТРОГИЕ ПРАВИЛА:
1. В FastAPI реализуй `PATCH /bot/orders/:id/status` (защищен хидером X-Bot-Secret, без JWT). Он должен менять статус и писать в лог.
2. В боте реализуй `middlewares/courier_auth.py` (бот должен проверять `tg_id` курьера через API бекенда `/users?role=courier` или свой кэш, чтобы не пускать чужих).
3. Напиши хендлеры для кнопок: "Взял в работу", "Доставлено", "Проблема" (они бьют в PATCH-эндпоинт бекенда).
```
*   **Критерий приемки:** Бот отвечает на `/start`, если курьер заведен в БД. При нажатии на inline-кнопку статус заказа в БД меняется.

---

## Phase 7: Frontend — Архитектура и Auth
*   **Цель:** Базовая настройка Next.js, API-клиента с интерцепторами, стейт-менеджмент авторизации.
*   **Идеальный агент:** Claude 3.5 Sonnet (Cursor Composer).
*   **Необходимый контекст:** `CONTEXT.md`, `logihub/frontend/src/lib/api.ts`, `logihub/frontend/src/hooks/useAuth.ts`, `logihub/frontend/app/(auth)/login/page.tsx`, `logihub/frontend/components/layout/AuthGuard.tsx`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — настроить слой авторизации во frontend-приложении Next.js.
СТРОГИЕ ПРАВИЛА:
1. В `lib/api.ts` реализуй fetch-клиент. Он должен автоматически подставлять Bearer токен из `localStorage` во все запросы.
2. В случае ответа 401 от бекенда клиент должен удалять токен и редиректить на `/login`.
3. Напиши страницу логина `/login` и `useAuth` хук. Сделай красивую форму с shadcn/ui.
4. Доработай `AuthGuard.tsx`, чтобы он закрывал защищенные роуты.
Не делай страницы заказов или товаров.
```
*   **Критерий приемки:** Успешный вход по паролю через форму, токен сохраняется, происходит редирект на `/`. При удалении токена выкидывает обратно.

---

## Phase 8: Frontend — Товары и Курьеры
*   **Цель:** Разработать UI для справочников (Склад и Сотрудники).
*   **Идеальный агент:** Claude 3.5 Sonnet.
*   **Необходимый контекст:** `CONTEXT.md`, `logihub/frontend/app/(dashboard)/products/`, `logihub/frontend/app/(dashboard)/couriers/`, соответствующие компоненты и хуки.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — реализовать страницы управления товарами (`/products`) и курьерами (`/couriers`).
СТРОГИЕ ПРАВИЛА:
1. Используй shadcn/ui таблицы и модалки.
2. Важно: с бекенда цены приходят как целые числа (тийыны) ИЛИ как готовые флоты (`_som`), проверь схемы. На UI нужно всегда отображать пользователю СОМЫ. Если нужно, используй `tiyins_to_som` из `lib/formatters.ts`.
3. Реализуй хуки `useProducts` и `useCouriers` (на базе SWR или кастомного useEffect+fetch).
```
*   **Критерий приемки:** Можно добавить товар и курьера через UI, они появляются в таблице без перезагрузки страницы.

---

## Phase 9: Frontend — Управление Заказами (Сложный UI)
*   **Цель:** Интерактивная таблица заказов, форма создания и модалка назначения курьеров.
*   **Идеальный агент:** Claude 3.5 Sonnet.
*   **Необходимый контекст:** `CONTEXT.md`, все файлы в `logihub/frontend/src/components/orders/`, `logihub/frontend/app/(dashboard)/orders/`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — реализовать флоу управления заказами. Это ядро системы.
СТРОГИЕ ПРАВИЛА:
1. Реализуй `OrderTable` с фильтрами по статусам (используй бейджи разных цветов из shadcn).
2. Форма создания `OrderForm` должна иметь дропдауны для выбора товара (с отображением текущего остатка!) и опционально курьера.
3. Модалка `AssignModal` должна вызывать `POST /orders/:id/assign`.
4. На странице деталей `/orders/[id]` отобрази `StatusTimeline`.
```
*   **Критерий приемки:** Успешное создание заказа, визуальное отличие статусов, успешное назначение курьера через UI.

---

## Phase 10: Frontend — Аналитика и Дашборд
*   **Цель:** Инфографика, Recharts и сводные карточки.
*   **Идеальный агент:** GitHub Copilot / Claude 3.5 Sonnet.
*   **Необходимый контекст:** `CONTEXT.md`, `logihub/frontend/app/(dashboard)/page.tsx`, `logihub/frontend/src/components/analytics/ProfitChart.tsx`, `logihub/frontend/src/components/dashboard/SummaryCards.tsx`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — доделать главную страницу (Дашборд) и графики аналитики.
СТРОГИЕ ПРАВИЛА:
1. На дашборде используй `SummaryCards` для вывода данных из `/analytics/summary`. Особо выдели блок "stock_alerts" красным цветом.
2. Интегрируй `Recharts` в `ProfitChart` для отображения массива `breakdown` из `/analytics/profit`.
```
*   **Критерий приемки:** При входе на главную страницу рисуются красивые графики и цифры чистой прибыли, загруженные с бекенда.

---

### Как работать с этим планом:
1. Копируй **ГОТОВЫЙ ПРОМПТ** из каждой фазы.
2. Прикрепляй к чату (через `@` в Cursor или загрузкой файлов) строго те файлы, которые указаны в **Необходимый контекст**. *Обязательно всегда прикрепляй `CONTEXT.md`*.
3. Проверяй по **Критерию приемки** перед переходом к следующей фазе.
4. Если ИИ стопорится — проси его сделать шаг назад и исправить конкретную ошибку, ссылаясь на номер фазы.
