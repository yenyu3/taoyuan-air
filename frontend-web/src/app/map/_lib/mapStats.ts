import type { GridCell } from '@shared/types';

export interface Pm25GridStats {
  count: number;
  average: number;
  maximum: number;
  highRiskCount: number;
  lastUpdated?: string;
}

/** 高污染門檻（μg/m³）：對應 mapColors 色階的紅色段起點。 */
export const HIGH_RISK_THRESHOLD = 54;

/** 由 PM2.5 網格計算左側指揮面板要顯示的整體摘要數值。 */
export function computePm25GridStats(gridCells: GridCell[]): Pm25GridStats {
  const values = gridCells
    .map((grid) => grid.values.value)
    .filter((value): value is number => Number.isFinite(value));

  if (values.length === 0) {
    return { count: gridCells.length, average: 0, maximum: 0, highRiskCount: 0, lastUpdated: gridCells[0]?.updatedAt };
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return {
    count: gridCells.length,
    average: Math.round(sum / values.length),
    maximum: Math.round(Math.max(...values)),
    highRiskCount: values.filter((value) => value > HIGH_RISK_THRESHOLD).length,
    lastUpdated: gridCells[0]?.updatedAt,
  };
}
