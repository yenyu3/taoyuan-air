'use client';

import React, { useMemo } from 'react';
import {
  Frown, MapPin, Meh, Smile,
  Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning, Droplet, Wind,
} from 'lucide-react';
import {
  getWeatherIconKey,
  type CurrentWeatherData,
  type ForecastDay,
  type WeatherIconKey,
} from '@shared/api/cwa';

export const C = {
  blue: '#315E8F',
  blueLt: 'rgba(49,94,143,0.12)',
  blueBorder: 'rgba(49,94,143,0.30)',
  glass: 'rgba(255,255,255,0.52)',
  glassInner: 'rgba(255,255,255,0.80)',
  glassShadow: 'rgba(23,58,94,0.14)',
  text: '#172A40',
  muted: '#506780',
  hint: '#6F91B2',
};

const COLORS = {
  good: '#4caf50',
  moderate: '#edbb05',
  unhealthySensitive: '#ff9800',
  unhealthy: '#f44336',
  veryUnhealthy: '#9c27b0',
  hazardous: '#1a0028',
};

export const DISTRICT_EXTENDED: Record<string, { no2: number; so2: number; co: number; pm10: number }> = {
  桃園區: { no2: 15, so2: 2.5, co: 0.45, pm10: 45 },
  中壢區: { no2: 15, so2: 1.3, co: 0.41, pm10: 44 },
  八德區: { no2: 12, so2: 2.1, co: 0.38, pm10: 38 },
  龜山區: { no2: 18, so2: 3.2, co: 0.55, pm10: 52 },
  蘆竹區: { no2: 11, so2: 2.0, co: 0.35, pm10: 32 },
  大園區: { no2: 10, so2: 2.8, co: 0.30, pm10: 30 },
  大溪區: { no2: 9, so2: 1.8, co: 0.28, pm10: 28 },
  平鎮區: { no2: 13, so2: 2.2, co: 0.40, pm10: 36 },
  楊梅區: { no2: 12, so2: 2.0, co: 0.36, pm10: 34 },
  龍潭區: { no2: 10, so2: 1.9, co: 0.36, pm10: 33 },
  觀音區: { no2: 16, so2: 3.5, co: 0.48, pm10: 50 },
  新屋區: { no2: 14, so2: 3.0, co: 0.46, pm10: 48 },
  復興區: { no2: 5, so2: 1.2, co: 0.20, pm10: 20 },
};

const TREND_DATA = [
  0.3, 0.2, 0.3, 0.5, 0.58, 0.47, 0.48, 0.52, 0.65, 0.42, 0.38,
  0.35, 0.3, 0.28, 0.4, 0.55, 0.6, 0.52, 0.45, 0.38, 0.3,
  0.25, 0.28, 0.32, 0.38, 0.42, 0.48, 0.5, 0.45, 0.4,
  0.38, 0.35, 0.33, 0.3, 0.28, 0.32, 0.35, 0.38,
];

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return COLORS.good;
  if (aqi <= 100) return COLORS.moderate;
  if (aqi <= 150) return COLORS.unhealthySensitive;
  if (aqi <= 200) return COLORS.unhealthy;
  if (aqi <= 300) return COLORS.veryUnhealthy;
  return COLORS.hazardous;
};

const getAQIStatus = (aqi: number) => {
  if (aqi <= 50) return '良好';
  if (aqi <= 100) return '普通';
  if (aqi <= 150) return '敏感族群';
  if (aqi <= 200) return '不健康';
  if (aqi <= 300) return '非常不健康';
  return '危害';
};

export const getPM25Color = (v: number) => {
  if (v <= 15.4) return '#315E8F';
  if (v <= 35.4) return COLORS.moderate;
  if (v <= 54.4) return COLORS.unhealthySensitive;
  if (v <= 150.4) return COLORS.unhealthy;
  if (v <= 250.4) return COLORS.veryUnhealthy;
  return COLORS.hazardous;
};

export const getO3Color = (v: number) => {
  if (v <= 54) return '#315E8F';
  if (v <= 70) return COLORS.moderate;
  if (v <= 85) return COLORS.unhealthySensitive;
  if (v <= 105) return COLORS.unhealthy;
  if (v <= 200) return COLORS.veryUnhealthy;
  return COLORS.hazardous;
};

