from __future__ import annotations

import uuid

from fastapi import APIRouter, Request

from ..ai.limits import enforce_daily_limit
from ..ai.llm_client import answer_chat, generate_insight, generate_questions
from ..ai.schemas import (
    AIChatRequest,
    AIChatResponse,
    AIInsightRequest,
    AIInsightResponse,
    SuggestedQuestionsRequest,
    SuggestedQuestionsResponse,
)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/insights", response_model=AIInsightResponse)
async def create_insight(payload: AIInsightRequest, request: Request):
    enforce_daily_limit(request)
    return await generate_insight(payload)


@router.post("/suggested-questions", response_model=SuggestedQuestionsResponse)
async def create_suggested_questions(payload: SuggestedQuestionsRequest, request: Request):
    enforce_daily_limit(request)
    return await generate_questions(payload.district, payload.metrics)


@router.post("/chat", response_model=AIChatResponse)
async def create_chat_answer(payload: AIChatRequest, request: Request):
    enforce_daily_limit(request)
    history_text = "\n".join(
        f"{item.role}: {item.text}" for item in payload.history[-8:]
    )
    answer = await answer_chat(
        f"MSG_{uuid.uuid4().hex[:8]}",
        payload.message.strip(),
        payload.context,
        history_text,
    )
    return AIChatResponse(answer=answer)
