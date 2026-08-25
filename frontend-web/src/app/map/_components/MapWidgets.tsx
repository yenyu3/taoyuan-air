'use client';

import React from 'react';
import { palette } from '@shared/constants/theme';

export const IconTemp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
  </svg>
);
export const IconHumidity = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);
export const IconWind = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);
export const IconCompass = ({ deg }: { deg: number }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: `rotate(${deg}deg)`, display: 'block' }}>
    <circle cx="12" cy="12" r="10"/>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="none" opacity="0.3"/>
    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2.5"/>
  </svg>
);

// ── Section label (same style as Dashboard SecLabel) ─────────────
export function SecLabel({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, flexShrink: 0, background: palette.primaryDeep, boxShadow: `0 0 6px ${palette.primaryDeep}55` }} />
      <span style={{ fontSize: 12, fontWeight: 800, color: palette.textMain }}>{title}</span>
      {sub && <small style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>{sub}</small>}
    </div>
  );
}

// ── Map page ─────────────────────────────────────────────────────
