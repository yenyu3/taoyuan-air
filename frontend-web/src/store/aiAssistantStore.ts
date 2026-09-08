'use client';

import { create } from 'zustand';
import {
  type AIMetricSnapshot,
  type AIUserProfileContext,
  type AISource,
} from '@/lib/ai-api';
import type { DemoRole } from '@/lib/login-button-context';

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
  demoRole: DemoRole;
  userProfile?: AIUserProfileContext;
  messages: AIChatMessage[];
  suggestedQuestions: string[];
  isSending: boolean;
  setOpen: (open: boolean) => void;
  setDemoRole: (role: DemoRole) => void;
  setDashboardContext: (
    district: string,
    metrics: AIMetricSnapshot,
    userProfile?: AIUserProfileContext,
  ) => void;
  refreshSuggestions: (district?: string, metrics?: AIMetricSnapshot) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
};

const DEMO_REPLY_DELAY_MS = 3000;

const demoSources: AISource[] = [
  { label: '桃園空品監測網即時資料', type: 'internal_dataset', latestAt: '2026-09-09T09:00:00+08:00' },
  { label: '環境部空氣品質指標規則', type: 'official_url', latestAt: '2026-09-09T09:00:00+08:00' },
  { label: 'Taoyuan Air 決策模型推估', type: 'derived_metric', latestAt: '2026-09-09T09:00:00+08:00' },
];

const fallbackQuestions = (district: string, role: DemoRole) =>
  role === 'government'
    ? [
        `${district} 今天哪些熱區需要優先派員查核？`,
        `如果下午臭氧升高，${district} 要先啟動哪些管制措施？`,
        `${district} 近 24 小時污染來源判讀與決策建議是什麼？`,
      ]
    : [
        `${district} 今天適合帶小孩去公園嗎？`,
        `${district} 傍晚慢跑需要戴口罩或改室內嗎？`,
        `明天早上通勤到 ${district}，敏感族群要注意什麼？`,
      ];

const nextId = () => `ai_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const metricLabel = (value: number | null | undefined, unit: string) =>
  typeof value === 'number' ? `${value}${unit}` : '暫無資料';

const classifyAqi = (aqi: number | null) => {
  if (aqi === null) return '資料不足';
  if (aqi <= 50) return '良好';
  if (aqi <= 100) return '普通';
  if (aqi <= 150) return '對敏感族群不健康';
  if (aqi <= 200) return '對所有族群不健康';
  return '非常不健康';
};

const buildDemoPublicAnswer = (question: string, district: string, metrics: AIMetricSnapshot) => {
  const aqi = typeof metrics.aqi === 'number' ? metrics.aqi : null;
  const pm25 = metricLabel(metrics.pm25, ' μg/m³');
  const ozone = metricLabel(metrics.o3, ' ppb');
  const level = classifyAqi(aqi);

  if (question.includes('小孩') || question.includes('公園')) {
    return `可以，但建議把活動安排在上午或傍晚較涼、車流較少的時段。

**空品判讀**
- ${district} 目前 AQI 為 ${aqi ?? '約 82'}，等級判定為「${level}」。
- PM2.5 約 ${pm25}，臭氧約 ${ozone}；兒童主要要留意咳嗽、眼睛刺激與活動後喘。
- 若公園靠近主幹道，短時間遊玩可以，避免連續 2 小時以上高強度奔跑。

**建議做法**
1. 選樹蔭多、離道路較遠的活動區。
2. 若孩子有氣喘或過敏，先帶藥並把戶外活動縮短到 30 到 60 分鐘。
3. 如果天空偏霧、聞到異味或孩子開始咳嗽，直接改室內活動。

**結論**
以目前資料看，今天不是需要取消行程的狀況，但敏感兒童建議採「短時間、低強度、可隨時撤回室內」的策略。`;
  }

  if (question.includes('慢跑') || question.includes('口罩')) {
    return `傍晚慢跑建議降強度；一般成人可改成輕鬆跑，敏感族群建議改室內。

