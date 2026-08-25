'use client';

import React from 'react';
import { Bell, Heart, Settings, Shield, UserCheck } from 'lucide-react';

export const C = {
  primary:       '#315E8F',
  primaryAlpha:  'rgba(49,94,143,0.12)',
  primaryBorder: 'rgba(49,94,143,0.30)',
  coral:         '#C4614A',
  coralAlpha:    'rgba(196,97,74,0.10)',
  coralBorder:   'rgba(196,97,74,0.25)',
  glass:         'rgba(255,255,255,0.52)',
  glassBorder:   'rgba(255,255,255,0.72)',
  glassShadow:   '0 4px 16px rgba(23,58,94,0.10)',
  text:          '#172A40',
  muted:         '#506780', 
  hint:          '#6F91B2',
};

export const card: React.CSSProperties = {
  backgroundColor: C.glass,
  border: `1px solid ${C.glassBorder}`,
  borderRadius: 20,
  boxShadow: C.glassShadow,
  width: '100%',
  boxSizing: 'border-box',
};

export type Section = '基本資料' | '帳戶安全' | '身份驗證' | '健康檔案' | '通知偏好';

export const NAV: { key: Section; Icon: React.ElementType; desc: string }[] = [
  { key: '基本資料', Icon: Settings,   desc: '頭像、名稱與信箱' },
  { key: '帳戶安全', Icon: Shield,     desc: '密碼與登入方式' },
  { key: '身份驗證', Icon: UserCheck,  desc: '帳號驗證狀態' },
  { key: '健康檔案', Icon: Heart,      desc: '個人健康資訊' },
  { key: '通知偏好', Icon: Bell,       desc: '警報與推播設定' },
];

/* ─── Toggle ─────────────────────────────────────────────────── */
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch" aria-checked={value} tabIndex={0}
      onClick={() => onChange(!value)}
      onKeyDown={(e) => e.key === ' ' && onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
        position: 'relative', flexShrink: 0, outline: 'none',
        backgroundColor: value ? C.primary : 'rgba(23,58,94,0.25)',
        transition: 'background-color 0.2s',
        boxShadow: value ? `0 0 0 3px ${C.primaryAlpha}` : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }} />
    </div>
  );
}

/* ─── Section label ──────────────────────────────────────────── */
export function SectionLabel({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 2, marginTop: 10 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: C.primary, boxShadow: `0 0 6px ${C.primaryAlpha}` }} />
      <span style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: 0.2 }}>{title}</span>
    </div>
  );
}

/* ─── Field row ──────────────────────────────────────────────── */
export function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.hint, letterSpacing: 0.8 }}>{label}</span>
      <div style={{
        padding: '11px 14px', borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.6)',
        border: `1px solid ${C.glassBorder}`,
        fontSize: 14, color: C.text, fontWeight: 500,
      }}>{value}</div>
    </div>
  );
}

/* ─── Toggle row ─────────────────────────────────────────────── */
export function ToggleRow({
  Icon, iconColor, iconBg, title, desc, value, onChange,
}: {
  Icon: React.ElementType; iconColor: string; iconBg: string;
  title: React.ReactNode; desc: React.ReactNode; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} color={iconColor} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{title}</p>
        <p style={{ fontSize: 12, color: C.hint }}>{desc}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export const INIT = {
  twoFactor: false,
  conditions: { asthma: true, elderly: false, child: false },
  notifs: { pm25: true, aqi: true, health: false, system: true },
};

/* ═══════════════════════════════════════════════════════════════ */
