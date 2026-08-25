import type { ExamPoint, TEDSPoint } from '@shared/types';
import { TAOYUAN_VILLAGE_CENTERS } from './search';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const seededNoise = (seed: number) => {
  const raw = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return raw - Math.floor(raw);
};

export const TAOYUAN_DEMO_BOUNDS = {
  south: 24.82,
  north: 25.19,
  west: 121.02,
  east: 121.49,
};

export const generateDemoTEDSPoints = (count = 420): TEDSPoint[] => {
  if (TAOYUAN_VILLAGE_CENTERS.length === 0) return [];

  const points: TEDSPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const center = TAOYUAN_VILLAGE_CENTERS[i % TAOYUAN_VILLAGE_CENTERS.length];
    const angle = seededNoise(i + 7) * Math.PI * 2;
    const distance = 0.0018 + seededNoise(i + 97) * 0.0105;
    const latitude = clamp(center.latitude + Math.cos(angle) * distance, TAOYUAN_DEMO_BOUNDS.south, TAOYUAN_DEMO_BOUNDS.north);
    const longitude = clamp(center.longitude + Math.sin(angle) * distance, TAOYUAN_DEMO_BOUNDS.west, TAOYUAN_DEMO_BOUNDS.east);
    const heightM = 18 + Math.round(seededNoise(i + 163) * 178);

    points.push({
      id: `demo-stack-${String(i + 1).padStart(4, '0')}`,
      name: `${center.district}${center.village}排放點`,
      latLng: { latitude, longitude },
      heightM,
      source: 'demo-fallback',
    });
  }

  return points;
};

export const generateDemoExamPoints = (count = 19): ExamPoint[] => {
  if (TAOYUAN_VILLAGE_CENTERS.length === 0) return [];

  const points: ExamPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const center = TAOYUAN_VILLAGE_CENTERS[i % TAOYUAN_VILLAGE_CENTERS.length];
    const angle = seededNoise(i + 401) * Math.PI * 2;
    const distance = 0.0015 + seededNoise(i + 557) * 0.005;
    const latitude = clamp(center.latitude + Math.cos(angle) * distance, TAOYUAN_DEMO_BOUNDS.south, TAOYUAN_DEMO_BOUNDS.north);
    const longitude = clamp(center.longitude + Math.sin(angle) * distance, TAOYUAN_DEMO_BOUNDS.west, TAOYUAN_DEMO_BOUNDS.east);

    points.push({
      id: `demo-mercury-${String(i + 1).padStart(3, '0')}`,
      name: `${center.district}${center.village}汞排放點`,
      latLng: { latitude, longitude },
      source: '汞',
      note: 'demo-fallback',
    });
  }

  return points;
};
