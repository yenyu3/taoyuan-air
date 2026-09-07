'use client';

import React from 'react';
import { Plane, Wind } from 'lucide-react';
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
        margin: '24px 0 12px 40px',
        background: 'rgba(255,255,255,0.5)',
        borderRadius: 999,
        border: `1px solid ${C.blueBorder}`,
        boxShadow: 'none',
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
              boxShadow: isActive ? '0 2px 10px rgba(106, 141, 115, 0.30)' : 'none',
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
