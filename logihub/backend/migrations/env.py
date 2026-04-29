"""Среда миграций Alembic."""

from __future__ import annotations

import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

sys.path.append(str(Path(__file__).resolve().parents[1]))

from models import Base  # noqa: E402


config = context.config

if config.config_file_name is not None:
	try:
		fileConfig(config.config_file_name)
	except KeyError:
		pass


def _load_database_url() -> str:
	"""Load DATABASE_URL from the environment or a local .env file."""

	for env_path in (Path(__file__).resolve().parents[2] / ".env", Path(__file__).resolve().parents[1] / ".env"):
		if env_path.exists():
			for line in env_path.read_text(encoding="utf-8").splitlines():
				if line.startswith("DATABASE_URL="):
					return line.split("=", 1)[1].strip()

	database_url = os.getenv("DATABASE_URL")
	if database_url:
		return database_url

	raise RuntimeError("DATABASE_URL is not set. Create logihub/.env or export DATABASE_URL before running Alembic.")


config.set_main_option("sqlalchemy.url", _load_database_url())

target_metadata = Base.metadata


def run_migrations_offline() -> None:
	"""Run migrations in offline mode."""

	url = config.get_main_option("sqlalchemy.url")
	context.configure(
		url=url,
		target_metadata=target_metadata,
		literal_binds=True,
		dialect_opts={"paramstyle": "named"},
		compare_type=True,
	)

	with context.begin_transaction():
		context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
	"""Run migrations against a live connection."""

	context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)

	with context.begin_transaction():
		context.run_migrations()


async def run_migrations_online() -> None:
	"""Run migrations in online mode."""

	connectable = async_engine_from_config(
		config.get_section(config.config_ini_section) or {},
		prefix="sqlalchemy.",
		poolclass=pool.NullPool,
	)

	async with connectable.connect() as connection:
		await connection.run_sync(do_run_migrations)

	await connectable.dispose()


if context.is_offline_mode():
	run_migrations_offline()
else:
	asyncio.run(run_migrations_online())
