"""Среда миграций Alembic."""

from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# TODO: implement async config and target_metadata
