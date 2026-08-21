'use client';

import React, { useState } from 'react';
import { ChevronDown, Plane, Wind } from 'lucide-react';
import type { FlightSummary } from '@/lib/uavApi';
import { C, type ActiveView } from '../_lib/eventsConfig';

export function ViewSwitcher({
  active,
  onChange,
}: {
  active: ActiveView;
  onChange: (v: ActiveView) => void;
}) {
  const tabs: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    {
      id: 'uav',
      label: 'UAV 無人機',
      icon: <Plane size={15} strokeWidth={2} />,
    },
    {
      id: 'wind-lidar',
      label: 'Wind Lidar 風光達',
      icon: <Wind size={15} strokeWidth={2} />,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '6px',
        margin: '40px 0px 8px 36px',
        background: 'rgba(255,255,255,0.70)',
        borderRadius: 999,
        border: `1px solid ${C.blueBorder}`,
        boxShadow: C.glassShadow,
        width: 'fit-content',
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 20px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isActive ? 800 : 600,
              color: isActive ? '#fff' : C.muted,
              background: isActive ? C.blue : 'transparent',
              boxShadow: isActive ? '0 2px 10px rgba(49,94,143,0.30)' : 'none',
              transition: 'all 0.18s',
            }}
            aria-pressed={isActive}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Flight selector dropdown                                     */
/* ──────────────────────────────────────────────────────────── */
export function FlightDropdown({
  flights,
  selected,
  onSelect,
}: {
  flights: FlightSummary[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = flights.find((f) => f.flight_id === selected);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 999, cursor: 'pointer',
          background: C.glass,
          border: `1px solid ${C.blueBorder}`,
          boxShadow: C.glassShadow,
          fontSize: 14, fontWeight: 700, color: C.blue,
          transition: 'all 0.15s',
        }}
      >
        <Plane size={16} strokeWidth={2} />
        {current
          ? `${current.flight_id} — ${current.site_name ?? ''}`
          : '選擇飛行任務'}
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 300,
            background: '#fff',
            border: `1px solid ${C.blueBorder}`,
            borderRadius: 14, boxShadow: '0 8px 32px rgba(23,58,94,0.18)',
            minWidth: 280, overflow: 'hidden',
          }}
        >
          {flights.map((f, i) => (
            <button
              key={f.flight_id}
              onClick={() => { onSelect(f.flight_id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', textAlign: 'left',
                padding: '12px 18px',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: selected === f.flight_id ? 700 : 500,
                color: selected === f.flight_id ? C.blue : C.text,
                background: selected === f.flight_id ? C.blueAlpha : 'transparent',
                borderBottom: i < flights.length - 1 ? '1px solid rgba(23,58,94,0.08)' : 'none',
                transition: 'background-color 0.12s',
              }}
            >
              <div
                style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: selected === f.flight_id ? C.blue : 'rgba(23,58,94,0.4)',
                }}
              />
              <span style={{ flex: 1 }}>
                {f.flight_id}
                <span style={{ marginLeft: 8, fontSize: 12, color: C.hint, fontWeight: 500 }}>
                  {f.site_name} · {f.flight_direction}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Page                                                         */
/* ──────────────────────────────────────────────────────────── */
