'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronsRight, MapPin, TrendingDown } from 'lucide-react';
import type { MoeStationData } from '@shared/api/moe';
import {
  MOCK_CURRENT_WEATHER,
  type CurrentWeatherData,
} from '@shared/api/cwa';
import {
  DISTRICT_STATIC_AQ,
  EPA_STATION_TO_DISTRICT,
  findNearestDistrict,
} from '@shared/constants/districts';
import TaoyuanSVGMap from '@/components/map/TaoyuanSVGMap';
import { fetchAIInsight, type AIInsightResponse, type AIMetricSnapshot } from '@/lib/ai-api';
import { useAIAssistantStore } from '@/store/aiAssistantStore';
import {
  AQIGauge,
  DISTRICT_EXTENDED,
  GaugeArc,
  SecLabel,
  TrendBars,
  getActivityInfo,
  getO3Color,
  getPM25Color,
} from './_components/DashboardWidgets';
import { DashboardStyles } from './_components/DashboardStyles';

const fetchMoeStations = (): Promise<MoeStationData[]> =>
  fetch('/api/moe')
    .then(r => r.json())
    .then(response => response.data);

const DISTRICT_INSIGHT_CONTEXT: Record<string, { place: string; source: string; activity: string }> = {
  桃園區: { place: '市區幹道與商圈周邊', source: '通勤車流與路口怠速排放', activity: '藝文特區、公園步道與校園活動' },
  中壢區: { place: '中壢車站、內壢與工業區交界', source: '交通尖峰、工業區邊界排放與局部揚塵', activity: '河濱步道、校園操場與通勤路線' },
  八德區: { place: '大湳交流道與住宅密集路廊', source: '車流壅塞、物流車進出與道路揚塵', activity: '埤塘公園與社區戶外活動' },
  龜山區: { place: '林口台地、工業區與高速公路周邊', source: '坡地風場變化、科技廠區與國道車流', activity: '校園、醫院周邊步行與自行車通勤' },
  蘆竹區: { place: '南崁交流道、物流園區與海湖一帶', source: '貨運車流、倉儲物流與沿海工業活動', activity: '南崁溪步道與學童放學時段' },
  大園區: { place: '機場周邊、竹圍海岸與工業區', source: '航運地勤、沿海風場與工業排放混合影響', activity: '海岸步道、機場通勤與戶外工作' },
  大溪區: { place: '大漢溪谷地與老街周邊', source: '谷地擴散條件、假日車流與河岸揚塵', activity: '河岸散步、老街遊憩與自行車活動' },
  平鎮區: { place: '台66、工業區與住宅交界', source: '東西向快速道路車流與工業活動', activity: '社區公園、學校操場與通勤路線' },
  楊梅區: { place: '埔心、幼獅工業區與丘陵住宅帶', source: '工業排放、貨運車流與地形造成的短時累積', activity: '社區步道、校園與市場周邊' },
  龍潭區: { place: '龍潭市區、科學園區與埤塘周邊', source: '園區通勤車流、局部施工與午後光化反應', activity: '龍潭大池周邊散步與自行車活動' },
  觀音區: { place: '觀音工業區、草漯與沿海聚落', source: '固定源排放、海陸風轉換與夜間擴散不佳', activity: '沿海戶外工作、學童通學與社區活動' },
  新屋區: { place: '永安漁港、農地與沿海道路', source: '海風輸送、農地揚塵與區域背景污染', activity: '海岸遊憩、農務與自行車路線' },
  復興區: { place: '山區聚落與溪谷道路', source: '山谷風、境外輸送背景值與局部燃燒影響', activity: '登山步道、露營與山區道路移動' },
};

function getInsightContext(district: string) {
  return DISTRICT_INSIGHT_CONTEXT[district] ?? {
    place: `${district}主要活動範圍`,
    source: '交通排放、局部揚塵與天氣擴散條件',
    activity: '戶外活動與通勤路線',
  };
}

function getTopPollutant(metrics: AIMetricSnapshot) {
  const candidates = [
    { name: 'PM2.5', value: metrics.pm25, baseline: 15.4 },
    { name: 'PM10', value: metrics.pm10, baseline: 50 },
    { name: '臭氧', value: metrics.o3, baseline: 54 },
    { name: 'NO2', value: metrics.no2, baseline: 30 },
    { name: 'SO2', value: metrics.so2, baseline: 75 },
    { name: 'CO', value: metrics.co, baseline: 4 },
  ].filter((item): item is { name: string; value: number; baseline: number } => Number.isFinite(item.value));

  return candidates.sort((a, b) => b.value / b.baseline - a.value / a.baseline)[0]?.name ?? '主要污染物';
}

