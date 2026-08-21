import type { MoeStationData } from '@shared/api/moe';
import type { ExplorerCwaWeatherBundle, StationData } from '../_types';

export const MICRO_SENSOR_MOCK_DATA: StationData[] = [
  { id: 9001, district: '蘆竹工業區', station: 'Micro-Sensor A04', time: '13:45', passed: false, parameter: 'PM2.5', value: 48, unit: 'μg/m³', source: '微感測器', version: '模擬資料', region: '蘆竹區', trend: '上升中', aqi: 128, temperature: 28, humidity: 72 },
  { id: 9002, district: '桃園市區', station: 'Micro-Sensor B12', time: '11:15', passed: false, parameter: 'PM2.5', value: 35, unit: 'μg/m³', source: '微感測器', version: '模擬資料', region: '桃園區', trend: '上升中', aqi: 112, temperature: 29, humidity: 62 },
  { id: 9003, district: '觀音工業區', station: 'Micro-Sensor B07', time: '昨日 23:30', passed: false, parameter: 'PM2.5', value: 52, unit: 'μg/m³', source: '微感測器', version: '模擬資料', region: '觀音區', trend: '上升中', aqi: 140, temperature: 23, humidity: 80 },
  { id: 9004, district: '中壢工業區', station: 'Micro-Sensor D05', time: '昨日 18:45', passed: true, parameter: 'PM2.5', value: 28, unit: 'μg/m³', source: '微感測器', version: '模擬資料', region: '中壢區', trend: '穩定中', aqi: 76, temperature: 27, humidity: 66 },
  { id: 9005, district: '中壢市中心', station: 'Micro-Sensor G02', time: '6天前 09:45', passed: true, parameter: 'PM2.5', value: 12, unit: 'μg/m³', source: '微感測器', version: '模擬資料', region: '中壢區', trend: '穩定中', aqi: 48, temperature: 24, humidity: 72 },
  { id: 9006, district: '大園住宅區', station: 'Micro-Sensor H09', time: '5天前 12:10', passed: true, parameter: 'PM2.5', value: 18, unit: 'μg/m³', source: '微感測器', version: '模擬資料', region: '大園區', trend: '下降中', aqi: 62, temperature: 26, humidity: 69 },
];

// Temporary stand-in until NAQO schema/import/API are implemented.
export const NAQO_MOCK_DATA: StationData[] = [
  { id: 'naqo-1', district: '中大空品站', station: 'NAQO 中大空品站', time: '目前觀測', passed: true, parameter: 'PM2.5', value: 16, unit: 'μg/m³', source: '中大空品站', version: '模擬資料', region: '中壢區', trend: '穩定中', aqi: 58, temperature: 27, humidity: 70 },
  { id: 'naqo-2', district: '中大空品站', station: 'NAQO 中大空品站', time: '目前觀測', passed: true, parameter: 'O3', value: 42, unit: 'ppb', source: '中大空品站', version: '模擬資料', region: '中壢區', trend: '下降中', aqi: 52, temperature: 27, humidity: 70 },
  { id: 'naqo-3', district: '中大空品站', station: 'NAQO 中大空品站', time: '目前觀測', passed: true, parameter: 'CO', value: 0.4, unit: 'ppm', source: '中大空品站', version: '模擬資料', region: '中壢區', trend: '穩定中', aqi: 20, temperature: 27, humidity: 70 },
  { id: 'naqo-4', district: '中大空品站', station: 'NAQO 中大空品站', time: '目前觀測', passed: true, parameter: 'PM10', value: 6, unit: 'μg/m³', source: '中大空品站', version: '模擬資料', region: '中壢區', trend: '穩定中', aqi: 20, temperature: 27, humidity: 70 },
  { id: 'naqo-5', district: '中大空品站', station: 'NAQO 中大空品站', time: '目前觀測', passed: true, parameter: 'NO2', value: 20, unit: 'ppb', source: '中大空品站', version: '模擬資料', region: '中壢區', trend: '穩定中', aqi: 20, temperature: 27, humidity: 70 },
  { id: 'naqo-6', district: '中大空品站', station: 'NAQO 中大空品站', time: '目前觀測', passed: true, parameter: 'SO2', value: 10, unit: 'ppb', source: '中大空品站', version: '模擬資料', region: '中壢區', trend: '穩定中', aqi: 20, temperature: 27, humidity: 70 },
];

