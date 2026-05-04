"""add_product_selling_price

Revision ID: 0008_add_product_selling_price
Revises: 0007_add_pending_status
Create Date: 2026-05-04 19:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0008_add_product_selling_price'
down_revision = '0007_add_pending_status'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('products', sa.Column('selling_price', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('products', 'selling_price')
