'use client';

import React from 'react';
import { AQI_RANGES, GAUGE_PARAMS, detailRangeItems, parameterColor } from '../_lib/parameterStatus';

export const ARC_R = 45, ARC_CX = 55, ARC_CY = 58, ARC_LEN = Math.PI * ARC_R;

export function polarToXY(deg: number) {
  const rad = (Math.PI * (180 - deg)) / 180;
  return { x: ARC_CX + ARC_R * Math.cos(rad), y: ARC_CY - ARC_R * Math.sin(rad) };
}

// Keep SVG attributes stable between server render and browser hydration.
export function svgNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

export function GaugeArc({ value, parameter, unit }: { value: number; parameter: string; unit: string }) {
  const gaugeConfig = GAUGE_PARAMS[parameter] ?? { max: 200, marker: 100 };
  const color = parameterColor(parameter, value);
  const isAqi = parameter in AQI_RANGES;

  // AQI 參數：動態顯示目前級別起往後 3 個門檻
  // 氣象參數：顯示目前所在級別的 upper（即下一級的起始門檻）
  const markers: number[] = [];
  if (isAqi) {
    const ranges = detailRangeItems(parameter, unit);
    const currentLevelIndex = ranges.findIndex(item => value <= item.upper);
    if (currentLevelIndex >= 0) {
      for (let i = currentLevelIndex; i < ranges.length && markers.length < 3; i++) {
        if (Number.isFinite(ranges[i].upper)) {
          markers.push(ranges[i].upper);
        }
      }
    }
    if (markers.length === 0) markers.push(gaugeConfig.marker);
  } else {
    const ranges = detailRangeItems(parameter, unit);
    const currentLevelIndex = ranges.findIndex(item => value <= item.upper);
    if (currentLevelIndex >= 0 && Number.isFinite(ranges[currentLevelIndex].upper)) {
      markers.push(ranges[currentLevelIndex].upper);
    } else {
      const last = [...ranges].reverse().find(item => Number.isFinite(item.upper));
      markers.push(last ? last.upper : gaugeConfig.marker);
    }
  }

  const dashOffset = ARC_LEN * (1 - Math.min(value / gaugeConfig.max, 1));

  return (
    <svg
      viewBox="-10 0 120 75"
      style={{ display: 'block', width: '100%', maxWidth: 190, margin: '0 auto', overflow: 'visible' }}
    >
      <path d={`M 10 58 A ${ARC_R} ${ARC_R} 0 0 1 100 58`} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={7} strokeLinecap="round" />
      <path
        d={`M 10 58 A ${ARC_R} ${ARC_R} 0 0 1 100 58`}
        fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
        strokeDasharray={svgNumber(ARC_LEN)} strokeDashoffset={svgNumber(dashOffset)}
      />
      {markers.map((m, idx) => {
        const markerAngle = Math.min(m / gaugeConfig.max, 1) * 180;
        const mp = polarToXY(markerAngle);
        const rad = (Math.PI * (180 - markerAngle)) / 180;
        const lx = ARC_CX + (ARC_R + 14) * Math.cos(rad);
        const ly = ARC_CY - (ARC_R + 14) * Math.sin(rad);
        return (
          <g key={`marker-${idx}`}>
            <line x1={svgNumber(mp.x)} y1={svgNumber(mp.y)} x2={svgNumber(lx)} y2={svgNumber(ly)} stroke="rgba(0,0,0,0.22)" strokeWidth={1.5} strokeLinecap="round" />
            <text x={svgNumber(lx)} y={svgNumber(ly - 3)} fontSize={9} fill="#bbb" textAnchor="middle">{m}</text>
          </g>
        );
      })}
      <text x={ARC_CX} y={50} fontSize={22} fontWeight={700} fill={color} textAnchor="middle">{value}</text>
      <text x={ARC_CX} y={63} fontSize={9} fill="#aaa" textAnchor="middle">{unit}</text>
    </svg>
  );
}

/* ─── Dropdown ───────────────────────────────────────────────── */
