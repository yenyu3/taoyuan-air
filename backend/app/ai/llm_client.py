from __future__ import annotations

import json
import hashlib
import logging
import re
from typing import Any, Optional, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from ..config import settings
from .cache import ai_cache
from .context_builder import aqi_level, now_iso, trend_direction
from .prompts import SYSTEM_PROMPT, chat_prompt, insight_prompt
from .schemas import (
    AIChatAnswer,
    AIContext,
    AIInsightRequest,
    AIInsightResponse,
    ActivityAdvice,
    GeminiInsightPayload,
    SuggestedQuestionsResponse,
    TrendInsight,
)
from .sources import ALLOWED_REFERENCE_URLS, DEFAULT_SOURCES, sanitize_sources

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)
CONFIDENCE_VALUE_MAP = {
    "低": "low",
    "低信心": "low",
    "low": "low",
    "中": "medium",
    "中等": "medium",
    "中信心": "medium",
    "medium": "medium",
    "moderate": "medium",
    "normal": "medium",
    "普通": "medium",
    "高": "high",
    "高信心": "high",
    "high": "high",
}
ACTIVITY_LEVEL_VALUE_MAP = {
    "正常": "normal",
    "一般": "normal",
    "適合": "normal",
    "normal": "normal",
    "注意": "caution",
    "謹慎": "caution",
    "caution": "caution",
    "避免": "avoid",
    "減少": "avoid",
    "avoid": "avoid",
}
TREND_DIRECTION_VALUE_MAP = {
    "上升": "rising",
    "升高": "rising",
    "rising": "rising",
    "下降": "falling",
    "降低": "falling",
    "falling": "falling",
    "穩定": "stable",
    "持平": "stable",
    "stable": "stable",
    "未知": "unknown",
    "不明": "unknown",
    "unknown": "unknown",
}
METRIC_VALUE_PATTERN = re.compile(
    r"(?:AQI|PM2\.5|PM10|O3|NO2|SO2|CO|臭氧|懸浮微粒|細懸浮微粒).{0,16}\d|"
    r"\d+(?:\.\d+)?\s*(?:ug/m3|μg/m³|ppb|ppm|%)",
    re.IGNORECASE,
)
PREDICTION_NUMBER_PATTERN = re.compile(
    r"(?:未來|接下來|過去|近|連續|預計|預測|預估|增加|下降|上升|降低|改善|惡化).{0,12}"
    r"\d+(?:\.\d+)?\s*(?:分鐘|小時|時|天|日|週|周|個月|月|年|%|百分比)",
    re.IGNORECASE,
)
EXPLICIT_VALUE_REQUEST_PATTERN = re.compile(
    r"(?:數值|多少|濃度|AQI|PM2\.5|PM10|O3|NO2|SO2|CO|臭氧|懸浮微粒|細懸浮微粒)",
    re.IGNORECASE,
)


