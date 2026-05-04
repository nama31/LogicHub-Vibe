"""HTTP-клиент бота для backend API."""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from bot.core.config import settings


@dataclass(slots=True)
class BackendClientError(RuntimeError):
	"""Ошибка при вызове backend API."""

	status_code: int
	detail: str


class BackendClient:
	"""Минимальный async HTTP клиент на базе stdlib."""

	def __init__(self, base_url: str | None = None) -> None:
		self._base_url = (base_url or settings.backend_url).rstrip("/")

	async def close(self) -> None:
		"""Совместимый интерфейс закрытия."""

		return None

	async def request(
		self,
		method: str,
		path: str,
		*,
		json_body: dict[str, Any] | None = None,
		headers: dict[str, str] | None = None,
		query: dict[str, Any] | None = None,
	) -> Any:
		"""Выполнить запрос к backend и вернуть распарсенный JSON."""

		return await asyncio.to_thread(self._request_sync, method, path, json_body, headers, query)

	def _request_sync(
		self,
		method: str,
		path: str,
		json_body: dict[str, Any] | None,
		headers: dict[str, str] | None,
		query: dict[str, Any] | None,
	) -> Any:
		url = f"{self._base_url}{path}"
		if query:
			query_string = urlencode({key: value for key, value in query.items() if value is not None})
			if query_string:
				url = f"{url}?{query_string}"

		payload = None if json_body is None else json.dumps(json_body).encode("utf-8")
		request_headers = {"Accept": "application/json"}
		if payload is not None:
			request_headers["Content-Type"] = "application/json"
		if headers:
			request_headers.update(headers)

		request = Request(url, data=payload, headers=request_headers, method=method.upper())

		try:
			with urlopen(request, timeout=10) as response:
				body = response.read().decode("utf-8")
				return json.loads(body) if body else {}
		except HTTPError as error:
			body = error.read().decode("utf-8") if error.fp else error.reason
			raise BackendClientError(error.code, body) from error
		except URLError as error:
			raise BackendClientError(503, str(error.reason)) from error

	async def fetch_courier_tg_ids(self) -> set[int]:
		"""Получить список tg_id курьеров из backend."""

		payload = await self.request(
			"GET",
			"/users",
			headers={"X-Bot-Secret": settings.bot_secret},
			query={"role": "courier"},
		)

		users = payload.get("users", payload) if isinstance(payload, dict) else payload
		courier_ids: set[int] = set()
		for user in users or []:
			if user.get("role") != "courier":
				continue
			if not user.get("is_active", True):
				continue
			tg_id = user.get("tg_id")
			if tg_id is not None:
				courier_ids.add(int(tg_id))
		return courier_ids

	async def update_order_status(self, order_id: str, tg_id: int, new_status: str, reason: str | None = None) -> dict[str, Any]:
		"""Отправить статус заказа в backend."""

		json_body: dict[str, Any] = {"tg_id": tg_id, "new_status": new_status}
		if reason:
			json_body["reason"] = reason

		payload = await self.request(
			"PATCH",
			f"/bot/orders/{order_id}/status",
			headers={"X-Bot-Secret": settings.bot_secret},
			json_body=json_body,
		)

		return payload if isinstance(payload, dict) else {"result": payload}

	async def register_user(self, phone: str, tg_id: int) -> dict[str, Any]:
		"""Зарегистрировать пользователя по номеру телефона."""

		payload = await self.request(
			"POST",
			"/bot/register",
			headers={"X-Bot-Secret": settings.bot_secret},
			json_body={"phone": phone, "tg_id": tg_id},
		)

		return payload

	async def fetch_courier_orders(self, tg_id: int, status_filter: str | None = None) -> list[dict[str, Any]]:
		"""Получить список заказов курьера."""

		payload = await self.request(
			"GET",
			"/bot/orders",
			headers={"X-Bot-Secret": settings.bot_secret},
			query={"tg_id": tg_id, "status": status_filter},
		)

		return payload if isinstance(payload, list) else []

	async def fetch_active_route(self, tg_id: int) -> dict | None:
		"""Получить активный маршрут курьера (статус 'active')."""

		try:
			payload = await self.request(
				"GET",
				"/bot/routes/active",
				headers={"X-Bot-Secret": settings.bot_secret},
				query={"tg_id": tg_id},
			)
			return payload if isinstance(payload, dict) else None
		except BackendClientError:
			return None

	async def fetch_route_by_id(self, route_id: str) -> dict | None:
		"""Получить полный маршрут по ID."""

		try:
			return await self.request(
				"GET",
				f"/bot/routes/by-id/{route_id}",
				headers={"X-Bot-Secret": settings.bot_secret},
			)
		except BackendClientError:
			return None

	async def complete_route_stop(
		self,
		route_id: str,
		stop_id: int,
		tg_id: int,
		result: str,
		failure_reason: str | None = None,
	) -> dict:
		"""Завершить остановку маршрута (bot endpoint)."""

		body: dict = {"tg_id": tg_id, "result": result}
		if failure_reason:
			body["failure_reason"] = failure_reason

		return await self.request(
			"PATCH",
			f"/bot/routes/{route_id}/stop/{stop_id}/complete",
			headers={"X-Bot-Secret": settings.bot_secret},
			json_body=body,
		)

	async def fetch_user_by_tg_id(self, tg_id: int) -> dict | None:
		"""Получить данные пользователя по tg_id."""

		try:
			return await self.request(
				"GET",
				f"/bot/users/{tg_id}",
				headers={"X-Bot-Secret": settings.bot_secret},
			)
		except BackendClientError:
			return None
