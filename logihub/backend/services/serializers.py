"""Shared response serialization helpers."""

from typing import Iterable

from constants.price import tiyins_to_som
from models.order import Order
from models.product import Product

def serialize_product_prices(product: Product) -> Product:
    """Attach display price fields expected by response schemas."""
    product.purchase_price_som = tiyins_to_som(product.purchase_price)
    product.selling_price_som = tiyins_to_som(product.selling_price)
    return product


def serialize_order_prices(order: Order) -> Order:
    order.sale_price_som = tiyins_to_som(order.sale_price)
    order.courier_fee_som = tiyins_to_som(order.courier_fee)
    purchase_price = order.product.purchase_price if order.product is not None else 0
    order.net_profit_som = tiyins_to_som(
        (order.sale_price - purchase_price) * order.quantity - order.courier_fee
    )
    if order.product is not None:
        order.product = serialize_product_prices(order.product)
    return order


def serialize_order_collection(orders: Iterable[Order]) -> list[Order]:
    return [serialize_order_prices(order) for order in orders]
