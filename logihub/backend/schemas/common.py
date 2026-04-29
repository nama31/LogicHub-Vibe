"""Общие схемы (ошибки, пагинация)."""

from pydantic import BaseModel, Field
from typing import Optional

class ErrorResponse(BaseModel):
    """Схема ошибки."""
    detail: str = Field(...)

class PaginationParams(BaseModel):
    """Схема пагинации."""
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=100, ge=1, le=1000)
