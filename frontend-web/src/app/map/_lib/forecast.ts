import type { GridCell, HealthLevel } from '@shared/types';

/**
 * 前端 mock 的 PM2.5 網格預報。以每格「當下濃度」為基準，加上日夜週期、緩慢趨勢與
 * 依 gridId 決定的雜訊，讓不同時間點的網格有可展示的變化。UI 不顯示干擾式提示，
 * 未來可換成後端 grid forecast endpoint（見 docs/監測地圖頁視覺與互動優化規劃.md §7）。
 */

export const FORECAST_STEPS = [0, 3, 6, 12, 24] as const;
export type ForecastHour = (typeof FORECAST_STEPS)[number];

const fract = (x: number) => x - Math.floor(x);

/** 由字串（gridId）產生穩定的 0–1 偽隨機值。 */
function seededUnit(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return fract(Math.sin(hash) * 43758.5453);
}

export function forecastValue(baseValue: number, gridId: string, hours: number): number {
  if (hours <= 0 || !Number.isFinite(baseValue)) return baseValue;
  const phase = seededUnit(gridId);
  const drift = seededUnit(`${gridId}#drift`);
  const noise = seededUnit(`${gridId}#${hours}`);

  const diurnal = Math.sin(((hours + phase * 8) / 24) * Math.PI * 2) * baseValue * 0.2;
  const trend = (drift - 0.46) * hours * 1.1;
  const jitter = (noise - 0.5) * baseValue * 0.14;

  return Math.max(2, Math.round(baseValue + diurnal + trend + jitter));
}

/** 由 PM2.5 濃度粗估 AQI 與健康等級（mock 用，非官方分級公式）。 */
function pm25ToHealthLevel(value: number): HealthLevel {
  if (value <= 15) return '良好';
  if (value <= 35) return '普通';
  if (value <= 54) return '對敏感族群不健康';
  return '對所有族群不健康';
}

/** 傳回某時間點的網格快照（hours=0 直接回傳原陣列）。 */
export function forecastGrid(cells: GridCell[], hours: number): GridCell[] {
  if (hours <= 0) return cells;
  return cells.map((cell) => {
    const value = forecastValue(cell.values.value, cell.gridId, hours);
    return {
      ...cell,
      values: { ...cell.values, value },
      health: {
        ...cell.health,
        aqi: Math.round(Math.min(300, value * 2)),
        level: pm25ToHealthLevel(value),
      },
    };
  });
}

/** 單一網格的未來 24 小時走勢（給詳情抽屜的迷你趨勢圖）。 */
export function forecastSeriesForGrid(grid: GridCell): Array<{ hour: number; label: string; value: number }> {
  return FORECAST_STEPS.map((hour) => ({
    hour,
    label: hour === 0 ? '現在' : `+${hour}h`,
    value: forecastValue(grid.values.value, grid.gridId, hour),
  }));
}

export const forecastStepLabel = (hour: number) => (hour === 0 ? '現在' : `+${hour}h`);
