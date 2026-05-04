"""Состояния FSM для заказа клиента."""

from aiogram.fsm.state import State, StatesGroup


class ClientOrderStates(StatesGroup):
    """Состояния заказа."""
    selecting_product = State()
    entering_quantity = State()
    choosing_next_action = State()
    entering_address = State()
    entering_note = State()
    confirming = State()
