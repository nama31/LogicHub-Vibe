#!/bin/sh
set -e

echo "==> Running Alembic migrations..."
alembic -c migrations/alembic.ini upgrade head

echo "==> Starting uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