const WEATHER_ICON_MAP: Record<WeatherIconKey, typeof Sun> = {
  sun: Sun,
  cloud: Cloud,
  'cloud-rain': CloudRain,
  'cloud-drizzle': CloudDrizzle,
  'cloud-lightning': CloudLightning,
};

export const getActivityInfo = (aqi: number) => {
  if (aqi <= 50) {
    return { icon: Smile, color: '#315E8F', advice: '正常戶外活動，無須特別注意。' };
  }
  if (aqi <= 100) {
    return { icon: Meh, color: COLORS.moderate, advice: '正常戶外活動。' };
  }
  if (aqi <= 150) {
    return {
      icon: Frown,
      color: COLORS.unhealthySensitive,
      advice: '若感不適，考慮減少戶外活動；學生建議減少長時間劇烈運動。',
    };
  }
  if (aqi <= 200) {
    return {
      icon: Frown,
      color: COLORS.unhealthy,
      advice: '若感不適，減少體力消耗；學生避免長時間劇烈運動並增加休息。',
    };
  }
  return {
    icon: Frown,
    color: aqi <= 300 ? COLORS.veryUnhealthy : COLORS.hazardous,
    advice: '減少或避免戶外活動；學生應停止戶外活動，課程調整至室內進行。',
  };
};

export function SecLabel({ title, sub }: { title: React.ReactNode; sub?: string }) {
  return (
    <div className="dash-section-label">
      <div className="dash-section-dot" />
      <span>{title}</span>
      {sub && <small>{sub}</small>}
    </div>
  );
}

export const GAUGE_SIZE = 158;
const STROKE_W = 9;
const GAUGE_R = (GAUGE_SIZE - STROKE_W) / 2;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R;

export function AQIGauge({ aqi, animationKey }: { aqi: number; animationKey: string }) {
  const color = getAQIColor(aqi);
  const pct = Math.min(Math.max(aqi / 200, 0), 1);
  const offset = GAUGE_CIRC * (1 - pct);
  const center = GAUGE_SIZE / 2;

  return (
    <div className="aqi-gauge">
      <svg width={GAUGE_SIZE} height={GAUGE_SIZE} aria-hidden="true">
        <defs>
          <linearGradient id="aqi-ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={`${color}99`} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={GAUGE_R}
          stroke={color}
          strokeOpacity={0.25}
          strokeWidth={STROKE_W}
          fill="none"
        />
        <circle
          key={`aqi-ring-${animationKey}-${aqi}`}
          cx={center}
          cy={center}
          r={GAUGE_R}
          stroke="url(#aqi-ring-gradient)"
          strokeWidth={STROKE_W}
          fill="none"
          strokeDasharray={GAUGE_CIRC}
          strokeDashoffset={GAUGE_CIRC}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        >
          <animate
            attributeName="stroke-dashoffset"
            from={GAUGE_CIRC}
            to={offset}
            dur="1.2s"
            fill="freeze"
            calcMode="linear"
          />
        </circle>
      </svg>
      <div className="aqi-gauge-inner">
        <span className="aqi-label">AQI</span>
        <strong style={{ color }}>{aqi}</strong>
        <span className="aqi-pill" style={{ color, backgroundColor: `${color}33`, borderColor: `${color}55` }}>
          {getAQIStatus(aqi)}
        </span>
      </div>
    </div>
  );
}

const ARC_R = 45;
const ARC_CX = 55;
const ARC_CY = 58;
const ARC_LEN = Math.PI * ARC_R;

function polarToXY(angleDeg: number) {
  const rad = (Math.PI * (180 - angleDeg)) / 180;
  return { x: ARC_CX + ARC_R * Math.cos(rad), y: ARC_CY - ARC_R * Math.sin(rad) };
}