function getFallbackInsight(district: string, metrics: AIMetricSnapshot) {
  const context = getInsightContext(district);
  const pollutant = getTopPollutant(metrics);
  const aqi = metrics.aqi ?? 101;
  const weatherNote = Number(metrics.past1hrRain) >= 1
    ? '雨後揚塵下降，交通熱區仍需觀察'
    : (metrics.humidity ?? 0) >= 75
      ? '濕度偏高，早晚較易累積'
      : (metrics.temperature ?? 0) >= 30
        ? '高溫日照下，午後臭氧風險升高'
        : '晚間風弱時可能短暫累積';

  if (aqi <= 50) {
    return {
      activityTitle: `${district}可維持一般戶外活動`,
      activitySummary: `${context.activity}可照常；敏感族群避開車流熱點。`,
      trendHeadline: `${pollutant}維持區域背景水準`,
      trendSummary: `${district}目前接近背景水準，觀察${context.place}。${weatherNote}。`,
    };
  }

  if (aqi <= 150) {
    return {
      activityTitle: `${district}戶外活動建議放慢節奏`,
      activitySummary: `${context.activity}建議縮短高強度時段，避開${context.place}。`,
      trendHeadline: `${pollutant}有累積跡象`,
      trendSummary: `${district}變化多與${context.source}有關。${weatherNote}。`,
    };
  }

  return {
    activityTitle: `${district}建議改以低暴露行程為主`,
    activitySummary: `${context.activity}建議改到室內，避開${context.place}。`,
    trendHeadline: `${pollutant}持續偏高`,
    trendSummary: `${district}需優先追蹤${context.source}。${weatherNote}。`,
  };
}


