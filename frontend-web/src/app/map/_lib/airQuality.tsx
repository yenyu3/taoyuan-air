'use client';

import React from 'react';
import type { Pollutant } from '@shared/types';
import { palette } from '@shared/constants/theme';

export const pollutantMeta: Record<Pollutant, {
  short: React.ReactNode; label: string; unit: string; description: string;
  range: [string, string, string, string]; arcMax: number; arcStandard: number;
}> = {
  PM25: {
    short: <>PM<sub className="text-xs">2.5</sub></>, label: '細懸浮微粒', unit: 'µg/m³',
    description: '極細小的懸浮顆粒，容易被吸入肺部深處，來源包括車輛廢氣與工業排放。',
    range: ['0', '15', '35', '54+'], arcMax: 100, arcStandard: 15.4,
  },
  O3: {
    short: <>O<sub className="text-xs">3</sub></>, label: '臭氧', unit: 'ppb',
    description: '陽光照射下產生的氣體，午後濃度較高，對眼睛和呼吸道有刺激性。',
    range: ['0', '55', '125', '165+'], arcMax: 200, arcStandard: 54,
  },
  NOX: {
    short: <>NO<sub className="text-xs">x</sub></>, label: '氮氧化物', unit: 'ppb',
    description: '主要來自交通與燃燒排放，是城市空氣污染的重要指標。',
    range: ['0', '30', '80', '150+'], arcMax: 200, arcStandard: 30,
  },
  VOCs: {
    short: 'VOCs', label: '揮發性有機物', unit: 'ppb',
    description: '來自工業、油漆、溶劑等，也是臭氧生成的重要前驅物。',
    range: ['0', '100', '250', '500+'], arcMax: 600, arcStandard: 100,
  },
};

// ── AQI color / status (standard scale) ─────────────────────────
export const getAQIColor = (aqi: number) => {
  if (aqi <= 50)  return '#76c476';
  if (aqi <= 100) return '#edbb05';
  if (aqi <= 150) return '#ff9800';
  if (aqi <= 200) return '#f44336';
  return '#9c27b0';
};
export const getAQIStatus = (aqi: number) => {
  if (aqi <= 50)  return '良好';
  if (aqi <= 100) return '普通';
  if (aqi <= 150) return '敏感族群注意';
  if (aqi <= 200) return '對所有人不健康';
  return '非常不健康';
};
export const getAQIBadgeBg = (aqi: number) => {
  if (aqi <= 50)  return { bg: 'rgba(118,196,118,0.14)', color: '#2F6B3D' };
  if (aqi <= 100) return { bg: 'rgba(237,187,5,0.14)',   color: '#7A5A00' };
  if (aqi <= 150) return { bg: 'rgba(255,152,0,0.14)',   color: '#8B4E00' };
  if (aqi <= 200) return { bg: 'rgba(244,67,54,0.12)',   color: '#9F1239' };
  return              { bg: 'rgba(156,39,176,0.12)',   color: '#6B21A8' };
};

export const getPollutantColor = (value: number, standard: number) => {
  const r = value / standard;
  if (r <= 1)   return '#76c476';
  if (r <= 2)   return '#edbb05';
  if (r <= 3.5) return '#ff9800';
  return '#f44336';
};

// ── Circle AQI Gauge (adapted from Dashboard AQIGauge) ──────────
export const G = { SIZE: 118, STROKE: 8 } as const;
export const G_R    = (G.SIZE - G.STROKE) / 2;        // 55
export const G_CIRC = 2 * Math.PI * G_R;              // ~345.6
export const G_CTR  = G.SIZE / 2;                     // 59

