import { DISTRICT_COORDINATES, calculateDistance, findNearestDistrict } from '@shared/constants/districts';
import type { GridCell } from '@shared/types';

export const formatTime = (iso?: string) => {
  if (!iso) return '尚無資料';
  return new Intl.DateTimeFormat('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
};

export type GridWithDistrict = GridCell & { district?: string; village?: string };
export type SearchResult = {
  key: string;
  label: string;
  detail: string;
  grid: GridWithDistrict;
};

export type VillageCenter = {
  district: string;
  village: string;
  latitude: number;
  longitude: number;
};

export const TAOYUAN_VILLAGE_CENTERS: VillageCenter[] = [
  { district: '桃園區', village: '中正里', latitude: 24.9937, longitude: 121.3010 },
  { district: '桃園區', village: '武陵里', latitude: 24.9896, longitude: 121.3136 },
  { district: '桃園區', village: '龍鳳里', latitude: 24.9807, longitude: 121.2817 },
  { district: '桃園區', village: '中路里', latitude: 24.9975, longitude: 121.2900 },
  { district: '桃園區', village: '大林里', latitude: 24.9848, longitude: 121.3227 },
  { district: '桃園區', village: '會稽里', latitude: 25.0060, longitude: 121.3195 },
  { district: '中壢區', village: '石頭里', latitude: 24.9539, longitude: 121.2248 },
  { district: '中壢區', village: '中原里', latitude: 24.9575, longitude: 121.2418 },
  { district: '中壢區', village: '內壢里', latitude: 24.9726, longitude: 121.2589 },
  { district: '中壢區', village: '青埔里', latitude: 25.0137, longitude: 121.2140 },
  { district: '中壢區', village: '龍岡里', latitude: 24.9342, longitude: 121.2323 },
  { district: '中壢區', village: '過嶺里', latitude: 24.9636, longitude: 121.1754 },
  { district: '平鎮區', village: '北勢里', latitude: 24.9450, longitude: 121.2188 },
  { district: '平鎮區', village: '東勢里', latitude: 24.9166, longitude: 121.2485 },
  { district: '平鎮區', village: '宋屋里', latitude: 24.9446, longitude: 121.2060 },
  { district: '平鎮區', village: '山峰里', latitude: 24.8974, longitude: 121.2130 },
  { district: '八德區', village: '大成里', latitude: 24.9287, longitude: 121.2833 },
  { district: '八德區', village: '大湳里', latitude: 24.9581, longitude: 121.3016 },
  { district: '八德區', village: '瑞豐里', latitude: 24.9308, longitude: 121.3001 },
  { district: '八德區', village: '興仁里', latitude: 24.9214, longitude: 121.2848 },
  { district: '龜山區', village: '龜山里', latitude: 24.9925, longitude: 121.3375 },
  { district: '龜山區', village: '大湖里', latitude: 25.0535, longitude: 121.3611 },
  { district: '龜山區', village: '文化里', latitude: 25.0567, longitude: 121.3689 },
  { district: '龜山區', village: '山頂里', latitude: 24.9878, longitude: 121.3280 },
  { district: '蘆竹區', village: '南崁里', latitude: 25.0475, longitude: 121.2926 },
  { district: '蘆竹區', village: '坑口里', latitude: 25.0843, longitude: 121.2658 },
  { district: '蘆竹區', village: '海湖里', latitude: 25.1012, longitude: 121.2562 },
  { district: '蘆竹區', village: '山腳里', latitude: 25.0916, longitude: 121.2875 },
  { district: '大園區', village: '大園里', latitude: 25.0608, longitude: 121.2006 },
  { district: '大園區', village: '埔心里', latitude: 25.0532, longitude: 121.2247 },
  { district: '大園區', village: '菓林里', latitude: 25.0797, longitude: 121.2342 },
  { district: '大園區', village: '竹圍里', latitude: 25.1041, longitude: 121.2440 },
  { district: '大園區', village: '橫峰里', latitude: 25.0186, longitude: 121.2145 },
  { district: '觀音區', village: '觀音里', latitude: 25.0354, longitude: 121.0823 },
  { district: '觀音區', village: '草漯里', latitude: 25.0435, longitude: 121.1420 },
  { district: '觀音區', village: '樹林里', latitude: 25.0545, longitude: 121.1245 },
  { district: '觀音區', village: '崙坪里', latitude: 25.0005, longitude: 121.1512 },
  { district: '觀音區', village: '新坡里', latitude: 25.0138, longitude: 121.1354 },
  { district: '新屋區', village: '新屋里', latitude: 24.9697, longitude: 121.1063 },
  { district: '新屋區', village: '永安里', latitude: 24.9869, longitude: 121.0315 },
  { district: '新屋區', village: '後庄里', latitude: 24.9509, longitude: 121.0306 },
  { district: '新屋區', village: '埔頂里', latitude: 24.9588, longitude: 121.0875 },
  { district: '楊梅區', village: '楊梅里', latitude: 24.9175, longitude: 121.1460 },
  { district: '楊梅區', village: '埔心里', latitude: 24.9127, longitude: 121.1838 },
  { district: '楊梅區', village: '富岡里', latitude: 24.9348, longitude: 121.0832 },
  { district: '楊梅區', village: '上湖里', latitude: 24.8970, longitude: 121.1152 },
  { district: '龍潭區', village: '龍潭里', latitude: 24.8635, longitude: 121.2168 },
  { district: '龍潭區', village: '中正里', latitude: 24.8675, longitude: 121.2125 },
  { district: '龍潭區', village: '高原里', latitude: 24.8358, longitude: 121.1964 },
  { district: '龍潭區', village: '三林里', latitude: 24.8518, longitude: 121.2322 },
  { district: '大溪區', village: '一心里', latitude: 24.8838, longitude: 121.2681 },
  { district: '大溪區', village: '仁善里', latitude: 24.9050, longitude: 121.2816 },
  { district: '大溪區', village: '南興里', latitude: 24.8860, longitude: 121.2520 },
  { district: '大溪區', village: '月眉里', latitude: 24.8972, longitude: 121.2923 },
  { district: '復興區', village: '澤仁里', latitude: 24.8202, longitude: 121.3523 },
  { district: '復興區', village: '三民里', latitude: 24.8335, longitude: 121.3165 },
  { district: '復興區', village: '羅浮里', latitude: 24.7904, longitude: 121.3730 },
  { district: '復興區', village: '華陵里', latitude: 24.6854, longitude: 121.3921 },
];

export const SEARCH_PLACE_ALIASES: Array<{
  label: string;
  tokens: string[];
  latitude: number;
  longitude: number;
}> = [
  { label: '桃園市', tokens: ['桃園市', '全市'], latitude: 24.9936, longitude: 121.3010 },
  { label: '桃園機場', tokens: ['桃園機場', '機場', 'taoyuanairport', 'airport'], latitude: 25.0797, longitude: 121.2342 },
  { label: '高鐵桃園站', tokens: ['高鐵桃園', '桃園高鐵', '青埔', '高鐵站'], latitude: 25.0137, longitude: 121.2140 },
  { label: '觀音工業區', tokens: ['觀音工業區', '觀音工業', '工業區'], latitude: 25.0384, longitude: 121.1138 },
  { label: '中壢交流道', tokens: ['中壢交流道', '中壢'], latitude: 24.9681, longitude: 121.2231 },
];

export const normalizeSearchText = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '')
  .replace(/台/g, '臺');

