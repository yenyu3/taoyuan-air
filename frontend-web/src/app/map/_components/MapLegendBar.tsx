'use client';

import { Pause, Play } from 'lucide-react';
import { Chip, ChipGroup } from '@/components/controls/ControlKit';
import { FORECAST_STEPS, forecastStepLabel, type ForecastHour } from '../_lib/forecast';
import styles from '../map.module.css';

const TICKS = ['0', '15', '35', '54', '150+'];

interface MapLegendBarProps {
  forecast?: boolean;
  forecastHour?: ForecastHour;
  onForecastHourChange?: (hour: ForecastHour) => void;
  playing?: boolean;
  onTogglePlay?: () => void;
  peak?: number;
  highRiskCount?: number;
}

/**
 * 底部中央：PM2.5 色階圖例。預報模式時同一列加上時間軸 chips + 播放鍵與預估摘要。
 */
export function MapLegendBar({
  forecast = false,
  forecastHour = 0,
  onForecastHourChange,
  playing = false,
  onTogglePlay,
  peak,
  highRiskCount,
}: MapLegendBarProps) {
  return (
    <div className={`${styles.legendBar} ${styles.glass}`}>
      {forecast && (
        <div className={styles.forecastRow}>
          <button
            type="button"
            className={styles.forecastPlay}
            onClick={onTogglePlay}
            aria-label={playing ? '暫停預報播放' : '播放預報'}
            title={playing ? '暫停' : '播放'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <ChipGroup>
            {FORECAST_STEPS.map((step) => (
              <Chip
                key={step}
                active={forecastHour === step}
                variant="solid"
                onClick={() => onForecastHourChange?.(step)}
              >
                {forecastStepLabel(step)}
              </Chip>
            ))}
          </ChipGroup>
          <span className={styles.forecastMeta}>
            預估最高 <strong>{peak ?? 0}</strong> · 高風險 <strong>{highRiskCount ?? 0}</strong> 格
          </span>
        </div>
      )}

      <div className={styles.legendTitleRow}>
        <span className={styles.legendTitle}>
          {forecast ? `PM2.5 預報 · ${forecastStepLabel(forecastHour)}` : 'PM2.5 濃度色階'}
        </span>
        <span className={styles.legendUnit}>μg/m³</span>
      </div>
      <div className={styles.legendScale} />
      <div className={styles.legendTicks}>
        {TICKS.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
    </div>
  );
}
