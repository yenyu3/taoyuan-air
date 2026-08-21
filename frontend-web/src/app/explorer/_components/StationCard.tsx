'use client';

import React, { useState } from 'react';
import { Clock, Droplets, MapPin, Minus, Thermometer, TrendingDown, TrendingUp } from 'lucide-react';
import type { StationData } from '../_types';
import { C, WIND_LEVEL_INFO, detailRangeItems, parameterColor, parameterStatus } from '../_lib/parameterStatus';
import { getParameterDisplay } from '../_lib/buildCards';
import { GaugeArc } from './GaugeArc';

export function StatChip({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: string | number; label?: string; color: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Icon size={15} color={color} strokeWidth={2.2} />
      <span style={{ fontSize: 15, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
        {value}
        {label && <span style={{ fontWeight: 500, marginLeft: 2 }}>{label}</span>}
      </span>
    </div>
  );
}

/* ─── Station card ───────────────────────────────────────────── */
export function StationCard({ station }: { station: StationData }) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedWindLabel, setSelectedWindLabel] = useState<string | null>(null);
  const pColor  = parameterColor(station.parameter, station.value);
  const status = parameterStatus(station.parameter, station.value);
  const detailItems = detailRangeItems(station.parameter, station.unit);
  const isWindDetail = station.parameter === '風速';
  const isWeather = station.source === '氣象署';
  const sColor  = status.color;
  const sAlpha  = status.alpha;
  const sBorder = status.border;
  const activeWindItem = isWindDetail
    ? detailItems.find(item => item.label === selectedWindLabel)
      ?? detailItems.find(item => item.label === status.label)
      ?? detailItems[0]
    : null;

  const TrendIcon  = station.trend === '上升中' ? TrendingUp : station.trend === '下降中' ? TrendingDown : Minus;
  const tColor  = station.trend === '上升中' ? sColor  : station.trend === '下降中' ? C.green : C.hint;
  const tAlpha  = station.trend === '上升中' ? sAlpha  : station.trend === '下降中' ? C.greenAlpha : 'rgba(80,103,128,0.10)';
  const tBorder = station.trend === '上升中' ? sBorder : station.trend === '下降中' ? C.greenBorder : 'rgba(80,103,128,0.20)';

  return (
    <div style={{
      position: 'relative',
      backgroundColor: 'rgba(255,255,255,0.94)',
      border: '1px solid rgba(0,0,0,0.06)',
      borderRadius: 20,
      boxShadow: '0 4px 16px rgba(23,58,94,0.10)',
      height: 440,
      overflow: 'hidden',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {showDetails ? (
        <div style={{
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255,255,255,0.98)',
          height: 440,
          boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 950, color: C.text, lineHeight: 1.1 }}>
                {station.parameter}｜分級說明
              </p>
              <p style={{ fontSize: 11, color: C.muted, fontWeight: 800, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {station.station}
              </p>
            </div>
            <span style={{
              flexShrink: 0,
              padding: '5px 11px',
              borderRadius: 99,
              backgroundColor: status.alpha,
              border: `1px solid ${status.border}`,
              color: status.color,
              fontSize: 12,
              fontWeight: 900,
            }}>
              {status.label}
            </span>
          </div>

          <div style={{
            padding: '8px 11px',
            borderRadius: 15,
            backgroundColor: status.alpha,
            border: `1px solid ${status.border}`,
            marginBottom: 8,
          }}>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 850, marginBottom: 2 }}>目前值</p>
            <p style={{ fontSize: 26, lineHeight: 1, color: pColor, fontWeight: 950 }}>
              {station.value}
              <span style={{ fontSize: 13, color: C.muted, marginLeft: 6 }}>{station.unit}</span>
            </p>
          </div>

          {isWindDetail ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 4,
                marginBottom: 6,
              }}>
                {detailItems.map(item => {
                  const isActive = item.label === (activeWindItem?.label ?? status.label);
                  return (
                    <button
                      type="button"
                      key={`${station.id}-${item.label}`}
                      onClick={() => setSelectedWindLabel(item.label)}
                      style={{
                        minWidth: 0,
                        minHeight: 26,
                        padding: '4px 5px',
                        borderRadius: 10,
                        backgroundColor: isActive ? item.alpha : 'rgba(255,255,255,0.62)',
                        border: `1px solid ${isActive ? item.border : 'rgba(0,0,0,0.06)'}`,
                        color: isActive ? item.color : C.muted,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 900,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        lineHeight: 1.05,
                      }}
                    >
                      <span>{item.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.range}</span>
                    </button>
                  );
                })}
              </div>
              {activeWindItem && (
                <div style={{
                  padding: '7px 9px',
                  borderRadius: 12,
                  backgroundColor: activeWindItem.alpha,
                  border: `1px solid ${activeWindItem.border}`,
                  color: C.text,
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1.35,
                  marginBottom: 5,
                }}>
                  <span style={{ color: activeWindItem.color, fontWeight: 950 }}>
                    {activeWindItem.label}：
                  </span>
                  {WIND_LEVEL_INFO[activeWindItem.label] ?? '此風級說明待補。'}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'grid', gap: 5, marginBottom: 6 }}>
              {detailItems.map(item => {
                const isActive = item.label === status.label;
                return (
                  <div
                    key={`${station.id}-${item.label}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 28,
                      padding: '5px 10px',
                      borderRadius: 12,
                      backgroundColor: isActive ? item.alpha : 'rgba(255,255,255,0.58)',
                      border: `1px solid ${isActive ? item.border : 'rgba(0,0,0,0.05)'}`,
                      fontSize: 12,
                      fontWeight: 850,
                      lineHeight: 1.15,
                    }}
                  >
                    <span style={{ color: item.color }}>{item.label}</span>
                    <span style={{ color: C.muted, textAlign: 'right', minWidth: 0 }}>{item.range}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'grid', gap: 7 }}>
            <p style={{ fontSize: 11, color: C.hint, fontWeight: 800, textAlign: 'center', lineHeight: 1.4 }}>
              資料來源：{station.source}・{station.version}{!isWeather && `・${station.time}`}
            </p>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              style={{
                width: '100%',
                padding: '6px 0',
                borderRadius: 12,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: 15,
                fontWeight: 900,
                color: C.primary,
              }}
            >
              返回卡片
            </button>
          </div>
        </div>
      ) : (
      <>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{station.district}</p>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 3 }}>{station.station}</p>
          </div>
          <span style={{
            flexShrink: 0, marginLeft: 12,
            padding: '5px 12px', borderRadius: 99,
            backgroundColor: sAlpha, border: `1px solid ${sBorder}`,
            fontSize: 12, fontWeight: 700, color: sColor,
          }}>
            {status.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Clock size={11} color={C.hint} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.hint, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>{station.time}</span>
          <span style={{ fontSize: 11, color: C.hint, flexShrink: 0 }}>·</span>
          <span style={{
            fontSize: 11, color: C.primary, fontWeight: 700,
            padding: '2px 8px', borderRadius: 99, backgroundColor: C.primaryAlpha,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {station.source}
          </span>
          <span style={{
            fontSize: 11, color: C.hint, fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
          }}>{station.version}</span>
        </div>
      </div>

      {/* Gauge section */}
      <div style={{ padding: '16px 20px 12px', textAlign: 'center', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            fontSize: 13, fontWeight: 800, color: pColor,
            padding: '3px 12px', borderRadius: 99,
            backgroundColor: `${pColor}18`, border: `1px solid ${pColor}40`,
          }}>
            {getParameterDisplay(station.parameter)}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: sColor,
            padding: '3px 10px', borderRadius: 99,
            backgroundColor: sAlpha, border: `1px solid ${sBorder}`,
          }}>
            {isWeather ? '氣象觀測' : `AQI ${station.aqi}`}
          </span>
        </div>
        <GaugeArc value={station.value} parameter={station.parameter} unit={station.unit} />
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 99,
            backgroundColor: tAlpha, border: `1px solid ${tBorder}`,
            fontSize: 12, fontWeight: 700, color: tColor,
          }}>
            <TrendIcon size={13} strokeWidth={2.5} />
            {station.trend}
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            {station.temperature !== undefined && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, fontWeight: 600 }}>
                <Thermometer size={12} color={C.hint} strokeWidth={2} />
                {station.temperature}°C
              </span>
            )}
            {station.humidity !== undefined && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.muted, fontWeight: 600 }}>
                <Droplets size={12} color={C.hint} strokeWidth={2} />
                {station.humidity}%
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedWindLabel(null);
            setShowDetails(true);
          }}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 12, cursor: 'pointer',
            backgroundColor: C.primaryAlpha, border: `1px solid ${C.primaryBorder}`,
            fontSize: 13, fontWeight: 700, color: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <MapPin size={14} strokeWidth={2} />
          查看詳細資料
        </button>
      </div>
      </>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
