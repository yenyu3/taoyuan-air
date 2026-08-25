from __future__ import annotations

from .schemas import AISource


DEFAULT_SOURCES = [
    AISource(label="Taoyuan Air dashboard metrics", type="internal_dataset"),
    AISource(label="MOE air quality data proxy", type="internal_dataset"),
    AISource(label="CWA weather data proxy", type="internal_dataset"),
    AISource(
        label="環境部空氣品質監測網",
        type="official_url",
        url="https://airtw.moenv.gov.tw/",
    ),
    AISource(
        label="中央氣象署開放資料平臺",
        type="official_url",
        url="https://opendata.cwa.gov.tw/",
    ),
]

ALLOWED_REFERENCE_URLS = {source.url for source in DEFAULT_SOURCES if source.url}


def sanitize_sources(sources: list[AISource]) -> list[AISource]:
    safe: list[AISource] = []
    for source in sources:
        if source.type == "official_url" and source.url not in ALLOWED_REFERENCE_URLS:
            continue
        safe.append(source)
    return safe or DEFAULT_SOURCES
