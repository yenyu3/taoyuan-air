'use client';

import { X } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GridCell } from '@shared/types';
import { CardAQIGauge, CardPollutantArc, getAQIBadgeBg, getPollutantColor } from '../_lib/airQuality';
import { getPm25CssColor, getPm25HexColor } from '../_lib/mapColors';
import { forecastSeriesForGrid } from '../_lib/forecast';
import { formatTime, getGridLocationName } from '../_lib/search';
import { SENSITIVE_GROUPS } from '../_data/sensitiveGroups';
import { IconCompass, IconHumidity, IconTemp, IconWind, SecLabel } from './MapWidgets';
import styles from '../map.module.css';

const PM25_UNIT = 'μg/m³';

interface GridDetailDrawerProps {
  grid: GridCell | null;
  /** Present-time snapshot of the same grid; the forecast sparkline must project from "now", not from an already-forecasted value. Falls back to `grid`. */
  baseGrid?: GridCell | null;
  open: boolean;
  onClose: () => void;
}

export function GridDetailDrawer({ grid, baseGrid, open, onClose }: GridDetailDrawerProps) {
  const visible = open && grid !== null;
  const aqi = grid?.health.aqi ?? 0;
  const aqiBadge = getAQIBadgeBg(aqi);
  const pollValue = grid ? Math.round(grid.values.value) : 0;
  const pollColor = grid ? getPollutantColor(grid.values.value, 15.4) : '#76c476';

  const meteoCells = grid
    ? [
        { icon: <IconTemp />, label: '溫度', value: `${grid.meteo.temp.toFixed(1)}°C` },
        { icon: <IconHumidity />, label: '濕度', value: `${grid.meteo.humidity.toFixed(0)}%` },
        { icon: <IconWind />, label: '風速', value: `${grid.meteo.windSpeed.toFixed(1)} m/s` },
        { icon: <IconCompass deg={grid.meteo.windDir} />, label: '風向', value: `${grid.meteo.windDir.toFixed(0)}°` },
      ]
    : [];

  return (
    <aside
      className={`${styles.drawer} ${styles.glass} ${visible ? '' : styles.drawerHidden}`}
      aria-hidden={!visible}
    >
      {/* Unmount contents when hidden so the close button / chart leave the tab
          order (opacity:0 + pointer-events:none don't remove focusability, and
          the <aside> is aria-hidden). */}
      {visible && grid && (
        <>
          <div className={styles.drawerHeader}>
            <div className={styles.drawerHeaderTop}>
              <div>
                <p className={styles.drawerKicker}>PM2.5 網格</p>
                <h2 className={styles.drawerTitle}>{getGridLocationName(grid)}</h2>
              </div>
              <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="關閉詳情">
                <X size={16} />
              </button>
            </div>
            <div className={styles.drawerBadges}>
              <span className={styles.drawerLevel} style={{ background: aqiBadge.bg, color: aqiBadge.color }}>
                {grid.health.level}
              </span>
              <span className={styles.drawerMeta}>更新 {formatTime(grid.updatedAt)}</span>
            </div>
          </div>

          <div className={styles.drawerBody}>
            <div className={styles.drawerSection}>
              <div style={{ marginBottom: 10 }}>
                <SecLabel title="空氣品質摘要" />
              </div>
              <div className={styles.gaugeRow}>
                <div>
                  <CardAQIGauge key={`gauge-${aqi}`} aqi={aqi} />
                  <p className={styles.gaugeCaption}>AQI 0-200 指標</p>
                </div>
                <div>
                  <CardPollutantArc
                    key={`arc-${pollValue}-PM25`}
                    value={pollValue}
                    max={100}
                    standard={15.4}
                    color={pollColor}
                    unit={PM25_UNIT}
                    label="PM2.5"
                  />
                </div>
              </div>
            </div>

            <div className={styles.healthCard}>
              <div style={{ marginBottom: 8 }}>
                <SecLabel title="健康建議" />
              </div>
              <p className={styles.healthSummary}>{grid.health.summary}</p>
              <div className={styles.chipWrap}>
                <span className={styles.pill}>戶外活動：{grid.health.outdoorActivity}</span>
                <span className={grid.health.maskRequired ? `${styles.pill} ${styles.pillWarn}` : styles.pill}>
                  {grid.health.maskRequired ? '建議配戴口罩' : '一般族群可正常活動'}
                </span>
              </div>

              <div className={styles.subBlock}>
                <div style={{ marginBottom: 10 }}>
                  <SecLabel title="敏感族群" />
                </div>
                <div className={styles.sensitiveRow}>
                  {SENSITIVE_GROUPS.map(({ key, label, icon }) => {
                    const active = grid.health.sensitiveGroups.some((group) => group.includes(key));
                    const iconColor = active ? getPm25CssColor(grid.values.value, 1) : '#c2c7bd';
                    return (
                      <div key={key} className={styles.sensitiveItem}>
                        <div
                          className={styles.sensitiveIcon}
                          style={{
                            background: active ? getPm25CssColor(grid.values.value, 0.13) : 'rgba(0,0,0,0.03)',
                            color: iconColor,
                          }}
                        >
                          {icon}
                        </div>
                        <span
                          className={styles.sensitiveLabel}
                          style={{ color: iconColor, fontWeight: active ? 800 : 600 }}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.drawerSection}>
              <div style={{ marginBottom: 8 }}>
                <SecLabel title="未來 24 小時預估" />
              </div>
              <ForecastSparkline grid={baseGrid ?? grid} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <SecLabel title="氣象條件" />
            </div>
            <div className={styles.meteoGrid}>
              {meteoCells.map(({ icon, label, value }) => (
                <div key={label} className={styles.meteoCell}>
                  <div className={styles.meteoIcon}>{icon}</div>
                  <p className={styles.meteoLabel}>{label}</p>
                  <p className={styles.meteoValue}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

function ForecastSparkline({ grid }: { grid: GridCell }) {
  const data = forecastSeriesForGrid(grid);
  const color = getPm25HexColor(grid.values.value);
  const gradientId = `fc-${grid.gridId}`;

  return (
    <div className={styles.forecastChart}>
      <ResponsiveContainer width="100%" height={112}>
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.34} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#8a9a86' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={30}
            tick={{ fontSize: 10, fill: '#8a9a86' }}
            axisLine={false}
            tickLine={false}
            domain={['dataMin - 6', 'dataMax + 6']}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid rgba(106,141,115,0.2)',
              fontSize: 11,
              padding: '4px 8px',
            }}
            labelFormatter={(label) => `預報 ${label}`}
            formatter={(value: number) => [`${value} μg/m³`, 'PM2.5']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