class GeminiClient:
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    async def generate_json(self, prompt: str, schema: type[T]) -> Optional[T]:
        if not self.api_key:
            return None

        if self._uses_interactions_api():
            return await self._interactions_json(prompt, schema)

        if self._uses_plain_json_first():
            return await self.generate_plain_json(prompt, schema)

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        body: dict[str, Any] = {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.35,
                "responseMimeType": "application/json",
                "responseSchema": schema.model_json_schema(),
            },
        }
        try:
            if settings.GEMINI_ENABLE_URL_CONTEXT and ALLOWED_REFERENCE_URLS:
                body["tools"] = [{"url_context": {}}]

            async with httpx.AsyncClient(
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
                trust_env=settings.AI_TRUST_ENV_PROXY,
            ) as client:
                response = await client.post(url, json=body)
                response.raise_for_status()
            payload = response.json()
            if usage := payload.get("usageMetadata"):
                logger.info("Gemini JSON usage: %s", usage)
            text = self._extract_generate_content_text(payload)
            return validate_model_json(schema, text)
        except (httpx.HTTPStatusError) as exc:
            if exc.response.status_code == 400:
                logger.warning("Gemini schema JSON request failed; retrying plain JSON: %r", exc)
                return await self.generate_plain_json(prompt, schema)
            logger.warning("Gemini JSON request failed; using fallback: %r", exc)
            return None
        except (httpx.HTTPError, KeyError, IndexError, ValidationError, json.JSONDecodeError) as exc:
            logger.warning("Gemini JSON request failed; using fallback: %r", exc)
            return None

    async def generate_plain_json(self, prompt: str, schema: type[T]) -> Optional[T]:
        if not self.api_key:
            return None

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        body: dict[str, Any] = {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                f"{prompt}\n\n"
                                "Return only valid JSON. Do not wrap it in Markdown. "
                                "Do not include comments or explanatory text."
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.25,
                "responseMimeType": "application/json",
            },
        }
        try:
            async with httpx.AsyncClient(
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
                trust_env=settings.AI_TRUST_ENV_PROXY,
            ) as client:
                response = await client.post(url, json=body)
                response.raise_for_status()
            text = self._extract_generate_content_text(response.json())
            return validate_model_json(schema, text)
        except (httpx.HTTPError, KeyError, IndexError, ValidationError, json.JSONDecodeError) as exc:
            logger.warning("Gemini plain JSON request failed; using fallback: %r", exc)
            return None

    async def generate_text(self, prompt: str) -> Optional[str]:
        if not self.api_key:
            return None

        if self._uses_interactions_api():
            return await self._interactions_text(prompt)

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        body: dict[str, Any] = {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.45, "maxOutputTokens": 900},
        }
        try:
            if settings.GEMINI_ENABLE_URL_CONTEXT and ALLOWED_REFERENCE_URLS:
                body["tools"] = [{"url_context": {}}]

            async with httpx.AsyncClient(
                timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
                trust_env=settings.AI_TRUST_ENV_PROXY,
            ) as client:
                response = await client.post(url, json=body)
                response.raise_for_status()
            payload = response.json()
            if usage := payload.get("usageMetadata"):
                logger.info("Gemini text usage: %s", usage)
            return self._extract_generate_content_text(payload)
        except (httpx.HTTPError, KeyError, IndexError) as exc:
            logger.warning("Gemini text request failed; using fallback: %r", exc)
            return None

    def _uses_interactions_api(self) -> bool:
        return self.model.startswith("gemini-3.")

    def _uses_plain_json_first(self) -> bool:
        return self.model in {"gemini-flash-lite-latest"}

    async def _interactions_json(self, prompt: str, schema: type[T]) -> Optional[T]:
        body: dict[str, Any] = {
            "model": self.model,
            "system_instruction": SYSTEM_PROMPT,
            "input": prompt,
            "response_format": {
                "type": "text",
                "mime_type": "application/json",
                "schema": schema.model_json_schema(),
            },
        }
        try:
            if settings.GEMINI_ENABLE_URL_CONTEXT and ALLOWED_REFERENCE_URLS:
                body["tools"] = [{"type": "url_context"}]

            payload = await self._post_interaction(body)
            text = self._extract_interaction_text(payload)
            return validate_model_json(schema, text)
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValidationError, json.JSONDecodeError) as exc:
            logger.warning("Gemini interactions JSON request failed; using fallback: %r", exc)
            return None

    async def _interactions_text(self, prompt: str) -> Optional[str]:
        body: dict[str, Any] = {
            "model": self.model,
            "system_instruction": SYSTEM_PROMPT,
            "input": prompt,
            "generation_config": {"thinking_level": "low"},
        }
        try:
            if settings.GEMINI_ENABLE_URL_CONTEXT and ALLOWED_REFERENCE_URLS:
                body["tools"] = [{"type": "url_context"}]

            payload = await self._post_interaction(body)
            return self._extract_interaction_text(payload)
        except (httpx.HTTPError, KeyError, IndexError, TypeError) as exc:
            logger.warning("Gemini interactions text request failed; using fallback: %r", exc)
            return None

    async def _post_interaction(self, body: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(
            timeout=settings.AI_REQUEST_TIMEOUT_SECONDS,
            trust_env=settings.AI_TRUST_ENV_PROXY,
        ) as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/interactions",
                headers={"x-goog-api-key": self.api_key},
                json=body,
            )
            response.raise_for_status()

        payload = response.json()
        if usage := payload.get("usage"):
            logger.info("Gemini interactions usage: %s", usage)
        return payload

    @staticmethod
    def _extract_interaction_text(payload: dict[str, Any]) -> str:
        output_text = payload.get("output_text")
        if isinstance(output_text, str) and output_text:
            return output_text

        texts: list[str] = []
        for step in payload.get("steps", []):
            if step.get("type") != "model_output":
                continue
            for content in step.get("content", []):
                if content.get("type") == "text" and content.get("text"):
                    texts.append(content["text"])

        if not texts:
            raise KeyError("No text output found in Gemini interaction response")
        return "\n".join(texts)

    @staticmethod
    def _extract_generate_content_text(payload: dict[str, Any]) -> str:
        parts = payload["candidates"][0]["content"]["parts"]
        texts = [
            part["text"]
            for part in parts
            if part.get("text") and not part.get("thought")
        ]
        if not texts:
            texts = [part["text"] for part in parts if part.get("text")]
        if not texts:
            raise KeyError("No text output found in Gemini generateContent response")
        return "\n".join(texts)