export function GaugeArc({
  value,
  max,
  markerVal,
  color,
  unit,
  animationKey,
}: {
  value: number;
  max: number;
  markerVal: number;
  color: string;
  unit: string;
  animationKey: string;
}) {
  const dashOffset = ARC_LEN * (1 - Math.min(value / max, 1));
  const markerAngle = Math.min(markerVal / max, 1) * 180;
  const mp = polarToXY(markerAngle);
  const rad = (Math.PI * (180 - markerAngle)) / 180;
  const lx = ARC_CX + (ARC_R + 14) * Math.cos(rad);
  const ly = ARC_CY - (ARC_R + 14) * Math.sin(rad);

  return (
    <svg width={190} height={90} viewBox="-10 0 120 68" className="mini-arc" aria-hidden="true">
      <path d={`M 10 58 A ${ARC_R} ${ARC_R} 0 0 1 100 58`} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={7} strokeLinecap="round" />
      <path
        key={`mini-arc-${animationKey}-${value}-${unit}`}
        d={`M 10 58 A ${ARC_R} ${ARC_R} 0 0 1 100 58`}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={ARC_LEN}
        strokeDashoffset={ARC_LEN}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={ARC_LEN}
          to={dashOffset}
          dur="0.8s"
          fill="freeze"
          calcMode="linear"
        />
      </path>
      <line x1={mp.x} y1={mp.y} x2={lx} y2={ly} stroke="rgba(0,0,0,0.28)" strokeWidth={1.5} strokeLinecap="round" />
      <text x={lx} y={ly - 3} fontSize={9} fill="#aaa" textAnchor="middle">{markerVal}</text>
      <text x={ARC_CX} y={52} fontSize={20} fontWeight={700} fill={color} textAnchor="middle">{value}</text>
      <text x={ARC_CX} y={63} fontSize={9} fill="#aaa" textAnchor="middle">{unit}</text>
    </svg>
  );
}

