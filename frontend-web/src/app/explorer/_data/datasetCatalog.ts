export type DatasetCategory =
  | 'air-quality'
  | 'weather'
  | 'emission'
  | 'vertical'
  | 'model-feature';

export type DatasetStatus = 'live' | 'historical' | 'imported' | 'pending' | 'mock';
export type ProcessingState = 'done' | 'partial' | 'pending' | 'na';

export interface DatasetCatalogItem {
  id: string;
  shortName: string;
  name: string;
  category: DatasetCategory;
  sourceAgency: string;
  sourceType: string;
  tableNames: string[];
  statuses: DatasetStatus[];
  parameters: string[];
  regions: string[];
  spatialType: 'station' | 'district' | 'grid' | 'point-source' | 'flight' | 'height-profile';
  temporalResolution: string;
  updateFrequency: string;
  timeRange: string;
  latestAt: string;
  recordCountLabel: string;
  coverageLabel: string;
  completeness: number;
  accent: string;
  apiPath?: string;
  mapLink?: string;
  accessNote: string;
  quality: {
    completeness: number;
    freshness: number;
    schemaStandardized: number;
    spatialCoverage: number;
    traceability: number;
  };
  processing: {
    fieldStandardized: ProcessingState;
    missingValueHandled: ProcessingState;
    unitNormalized: ProcessingState;
    timestampAligned: ProcessingState;
    coordinateNormalized: ProcessingState;
  };
}

export const CATEGORY_LABELS: Record<DatasetCategory | 'all', string> = {
  all: '全部',
  'air-quality': '空品監測',
  weather: '氣象驅動',
  emission: '排放源',
  vertical: '垂直觀測',
  'model-feature': '模型特徵',
};

export const STATUS_LABELS: Record<DatasetStatus, string> = {
  live: '即時串接',
  historical: '歷史資料',
  imported: '已匯入',
  pending: '待串接',
  mock: '模擬資料',
};

export const PROCESSING_LABELS: Record<ProcessingState, string> = {
  done: '完成',
  partial: '部分完成',
  pending: '待處理',
  na: '不適用',
};

export const FIELD_GROUPS = [
  '時間戳',
  '經緯度',
  '行政區',
  'PM2.5',
  'PM10',
  'O3',
  'NO2',
  'SO2',
  'CO',
  '溫度',
  '濕度',
  '風速',
  '雨量',
  '排放量',
  '高度',
  '網格',
];

