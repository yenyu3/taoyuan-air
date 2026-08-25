'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { C } from '../_lib/parameterStatus';

export function Dropdown({ id, value, options, onSelect, openId, setOpenId, renderOption }: {
  id: string; value: string; options: string[];
  onSelect: (v: string) => void;
  openId: string | null; setOpenId: (v: string | null) => void;
  renderOption?: (opt: string) => React.ReactNode;
}) {
  const isOpen = openId === id;
  const isActive = value !== options[0];
  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpenId(isOpen ? null : id); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 999, cursor: 'pointer',
          maxWidth: '100%',
          backgroundColor: isActive ? C.primaryAlpha : C.glass,
          border: `1px solid ${isActive ? C.primaryBorder : C.glassBorder}`,
          boxShadow: C.glassShadow,
          fontSize: 13, fontWeight: isActive ? 700 : 500,
          color: isActive ? C.primary : C.muted,
          transition: 'all 0.15s',
        }}
      >
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {renderOption ? renderOption(value) : value}
        </span>
        <ChevronDown
          size={14} strokeWidth={2.5}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
            backgroundColor: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden',
          }}
        >
          {options.map((opt, i) => (
            <button key={opt} onClick={() => { onSelect(opt); setOpenId(null); }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '11px 16px', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: value === opt ? 700 : 500,
              color: value === opt ? C.primary : C.text,
              backgroundColor: value === opt ? C.primaryAlpha : 'transparent',
              borderBottom: i < options.length - 1 ? '1px solid rgba(23,58,94,0.08)' : 'none',
            }}>
              {renderOption ? renderOption(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Data model ─────────────────────────────────────────────── */
