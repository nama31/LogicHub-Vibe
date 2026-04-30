# LogiHub — Стратегический Roadmap Разработки: Часть 2 (Frontend)

Этот документ представляет собой пошаговый план разработки **Frontend-части** проекта **LogiHub** (Next.js 14), основываясь на уже готовом backend-API и созданной структуре папок.

Ключевой принцип: **Каждый агент получает строго ограниченный контекст и решает только одну задачу (Single Responsibility).**

### 🎨 Design System (Стиль: Welcoming and Easy)
Все компоненты UI должны строго использовать следующую цветовую палитру (никаких базовых generic цветов):
- **Cream** (Фон приложения, светлые подложки): HEX `#EEE8DF` (238, 232, 223)
- **Beige** (Вторичные элементы, бордеры, неактивные стейты): HEX `#C4BCB0` (196, 188, 176)
- **Deep Ocean** (Текст, акценты, первичные кнопки, активные элементы): HEX `#2C365A` (44, 54, 90)

Дизайн должен ощущаться премиальным, современным (используй плавные тени, закругленные углы) и интуитивно понятным (easy to use).

---

## Phase 7: API Client & Authentication State
*   **Цель:** Реализовать базовый `lib/api.ts` с интерцепторами, хук `useAuth.ts` и страницу логина `/login`.
*   **Идеальный агент:** Devin AI (Opus Model)
*   **Необходимый контекст:** `CONTEXT.md`, `architecture.md` (раздел 6), `logihub/frontend/src/lib/api.ts`, `logihub/frontend/src/lib/auth.ts`, `logihub/frontend/src/hooks/useAuth.ts`, `logihub/frontend/app/(auth)/login/page.tsx`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Действуй как Senior Frontend Engineer.
Твоя задача — реализовать слой авторизации в Next.js.
СТРОГИЕ ПРАВИЛА:
1. В `src/lib/api.ts` создай инстанс axios или fetch-обертку, которая берет токен из `localStorage` и подставляет в заголовок `Authorization: Bearer ...`. Если сервер отвечает 401, токен нужно удалить и перенаправить на `/login`. (Учти, что бекенд уже имеет CORSMiddleware для localhost:3000).
2. Реализуй хук `src/hooks/useAuth.ts` для логина и получения текущего пользователя (`/auth/login` и `/auth/me`). Сохраняй токен в `localStorage`.
3. Сверстай страницу логина в `app/(auth)/login/page.tsx` с использованием shadcn/ui. 
4. ДИЗАЙН: Используй палитру: Cream (#EEE8DF) для фона, Deep Ocean (#2C365A) для кнопок и текста, Beige (#C4BCB0) для бордеров формы. Сделай дизайн приветливым (welcoming and easy). Логин возможен по `tg_id` или `password`.
Не трогай компоненты Layout или другие страницы.
```
*   **Критерий приемки:** Успешный вход через UI `/login`, сохранение токена в браузере, API клиент корректно прикрепляет токен к последующим запросам.

---

## Phase 8: Layout & AuthGuard
*   **Цель:** Реализовать защищенный слой для дашборда, боковую панель (Sidebar) и верхнюю панель (TopBar).
*   **Идеальный агент:** Devin AI (Opus Model)
*   **Необходимый контекст:** `logihub/frontend/src/components/layout/AuthGuard.tsx`, `logihub/frontend/src/components/layout/Sidebar.tsx`, `logihub/frontend/src/components/layout/TopBar.tsx`, `logihub/frontend/app/(dashboard)/layout.tsx`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Действуй как Frontend Engineer.
Твоя задача — реализовать каркас приложения (Layout) для авторизованной зоны.
СТРОГИЕ ПРАВИЛА:
1. В `AuthGuard.tsx` используй `useAuth`. Если нет токена или юзера, показывай красивый лоадер цвета Deep Ocean (#2C365A) или редиректи на `/login`.
2. В `Sidebar.tsx` сделай навигационное меню со ссылками. Подсвечивай активный роут фоном цвета Deep Ocean (#2C365A) и текстом Cream (#EEE8DF). Сам Sidebar должен быть цвета Cream (#EEE8DF) с тонкими границами Beige (#C4BCB0).
3. В `TopBar.tsx` выведи имя текущего пользователя (Deep Ocean) и кнопку "Выйти".
4. Собери все вместе в `app/(dashboard)/layout.tsx`. Весь глобальный фон приложения должен быть Cream (#EEE8DF).
```
*   **Критерий приемки:** При заходе на `/` без токена — редирект на `/login`. С токеном — отображается стильный Sidebar и пустая страница дашборда на кремовом фоне.

---

## Phase 9: Управление Товарами (Склад)
*   **Цель:** Разработать страницу товаров, хук `useProducts` и модалку создания/редактирования.
*   **Идеальный агент:** Devin AI (Opus Model)
*   **Необходимый контекст:** `CONTEXT.md` (раздел 4 и 7), `logihub/frontend/src/hooks/useProducts.ts`, `logihub/frontend/src/components/products/`, `logihub/frontend/app/(dashboard)/products/page.tsx`, `logihub/frontend/src/lib/formatters.ts`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — реализовать раздел "Склад" (Товары).
СТРОГИЕ ПРАВИЛА:
1. Реализуй API вызовы в `hooks/useProducts.ts` (GET /products, POST /products, PATCH /products).
2. В `ProductTable.tsx` используй таблицу из shadcn/ui. Настрой стили таблицы под нашу палитру (текст заголовков Deep Ocean, бордеры Beige, чередование строк с легким кремовым оттенком для читаемости). Выведи колонки: Название, Цена, Остаток, Ед. изм.
3. Создай `ProductModal.tsx` с формой (React Hook Form + Zod) для добавления и изменения товара. Используй закругленные углы и чистый, "воздушный" UI.
4. Везде на UI показывай цены в СОМАХ (не в тийынах). Используй утилиты из `formatters.ts`.
5. Собери все на странице `app/(dashboard)/products/page.tsx`.
```
*   **Критерий приемки:** Добавление товара через UI мгновенно обновляет таблицу. Дизайн таблицы легкий и легко читаемый.

---

## Phase 10: Управление Курьерами
*   **Цель:** Разработать страницу справочника курьеров.
*   **Идеальный агент:** Devin AI (Opus Model)
*   **Необходимый контекст:** `logihub/frontend/src/hooks/useCouriers.ts`, `logihub/frontend/src/components/couriers/`, `logihub/frontend/app/(dashboard)/couriers/page.tsx`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — реализовать раздел управления курьерами.
СТРОГИЕ ПРАВИЛА:
1. Напиши логику в `hooks/useCouriers.ts` (запрос `GET /users?role=courier` и создание `POST /users`).
2. Сделай `CourierTable.tsx` с отображением: Имя, Telegram ID, Телефон, Статус. Используй мягкие цвета для бейджей статуса (например, Deep Ocean для "активен" и Beige для "неактивен").
3. Создай `CourierForm.tsx` (или модалку) для регистрации нового курьера. Обязательно поле `tg_id`. Модалка должна гармонировать с дизайном (Cream фон, Deep Ocean кнопки).
4. Собери все на `app/(dashboard)/couriers/page.tsx`.
```
*   **Критерий приемки:** Успешное создание курьера с tg_id. Интерфейс выглядит консистентно.

---

## Phase 11: Управление Заказами — Ядро Системы
*   **Цель:** Создание, список и назначение заказов.
*   **Идеальный агент:** Devin AI (Opus Model)
*   **Необходимый контекст:** `CONTEXT.md` (раздел 8), `logihub/frontend/src/hooks/useOrders.ts`, `logihub/frontend/src/components/orders/`, `logihub/frontend/app/(dashboard)/orders/`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — реализовать сложный UI для заказов.
СТРОГИЕ ПРАВИЛА:
1. В `hooks/useOrders.ts` реализуй CRUD и `POST /orders/:id/assign`. (Бекенд использует BackgroundTasks для уведомлений в Telegram, так что ответ будет быстрым).
2. В `OrderTable.tsx` выведи список заказов. Используй бейджи shadcn/ui/badge, стилизуй их так, чтобы они гармонировали с палитрой (используй оттенки Deep Ocean и Beige, избегай резких базовых цветов вроде чисто зеленого или красного).
3. `OrderForm.tsx` (на `/orders/new`) должен иметь `Select` для товара и поля для цены/адреса. Форма должна выглядеть "воздушной" (welcoming and easy).
4. `AssignModal.tsx` — модалка назначения курьера.
5. На `[id]/page.tsx` отобрази `StatusTimeline.tsx` (используй красивые микро-анимации и чистые линии).
```
*   **Критерий приемки:** Оформление нового заказа, уменьшение остатка на складе, успешное назначение курьера через красивую и интуитивно понятную модалку.

---

## Phase 12: Аналитика и Главная страница (Dashboard)
*   **Цель:** Визуализация прибыли и виджеты.
*   **Идеальный агент:** Devin AI (Opus Model)
*   **Необходимый контекст:** `logihub/frontend/src/hooks/useAnalytics.ts`, `logihub/frontend/src/components/analytics/ProfitChart.tsx`, `logihub/frontend/src/components/dashboard/SummaryCards.tsx`, `logihub/frontend/app/(dashboard)/page.tsx`, `logihub/frontend/app/(dashboard)/analytics/page.tsx`.
*   **ГОТОВЫЙ ПРОМПТ:**
```text
Твоя задача — доделать графики и дашборд.
СТРОГИЕ ПРАВИЛА:
1. Реализуй хук `hooks/useAnalytics.ts` для `/analytics/summary` и `/analytics/profit`. (Данные из /summary кешируются в Redis на бекенде, ответ моментальный).
2. На главной странице (`app/(dashboard)/page.tsx`) используй `SummaryCards.tsx`. Фон карточек должен быть белым или светлым Cream (#EEE8DF), с тонким бордером Beige (#C4BCB0), текст цифр - Deep Ocean (#2C365A).
3. В `ProfitChart.tsx` используй `recharts`. Цвет линии графика должен быть строго Deep Ocean (#2C365A). 
4. На странице `/analytics` размести `ProfitChart` и добавь выбор дат. Убедись, что все элементы управления датами выглядят мягко (welcoming and easy to use).
Все суммы денег переводи из тийынов в сомы для отображения!
```
*   **Критерий приемки:** Красивые карточки на главной с реальными цифрами из API. График корректно рисуется с помощью Recharts в фирменном цвете Deep Ocean.

---

### Итоговые чек-пойнты (E2E Test)
*   [ ] Администратор логинится в веб-панель.
*   [ ] Создает товар (задает цену закупки и остаток).
*   [ ] Создает курьера.
*   [ ] Создает заказ (указывает цену продажи).
*   [ ] Назначает курьера на заказ.
*   [ ] Курьер (в Telegram) нажимает "Взял в работу", затем "Доставлено".
*   [ ] Администратор видит обновленный статус в Next.js и посчитанную прибыль на дашборде.