**風險分析**
- ${district} AQI：${aqi ?? '約 96'}，接近普通上緣。
- PM2.5：${pm25}；臭氧：${ozone}。傍晚若風速弱，污染物容易累積在道路與建物周邊。
- 跑步時換氣量增加，實際吸入量會比靜態通勤高。

**行動建議**
1. 路線避開大馬路、交流道與施工區。
2. 改做 20 到 30 分鐘低強度慢跑，心率不要拉太高。
3. 有鼻過敏、氣喘、近期感冒者，今天改室內訓練更穩妥。

**口罩判斷**
若只是散步可戴一般防護口罩；跑步時不建議硬戴到呼吸不順，較好的決策是降低強度或改室內。`;
  }

  return `以目前資料估計，明天早上通勤到 ${district} 要留意交通尖峰造成的短時污染。

**重點判讀**
- 早上 7:00 到 9:00 通勤車流會讓路口、車站周邊 PM2.5 與 NO2 短暫偏高。
- 目前 AQI 參考值為 ${aqi ?? '約 88'}，屬「${level}」。
- 敏感族群包含氣喘、慢性呼吸道疾病、心血管疾病、孕婦、幼童與高齡者。

**通勤決策**
1. 等公車或接送時，盡量離車道 5 到 10 公尺以上。
2. 可選擇提早 15 分鐘出門，避開車流最高峰。
3. 若有胸悶、喘或眼鼻刺激，當天減少戶外停留並配戴口罩。

**總結**
不需要取消通勤，但敏感族群建議把暴露時間壓短，避免在車流熱點久站。`;
};

const buildDemoGovernmentAnswer = (question: string, district: string, metrics: AIMetricSnapshot) => {
  const aqi = typeof metrics.aqi === 'number' ? metrics.aqi : null;
  const pm25 = metricLabel(metrics.pm25, ' μg/m³');
  const pm10 = metricLabel(metrics.pm10, ' μg/m³');
  const ozone = metricLabel(metrics.o3, ' ppb');

  if (question.includes('派員') || question.includes('熱區')) {
    return `建議今天優先鎖定「交通走廊、工業邊界、裸露地與施工熱點」三類區域。

**監測摘要**
- ${district} AQI：${aqi ?? '約 104'}，PM2.5：${pm25}，PM10：${pm10}，臭氧：${ozone}。
- 熱點判讀顯示 08:00 到 10:00 的濃度抬升與通勤車流較一致；午後若日照強，臭氧可能接續升高。
- 優先巡查位置建議：主要幹道交會口、物流車進出路段、工業區下風處、近期營建工地周邊。

**派工建議**
1. 上午派 1 組巡查交通熱點與怠速熱區，蒐證重點放在柴油車黑煙、路口壅塞與工地揚塵。
2. 中午前確認工業區邊界異味與 VOCs 指標，若濃度持續偏高，改列加強稽查。
3. 下午 13:00 到 16:00 追蹤臭氧升幅，必要時發布戶外活動提醒。

**決策結論**
今日治理優先序為「移動污染源管制」大於「固定污染源稽查」大於「健康提醒」，但若午後臭氧快速上升，需把健康提醒提前到 13:30 前發布。`;
  }

  if (question.includes('臭氧') || question.includes('管制')) {
    return `若下午臭氧升高，建議採取分階段應變，先做提醒與前驅物減量，再視濃度啟動稽查。

**觸發條件**
- 13:00 臭氧超過 ${metricLabel(metrics.o3 ?? 68, ' ppb')} 且連續兩小時上升。
- 風速偏弱、日照強，且 NOx / VOCs 前驅物排放區位於 ${district} 上風處。

**建議措施**
1. 第一階段：發布敏感族群提醒，通知學校與戶外活動承辦單位降低活動強度。
2. 第二階段：要求大型固定源檢視燃燒與溶劑使用時段，避免午後高反應時段排放尖峰。
3. 第三階段：派員至工業區邊界與交通節點，交叉比對異味陳情、風向與監測抬升。

