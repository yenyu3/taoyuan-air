'use client';

import React from 'react';
import type { MoeStationData } from '@shared/api/moe';
import type { ExplorerCwaWeatherBundle, StationData } from '../_types';
import { CWA_PARAMETERS, MOE_PARAMETERS, MOE_REGION_MAP } from '../_data/explorerConfig';

export function formatObservationTime(value?: string): string {
  if (!value) return '最新資料';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function buildMoeCards(stations: MoeStationData[]): StationData[] {
  const latestByStation = Array.from(
    new Map(stations.map(station => [station.sitename, station])).values()
  ).filter(station => station.sitename in MOE_REGION_MAP);

  return latestByStation.flatMap((station, stationIndex) =>
    MOE_PARAMETERS.map((parameter, parameterIndex) => ({
      id: 1000 + stationIndex * 100 + parameterIndex,
      district: `${station.sitename}測站`,
      station: `環境部 ${station.sitename}`,
      time: formatObservationTime(station.datacreationdate),
      passed: station.aqi <= 100,
      parameter: parameter.id,
      value: parameter.value(station),
      unit: parameter.unit,
      source: '環境部',
      version: '即時 API',
      region: MOE_REGION_MAP[station.sitename] ?? `${station.sitename}區`,
      trend: '穩定中' as const,
      aqi: station.aqi,
    }))
  );
}

export function buildCwaCards(weather: ExplorerCwaWeatherBundle, region: string): StationData[] {
  const temperature = Number(weather.current.temperature);
  const humidity = Number(weather.current.humidity);
  const stationLabel = `${weather.current.stationName ?? region}${weather.current.stationType ?? ''}`;

  return CWA_PARAMETERS.map(parameter => {
    const value = parameter.value(weather);

    return {
      id: `cwa-${region}-${parameter.id}`,
      district: region,
      station: `氣象署 · ${weather.current.stationName ?? weather.current.weather}`,
      time: '目前觀測',
      passed: Number.isFinite(value) ? parameter.passed(value) : false,
      parameter: parameter.id,
      value: Number.isFinite(value) ? value : 0,
      unit: parameter.unit,
      source: '氣象署',
      version: weather.isFallback ? '模擬資料' : `即時 API · ${stationLabel}`,
      region,
      trend: '穩定中',
      aqi: 0,
      temperature: Number.isFinite(temperature) ? temperature : undefined,
      humidity: Number.isFinite(humidity) ? humidity : undefined,
    };
  });
}

export function getParameterDisplay(parameter: string): React.ReactNode {
  switch (parameter) {
    case 'PM2.5': return <>PM<sub className="text-xs">2.5</sub></>;
    case 'O3': return <>O<sub className="text-xs">3</sub></>;
    case 'NO2': return <>NO<sub className="text-xs">2</sub></>;
    case 'SO2': return <>SO<sub className="text-xs">2</sub></>;
    default: return parameter;
  }
}

/* ─── Stat chip ──────────────────────────────────────────────── */