export const DATASET_CATALOG: DatasetCatalogItem[] = [
  {
    id: 'moe',
    shortName: 'MOE',
    name: '環境部空品測站',
    category: 'air-quality',
    sourceAgency: '環境部',
    sourceType: '官方空氣品質監測',
    tableNames: ['moe_stations'],
    statuses: ['live', 'historical'],
    parameters: ['時間戳', '經緯度', '行政區', 'PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
    regions: ['桃園', '中壢', '平鎮', '龍潭', '大園', '觀音', '蘆竹'],
    spatialType: 'station',
    temporalResolution: '小時',
    updateFrequency: '即時 API / 月資料匯入',
    timeRange: '即時與近 7 日歷史',
    latestAt: '依 API 回傳',
    recordCountLabel: '6 測站 · 6 污染物',
    coverageLabel: '桃園主要官方測站',
    completeness: 96,
    accent: '#4f8d7a',
    apiPath: '/api/moe',
    mapLink: '/map',
    accessNote: '可由即時 API 取用，歷史資料由後端資料庫查詢。',
    quality: {
      completeness: 96,
      freshness: 92,
      schemaStandardized: 94,
      spatialCoverage: 82,
      traceability: 96,
    },
    processing: {
      fieldStandardized: 'done',
      missingValueHandled: 'partial',
      unitNormalized: 'done',
      timestampAligned: 'done',
      coordinateNormalized: 'done',
    },
  },
  {
    id: 'cwa',
    shortName: 'CWA',
    name: '中央氣象署觀測',
    category: 'weather',
    sourceAgency: '中央氣象署',
    sourceType: '氣象觀測與天氣資料',
    tableNames: ['cwa_stations'],
    statuses: ['live', 'historical'],
    parameters: ['時間戳', '經緯度', '行政區', '溫度', '濕度', '風速', '雨量'],
    regions: ['桃園', '中壢', '觀音', '大園', '蘆竹', '龍潭', '平鎮', '八德'],
    spatialType: 'district',
    temporalResolution: '小時',
    updateFrequency: '即時 API / 月資料匯入',
    timeRange: '即時與近 7 日歷史',
    latestAt: '依 API 回傳',
    recordCountLabel: '13 行政區 · 4 氣象變數',
    coverageLabel: '桃園行政區氣象條件',
    completeness: 91,
    accent: '#5a93b8',
    apiPath: '/api/cwa',
    accessNote: '可依行政區查詢即時氣象，歷史資料由資料庫端點彙整。',
    quality: {
      completeness: 91,
      freshness: 90,
      schemaStandardized: 90,
      spatialCoverage: 86,
      traceability: 92,
    },
    processing: {
      fieldStandardized: 'done',
      missingValueHandled: 'partial',
      unitNormalized: 'done',
      timestampAligned: 'done',
      coordinateNormalized: 'partial',
    },
  },
  {
    id: 'tydep',
    shortName: 'TYDEP',
    name: '桃園市環保局測站',
    category: 'air-quality',
    sourceAgency: '桃園市政府環境保護局',
    sourceType: '地方空氣品質監測',
    tableNames: ['tydep_stations'],
    statuses: ['historical', 'imported'],
    parameters: ['時間戳', '經緯度', '行政區', 'PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
    regions: ['觀音', '中壢', '大園', '蘆竹'],
    spatialType: 'station',
    temporalResolution: '小時',
    updateFrequency: '歷史匯入',
    timeRange: '依匯入資料',
    latestAt: '資料庫回傳',
    recordCountLabel: '地方測站 · 歷史資料',
    coverageLabel: '補足地方監測點位',
    completeness: 78,
    accent: '#6a8d73',
    apiPath: '/api/explorer/history?days=7',
    accessNote: '目前透過歷史資料端點取用；若資料庫尚未匯入，需顯示待補齊狀態。',
    quality: {
      completeness: 78,
      freshness: 62,
      schemaStandardized: 84,
      spatialCoverage: 74,
      traceability: 82,
    },
    processing: {
      fieldStandardized: 'done',
      missingValueHandled: 'partial',
      unitNormalized: 'done',
      timestampAligned: 'partial',
      coordinateNormalized: 'done',
    },
  },
  {
    id: 'micro',
    shortName: 'Micro',
    name: '微型感測器資料',
    category: 'air-quality',
    sourceAgency: '桃園市微型感測器網',
    sourceType: '高密度低成本感測',
    tableNames: ['micro_sensor_readings'],
    statuses: ['pending', 'mock'],
    parameters: ['時間戳', '經緯度', '行政區', 'PM2.5'],
    regions: ['觀音', '中壢', '大園', '蘆竹'],
    spatialType: 'station',
    temporalResolution: '分鐘至小時',
    updateFrequency: '待串接',
    timeRange: '介面展示資料',
    latestAt: '待串接',
    recordCountLabel: '介面展示 · 待正式匯入',
    coverageLabel: '高密度補充監測',
    completeness: 42,
    accent: '#7d8f50',
    accessNote: '第一版僅保留資料位置與狀態，不提供正式下載。',
    quality: {
      completeness: 42,
      freshness: 35,
      schemaStandardized: 50,
      spatialCoverage: 60,
      traceability: 38,
    },
    processing: {
      fieldStandardized: 'pending',
      missingValueHandled: 'pending',
      unitNormalized: 'pending',
      timestampAligned: 'pending',
      coordinateNormalized: 'partial',
    },
  },
  {
    id: 'naqo',
    shortName: 'NAQO',
    name: '中大空品站',
    category: 'air-quality',
    sourceAgency: '國立中央大學',
    sourceType: '研究型空品觀測',
    tableNames: ['naqo_observations'],
    statuses: ['pending', 'mock'],
    parameters: ['時間戳', '經緯度', 'PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
    regions: ['中壢'],
    spatialType: 'station',
    temporalResolution: '小時',
    updateFrequency: '待串接',
    timeRange: '介面展示資料',
    latestAt: '待串接',
    recordCountLabel: '研究站資料 · 待正式 API',
    coverageLabel: '研究觀測補充',
    completeness: 48,
    accent: '#8a71b2',
    accessNote: '目前為介面占位資料，後續接入正式資料庫後開放查詢。',
    quality: {
      completeness: 48,
      freshness: 36,
      schemaStandardized: 55,
      spatialCoverage: 35,
      traceability: 44,
    },
    processing: {
      fieldStandardized: 'pending',
      missingValueHandled: 'pending',
      unitNormalized: 'partial',
      timestampAligned: 'pending',
      coordinateNormalized: 'done',
    },
  },
  {
    id: 'teds-point',
    shortName: 'TEDS P',
    name: 'TEDS 煙囪點源',
    category: 'emission',
    sourceAgency: 'TEDS 排放清冊',
    sourceType: '固定污染源排放資料',
    tableNames: ['teds_point_sources'],
    statuses: ['imported'],
    parameters: ['時間戳', '經緯度', '行政區', '排放量'],
    regions: ['觀音', '大園', '蘆竹', '中壢'],
    spatialType: 'point-source',
    temporalResolution: '年度清冊',
    updateFrequency: '清冊匯入',
    timeRange: '依清冊版本',
    latestAt: '依匯入版本',
    recordCountLabel: '煙囪點源 · 排放量欄位',
    coverageLabel: '工業與固定污染源',
    completeness: 86,
    accent: '#c58a3a',
    mapLink: '/map',
    accessNote: '適合與測站資料比較空間關聯，下載功能待後端匯出端點完成。',
    quality: {
      completeness: 86,
      freshness: 68,
      schemaStandardized: 88,
      spatialCoverage: 80,
      traceability: 90,
    },
    processing: {
      fieldStandardized: 'done',
      missingValueHandled: 'partial',
      unitNormalized: 'done',
      timestampAligned: 'na',
      coordinateNormalized: 'done',
    },
  },
  {
    id: 'teds-grid',
    shortName: 'TEDS G',
    name: 'TEDS 網格排放',
    category: 'emission',
    sourceAgency: 'TEDS 排放清冊',
    sourceType: '網格化排放資料',
    tableNames: ['teds_grid_emissions'],
    statuses: ['imported'],
    parameters: ['時間戳', '經緯度', '行政區', '排放量', '網格'],
    regions: ['桃園全域'],
    spatialType: 'grid',
    temporalResolution: '年度清冊',
    updateFrequency: '清冊匯入',
    timeRange: '依清冊版本',
    latestAt: '依匯入版本',
    recordCountLabel: '網格排放 · 空間化特徵',
    coverageLabel: '桃園全域網格',
    completeness: 88,
    accent: '#b97841',
    mapLink: '/map',
    accessNote: '可作為 Geo-AI 模型空間特徵；下載端點可列為第二版。',
    quality: {
      completeness: 88,
      freshness: 70,
      schemaStandardized: 88,
      spatialCoverage: 92,
      traceability: 90,
    },
    processing: {
      fieldStandardized: 'done',
      missingValueHandled: 'partial',
      unitNormalized: 'done',
      timestampAligned: 'na',
      coordinateNormalized: 'done',
    },
  },
  {
    id: 'uav',
    shortName: 'UAV',
    name: '無人機垂直剖面',
    category: 'vertical',
    sourceAgency: 'UAV 觀測任務',
    sourceType: '垂直氣體與懸浮微粒觀測',
    tableNames: ['uav_flights', 'uav_data'],
    statuses: ['imported'],
    parameters: ['時間戳', '經緯度', 'PM2.5', 'PM10', '高度'],
    regions: ['觀音'],
    spatialType: 'flight',
    temporalResolution: '航次剖面',
    updateFrequency: '任務後匯入',
    timeRange: '依航次資料',
    latestAt: '2026-03-30 範例航次',
    recordCountLabel: '航次資料 · 垂直高度層',
    coverageLabel: '觀音垂直觀測',
    completeness: 82,
    accent: '#6270b1',
    mapLink: '/events',
    accessNote: '可跳轉事件記錄查看 UAV 剖面圖；資料下載待匯出端點。',
    quality: {
      completeness: 82,
      freshness: 76,
      schemaStandardized: 86,
      spatialCoverage: 58,
      traceability: 86,
    },
    processing: {
      fieldStandardized: 'done',
      missingValueHandled: 'partial',
      unitNormalized: 'done',
      timestampAligned: 'done',
      coordinateNormalized: 'done',
    },
  },
  {
    id: 'wind-lidar',
    shortName: 'Lidar',
    name: 'Wind Lidar 風光達',
    category: 'vertical',
    sourceAgency: 'Wind Lidar 觀測站',
    sourceType: '風場垂直剖面',
    tableNames: ['wind_lidar_stations', 'wind_lidar_data'],
    statuses: ['imported'],
    parameters: ['時間戳', '經緯度', '風速', '高度'],
    regions: ['觀音'],
    spatialType: 'height-profile',
    temporalResolution: '高度 x 時間',
    updateFrequency: '任務後匯入',
    timeRange: '依量測檔案',
    latestAt: '2026-03-30 範例檔案',
    recordCountLabel: '高度剖面 · 風場資料',
    coverageLabel: '觀音風場垂直結構',
    completeness: 84,
    accent: '#4d7c9f',
    mapLink: '/events',
    accessNote: '適合呈現污染擴散條件；第一版以 heatmap 預覽資料形態。',
    quality: {
      completeness: 84,
      freshness: 76,
      schemaStandardized: 86,
      spatialCoverage: 54,
      traceability: 88,
    },
    processing: {
      fieldStandardized: 'done',
      missingValueHandled: 'partial',
      unitNormalized: 'done',
      timestampAligned: 'done',
      coordinateNormalized: 'done',
    },
  },
  {
    id: 'feature-grid',
    shortName: 'Feature',
    name: '時空模型特徵表',
    category: 'model-feature',
    sourceAgency: 'Taoyuan Air 整合資料庫',
    sourceType: 'Geo-AI 模型輸入特徵',
    tableNames: ['spatiotemporal_features'],
    statuses: ['pending'],
    parameters: ['時間戳', '經緯度', '行政區', 'PM2.5', '溫度', '風速', '排放量', '網格'],
    regions: ['桃園全域'],
    spatialType: 'grid',
    temporalResolution: '3 km x 3 km / 小時',
    updateFrequency: '模型管線產生',
    timeRange: '規劃中',
    latestAt: '待建立',
    recordCountLabel: '模型特徵 · 規劃中',
    coverageLabel: '3 km x 3 km 高解析網格',
    completeness: 64,
    accent: '#587f62',
    accessNote: '此資料集用來呈現整合成果如何進入 Geo-AI 模型，第一版先標示為待建立。',
    quality: {
      completeness: 64,
      freshness: 46,
      schemaStandardized: 72,
      spatialCoverage: 88,
      traceability: 70,
    },
    processing: {
      fieldStandardized: 'partial',
      missingValueHandled: 'partial',
      unitNormalized: 'partial',
      timestampAligned: 'partial',
      coordinateNormalized: 'done',
    },
  },
];
