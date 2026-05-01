"""Хендлер регистрации по номеру телефона."""

from typing import Any
from aiogram import F, Router
from aiogram.types import Message, ReplyKeyboardRemove

from bot.core.http_client import BackendClient, BackendClientError
from bot.keyboards.main_menu import build_main_menu
from bot.services.auth_service import CourierAuthService


router = Router()


@router.message(F.contact)
async def contact_handler(
	message: Message,
	auth_service: CourierAuthService,
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
		await auth_service.client.register_courier(phone, tg_id)
		
		# Обновляем кэш авторизации
		await auth_service.refresh()
		
		await message.answer(
			f"Регистрация успешна! Ваш номер {phone} привязан к аккаунту.\n"
			"Теперь вы можете полноценно пользоваться ботом.",
			reply_markup=build_main_menu(),
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
