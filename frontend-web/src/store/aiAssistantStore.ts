'use client';

import { create } from 'zustand';
import {
  fetchSuggestedQuestions,
  postAIChat,
  type AIChatMessagePayload,
  type AIMetricSnapshot,
  type AIUserProfileContext,
  type AISource,
} from '@/lib/ai-api';

export type AIChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  isPending?: boolean;
  sources?: AISource[];
};

type AIAssistantState = {
  open: boolean;
  district: string;
  metrics: AIMetricSnapshot;
  userProfile?: AIUserProfileContext;
  messages: AIChatMessage[];
  suggestedQuestions: string[];
  isSending: boolean;
  setOpen: (open: boolean) => void;
  setDashboardContext: (
    district: string,
    metrics: AIMetricSnapshot,
    userProfile?: AIUserProfileContext,
  ) => void;
  refreshSuggestions: (district?: string, metrics?: AIMetricSnapshot) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
};

const fallbackQuestions = (district: string) => [
  `${district} 現在適合戶外活動嗎？`,
  `${district} 目前主要污染物是什麼？`,
  `${district} 敏感族群需要注意什麼？`,
];

const nextId = () => `ai_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const buildLocalFallbackAnswer = (district: string, metrics: AIMetricSnapshot) => {
  const aqi = typeof metrics.aqi === 'number' ? metrics.aqi : null;
  if (aqi === null) {
    return `目前無法取得 ${district} 的完整 AI 回覆，我先用保守原則建議：活動前再確認最新空氣品質，敏感族群減少長時間戶外停留，若有不適請改到室內。`;
  }

  if (aqi <= 50) {
    return `${district} 目前可維持一般戶外活動。敏感族群仍建議留意自身感受，運動或外出前可再確認最新空氣品質。`;
  }

  if (aqi <= 100) {
    return `${district} 建議以一般戶外活動為主，敏感族群降低劇烈活動強度。若要長時間外出，可避開交通尖峰與空氣較悶熱的時段。`;
  }

  return `${district} 建議減少長時間或高強度戶外活動，敏感族群優先安排室內行程。外出時留意身體狀況，必要時配戴口罩。`;
};

export const useAIAssistantStore = create<AIAssistantState>((set, get) => ({
  open: false,
  district: '桃園區',
  metrics: {},
  userProfile: undefined,
  messages: [],
  suggestedQuestions: fallbackQuestions('桃園區'),
  isSending: false,
  setOpen: (open) => set({ open }),
  setDashboardContext: (district, metrics, userProfile) => {
    const state = get();
    const districtChanged = district !== state.district;
    set({ district, metrics, userProfile });
    if (districtChanged) {
      void get().refreshSuggestions(district, metrics);
    }
  },
  refreshSuggestions: async (districtArg, metricsArg) => {
    const state = get();
    const district = districtArg ?? state.district;
    const metrics = metricsArg ?? state.metrics;
    try {
      const response = await fetchSuggestedQuestions(district, metrics);
      set({ suggestedQuestions: response.questions.slice(0, 3) });
    } catch {
      set({ suggestedQuestions: fallbackQuestions(district) });
    }
  },
  sendMessage: async (rawMessage) => {
    const message = rawMessage.trim();
    if (!message) return;

    const state = get();
    if (state.isSending || state.messages.some((item) => item.isPending)) return;

    const userMessage: AIChatMessage = {
      id: nextId(),
      role: 'user',
      text: message,
      createdAt: Date.now(),
    };
    const pendingId = nextId();
    const pendingMessage: AIChatMessage = {
      id: pendingId,
      role: 'assistant',
      text: '分析中...',
      createdAt: Date.now(),
      isPending: true,
    };

    set({ isSending: true, messages: [...state.messages, userMessage, pendingMessage] });

    const history: AIChatMessagePayload[] = state.messages
      .filter((item) => !item.isPending)
      .slice(-8)
      .map(({ role, text }) => ({ role, text }));

    try {
      const response = await postAIChat(
        message,
        state.district,
        state.metrics,
        history,
        state.userProfile,
      );
      set((current) => ({
        isSending: false,
        messages: current.messages.map((item) =>
          item.id === pendingId
            ? {
                id: response.answer.messageId,
                role: 'assistant',
                text: response.answer.text,
                createdAt: Date.now(),
                sources: response.answer.sources,
              }
            : item,
        ),
      }));
    } catch {
      set((current) => ({
        isSending: false,
        messages: current.messages.map((item) =>
          item.id === pendingId
            ? {
                ...item,
                text: buildLocalFallbackAnswer(state.district, state.metrics),
                isPending: false,
              }
            : item,
        ),
      }));
    }
  },
}));
