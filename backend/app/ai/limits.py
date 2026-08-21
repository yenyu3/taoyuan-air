from __future__ import annotations

from collections import defaultdict
from datetime import date

from fastapi import HTTPException, Request

from ..config import settings

_daily_counts: dict[tuple[str, date], int] = defaultdict(int)


def client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()
    if request.client:
        return request.client.host
    return "anonymous"


def enforce_daily_limit(request: Request) -> None:
    key = (client_key(request), date.today())
    _daily_counts[key] += 1
    if _daily_counts[key] > settings.AI_DAILY_USER_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="AI daily request limit exceeded. Please try again tomorrow.",
        )
