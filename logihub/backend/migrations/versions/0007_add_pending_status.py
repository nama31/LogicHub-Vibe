"""add_pending_status

Revision ID: 0007_add_pending_status
Revises: 0006_add_client_role
Create Date: 2026-05-04 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0007_add_pending_status'
down_revision = '0006_add_client_role'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Postgres specific: add 'pending' value to order_status enum
    # We use commit_as_batch is not needed here as it's raw SQL
    op.execute("ALTER TYPE order_status ADD VALUE 'pending'")


def downgrade() -> None:
    pass
