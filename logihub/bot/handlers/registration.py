"""Хендлер регистрации по номеру телефона."""

from typing import Any
from aiogram import F, Router
from aiogram.types import Message, ReplyKeyboardRemove

from bot.core.http_client import BackendClient, BackendClientError
from bot.keyboards.main_menu import build_main_menu
from bot.keyboards.client_menu import build_client_main_menu
from bot.services.auth_service import BotAuthService


router = Router()


@router.message(F.contact)
async def contact_handler(
	message: Message,
	auth_service: BotAuthService,
	order_service: Any, # pass-through for middleware compatibility if needed
) -> None:
	"""Обработка расшаренного контакта."""

	contact = message.contact
	if contact is None:
		return

	# Убеждаемся, что контакт принадлежит пользователю
	if contact.user_id != message.from_user.id:
		await message.answer("Пожалуйста, поделитесь своим собственным контактом.")
		return

	tg_id = message.from_user.id
	phone = contact.phone_number

	try:
		# Вызываем регистрацию в бекенде
		# Используем клиент из auth_service
		await auth_service.client.register_user(phone, tg_id)
		
		# Обновляем кэш авторизации
		await auth_service.refresh()
		user_db = await auth_service.get_user(tg_id)
		
		role = user_db.get("role") if user_db else "courier"
		keyboard = build_client_main_menu() if role == "client" else build_main_menu()
		
		await message.answer(
			f"Регистрация успешна! Ваш номер {phone} привязан к аккаунту.\n"
			"Теперь вы можете полноценно пользоваться ботом.",
			reply_markup=keyboard,
		)
	except BackendClientError as e:
		if e.status_code == 404:
			await message.answer(
				"Пользователь с таким номером телефона не найден в системе.\n"
				"Пожалуйста, обратитесь к менеджеру, чтобы он добавил ваш номер в базу."
			)
		else:
			await message.answer(f"Произошла ошибка при регистрации: {e.detail}")
	except Exception as e:
		await message.answer(f"Что-то пошло не так: {str(e)}")
