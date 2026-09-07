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
  const fallbackActivityTitle = '敏感族群留意戶外活動';
  const fallbackActivityAdvice =
    '空氣品質稍有影響，敏感族群宜減少長時間戶外劇烈活動並備妥口罩，一般民眾可正常活動。';
  const fallbackTrendInsight =
    '目前資料不足以判斷明確趨勢，建議持續關注；若晚間風速轉弱或排放增加，PM2.5 可能短暫累積。';

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
                    <strong style={{ color: activity.color }}>{aiActivityAdvice?.title ?? fallbackActivityTitle}</strong>
                    <span>{aiActivityAdvice?.summary ?? fallbackActivityAdvice}</span>
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
                    <strong>{aiTrendInsight?.headline ?? <>PM<sub className="text-xs">2.5</sub> 趨勢分析</>}</strong>
                    <span>{aiTrendInsight?.summary ?? fallbackTrendInsight}</span>
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
