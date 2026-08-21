from __future__ import annotations

from .llm_client import fallback_insight, fallback_questions
from .schemas import AIInsightRequest, MetricSnapshot


REGRESSION_CASES = [
    AIInsightRequest(district="桃園區", metrics=MetricSnapshot(aqi=35, pm25=8, o3=30)),
    AIInsightRequest(district="中壢區", metrics=MetricSnapshot(aqi=95, pm25=28, o3=55)),
    AIInsightRequest(district="觀音區", metrics=MetricSnapshot(aqi=135, pm25=42, o3=65)),
    AIInsightRequest(district="蘆竹區", metrics=MetricSnapshot(aqi=170, pm25=58, o3=80)),
    AIInsightRequest(district="大園區", metrics=MetricSnapshot()),
]


def run_fallback_regression() -> None:
    for case in REGRESSION_CASES:
        insight = fallback_insight(case)
        assert insight.district == case.district
        assert insight.activityAdvice.summary
        assert len(insight.activityAdvice.actions) <= 3
        assert insight.trendInsight.summary
        assert insight.sources

        questions = fallback_questions(case.district, case.metrics)
        assert 2 <= len(questions.questions) <= 4
        assert any(case.district in question for question in questions.questions)


if __name__ == "__main__":
    run_fallback_regression()
    print("AI fallback regression cases passed")