def client() -> GeminiClient:
    return GeminiClient(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)


def validate_model_json(schema: type[T], text: str) -> T:
    data = json.loads(text)
    return schema.model_validate(normalize_model_payload(data))


def normalize_model_payload(data: Any) -> Any:
    if isinstance(data, list):
        return [normalize_model_payload(item) for item in data]
    if not isinstance(data, dict):
        return data

    normalized = {key: normalize_model_payload(value) for key, value in data.items()}

    if isinstance(normalized.get("confidence"), str):
        normalized["confidence"] = normalize_enum_value(
            normalized["confidence"],
            CONFIDENCE_VALUE_MAP,
        )

    activity = normalized.get("activityAdvice")
    if isinstance(activity, dict):
        normalized["activityAdvice"] = normalize_model_payload(activity)

    trend = normalized.get("trendInsight")
    if isinstance(trend, dict):
        normalized["trendInsight"] = normalize_model_payload(trend)

    if isinstance(normalized.get("level"), str):
        normalized["level"] = normalize_enum_value(
            normalized["level"],
            ACTIVITY_LEVEL_VALUE_MAP,
        )

    if isinstance(normalized.get("direction"), str):
        normalized["direction"] = normalize_enum_value(
            normalized["direction"],
            TREND_DIRECTION_VALUE_MAP,
        )

    return normalized


def normalize_enum_value(value: str, value_map: dict[str, str]) -> str:
    compact = value.strip().lower()
    return value_map.get(compact, value_map.get(value.strip(), value))


def has_metric_value(text: str | None) -> bool:
    return bool(text and METRIC_VALUE_PATTERN.search(text))


def has_prediction_number(text: str | None) -> bool:
    return bool(text and PREDICTION_NUMBER_PATTERN.search(text))


def explicitly_asks_for_values(message: str) -> bool:
    return bool(EXPLICIT_VALUE_REQUEST_PATTERN.search(message))


def remove_metric_values(
    generated: GeminiInsightPayload,
    fallback: AIInsightResponse,
) -> GeminiInsightPayload:
    activity = generated.activityAdvice
    trend = generated.trendInsight

    if has_metric_value(activity.summary):
        activity = activity.model_copy(update={"summary": fallback.activityAdvice.summary})

    if any(has_metric_value(action) for action in activity.actions):
        activity = activity.model_copy(update={"actions": fallback.activityAdvice.actions})

    trend_updates: dict[str, Any] = {}
    if has_metric_value(trend.headline) or has_prediction_number(trend.headline):
        trend_updates["headline"] = fallback.trendInsight.headline
    if has_metric_value(trend.summary) or has_prediction_number(trend.summary):
        trend_updates["summary"] = fallback.trendInsight.summary
    if has_metric_value(trend.deltaLabel) or has_prediction_number(trend.deltaLabel):
        trend_updates["deltaLabel"] = None
    if any(has_metric_value(driver) or has_prediction_number(driver) for driver in trend.drivers):
        trend_updates["drivers"] = fallback.trendInsight.drivers
    if trend_updates:
        trend = trend.model_copy(update=trend_updates)

    return generated.model_copy(update={"activityAdvice": activity, "trendInsight": trend})


def fallback_insight(payload: AIInsightRequest) -> AIInsightResponse:
    metrics = payload.metrics
    level = aqi_level(metrics.aqi)

    title_by_level = {
        "normal": "適合一般戶外活動",
        "caution": "戶外活動建議放慢節奏",
        "avoid": "建議減少長時間戶外活動",
        "unknown": "資料不足，先採保守建議",
    }
    summary_by_level = {
        "normal": "一般民眾可維持日常戶外活動，敏感族群仍建議留意身體感受。",
        "caution": "敏感族群建議降低劇烈活動強度，一般民眾可視身體狀況調整行程。",
        "avoid": "建議減少長時間或高強度戶外活動，優先安排室內或低暴露行程。",
        "unknown": "資料不完整時先採保守安排，活動前再確認最新空氣品質狀況。",
    }
    actions_by_level = {
        "normal": ["維持一般活動", "補充水分", "持續留意午後臭氧變化"],
        "caution": ["縮短劇烈運動時間", "敏感族群備妥口罩", "避開交通尖峰路段"],
        "avoid": ["改為室內活動", "關注官方空品更新", "若不適請停止戶外活動"],
        "unknown": ["重新整理資料", "查看鄰近測站", "採取敏感族群保守標準"],
    }
    direction = trend_direction(metrics)
    response_level = level if level in {"normal", "caution", "avoid"} else "caution"
    return AIInsightResponse(
        generatedAt=now_iso(),
        district=payload.district,
        activityAdvice=ActivityAdvice(
            level=response_level,  # type: ignore[arg-type]
            title=title_by_level[level],
            summary=summary_by_level[level],
            actions=actions_by_level[level],
            confidence="medium" if level != "unknown" else "low",
        ),
        trendInsight=TrendInsight(
            direction=direction,  # type: ignore[arg-type]
            headline="主要污染物維持觀察",
            summary="目前趨勢判讀以即時狀況為主，建議持續觀察污染物與天氣條件的變化。",
            deltaLabel=None,
            drivers=["即時監測值", "天氣條件", "地區背景值"],
            confidence="low",
        ),
        sources=DEFAULT_SOURCES,
        dataMode="fallback",
    )


