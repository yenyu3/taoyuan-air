import type { CwaWeatherBundle } from '@shared/api/cwa';
import type { MoeStationData } from '@shared/api/moe';

export interface StationData {
  id: number | string;
  district: string;
  station: string;
  time: string;
  passed: boolean;
  parameter: string;
  value: number;
  unit: string;
  source: string;
  version: string;
  region: string;
  trend: '上升中' | '下降中' | '穩定中' | '歷史資料';
  aqi: number;
  temperature?: number;
  humidity?: number;
}

export interface ExplorerCwaWeatherBundle extends CwaWeatherBundle {
  isFallback?: boolean;
}

export interface MoeApiResponse {
  data: MoeStationData[];
  isFallback: boolean;
}

export interface CwaApiResponse {
  data: CwaWeatherBundle;
  isFallback: boolean;
}

export interface ExplorerHistoryResponse {
  data: StationData[];
  count: number;
  error?: string;
  latestAt?: Record<string, string>;
}
