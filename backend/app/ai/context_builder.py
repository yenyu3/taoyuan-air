from __future__ import annotations

from datetime import datetime, timezone

from .schemas import MetricSnapshot


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def aqi_level(aqi: float | None) -> str:
    if aqi is None:
        return "unknown"
    if aqi <= 50:
        return "normal"
    if aqi <= 150:
        return "caution"
    return "avoid"


def trend_direction(metrics: MetricSnapshot) -> str:
    if metrics.pm25 is None and metrics.o3 is None:
        return "unknown"
    if metrics.pm25 is not None and metrics.pm25 > 35:
        return "rising"
    if metrics.o3 is not None and metrics.o3 > 70:
        return "rising"
    if metrics.aqi is not None and metrics.aqi <= 50:
        return "stable"
    return "stable"
