from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


Confidence = Literal["low", "medium", "high"]


class MetricSnapshot(BaseModel):
    aqi: Optional[float] = None
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    o3: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    past1hrRain: Optional[str] = None


class UserProfileContext(BaseModel):
    mainDistrict: Optional[str] = None
    sensitivity: Optional[str] = None
    sensitiveGroups: list[str] = Field(default_factory=list)
    hasRespiratory: bool = False
    hasElderly: bool = False
    hasChild: bool = False


class AIContext(BaseModel):
    district: str
    page: str = "dashboard"
    metrics: MetricSnapshot = Field(default_factory=MetricSnapshot)
    userProfile: Optional[UserProfileContext] = None


class AIInsightRequest(BaseModel):
    district: str
    view: str = "dashboard"
    metrics: MetricSnapshot = Field(default_factory=MetricSnapshot)
    userProfile: Optional[UserProfileContext] = None


class AISource(BaseModel):
    label: str
    type: Literal["internal_dataset", "official_url", "derived_metric"]
    url: Optional[str] = None
    latestAt: Optional[str] = None


class ActivityAdvice(BaseModel):
    level: Literal["normal", "caution", "avoid"]
    title: str
    summary: str
    actions: list[str] = Field(default_factory=list, max_length=3)
    confidence: Confidence = "medium"


class TrendInsight(BaseModel):
    direction: Literal["rising", "falling", "stable", "unknown"]
    headline: str
    summary: str
    deltaLabel: Optional[str] = None
    drivers: list[str] = Field(default_factory=list, max_length=3)
    confidence: Confidence = "medium"


class AIInsightResponse(BaseModel):
    generatedAt: str
    district: str
    dataFreshness: dict[str, str | None] = Field(default_factory=dict)
    activityAdvice: ActivityAdvice
    trendInsight: TrendInsight
    sources: list[AISource] = Field(default_factory=list)
    dataMode: Literal["gemini", "fallback"] = "fallback"


class GeminiInsightPayload(BaseModel):
    activityAdvice: ActivityAdvice
    trendInsight: TrendInsight
    sources: list[AISource] = Field(default_factory=list)


class SuggestedQuestionsRequest(BaseModel):
    district: str
    page: str = "dashboard"
    metrics: MetricSnapshot = Field(default_factory=MetricSnapshot)


class SuggestedQuestionsResponse(BaseModel):
    questions: list[str] = Field(min_length=2, max_length=4)
    dataMode: Literal["gemini", "fallback"] = "fallback"


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    text: str


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    context: AIContext
    history: list[ChatHistoryItem] = Field(default_factory=list, max_length=8)


class AIChatAnswer(BaseModel):
    messageId: str
    text: str
    createdAt: str
    confidence: Confidence = "medium"
    sources: list[AISource] = Field(default_factory=list)
    dataMode: Literal["gemini", "fallback"] = "fallback"


class AIChatResponse(BaseModel):
    answer: AIChatAnswer