export function CardAQIGauge({ aqi }: { aqi: number }) {
  const color  = getAQIColor(aqi);
  const pct    = Math.min(Math.max(aqi / 200, 0), 1);
  const offset = G_CIRC * (1 - pct);
  return (
    <div style={{ position: 'relative', width: G.SIZE, height: G.SIZE, display: 'grid', placeItems: 'center', margin: '0 auto' }}>
      <svg width={G.SIZE} height={G.SIZE} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <defs>
          <linearGradient id="map-aqi-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={`${color}99`} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={G_CTR} cy={G_CTR} r={G_R} stroke={color} strokeOpacity={0.2} strokeWidth={G.STROKE} fill="none" />
        <circle
          key={`aqi-ring-${aqi}`}
          cx={G_CTR} cy={G_CTR} r={G_R}
          stroke="url(#map-aqi-grad)" strokeWidth={G.STROKE} fill="none"
          strokeDasharray={G_CIRC} strokeDashoffset={G_CIRC}
          strokeLinecap="round"
          transform={`rotate(-90, ${G_CTR}, ${G_CTR})`}
        >
          <animate attributeName="stroke-dashoffset" from={G_CIRC} to={offset} dur="1s" fill="freeze" calcMode="linear" />
        </circle>
      </svg>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: G.SIZE - 38, height: G.SIZE - 38, borderRadius: '50%', background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(58,30,45,0.08)' }}>
        <span style={{ fontSize: 8, color: '#6F91B2', letterSpacing: '1.5px', fontFamily: 'monospace' }}>AQI</span>
        <strong style={{ fontSize: 26, lineHeight: 1.1, fontWeight: 900, color }}>{aqi}</strong>
        <span style={{ marginTop: 3, padding: '1px 6px', borderRadius: 999, background: `${color}22`, border: `1px solid ${color}44`, fontSize: 8, fontWeight: 800, color }}>{getAQIStatus(aqi)}</span>
      </div>
    </div>
  );
}

// ── Half-arc pollutant gauge (adapted from Dashboard GaugeArc) ───
export const ARC_R   = 42;
export const ARC_CX  = 52;
export const ARC_CY  = 54;
export const ARC_LEN = Math.PI * ARC_R;

export function polarToXY(angleDeg: number) {
  const rad = (Math.PI * (180 - angleDeg)) / 180;
  return { x: ARC_CX + ARC_R * Math.cos(rad), y: ARC_CY - ARC_R * Math.sin(rad) };
}

export function CardPollutantArc({ value, max, standard, color, unit, label }: {
  value: number; max: number; standard: number; color: string; unit: string; label: string;
}) {
  const dashOffset    = ARC_LEN * (1 - Math.min(value / max, 1));
  const markerAngle   = Math.min(standard / max, 1) * 180;
  const rad           = (Math.PI * (180 - markerAngle)) / 180;
  const mp            = polarToXY(markerAngle);
  const lx            = ARC_CX + (ARC_R + 13) * Math.cos(rad);
  const ly            = ARC_CY - (ARC_R + 13) * Math.sin(rad);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: palette.textMain, lineHeight: 1.2 }}>{label}</div>
      <svg
        key={`arc-${value}-${unit}`}
        width={160} height={76}
        viewBox="-8 0 120 65"
        style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
        aria-hidden="true"
      >
        <path d={`M 10 54 A ${ARC_R} ${ARC_R} 0 0 1 94 54`} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={6} strokeLinecap="round" />
        <path
          d={`M 10 54 A ${ARC_R} ${ARC_R} 0 0 1 94 54`}
          fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={ARC_LEN} strokeDashoffset={ARC_LEN}
        >
          <animate attributeName="stroke-dashoffset" from={ARC_LEN} to={dashOffset} dur="0.8s" fill="freeze" calcMode="linear" />
        </path>
        <line x1={mp.x} y1={mp.y} x2={lx} y2={ly} stroke="rgba(0,0,0,0.25)" strokeWidth={1.5} strokeLinecap="round" />
        <text x={lx} y={ly - 2} fontSize={8} fill="#aaa" textAnchor="middle">{standard}</text>
        <text x={ARC_CX} y={48} fontSize={19} fontWeight={700} fill={color} textAnchor="middle">{Math.round(value)}</text>
        <text x={ARC_CX} y={59} fontSize={8} fill="#aaa" textAnchor="middle">{unit}</text>
      </svg>
    </div>
  );
}

// ── Sensitive group icons ────────────────────────────────────────
