"""Утилиты конвертации цен."""

def som_to_tiyins(som: int) -> int:
    """Конвертация сомов в тыйыны."""
    return som * 10000

def tiyins_to_som(tiyins: int) -> int:
    """Конвертация тыйынов в сомы."""
    return tiyins // 10000
