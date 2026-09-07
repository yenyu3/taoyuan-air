'use client';

import {
  ALL_PARAMETER_IDS,
  CATEGORY_LABELS,
  PARAMETER_CONFIG,
  type CategoryId,
  type ParameterId,
} from './uavConfig';
import type { ParamStats } from './UAVProfileChart';
import { ControlLabel, ControlSubLabel, ChipGroup, Chip } from '@/components/controls/ControlKit';

interface Props {
  selected: ParameterId[];
  onChange: (params: ParameterId[]) => void;
  /** Stats from the last successful chart fetch — used for the range tooltip */
  paramStats?: Record<string, ParamStats>;
  /**
   * Set of parameter IDs confirmed to have data in the current flight.
   * null = still prefetching (show all chips to avoid flash).
   * When provided, chips for parameters NOT in the set are hidden.
   */
  availableParams: Set<ParameterId> | null;
}

// Parameters intentionally excluded from the selector UI
const HIDDEN_PARAMS = new Set<ParameterId>(['p']);

// Group parameters by category in display order
const CATEGORY_ORDER: CategoryId[] = ['meteorology', 'aerosol', 'gas'];

const byCategory = CATEGORY_ORDER.reduce<Record<CategoryId, ParameterId[]>>(
  (acc, cat) => {
    acc[cat] = ALL_PARAMETER_IDS.filter(
      (id) => PARAMETER_CONFIG[id].category === cat && !HIDDEN_PARAMS.has(id)
    );
    return acc;
  },
  { meteorology: [], aerosol: [], gas: [] }
);

function rangeTitle(
  id: ParameterId,
  stats: Record<string, ParamStats> | undefined,
  unit: string,
): string {
  const label = PARAMETER_CONFIG[id].label;
  const s = stats?.[id];
  if (!s) return `${label}（${unit}）`;
  if (!s.hasData) return `${label}：此航次無資料`;
  return `${label}：${s.min.toFixed(1)}~${s.max.toFixed(1)} ${unit}`;
}

export function UAVParameterSelector({ selected, onChange, paramStats, availableParams }: Props) {
  function toggle(id: ParameterId) {
    onChange(
      selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px' }}>
      <ControlLabel>顯示參數</ControlLabel>
      {CATEGORY_ORDER.map((cat) => {
        const ids = byCategory[cat].filter(
          // availableParams === null → still loading, show everything
          (id) => availableParams === null || availableParams.has(id)
        );
        if (ids.length === 0) return null;

        return (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ControlSubLabel>{CATEGORY_LABELS[cat]}</ControlSubLabel>
            <ChipGroup>
              {ids.map((id) => {
                const cfg = PARAMETER_CONFIG[id];
                const active = selected.includes(id);
                return (
                  <Chip
                    key={id}
                    active={active}
                    variant="soft"
                    dot={cfg.color}
                    onClick={() => toggle(id)}
                    title={rangeTitle(id, paramStats, cfg.unit)}
                  >
                    {cfg.label}
                  </Chip>
                );
              })}
            </ChipGroup>
          </div>
        );
      })}
    </div>
  );
}