export const TIME_TABS = ['近24小時', '近3天', '近7天'] as const;

/* ─── Filter settings ───────────────────────────────────────── */
export const DEFAULT_PARAMETER = '全部量測參數';
export const DEFAULT_SOURCE = '全部來源';
export const DEFAULT_REGION = '所有區域';

export const PARAMETER_OPTIONS = ['全部量測參數', 'PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO', '氣溫', '風速', '1小時雨量'];

// 新增資料來源時，請同步補上該來源可查詢的量測參數。
export const SOURCE_PARAMETER_OPTIONS: Record<string, string[]> = {
  [DEFAULT_SOURCE]: PARAMETER_OPTIONS,
  環境部: [DEFAULT_PARAMETER, 'PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
  桃園市環保局: [DEFAULT_PARAMETER, 'PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
  氣象署: [DEFAULT_PARAMETER, '氣溫', '風速', '1小時雨量'],
  微感測器: [DEFAULT_PARAMETER, 'PM2.5'],
  中大空品站: [DEFAULT_PARAMETER, 'PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
};

export const REGIONS    = [DEFAULT_REGION, '桃園區', '中壢區', '平鎮區', '龍潭區', '大園區', '觀音區', '蘆竹區', '龜山區', '新屋區', '楊梅區','復興區', '八德區',];
export const SOURCES    = [DEFAULT_SOURCE, '環境部', '桃園市環保局', '氣象署', '微感測器', '中大空品站'];
export const CWA_REGION_OPTIONS = [
  DEFAULT_REGION,
  '新屋區',
  '楊梅區',
  '復興區',
  '觀音區',
  '大園區',
  '大溪區',
  '中壢區',
  '龜山區',
  '龍潭區',
  '平鎮區',
  '蘆竹區',
  '八德區',
];

// 區域下拉選單也要跟著資料來源收斂，避免環境部出現沒有測站的行政區。
export const SOURCE_REGION_OPTIONS: Record<string, string[]> = {
  [DEFAULT_SOURCE]: REGIONS,
  環境部: [DEFAULT_REGION, '桃園區', '中壢區', '平鎮區', '龍潭區', '大園區', '觀音區'],
  桃園市環保局: [DEFAULT_REGION, '蘆竹區', '中壢區', '龜山區', '觀音區'],
  // 氣象署依 cwa_stations_schema.sql 的 address 欄位取出有測站的行政區。
  氣象署: CWA_REGION_OPTIONS,
  微感測器: [DEFAULT_REGION, '桃園區', '中壢區', '大園區', '觀音區', '蘆竹區'],
  中大空品站: [DEFAULT_REGION, '中壢區'],
};

export const MOE_REGION_MAP: Record<string, string> = {
  桃園: '桃園區',
  中壢: '中壢區',
  平鎮: '平鎮區',
  龍潭: '龍潭區',
  大園: '大園區',
  觀音: '觀音區',
};

export const MOE_PARAMETERS: Array<{
  id: string;
  unit: string;
  value: (station: MoeStationData) => number;
}> = [
  { id: 'PM2.5', unit: 'μg/m³', value: station => station.pm25 },
  { id: 'PM10', unit: 'μg/m³', value: station => station.pm10 },
  { id: 'O3', unit: 'ppb', value: station => station.o3 },
  { id: 'NO2', unit: 'ppb', value: station => station.no2 },
  { id: 'SO2', unit: 'ppb', value: station => station.so2 },
  { id: 'CO', unit: 'ppm', value: station => station.co },
];

export const CWA_PARAMETERS: Array<{
  id: string;
  unit: string;
  value: (weather: ExplorerCwaWeatherBundle) => number;
  passed: (value: number) => boolean;
}> = [
  { id: '氣溫', unit: '°C', value: weather => Number(weather.current.temperature), passed: value => value <= 38 },
  { id: '風速', unit: 'm/s', value: weather => Number(weather.current.windSpeed), passed: value => value <= 15 },
  { id: '1小時雨量', unit: 'mm', value: weather => Number(weather.past1hrRain), passed: value => value <= 40 },
];