export default function DashboardPage() {
  const [district, setDistrict] = useState('中壢區');
  const [allStations, setAllStations] = useState<MoeStationData[]>([]);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherData>(MOCK_CURRENT_WEATHER);
  const [past1hrRain, setPast1hrRain] = useState('0.0');
  const [aiInsight, setAIInsight] = useState<AIInsightResponse | null>(null);
  const setAIDashboardContext = useAIAssistantStore((state) => state.setDashboardContext);

  useEffect(() => {
    if (!navigator.geolocation) return; // 不支援定位，維持預設中壢區

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestDistrict(pos.coords.latitude, pos.coords.longitude);
        setDistrict(nearest);
      },
      () => undefined, // 定位失敗，維持預設中壢區
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    );
  }, []); // 移除 user 依賴，不讀取用戶設定

  useEffect(() => {
    fetchMoeStations()
      .then((data) => {
        console.log('[MOE] stations 數量:', data.length, data);
        setAllStations(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`/api/cwa?district=${encodeURIComponent(district)}`)
      .then(r => r.json())
      .then(({ data: { current, past1hrRain } }) => {
        setCurrentWeather(current);
        setPast1hrRain(past1hrRain);
      })
      .catch(console.error);
  }, [district]);

  const remoteMetrics = useMemo(() => {
    if (!allStations.length) return null;

    const sitename = Object.entries(EPA_STATION_TO_DISTRICT)
      .find(([, d]) => d === district)?.[0];
    if (!sitename) return null;

    const station = allStations.find((s) => s.sitename === sitename);
    if (!station) return null;

    const base = DISTRICT_STATIC_AQ[district] ?? DISTRICT_STATIC_AQ.中壢區;
    return {
      district,
      aqi:  station.aqi  || base.aqi,
      pm25: station.pm25 || base.pm25,
      pm10: station.pm10,
      o3:   station.o3   || base.o3,
      no2:  station.no2,
      so2:  station.so2,
      co:   station.co,
    };
  }, [district, allStations]);

  const base = DISTRICT_STATIC_AQ[district] ?? DISTRICT_STATIC_AQ.中壢區;
  const ext = DISTRICT_EXTENDED[district] ?? DISTRICT_EXTENDED.中壢區;
  const live = remoteMetrics?.district === district ? remoteMetrics : null;
  const aqi = live?.aqi ?? base.aqi;
  const pm25 = live?.pm25 ?? base.pm25;
  const o3 = live?.o3 ?? base.o3;
  const no2  = live?.no2  ?? ext.no2;
  const so2  = live?.so2  ?? ext.so2;
  const co   = live?.co   ?? ext.co;
  const pm10 = live?.pm10 ?? ext.pm10;
  const activity = getActivityInfo(aqi);
  const ActivityIcon = activity.icon;
  const aiMetrics = useMemo<AIMetricSnapshot>(() => ({
    aqi,
    pm25,
    pm10,
    o3,
    no2,
    so2,
    co,
    temperature: Number(currentWeather.temperature) || null,
    humidity: Number(currentWeather.humidity) || null,
    past1hrRain,
  }), [aqi, pm25, pm10, o3, no2, so2, co, currentWeather.temperature, currentWeather.humidity, past1hrRain]);
  useEffect(() => {
    setAIDashboardContext(district, aiMetrics);

    let cancelled = false;
    fetchAIInsight(district, aiMetrics)
      .then((response) => {
        if (!cancelled) setAIInsight(response);
      })
      .catch(() => {
        if (!cancelled) setAIInsight(null);
      });

    return () => {
      cancelled = true;
    };
  }, [district, aiMetrics, setAIDashboardContext]);

  const aiActivityAdvice = aiInsight?.activityAdvice;
  const aiTrendInsight = aiInsight?.trendInsight;
  const fallbackInsight = useMemo(
    () => getFallbackInsight(district, aiMetrics),
    [district, aiMetrics],
  );

  const pollutants = [
    { name: <>NO<sub className="text-xs">2</sub></>, sub: '二氧化氮', value: no2, unit: 'ppb' },
    { name: <>SO<sub className="text-xs">2</sub></>, sub: '二氧化硫', value: so2, unit: 'ppb' },
    { name: 'CO', sub: '一氧化碳', value: co.toFixed(2), unit: 'ppm' },
    { name: <>PM<sub className="text-xs">10</sub></>, sub: '懸浮微粒', value: pm10, unit: 'μg/m³' },
  ];

  return (
    <>
      <DashboardStyles />
      <main className="dashboard-page">
        <section className="dashboard-map-pane" aria-label="桃園行政區地圖">
          <div className="dashboard-map-wrap">
            <TaoyuanSVGMap selectedDistrict={district} onSelectDistrict={setDistrict} />
          </div>
          <button className="dashboard-map-action" type="button">
            點選查看區域詳情
            <MapPin size={15} />
            {district}
          </button>
        </section>

        <section className="dashboard-panel" aria-label={`${district} 空氣品質儀表板`}>
          <header className="district-heading">
            <MapPin size={31} strokeWidth={2.3} />
            <h1>{district}</h1>
          </header>

          <div className="dash-divider" />

          <div className="dashboard-first-row">
            <div>
              <SecLabel title="AQI 空氣品質指標" />
              <div className="aqi-block">
                <AQIGauge key={`aqi-${district}-${aqi}`} aqi={aqi} animationKey={`${district}-${aqi}`} />
                <span className="aqi-hint">數值範圍 0-200，越低越好</span>
              </div>
            </div>

            <div>
              <div className="pollutant-title-row">
                <SecLabel title="污染物詳情" sub="（每小時）" />
              </div>

              <div className="mini-gauge-row">
                <div className="mini-gauge-card">
                  <h3>PM<sub className="text-xs">2.5</sub></h3>
                  <p>細懸浮微粒</p>
                  <small>標準日均值為 15.4 μg/m³</small>
                  <GaugeArc
                    key={`pm25-${district}-${pm25}`}
                    value={pm25}
                    max={150}
                    markerVal={15.4}
                    color={getPM25Color(pm25)}
                    unit="μg/m³"
                    animationKey={`${district}-pm25-${pm25}`}
                  />
                </div>
                <div className="mini-divider" />
                <div className="mini-gauge-card">
                  <h3>O<sub className="text-xs">3</sub></h3>
                  <p>臭氧</p>
                  <small>標準8小時均值為 54 ppb</small>
                  <GaugeArc
                    key={`o3-${district}-${o3}`}
                    value={o3}
                    max={200}
                    markerVal={54}
                    color={getO3Color(o3)}
                    unit="ppb"
                    animationKey={`${district}-o3-${o3}`}
                  />
                </div>
              </div>

              <div className="mini-pollut-strip">
                {pollutants.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <div className="metric-divider" />}
                    <div className="mini-pollut-card">
                      <h4>{item.name}</h4>
                      <p>{item.sub}</p>
                      <span className="mini-pollut-value">
                        <strong>{item.value}</strong>
                        <small>{item.unit}</small>
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-lower-row">
            <div className="dashboard-side-stack">
              <div>
                <SecLabel title="活動建議" />
                <div className="advice-card" style={{ backgroundColor: `${activity.color}18`, border: `1px solid ${activity.color}55` }}>
                  <span className="advice-icon" style={{ backgroundColor: `${activity.color}28` }}>
                    <ActivityIcon size={18} color={activity.color} />
                  </span>
                  <p className="insight-copy">
                    <strong style={{ color: activity.color }}>{aiActivityAdvice?.title ?? fallbackInsight.activityTitle}</strong>
                    <span>{aiActivityAdvice?.summary ?? fallbackInsight.activitySummary}</span>
                  </p>
                </div>
              </div>

              <div>
                <SecLabel title="AI 趨勢分析" />
                <div className="insight-card">
                  <span className="insight-icon">
                    <TrendingDown size={16} />
                  </span>
                  <p className="insight-copy">
                    <strong>{aiTrendInsight?.headline ?? fallbackInsight.trendHeadline}</strong>
                    <span>{aiTrendInsight?.summary ?? fallbackInsight.trendSummary}</span>
                  </p>
                </div>
              </div>
            </div>

            <section className="trend-section">
              <div className="trend-heading">
                <SecLabel title={<>PM<sub className="text-xs">2.5</sub> 趨勢</>} />
                <span className="scroll-hint">
                  <ChevronsRight size={13} />
                  左右滑動查看
                </span>
              </div>
              <TrendBars />
            </section>
          </div>
        </section>

        
      </main>
    </>
  );
}