export const getGridDistrict = (grid: GridCell) => (
  (grid as GridWithDistrict).district ||
  findNearestDistrict(grid.centerLatLng.latitude, grid.centerLatLng.longitude)
);

export const getGridVillageLocation = (grid: GridCell) => {
  const existing = grid as GridWithDistrict;
  if (existing.district && existing.village) {
    return { district: existing.district, village: existing.village };
  }

  const nearest = TAOYUAN_VILLAGE_CENTERS.reduce<VillageCenter | null>((best, village) => {
    if (!best) return village;
    return calculateDistance(
      grid.centerLatLng.latitude,
      grid.centerLatLng.longitude,
      village.latitude,
      village.longitude,
    ) < calculateDistance(
      grid.centerLatLng.latitude,
      grid.centerLatLng.longitude,
      best.latitude,
      best.longitude,
    )
      ? village
      : best;
  }, null);

  return nearest
    ? { district: nearest.district, village: nearest.village }
    : { district: getGridDistrict(grid), village: '' };
};

export const getGridLocationName = (grid: GridCell) => {
  const { district, village } = getGridVillageLocation(grid);
  return village ? `${district}${village}` : district;
};

export const withDistrict = (grid: GridCell): GridWithDistrict => ({
  ...grid,
  ...getGridVillageLocation(grid),
});

export const getDistanceToPoint = (grid: GridCell, latitude: number, longitude: number) => (
  calculateDistance(grid.centerLatLng.latitude, grid.centerLatLng.longitude, latitude, longitude)
);

export const getNearestGridToDistrict = (grids: GridCell[], district: string) => {
  const coords = DISTRICT_COORDINATES[district];
  if (!coords) return null;
  return grids.reduce<GridCell | null>((best, grid) => {
    if (!best) return grid;
    return getDistanceToPoint(grid, coords.latitude, coords.longitude) <
      getDistanceToPoint(best, coords.latitude, coords.longitude)
      ? grid
      : best;
  }, null);
};

export const getNearestGridToPoint = (grids: GridCell[], latitude: number, longitude: number) => (
  grids.reduce<GridCell | null>((best, grid) => {
    if (!best) return grid;
    return getDistanceToPoint(grid, latitude, longitude) < getDistanceToPoint(best, latitude, longitude)
      ? grid
      : best;
  }, null)
);
