export type AIMetricSnapshot = {
  aqi?: number | null;
  pm25?: number | null;
  pm10?: number | null;
  o3?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  past1hrRain?: string | null;
};

export type AIUserProfileContext = {
  mainDistrict?: string | null;
  sensitivity?: string | null;
  sensitiveGroups?: string[];
  hasRespiratory?: boolean;
  hasElderly?: boolean;
  hasChild?: boolean;
};

export type AISource = {
  label: string;
  type: 'internal_dataset' | 'official_url' | 'derived_metric';
  url?: string | null;
  latestAt?: string | null;
};

export type ActivityAdvice = {
  level: 'normal' | 'caution' | 'avoid';
  title: string;
  summary: string;
  actions: string[];
  confidence: 'low' | 'medium' | 'high';
};

export type TrendInsight = {
  direction: 'rising' | 'falling' | 'stable' | 'unknown';
  headline: string;
  summary: string;
  deltaLabel?: string | null;
  drivers: string[];
  confidence: 'low' | 'medium' | 'high';
};

export type AIInsightResponse = {
  generatedAt: string;
  district: string;
  dataFreshness?: Record<string, string | null>;
  activityAdvice: ActivityAdvice;
  trendInsight: TrendInsight;
  sources: AISource[];
  dataMode: 'gemini' | 'fallback';
};

export type AIChatMessagePayload = {
  role: 'user' | 'assistant';
  text: string;
};

export type AIChatResponse = {
  answer: {
    messageId: string;
    text: string;
    createdAt: string;
    confidence: 'low' | 'medium' | 'high';
    sources: AISource[];
    dataMode: 'gemini' | 'fallback';
  };
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 120000);
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    signal: controller.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).finally(() => window.clearTimeout(timeoutId));

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchAIInsight(
  district: string,
  metrics: AIMetricSnapshot,
  userProfile?: AIUserProfileContext,
) {
  return postJson<AIInsightResponse>('/api/ai/insights', {
    district,
    view: 'dashboard',
    metrics,
    userProfile,
  });
}

export function fetchSuggestedQuestions(
  district: string,
  metrics: AIMetricSnapshot,
) {
  return postJson<{ questions: string[]; dataMode: 'gemini' | 'fallback' }>(
    '/api/ai/suggested-questions',
    { district, page: 'dashboard', metrics },
  );
}

export function postAIChat(
  message: string,
  district: string,
  metrics: AIMetricSnapshot,
  history: AIChatMessagePayload[],
  userProfile?: AIUserProfileContext,
) {
  return postJson<AIChatResponse>('/api/ai/chat', {
    message,
    context: {
      district,
      page: 'dashboard',
      metrics,
      userProfile,
    },
    history,
  });
}
