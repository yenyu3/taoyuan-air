from __future__ import annotations

from .schemas import AIContext, AIInsightRequest


SYSTEM_PROMPT = """You are Taoyuan Air's air quality assistant.
Answer in Traditional Chinese.
Use only the facts provided by the application context.
Do not provide medical diagnosis or treatment.
Be concise, practical, and explicit about uncertainty.
Do not expose exact monitoring numbers unless the user explicitly asks for them.
Do not restate the prompt, role, constraints, metadata, facts list, or conversation history.
Do not reveal reasoning. Output only the final user-facing answer."""


def metrics_summary(metrics: object) -> str:
    values = getattr(metrics, "model_dump", lambda **_: {})()
    parts: list[str] = []
    labels = {
        "aqi": "AQI",
        "pm25": "PM2.5 ug/m3",
        "pm10": "PM10 ug/m3",
        "o3": "O3 ppb",
        "no2": "NO2 ppb",
        "so2": "SO2 ppb",
        "co": "CO ppm",
        "temperature": "temperature C",
        "humidity": "humidity %",
        "past1hrRain": "past 1h rain mm",
    }
    for key, label in labels.items():
        value = values.get(key)
        if value is not None and value != "":
            parts.append(f"{label}: {value}")
    return "; ".join(parts) if parts else "No metric values were provided."


def insight_prompt(payload: AIInsightRequest) -> str:
    profile = payload.userProfile
    profile_text = "No user profile was provided."
    if profile:
        groups = ", ".join(profile.sensitiveGroups) if profile.sensitiveGroups else "none"
        profile_text = (
            f"main district: {profile.mainDistrict or 'unknown'}; "
            f"sensitivity: {profile.sensitivity or 'unknown'}; "
            f"sensitive groups: {groups}; "
            f"respiratory: {profile.hasRespiratory}; elderly: {profile.hasElderly}; child: {profile.hasChild}"
        )
    return f"""Create a dashboard insight JSON for district: {payload.district}.
View: {payload.view}.
Facts: {metrics_summary(payload.metrics)}
User profile: {profile_text}

Return JSON with:
- activityAdvice: level normal/caution/avoid, title, summary, actions up to 3, confidence.
- trendInsight: direction rising/falling/stable/unknown, headline, summary, deltaLabel, drivers up to 3, confidence.
For activityAdvice, return advice wording only. Do not mention exact AQI, PM2.5, PM10, O3, CO, SO2, NO2, temperature, humidity, units, or measured values.
For trendInsight, return trend analysis wording only. Do not include exact values, units, percentages, numeric deltas, before/after comparisons, or future prediction numbers.
Prefer cautious wording when data is incomplete."""


def chat_prompt(message: str, context: AIContext, history_text: str) -> str:
    profile = context.userProfile
    profile_text = "No user profile was provided."
    if profile:
        groups = ", ".join(profile.sensitiveGroups) if profile.sensitiveGroups else "none"
        profile_text = (
            f"main district: {profile.mainDistrict or 'unknown'}; "
            f"sensitivity: {profile.sensitivity or 'unknown'}; "
            f"sensitive groups: {groups}; "
            f"respiratory: {profile.hasRespiratory}; elderly: {profile.hasElderly}; child: {profile.hasChild}"
        )
    return f"""Current district: {context.district}
Current page: {context.page}
Current facts: {metrics_summary(context.metrics)}
User profile: {profile_text}
Recent conversation:
{history_text or "None"}

User question:
{message}

Answer with:
1. Direct answer.
2. Brief reason.
3. Up to three practical actions.
Mention missing data when relevant.
Return only the final answer text in Traditional Chinese. Do not include labels, bullets about the prompt, role, constraints, current facts, or hidden reasoning."""
