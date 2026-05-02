# LogiHub

LogiHub is a comprehensive logistics and delivery management platform consisting of a FastAPI backend, a Next.js frontend dashboard, and a Telegram Bot for courier operations.

## Architecture

* **Backend**: FastAPI (Python), PostgreSQL (Asyncpg + Alembic), Redis.
* **Frontend**: Next.js 16 (App Router), Tailwind CSS, Shadcn UI, Recharts.
* **Telegram Bot**: Aiogram 3 (Python) for couriers to manage their stops and delivery proofs.

## Prerequisites

* Docker & Docker Compose
* Telegram Bot Token (from BotFather)

## Quick Start (Development)

The entire stack can be run seamlessly using Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd LogiHub
   ```

2. **Environment Setup:**
   Create a `.env` file in the `backend` directory (e.g., `backend/.env`) with the following variables:
   ```env
   # PostgreSQL
   DATABASE_URL=postgresql+asyncpg://logihub:logihub_secret@localhost:5432/logihub
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key
   
   # Telegram Bot (Required for courier integration)
   BOT_SECRET=your_telegram_bot_token
   
   # API Configuration (Frontend)
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start the containers:**
   ```bash
   docker-compose up -d --build
   ```
   This will spin up:
   - `postgres` on port 5432
   - `redis` on port 6379
   - `backend` on port 8000
   - `frontend` on port 3000
   - `bot` connected to Telegram

4. **Initialize the Database:**
   The backend container automatically runs Alembic migrations on startup. If you need to seed initial admin accounts or products, connect to the database locally or through the API.
   *By default, the first user registering via the backend `/auth/register` might be an admin, or you can manually update the `role` to `'admin'` in the database.*

5. **Access the Application:**
   - **Dashboard**: `http://localhost:3000`
   - **API Docs (Swagger)**: `http://localhost:8000/docs`

## Features

1. **Order Management**: Create, assign, and track orders across different stages (Draft, Assigned, In Transit, Delivered, Failed).
2. **Courier Routing**: Group orders into routes and optimize delivery flow.
3. **Analytics**: Deep analytical insights into courier performance, product margins, daily trends, and failure reasons.
4. **Real-time Updates**: WebSocket integration to push live updates to the dashboard when order or route statuses change.
5. **Inventory Management**: Track product stock and purchase/sale prices to calculate profit margins.
6. **Telegram Integration**: Couriers interact entirely through a Telegram bot to view routes, mark deliveries complete, and provide photo proofs.

## Production Deployment

For production deployments:
1. Change `network_mode: host` to proper bridged networks in `docker-compose.yml` if not deploying on a single machine where host networking is safe.
2. Change default passwords (`logihub_secret`, `JWT_SECRET`, etc.).
3. Serve the application behind a reverse proxy (like Nginx or Traefik) and configure SSL/TLS certificates.
4. Set up persistent volume backups for PostgreSQL.