**決策判斷**
目前情境屬於「可預防型臭氧事件」，不宜等 AQI 轉差才處理。建議 12:30 前完成跨單位通知，14:00 前回收第一輪現地回報。`;
  }

  return `近 24 小時判讀顯示，${district} 污染變化主要受交通尖峰、午後光化反應與局部揚塵共同影響。

**資料整合**
- PM2.5：${pm25}，PM10：${pm10}，臭氧：${ozone}，AQI：${aqi ?? '約 98'}。
- 上午濃度抬升多落在通勤時段，午後臭氧風險增加，夜間若混合層降低，PM2.5 可能再度累積。
- 模型信心：中等，因目前尚未接入即時風場與完整稽查回報。

**原因推估**
1. 移動污染源：通勤與物流車流造成短時 NO2 / PM2.5 增加。
2. 光化反應：午後日照推升臭氧，且與 VOCs 前驅物有關。
3. 揚塵事件：施工或道路積塵會讓 PM10 出現局部尖峰。

**治理建議**
- 今日先做熱點巡查與道路洗掃調度。
- 若臭氧持續升高，要求高 VOCs 使用單位調整作業時段。
- 對民眾端發布「敏感族群降低戶外強度」提醒，避免訊息過度恐慌。

**決策結論**
建議採取「輕量應變 + 熱點蒐證」策略，暫不升級為全面管制；若連續兩小時 AQI 超過 120，再啟動第二階段應變。`;
};

const buildDemoAnswer = (role: DemoRole, question: string, district: string, metrics: AIMetricSnapshot) => {
  const answer =
    role === 'government'
      ? buildDemoGovernmentAnswer(question, district, metrics)
      : buildDemoPublicAnswer(question, district, metrics);

  return `${answer}

_註：以上內容為情境模擬與輔助判讀，實際發布與管制仍需以官方監測、現地回報與主管機關判定為準。_`;
};

export const useAIAssistantStore = create<AIAssistantState>((set, get) => ({
  open: false,
  district: '桃園區',
  metrics: {},
  demoRole: 'public',
  userProfile: undefined,
  messages: [],
  suggestedQuestions: fallbackQuestions('桃園區', 'public'),
  isSending: false,
  setOpen: (open) => set({ open }),
  setDemoRole: (role) => {
    const state = get();
    if (role === state.demoRole) return;
    set({
      demoRole: role,
      messages: [],
      isSending: false,
      suggestedQuestions: fallbackQuestions(state.district, role),
    });
  },
  setDashboardContext: (district, metrics, userProfile) => {
    const state = get();
    const districtChanged = district !== state.district;
    set({
      district,
      metrics,
      userProfile,
      suggestedQuestions: districtChanged
        ? fallbackQuestions(district, state.demoRole)
        : state.suggestedQuestions,
    });
    if (districtChanged) {
      void get().refreshSuggestions(district, metrics);
    }
  },
  refreshSuggestions: async (districtArg, metricsArg) => {
    const state = get();
    const district = districtArg ?? state.district;
    void (metricsArg ?? state.metrics);
    set({ suggestedQuestions: fallbackQuestions(district, state.demoRole) });
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

    await wait(DEMO_REPLY_DELAY_MS);

    set((current) => {
      const pendingStillExists = current.messages.some((item) => item.id === pendingId);
      if (!pendingStillExists) {
        return { isSending: current.messages.some((item) => item.isPending) };
      }

      const messages = current.messages.map((item) =>
        item.id === pendingId
          ? {
              ...item,
              text: buildDemoAnswer(state.demoRole, message, state.district, state.metrics),
              isPending: false,
              sources: demoSources,
            }
          : item,
      );

      return {
        isSending: messages.some((item) => item.isPending),
        messages,
      };
    });
  },
}));
