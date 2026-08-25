from __future__ import annotations

import time
from typing import Generic, TypeVar

T = TypeVar("T")


class TTLCache(Generic[T]):
    def __init__(self) -> None:
        self._items: dict[str, tuple[float, T]] = {}

    def get(self, key: str, ttl_seconds: int) -> T | None:
        item = self._items.get(key)
        if not item:
            return None
        created_at, value = item
        if time.time() - created_at > ttl_seconds:
            self._items.pop(key, None)
            return None
        return value

    def set(self, key: str, value: T) -> None:
        self._items[key] = (time.time(), value)


ai_cache: TTLCache[object] = TTLCache()
