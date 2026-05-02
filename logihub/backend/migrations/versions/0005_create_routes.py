"""Создание таблицы routes и добавление route_id/stop_sequence в orders."""

revision = "0005_create_routes"
down_revision = "cdd5b2320fde"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # 1. Create the routes table (must come BEFORE altering orders)
    op.create_table(
        "routes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("courier_id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("label", sa.String(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("draft", "active", "completed", "cancelled", name="route_status"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["courier_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # 2. Add route_id and stop_sequence columns to orders
    op.add_column(
        "orders",
        sa.Column("route_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("stop_sequence", sa.Integer(), nullable=True),
    )

    # 3. Add FK constraint from orders.route_id → routes.id
    op.create_foreign_key(
        "fk_orders_route_id",
        "orders",
        "routes",
        ["route_id"],
        ["id"],
    )

    # 4. Index for quick lookup: all stops belonging to a route in order
    op.create_index(
        "ix_orders_route_id_stop_sequence",
        "orders",
        ["route_id", "stop_sequence"],
    )


def downgrade() -> None:
    op.drop_index("ix_orders_route_id_stop_sequence", table_name="orders")
    op.drop_constraint("fk_orders_route_id", "orders", type_="foreignkey")
    op.drop_column("orders", "stop_sequence")
    op.drop_column("orders", "route_id")
    op.drop_table("routes")
    op.execute("DROP TYPE IF EXISTS route_status")