export function TrendBars() {
  const BAR_W = 12;
  const BAR_GAP = 8;
  const MAX_H = 74;
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

  const slots = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const items: { hour: number; date: Date; isPrediction: boolean; isNow: boolean }[] = [];

    for (let i = 12; i >= 1; i -= 1) {
      const d = new Date(now);
      d.setHours(currentHour - i, 0, 0, 0);
      items.push({ hour: d.getHours(), date: d, isPrediction: false, isNow: false });
    }

    items.push({ hour: currentHour, date: new Date(now), isPrediction: false, isNow: true });

    for (let i = 1; i <= 12; i += 1) {
      const d = new Date(now);
      d.setHours(currentHour + i, 0, 0, 0);
      items.push({ hour: d.getHours(), date: d, isPrediction: true, isNow: false });
    }

    return items;
  }, []);

  const data = TREND_DATA.slice(0, 25);
  const totalWidth = data.length * (BAR_W + BAR_GAP) - BAR_GAP;
  const pastWidth = 12 * (BAR_W + BAR_GAP);
  const nowOffset = pastWidth + BAR_W / 2;

  const barColor = (value: number, isPrediction: boolean) => {
    if (isPrediction) {
      if (value <= 0.3) return '#D9D9D9';
      if (value <= 0.5) return '#C4C4C4';
      if (value <= 0.7) return '#999999';
      return '#7B7B7B';
    }
    if (value <= 0.3) return '#7ec480'; 
    if (value <= 0.5) return '#f2d44a';  
    if (value <= 0.7) return '#f87171';  
    return '#c07bc0'; 
  };

  const dateLabel = (index: number) => {
    if (index === 0) return null;
    const curr = slots[index];
    const prev = slots[index - 1];
    if (!curr || !prev || curr.date.getDate() === prev.date.getDate()) return null;
    return `${curr.date.getMonth() + 1}/${curr.date.getDate()}(${WEEK[curr.date.getDay()]})`;
  };

  return (
    <div className="trend-scroll">
      <div className="trend-inner" style={{ width: totalWidth }}>
        <div className="trend-date-row">
          {data.map((_, index) => {
            const label = dateLabel(index);
            if (!label) return null;
            return (
              <span key={index} className="trend-date-label" style={{ left: index * (BAR_W + BAR_GAP) - 10 }}>
                {label}
              </span>
            );
          })}
        </div>

        <div className="trend-bars" style={{ gap: BAR_GAP }}>
          {data.map((value, index) => {
            const slot = slots[index] ?? { isPrediction: false, isNow: false };
            const label = dateLabel(index);
            return (
              <div key={index} className="trend-bar-wrap" style={{ width: BAR_W }}>
                {label && <span className="trend-day-line" />}
                <span
                  className="trend-bar"
                  style={{
                    height: Math.max(5, value * MAX_H),
                    width: BAR_W,
                    backgroundColor: barColor(value, slot.isPrediction),
                    borderColor: slot.isNow ? '#6F91B2' : 'transparent',
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="trend-hour-row">
          {data.map((_, index) => {
            const slot = slots[index];
            if (!slot) return null;
            return (
              <span
                key={index}
                className={`trend-hour${slot.isNow ? ' now' : ''}${slot.isPrediction ? ' prediction' : ''}`}
                style={{ left: index * (BAR_W + BAR_GAP) - 5 }}
              >
                {String(slot.hour).padStart(2, '0')}
              </span>
            );
          })}
        </div>

        <div className="trend-footer">
          <span>過去 12h</span>
          <strong style={{ left: nowOffset - 14 }}>NOW</strong>
          <span>未來 12h</span>
        </div>
      </div>
    </div>
  );
}

export function WeatherCard({
  district,
  current,
  forecast,
  past1hrRain,
}: {
  district: string;
  current: CurrentWeatherData;
  forecast: ForecastDay[];
  past1hrRain: string;
}) {
  const CurrentIcon = WEATHER_ICON_MAP[getWeatherIconKey(current.weather)];

  const stats = [
    { Icon: Droplet, val: `${current.humidity}%`, label: '濕度' },
    { Icon: Wind, val: `${current.windSpeed}m/s`, label: '風速' },
    { Icon: CloudRain, val: `${past1hrRain}mm`, label: '近1時雨量' },
  ];

  return (
    
    <div className="weather-card">
      <div className="weather-current-row">
        <div>
          <div className="weather-temp-row">
            <strong className="weather-temp-big">{current.temperature}°</strong>
            <span className="weather-district-badge">
              <MapPin size={10} />
              {district}
            </span>
          </div>
          <p className="weather-desc">{current.weather}</p>
          <div className="weather-hilo-row">
            <span className="weather-hi">{current.dailyHigh}°</span>
            <span className="weather-sep">/</span>
            <span className="weather-lo">{current.dailyLow}°</span>
          </div>
        </div>
        <span className="weather-icon-circle">
          <CurrentIcon size={32} color="#315E8F" />
        </span>
      </div>

      <div className="weather-stats-row">
        {stats.map(({ Icon, val, label }, i) => (
          <React.Fragment key={label}>
            <div className="weather-stat-item">
              <Icon size={13} color="#315E8F" />
              <span className="weather-stat-val">{val}</span>
              <span className="weather-stat-label">{label}</span>
            </div>
            {i < stats.length - 1 && <div className="weather-stat-sep" />}
          </React.Fragment>
        ))}
      </div>

      <div className="dash-divider" />

      <p className="weather-forecast-title">未來 3 天預報</p>
      <div className="weather-forecast-row">
        {forecast.map((day, i) => {
          const DayIcon = WEATHER_ICON_MAP[getWeatherIconKey(day.weather)];
          return (
            <div
              key={day.label}
              className={`weather-forecast-col${i < forecast.length - 1 ? ' weather-forecast-col-border' : ''}`}
            >
              <span className="weather-forecast-label">{day.label}</span>
              <span className="weather-forecast-date">{day.dateLabel}</span>
              <DayIcon size={20} color="#315E8F" style={{ margin: '8px 0' }} />
              <div className="weather-forecast-temp-row">
                <span className="weather-forecast-hi">{day.maxTemp}°</span>
                <span className="weather-forecast-lo"> / {day.minTemp}°</span>
              </div>
              <div className="weather-forecast-pop-row">
                <CloudRain size={10} color={Number(day.precipProb) >= 50 ? '#5b9bd5' : '#bbb'} />
                <span
                  className="weather-forecast-pop-text"
                  style={Number(day.precipProb) >= 50 ? { color: '#5b9bd5' } : undefined}
                >
                  {day.precipProb}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
