export type DatasetCategory =
  | 'air-quality'
  | 'weather'
  | 'emission'
  | 'vertical';

export type DatasetStatus = 'live' | 'historical' | 'imported' | 'pending' | 'mock';
export type ProcessingState = 'done' | 'partial' | 'pending' | 'na';
export type DataAvailability = 'public-download' | 'public-query' | 'internal' | 'planned';

/** 資料來源在桃園的實際 / 概略點位（用於空間資料預覽地圖） */
export interface DatasetSite {
  name: string;
  lat: number;
  lng: number;
}

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
  officialDownloadUrl?: string;
  officialDownloadLabel?: string;
  dataAvailability: DataAvailability;
  databaseAssets: {
    coreTables: string[];
    views: string[];
    qualityChecks: string[];
    importScripts: string[];
    updateScripts?: string[];
  };
  accessNote: string;
  /** 空間資料預覽用點位；sitesNote 為點位來源說明（示意座標或實際測站清單皆會註明） */
  sites: DatasetSite[];
  sitesNote?: string;
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

/** 桃園各行政區中心，用於「全域網格」類資料集的涵蓋範圍示意 */
export const TAOYUAN_DISTRICT_CENTROIDS: DatasetSite[] = [
  { name: '桃園', lat: 24.9936, lng: 121.301 },
  { name: '中壢', lat: 24.9539, lng: 121.2248 },
  { name: '八德', lat: 24.944, lng: 121.297 },
  { name: '龜山', lat: 25.0026, lng: 121.354 },
  { name: '蘆竹', lat: 25.0442, lng: 121.2918 },
  { name: '大園', lat: 25.0608, lng: 121.2006 },
  { name: '大溪', lat: 24.8838, lng: 121.2681 },
  { name: '平鎮', lat: 24.953, lng: 121.2017 },
  { name: '楊梅', lat: 24.9175, lng: 121.146 },
  { name: '龍潭', lat: 24.8635, lng: 121.2168 },
  { name: '觀音', lat: 25.0354, lng: 121.0823 },
  { name: '新屋', lat: 24.9697, lng: 121.1063 },
  { name: '復興', lat: 24.8186, lng: 121.3496 },
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
    regions: ['桃園', '大園', '觀音', '平鎮', '龍潭', '中壢'],
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
    mapLink: '/map?source=moe&highlight=stations',
    officialDownloadUrl: 'https://data.moenv.gov.tw/dataset/detail/AQX_P_205',
    officialDownloadLabel: '環境部空品小時值',
    dataAvailability: 'public-download',
    databaseAssets: {
      coreTables: ['moe_stations', 'moe_pollutants', 'moe_hourly_data'],
      views: ['moe_latest_data', 'moe_monthly_stats'],
      qualityChecks: ['check_moe_data_quality()'],
      importScripts: ['scripts/import_moe_stations.py'],
      updateScripts: ['scripts/update_moe_monthly.py'],
    },
    accessNote: '可由即時 API 取用，歷史資料由後端資料庫查詢；下載按鈕前往官方公開資料頁。',
    sites: [
      { name: '桃園', lat: 24.9936, lng: 121.301 },
      { name: '大園', lat: 25.0608, lng: 121.2 },
      { name: '觀音_S', lat: 25.0354, lng: 121.082 },
      { name: '平鎮', lat: 24.9533, lng: 121.2039 },
      { name: '龍潭', lat: 24.8633, lng: 121.2164 },
      { name: '中壢', lat: 24.9536, lng: 121.2265 },
    ],
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
    parameters: ['時間戳', '經緯度', '行政區', '溫度', '濕度', '風速', '風向', '雨量', '氣壓', '日射量', '高度'],
    regions: ['新屋', '楊梅', '中壢', '大園', '蘆竹', '龜山', '八德', '平鎮', '龍潭', '大溪', '觀音', '復興'],
    spatialType: 'district',
    temporalResolution: '小時',
    updateFrequency: '即時 API / 月資料匯入',
    timeRange: '即時與近 7 日歷史',
    latestAt: '依 API 回傳',
    recordCountLabel: '23 測站 · 7 觀測項目',
    coverageLabel: '桃園行政區氣象條件',
    completeness: 91,
    accent: '#5a93b8',
    apiPath: '/api/cwa',
    mapLink: '/map?source=cwa&highlight=stations',
    officialDownloadUrl: 'https://www.motc.gov.tw/201506260001/app/govdata_list/view?id=1615&module=&uid=201705110165',
    officialDownloadLabel: 'CWA 全測站逐時氣象資料',
    dataAvailability: 'public-download',
    databaseAssets: {
      coreTables: ['cwa_stations', 'cwa_observations', 'cwa_hourly_data'],
      views: ['cwa_latest_data', 'cwa_monthly_stats'],
      qualityChecks: ['check_cwa_data_quality()'],
      importScripts: ['scripts/import_cwa_stations.py'],
      updateScripts: ['scripts/update_cwa_monthly.py'],
    },
    accessNote: '可依行政區查詢即時氣象，歷史資料由資料庫端點彙整；下載按鈕前往中央氣象署公開資料頁。',
    sites: [
      { name: '新屋', lat: 25.006725, lng: 121.047492 },
      { name: '水尾', lat: 24.940081, lng: 121.087161 },
      { name: '四稜', lat: 24.64733, lng: 121.4293 },
      { name: '東眼山', lat: 24.8284, lng: 121.40888 },
      { name: '新興坑尾', lat: 25.0061, lng: 121.0971 },
      { name: '觀音工業區', lat: 25.064764, lng: 121.114856 },
      { name: '中大臨海站', lat: 24.966126, lng: 121.008581 },
      { name: '竹圍', lat: 25.112692, lng: 121.239824 },
      { name: '大溪永福', lat: 24.892936, lng: 121.324975 },
      { name: '中壢', lat: 24.977661, lng: 121.256375 },
      { name: '龜山', lat: 25.02846, lng: 121.38656 },
      { name: '龍潭', lat: 24.870056, lng: 121.221389 },
      { name: '楊梅', lat: 24.912375, lng: 121.143047 },
      { name: '平鎮', lat: 24.897503, lng: 121.214636 },
      { name: '大溪', lat: 24.882853, lng: 121.265547 },
      { name: '蘆竹', lat: 25.084275, lng: 121.265767 },
      { name: '八德', lat: 24.928708, lng: 121.283289 },
      { name: '復興', lat: 24.820208, lng: 121.352281 },
      { name: '桃園農改場', lat: 24.950944, lng: 121.030583 },
      { name: '茶改場', lat: 24.908472, lng: 121.185333 },
      { name: '農工中心', lat: 24.985917, lng: 121.239833 },
      { name: '中央大學', lat: 24.967652, lng: 121.185165 },
      { name: '觀音', lat: 25.027072, lng: 121.153317 },
    ],
    sitesNote: '依 cwa_stations schema 之 23 個測站實際座標（含署屬有人站、自動站與農業站）。',
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
    regions: ['觀音', '中壢', '龜山', '蘆竹'],
    spatialType: 'station',
    temporalResolution: '小時',
    updateFrequency: '歷史匯入',
    timeRange: '依匯入資料',
    latestAt: '資料庫回傳',
    recordCountLabel: '4 地方測站 · 歷史資料',
    coverageLabel: '補足地方監測點位',
    completeness: 78,
    accent: '#6a8d73',
    apiPath: '/api/explorer/history?days=7',
    mapLink: '/map?source=tydep&highlight=stations',
    officialDownloadUrl: 'https://tydep.tycg.gov.tw/News.aspx?n=20097&sms=19414',
    officialDownloadLabel: '桃園環保局監測資料查詢',
    dataAvailability: 'public-query',
    databaseAssets: {
      coreTables: ['tydep_stations', 'tydep_pollutants', 'tydep_hourly_data'],
      views: ['tydep_latest_data', 'tydep_monthly_stats'],
      qualityChecks: ['check_tydep_data_quality()'],
      importScripts: ['scripts/convert_tydep_xlsx.py', 'scripts/import_tydep_stations.py'],
    },
    accessNote: '目前透過歷史資料端點取用；官方來源為查詢頁形式，若資料庫尚未匯入需顯示待補齊狀態。',
    sites: [
      { name: '內壢', lat: 24.9677, lng: 121.259 },
      { name: '新興國小', lat: 25.0083, lng: 121.265 },
      { name: '華亞', lat: 25.0505, lng: 121.3713 },
      { name: '觀音_N', lat: 25.0525, lng: 121.1181 },
    ],
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
    dataAvailability: 'planned',
    databaseAssets: {
      coreTables: ['micro_sensor_readings（規劃中）'],
      views: [],
      qualityChecks: [],
      importScripts: [],
    },
    accessNote: '第一版僅保留資料位置與狀態，不提供正式下載。',
    sites: [
      { name: '觀音', lat: 25.0354, lng: 121.0823 },
      { name: '中壢', lat: 24.9539, lng: 121.2248 },
      { name: '大園', lat: 25.0608, lng: 121.2006 },
      { name: '蘆竹', lat: 25.0442, lng: 121.2918 },
    ],
    sitesNote: '尚未串接，座標以涵蓋行政區中心示意。',
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
    dataAvailability: 'planned',
    databaseAssets: {
      coreTables: ['naqo_observations（規劃中）'],
      views: [],
      qualityChecks: [],
      importScripts: [],
    },
    accessNote: '目前為介面占位資料，後續接入正式資料庫後開放查詢。',
    sites: [{ name: '中央大學', lat: 24.9682, lng: 121.1959 }],
    sitesNote: '介面展示資料，座標為研究站概略位置。',
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
    tableNames: ['teds_stations', 'teds_emission_data'],
    statuses: ['imported'],
    parameters: ['經緯度', '行政區', '排放量', '煙囪高度'],
    regions: ['觀音', '大園', '蘆竹', '中壢'],
    spatialType: 'point-source',
    temporalResolution: '年度清冊',
    updateFrequency: '清冊匯入',
    timeRange: '依清冊版本',
    latestAt: '目前匯入 TEDS12；官方最新版可另行升級',
    recordCountLabel: '煙囪點源 · 排放量欄位',
    coverageLabel: '工業與固定污染源',
    completeness: 86,
    accent: '#c58a3a',
    mapLink: '/map?source=teds-point&highlight=points',
    officialDownloadUrl: 'https://air.moenv.gov.tw/envtopics/AirQuality_6.aspx',
    officialDownloadLabel: 'TEDS 排放清冊',
    dataAvailability: 'public-download',
    databaseAssets: {
      coreTables: ['teds_stations', 'teds_observations', 'teds_emission_data'],
      views: ['teds_latest_data'],
      qualityChecks: [],
      importScripts: ['scripts/import_teds_point.py'],
    },
    accessNote: '適合與測站資料比較空間關聯；目前系統匯入 TEDS12，官方頁可下載最新版清冊文件與網格資料。',
    sites: [
      { name: '觀音工業區', lat: 25.045, lng: 121.115 },
      { name: '大園工業區', lat: 25.055, lng: 121.195 },
      { name: '蘆竹南崁', lat: 25.048, lng: 121.293 },
      { name: '中壢工業區', lat: 24.98, lng: 121.25 },
    ],
    sitesNote: '排放清冊點源位置示意（觀音、大園、蘆竹、中壢工業區）。',
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
    tableNames: ['teds_grid_points', 'teds_grid_emission_data'],
    statuses: ['imported'],
    parameters: ['經緯度', '行政區', '排放量', '網格'],
    regions: ['桃園全域'],
    spatialType: 'grid',
    temporalResolution: '年度清冊',
    updateFrequency: '清冊匯入',
    timeRange: '依清冊版本',
    latestAt: '目前匯入 TEDS12；官方最新版可另行升級',
    recordCountLabel: '網格排放 · 空間化特徵',
    coverageLabel: '桃園全域網格',
    completeness: 88,
    accent: '#b97841',
    mapLink: '/map?source=teds-grid&highlight=grid',
    officialDownloadUrl: 'https://air.moenv.gov.tw/envtopics/AirQuality_6.aspx',
    officialDownloadLabel: 'TEDS 網格資料',
    dataAvailability: 'public-download',
    databaseAssets: {
      coreTables: ['teds_grid_points', 'teds_observations', 'teds_grid_emission_data'],
      views: [],
      qualityChecks: ['update_grid_geometries()'],
      importScripts: ['scripts/import_teds_grid.py'],
    },
    accessNote: '可作為 Geo-AI 模型空間特徵；目前系統匯入 TEDS12，官方頁可下載最新版清冊文件與網格資料。',
    sites: TAOYUAN_DISTRICT_CENTROIDS,
    sitesNote: '網格化排放資料，以桃園各行政區中心示意涵蓋範圍。',
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
    id: 'exam',
    shortName: 'Exam',
    name: '固定污染源檢測資料',
    category: 'emission',
    sourceAgency: '環境部',
    sourceType: '戴奧辛、重金屬與氯化氫檢測',
    tableNames: ['exam_sources', 'exam_records'],
    statuses: ['imported'],
    parameters: ['時間戳', '經緯度', '管制編號', '檢測項目', '檢測值', '檢測單位'],
    regions: ['桃園全域'],
    spatialType: 'point-source',
    temporalResolution: '檢測日期',
    updateFrequency: '官方資料約每 3 月更新',
    timeRange: '依公開資料與匯入紀錄',
    latestAt: '依匯入資料與官方更新',
    recordCountLabel: '固定源檢測 · 汞圖層可用',
    coverageLabel: '固定污染源定檢與稽查檢測',
    completeness: 83,
    accent: '#7c5aa6',
    apiPath: '/api/exam-points',
    mapLink: '/map?source=exam&highlight=points',
    officialDownloadUrl: 'https://data.moenv.gov.tw/dataset/detail/EMS_S_10',
    officialDownloadLabel: '環境部固定污染源檢測資料',
    dataAvailability: 'public-download',
    databaseAssets: {
      coreTables: ['exam_sources', 'exam_items', 'exam_records'],
      views: ['latest_exam_summary'],
      qualityChecks: [],
      importScripts: ['scripts/import_exam_point.py'],
    },
    accessNote: '地圖已使用汞及其化合物檢測點位；下載按鈕前往環境部官方資料頁。',
    sites: [
      { name: '桃園固定源檢測點位', lat: 25.0, lng: 121.22 },
      { name: '觀音工業區周邊', lat: 25.045, lng: 121.115 },
      { name: '大園工業區周邊', lat: 25.055, lng: 121.195 },
      { name: '蘆竹南崁周邊', lat: 25.048, lng: 121.293 },
    ],
    sitesNote: '實際點位由 /api/exam-points 依資料庫回傳；此處為涵蓋範圍示意。',
    quality: {
      completeness: 83,
      freshness: 74,
      schemaStandardized: 86,
      spatialCoverage: 78,
      traceability: 90,
    },
    processing: {
      fieldStandardized: 'done',
      missingValueHandled: 'partial',
      unitNormalized: 'partial',
      timestampAligned: 'done',
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
    parameters: ['時間戳', '經緯度', 'PM1', 'PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO', '溫度', '濕度', '風速', '風向', '氣壓', '高度'],
    regions: ['觀音'],
    spatialType: 'flight',
    temporalResolution: '航次剖面',
    updateFrequency: '任務後匯入',
    timeRange: '依航次資料',
    latestAt: '2026-03-30 範例航次',
    recordCountLabel: '6 航次 · 23 主要欄位',
    coverageLabel: '觀音垂直觀測',
    completeness: 82,
    accent: '#6270b1',
    mapLink: '/events',
    dataAvailability: 'internal',
    databaseAssets: {
      coreTables: ['uav_flights', 'uav_parameters', 'uav_data'],
      views: ['uav_profile'],
      qualityChecks: ['check_uav_data_quality()'],
      importScripts: ['scripts/import_uav.py'],
    },
    accessNote: '可跳轉事件記錄查看 UAV 剖面圖；任務資料尚未找到公開下載頁，下載待匯出端點。',
    sites: [{ name: '觀音（航次起降點）', lat: 25.0605, lng: 121.1287 }],
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
    parameters: ['時間戳', '經緯度', '風速', '風向', '亂流強度', '訊號強度', '樣本數', '高度'],
    regions: ['觀音'],
    spatialType: 'height-profile',
    temporalResolution: '高度 x 時間',
    updateFrequency: '任務後匯入',
    timeRange: '依量測檔案',
    latestAt: '2026-03-27 至 2026-04-15 量測檔案',
    recordCountLabel: '20 天 · 760 高度層 · 7 參數',
    coverageLabel: '觀音風場垂直結構',
    completeness: 84,
    accent: '#4d7c9f',
    mapLink: '/events',
    dataAvailability: 'internal',
    databaseAssets: {
      coreTables: ['wind_lidar_stations', 'wind_lidar_parameters', 'wind_lidar_data'],
      views: ['wind_lidar_latest'],
      qualityChecks: ['check_wind_lidar_quality()'],
      importScripts: ['scripts/import_wind_lidar.py'],
    },
    accessNote: '適合呈現污染擴散條件；尚未找到公開下載頁，第一版以 heatmap 預覽資料形態。',
    sites: [{ name: 'TMA_328（觀音）', lat: 25.0528, lng: 121.1179 }],
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
];
