'use client';

import type { PanelKey, StationInfo } from '@/lib/windLidarApi';
import {
  ControlBar,
  ControlRow,
  ControlLabel,
  ControlDivider,
  ChipGroup,
  Chip,
  ControlSelect,
} from '@/components/controls/ControlKit';

// ── 面板中文標籤 ──────────────────────────────────────────────────────────────
export const PANEL_LABELS: Record<PanelKey, string> = {
  wind_speed:     '水平風速',
  wind_direction: '風向',
  turbulence:     '亂流強度',
  cnr:            '訊號強度',
};

const ALL_PANELS: PanelKey[] = ['wind_speed', 'wind_direction', 'turbulence', 'cnr'];
const HEIGHT_OPTIONS = [0.5, 1.0, 1.5, 2.0];

// ── Props ─────────────────────────────────────────────────────────────────────
export interface WindLidarControlsProps {
  stations: StationInfo[];
  selectedStation: string;
  selectedDate: string;
  heightMax: number;
  panelVisibility: Record<PanelKey, boolean>;
  loading: boolean;
  onStationChange: (station: string) => void;
  onDateChange: (date: string) => void;
  onHeightMaxChange: (km: number) => void;
  onPanelVisibilityChange: (panel: PanelKey, visible: boolean) => void;
}

// ── 主元件 ────────────────────────────────────────────────────────────────────
export default function WindLidarControls({
  stations,
  selectedStation,
  selectedDate,
  heightMax,
  panelVisibility,
  loading,
  onStationChange,
  onDateChange,
  onHeightMaxChange,
  onPanelVisibilityChange,
}: WindLidarControlsProps) {
  const currentStation = stations.find((s) => s.station === selectedStation);
  const dates = currentStation?.dates ?? [];

  return (
    <ControlBar>
      <ControlRow>
        <ControlLabel>測站</ControlLabel>
        <ControlSelect
          value={selectedStation}
          options={stations.map((s) => ({ value: s.station, label: s.station }))}
          onChange={onStationChange}
          placeholder="選擇測站"
          disabled={loading || stations.length === 0}
          ariaLabel="測站"
        />
        <ControlDivider />
        <ControlLabel>日期</ControlLabel>
        <ControlSelect
          value={selectedDate}
          options={dates.map((d) => ({ value: d, label: d }))}
          onChange={onDateChange}
          placeholder="選擇日期"
          disabled={loading || dates.length === 0}
          ariaLabel="日期"
        />
      </ControlRow>

      <ControlDivider orientation="horizontal" />

      <ControlRow>
        <ControlLabel>高度上限</ControlLabel>
        <ChipGroup>
          {HEIGHT_OPTIONS.map((km) => (
            <Chip
              key={km}
              active={heightMax === km}
              variant="solid"
              onClick={() => onHeightMaxChange(km)}
            >
              {km} km
            </Chip>
          ))}
        </ChipGroup>

        <ControlDivider />

        <ControlLabel>顯示面板</ControlLabel>
        <ChipGroup>
          {ALL_PANELS.map((key) => (
            <Chip
              key={key}
              active={panelVisibility[key]}
              variant="soft"
              dot="#6a8d73"
              onClick={() => onPanelVisibilityChange(key, !panelVisibility[key])}
            >
              {PANEL_LABELS[key]}
            </Chip>
          ))}
        </ChipGroup>
      </ControlRow>
    </ControlBar>
  );
}
