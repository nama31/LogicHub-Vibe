"""add_client_role

Revision ID: 0006_add_client_role
Revises: 0005_create_routes
Create Date: 2026-05-04 18:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0006_add_client_role'
down_revision = '0005_create_routes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use op.execute to run raw SQL because op.alter_column doesn't support adding enum values easily in all DBs
    # Postgres specific:
    op.execute("ALTER TYPE user_role ADD VALUE 'client'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values easily. 
    # Usually you'd have to rename the old type, create a new one, and update the column.
    # Given the instructions, we'll leave it as is or do nothing in downgrade for now
    # as it's a non-destructive addition.
    pass
