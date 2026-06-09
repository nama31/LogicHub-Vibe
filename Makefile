.PHONY: install db-up db-down run-backend run-frontend run-bot run-all deploy help

# Load environment variables for local development
ifneq (,$(wildcard logihub/.env))
    include logihub/.env
    export $(shell sed 's/=.*//' logihub/.env)
endif

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies for all services locally
	@echo "Installing Backend dependencies..."
	cd logihub/backend && pip install -r requirements.txt
	@echo "Installing Frontend dependencies..."
	cd logihub/frontend && pnpm install
	@echo "Installing Bot dependencies..."
	cd logihub/bot && pip install -r requirements.txt

db-up: ## Start local PostgreSQL and Redis using Docker (optional, if needed for local dev)
	cd logihub && docker-compose up -d db redis

db-down: ## Stop local PostgreSQL and Redis
	cd logihub && docker-compose stop db redis

run-backend: ## Run FastAPI backend locally
	cd logihub/backend && ../../.venv/bin/alembic -c migrations/alembic.ini upgrade head && ../../.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload

run-frontend: ## Run Next.js frontend locally
	cd logihub/frontend && NEXT_PUBLIC_API_URL=http://localhost:8000 pnpm dev

run-bot: ## Run Telegram bot locally
	cd logihub && BACKEND_URL=http://localhost:8000 ../.venv/bin/python -m bot.main

run-all: ## Run all services locally using a simple background job wrapper (stop with Ctrl+C)
	@echo "Starting all services..."
	@make run-backend & make run-frontend & make run-bot & wait

deploy: ## Deploy to DigitalOcean Droplet
	@echo "Starting deployment script..."
	./deploy.sh
