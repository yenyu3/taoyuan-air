'use client';

import React, { useState } from 'react';
import { Box, ChevronLeft, Layers, SlidersHorizontal, ScanEye } from 'lucide-react';
import { Chip, ChipGroup } from '@/components/controls/ControlKit';
import { SecLabel } from './MapWidgets';
import { getPm25CssColor, getPm25Status } from '../_lib/mapColors';
import { formatTime } from '../_lib/search';
import type { Pm25GridStats } from '../_lib/mapStats';
import styles from '../map.module.css';

export type MapMode = 'NOW' | 'FORECAST';
export type MapViewMode = '2d' | '3d' | 'professional';

export interface LayerToggleItem {
  key: string;
  label: string;
  detail: string;
  checked: boolean;
  color: string;
  onToggle: () => void;
}

const PM25_UNIT = 'μg/m³';

interface CommandPanelProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  viewMode: MapViewMode;
  effectiveViewMode: MapViewMode;
  onViewModeChange: (mode: MapViewMode) => void;
  search: React.ReactNode;
  stats: Pm25GridStats;
  layers: LayerToggleItem[];
  forecastLabel?: string;
}

export function CommandPanel({
  mode,
  onModeChange,
  viewMode,
  effectiveViewMode,
  onViewModeChange,
  search,
  stats,
  layers,
  forecastLabel,
}: CommandPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        className={`${styles.collapsedToggle} ${styles.glass}`}
        onClick={() => setCollapsed(false)}
        aria-label="展開監測面板"
        title="展開監測面板"
      >
        <SlidersHorizontal size={18} />
      </button>
    );
  }

  const statusColor = getPm25CssColor(stats.maximum, 1);
  const statusBg = getPm25CssColor(stats.maximum, 0.14);
  const subLine =
    mode === 'NOW'
      ? `${effectiveViewMode === 'professional' ? '專業視角' : effectiveViewMode === '3d' ? '3D 濃度地景' : '2D 網格監測'} · 更新 ${formatTime(stats.lastUpdated)}`
      : `2D 預報網格 · ${forecastLabel ?? '未來趨勢'}`;

  const statCells = [
    { label: '平均', value: stats.average, unit: PM25_UNIT },
    { label: '最高', value: stats.maximum, unit: PM25_UNIT },
    { label: '高風險格', value: stats.highRiskCount, unit: '格' },
  ];

  return (
    <div className={`${styles.commandPanel} ${styles.glass}`}>
      <div className={styles.commandScroll}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>
            <Layers size={15} />
            桃園 PM2.5 監測
          </span>
          <button
            type="button"
            className={styles.iconGhost}
            onClick={() => setCollapsed(true)}
            aria-label="收合監測面板"
            title="收合監測面板"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className={styles.section}>
          <ChipGroup>
            {(['NOW', 'FORECAST'] as const).map((key) => (
              <Chip key={key} active={mode === key} variant="solid" onClick={() => onModeChange(key)}>
                {key === 'NOW' ? '即時監測' : 'PM2.5 預報'}
              </Chip>
            ))}
          </ChipGroup>

          {search}

          {mode === 'NOW' && (
            <div className={styles.viewSeg}>
              {([
                { key: '2d', label: '2D 網格', Icon: Layers },
                { key: '3d', label: '3D 濃度', Icon: Box },
                { key: 'professional', label: '專業視角', Icon: ScanEye },
              ] as const).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={viewMode === key}
                  onClick={() => onViewModeChange(key)}
                  className={viewMode === key ? `${styles.viewSegBtn} ${styles.viewSegBtnActive}` : styles.viewSegBtn}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.summaryHead}>
            <div>
              <SecLabel title={mode === 'NOW' ? 'PM2.5 即時濃度' : 'PM2.5 預報濃度'} />
              <div className={styles.summarySub}>{subLine}</div>
            </div>
            <span className={styles.statusBadge} style={{ background: statusBg, color: statusColor }}>
              {getPm25Status(stats.maximum)}
            </span>
          </div>

          <div className={styles.statGrid}>
            {statCells.map((cell) => (
              <div key={cell.label} className={styles.stat}>
                <p className={styles.statLabel}>{cell.label}</p>
                <p className={styles.statValue}>
                  {cell.value}
                  <span className={styles.statUnit}>{cell.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <SecLabel title="圖層" />
          <div className={styles.layerList}>
          {layers.map((layer) => (
            <button
              key={layer.key}
              type="button"
              role="switch"
              aria-checked={layer.checked}
              onClick={layer.onToggle}
              title={layer.detail}
              className={layer.checked ? `${styles.layerRow} ${styles.layerRowActive}` : styles.layerRow}
            >
              <span className={styles.layerRowMain}>
                <span
                  aria-hidden="true"
                  className={styles.layerDot}
                  style={
                    layer.checked
                      ? { background: layer.color, boxShadow: `0 0 0 4px ${layer.color}1f` }
                      : undefined
                  }
                />
                <span className={styles.layerText}>
                  <span className={styles.layerLabel}>{layer.label}</span>
                  <span className={styles.layerDetail}>{layer.detail}</span>
                </span>
              </span>
              <span
                aria-hidden="true"
                className={layer.checked ? `${styles.switch} ${styles.switchOn}` : styles.switch}
                style={layer.checked ? { background: layer.color } : undefined}
              >
                <span className={layer.checked ? `${styles.switchKnob} ${styles.switchKnobOn}` : styles.switchKnob} />
              </span>
            </button>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
