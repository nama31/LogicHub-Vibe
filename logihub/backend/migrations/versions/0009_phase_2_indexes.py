"""add phase 2 hot path indexes"""

revision = "0009_phase_2_indexes"
down_revision = "5235152486c5"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.create_index(
        "ix_orders_status_created_at",
        "orders",
        ["status", sa.text("created_at DESC")],
        unique=False,
    )
    op.create_index(
        "ix_orders_courier_id_status_created_at",
        "orders",
        ["courier_id", "status", sa.text("created_at DESC")],
        unique=False,
    )
    op.create_index("ix_orders_product_id", "orders", ["product_id"], unique=False)
    op.create_index("ix_orders_customer_phone", "orders", ["customer_phone"], unique=False)
    op.create_index(
        "ix_order_status_log_order_id_changed_at",
        "order_status_log",
        ["order_id", "changed_at"],
        unique=False,
    )
    op.create_index(
        "ix_routes_status_created_at",
        "routes",
        ["status", sa.text("created_at DESC")],
        unique=False,
    )
    op.create_index(
        "ix_routes_courier_id_status",
        "routes",
        ["courier_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_products_stock_quantity_title",
        "products",
        ["stock_quantity", "title"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_products_stock_quantity_title", table_name="products")
    op.drop_index("ix_routes_courier_id_status", table_name="routes")
    op.drop_index("ix_routes_status_created_at", table_name="routes")
    op.drop_index("ix_order_status_log_order_id_changed_at", table_name="order_status_log")
    op.drop_index("ix_orders_customer_phone", table_name="orders")
    op.drop_index("ix_orders_product_id", table_name="orders")
    op.drop_index("ix_orders_courier_id_status_created_at", table_name="orders")
    op.drop_index("ix_orders_status_created_at", table_name="orders")