async def generate_insight(payload: AIInsightRequest) -> AIInsightResponse:
    cache_key = "insight:" + hashlib.sha256(
        payload.model_dump_json().encode("utf-8")
    ).hexdigest()
    cached = ai_cache.get(cache_key, settings.AI_CACHE_TTL_SECONDS)
    if isinstance(cached, AIInsightResponse):
        return cached

    fallback = fallback_insight(payload)
    generated = await client().generate_json(insight_prompt(payload), GeminiInsightPayload)
    if generated:
        generated = remove_metric_values(generated, fallback)
        response = AIInsightResponse(
            generatedAt=now_iso(),
            district=payload.district,
            activityAdvice=generated.activityAdvice,
            trendInsight=generated.trendInsight,
            sources=sanitize_sources(generated.sources or DEFAULT_SOURCES),
            dataMode="gemini",
        )
        ai_cache.set(cache_key, response)
        return response
    ai_cache.set(cache_key, fallback)
    return fallback


def fallback_questions(district: str, metrics: Any) -> SuggestedQuestionsResponse:
    return SuggestedQuestionsResponse(
        questions=[
            f"{district} 現在適合戶外活動嗎？",
            f"{district} 目前主要污染物是什麼？",
            f"{district} 敏感族群需要注意什麼？",
        ],
        dataMode="fallback",
    )


async def generate_questions(district: str, metrics: Any) -> SuggestedQuestionsResponse:
    cache_key = "questions:" + hashlib.sha256(
        f"{district}:{getattr(metrics, 'model_dump_json', lambda: str(metrics))()}".encode("utf-8")
    ).hexdigest()
    cached = ai_cache.get(cache_key, settings.AI_CACHE_TTL_SECONDS)
    if isinstance(cached, SuggestedQuestionsResponse):
        return cached

    prompt = (
        f"Create 3 short Traditional Chinese suggested questions for {district}. "
        "They should help a user ask about air quality, health risk, and activity planning. "
        "Return JSON: {\"questions\": [..]}."
    )
    generated = await client().generate_json(prompt, SuggestedQuestionsResponse)
    if generated:
        generated.dataMode = "gemini"
        ai_cache.set(cache_key, generated)
        return generated
    fallback = fallback_questions(district, metrics)
    ai_cache.set(cache_key, fallback)
    return fallback


async def answer_chat(message_id: str, message: str, context: AIContext, history_text: str) -> AIChatAnswer:
    text = await client().generate_text(chat_prompt(message, context, history_text))
    data_mode = "gemini"
    confidence = "medium"
    if not text:
        data_mode = "fallback"
        confidence = "low"
        text = (
            f"以 {context.district} 目前的空氣品質狀況來看，建議先採保守原則安排活動。"
            "敏感族群可縮短戶外停留時間，必要時配戴口罩，"
            "並在出發或活動前再次確認最新空氣品質與天氣。"
        )
    elif has_metric_value(text) and not explicitly_asks_for_values(message):
        confidence = "low"
        text = (
            f"以 {context.district} 目前的空氣品質狀況來看，建議以保守原則安排活動。"
            "一般民眾可視身體狀況進行戶外行程，敏感族群建議降低劇烈活動強度，"
            "並在出發前再次確認最新空氣品質與天氣。"
        )
    return AIChatAnswer(
        messageId=message_id,
        text=text,
        createdAt=now_iso(),
        confidence=confidence,  # type: ignore[arg-type]
        sources=DEFAULT_SOURCES,
        dataMode=data_mode,  # type: ignore[arg-type]
    )
