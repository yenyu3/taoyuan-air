'use client';

export const C = {
  primary:       '#315E8F',
  primaryAlpha:  'rgba(49,94,143,0.12)',
  primaryBorder: 'rgba(49,94,143,0.30)',
  red:           '#B4234D',
  redAlpha:      'rgba(233,76,120,0.12)',
  redBorder:     'rgba(233,76,120,0.30)',
  orange:        '#C45A18',
  orangeAlpha:   'rgba(234,88,12,0.12)',
  orangeBorder:  'rgba(234,88,12,0.30)',
  yellow:        '#CA8A04',
  yellowAlpha:   'rgba(202,138,4,0.14)',
  yellowBorder:  'rgba(202,138,4,0.30)',
  amber:         '#D97706',
  amberAlpha:    'rgba(217,119,6,0.12)',
  amberBorder:   'rgba(217,119,6,0.28)',
  green:         '#059669',
  greenAlpha:    'rgba(5,150,105,0.12)',
  greenBorder:   'rgba(5,150,105,0.28)',
  blue:          '#2563EB',
  blueAlpha:     'rgba(37,99,235,0.12)',
  blueBorder:    'rgba(37,99,235,0.30)',
  purple:        '#7C3AED',
  purpleAlpha:   'rgba(124,58,237,0.12)',
  purpleBorder:  'rgba(124,58,237,0.30)',
  maroon:        '#9F1239',
  maroonAlpha:   'rgba(159,18,57,0.12)',
  maroonBorder:  'rgba(159,18,57,0.30)',
  glass:         'rgba(255,255,255,0.60)',
  glassBorder:   'rgba(255,255,255,0.80)',
  glassShadow:   '0 4px 16px rgba(23,58,94,0.10)',
  text:          '#172A40',
  muted:         '#506780',
  hint:          '#6F91B2',
};

/* ─── Gauge helpers ──────────────────────────────────────────── */
export const GAUGE_PARAMS: Record<string, { max: number; marker: number }> = {
  'PM2.5': { max: 150, marker: 12.4 },
  'PM10':  { max: 250, marker: 30   },
  'O3':    { max: 200, marker: 54   },
  'NO2':   { max: 200, marker: 21   },
  'SO2':   { max: 100, marker: 8    },
  'CO':    { max: 15,  marker: 4.4  },
  '氣溫':  { max: 45,  marker: 36   },
  '風速':  { max: 20,  marker: 7.9  },
  '1小時雨量': { max: 80, marker: 10 },
};

export function parameterColor(parameter: string, value: number): string {
  const aqiItems = aqiRangeItems(parameter);
  if (aqiItems.length > 0) {
    return (aqiItems.find(item => value <= item.upper) ?? aqiItems[aqiItems.length - 1]).color;
  }

  const weatherStatus = parameterWeatherStatus(parameter, value);
  if (weatherStatus) return weatherStatus.color;

  if (parameter === 'PM2.5') return value <= 15.4 ? C.primary : value <= 35.4 ? C.amber : C.red;
  if (parameter === 'PM10')  return value <= 50   ? C.primary : value <= 100  ? C.amber : C.red;
  if (parameter === 'O3')    return value <= 54   ? C.primary : value <= 70   ? C.amber : C.red;
  if (parameter === 'NO2')   return value <= 53   ? C.primary : value <= 100  ? C.amber : C.red;
  if (parameter === 'SO2')   return value <= 35   ? C.primary : value <= 75   ? C.amber : C.red;
  if (parameter === 'CO')    return value <= 4.4  ? C.primary : value <= 9.4  ? C.amber : C.red;
  return C.primary;
}

export type ParameterStatus = {
  label: string;
  color: string;
  alpha: string;
  border: string;
};

export type DetailRangeItem = ParameterStatus & {
  range: string;
  upper: number;
};

// AQI 背板顏色設定：這裡控制「分級說明」每一列的文字、邊框、淡底色。
// 如果之後想微調成更接近設計稿，只改 C 裡的色碼或這個順序即可。
// 順序要和 AQI_LABELS、AQI_RANGES 的每一列一致。
export const AQI_COLORS = [
  statusColors(C.green),
  statusColors(C.yellow),
  statusColors(C.orange),
  statusColors(C.red),
  statusColors(C.purple),
  statusColors(C.maroon),
];

export const AQI_LABELS = [
  '良好',
  '普通',
  '對敏感族群不健康',
  '對所有族群不健康',
  '非常不健康',
  '危害',
];

// 空氣品質官方級距：
// - 畫面上採六列呈現，和背板設計一致。
// - 官方 AQI 表格中「危害」有 301-400、401-500 兩列；這裡合併成同一列，
//   讓卡片背面維持簡潔，範圍則涵蓋兩列完整數值。
// - O3、CO 使用 ppm；PM2.5、PM10 使用 μg/m³；SO2、NO2 使用 ppb。
export const AQI_RANGES: Record<string, Array<{ upper: number; display: string }>> = {
  O3: [
    { upper: 54, display: '0.000-0.054 ppm' },
    { upper: 70, display: '0.055-0.070 ppm' },
    { upper: 85, display: '0.071-0.085 ppm' },
    { upper: 105, display: '0.086-0.105 ppm' },
    { upper: 200, display: '0.106-0.200 ppm' },
    { upper: 604, display: '0.405-0.604 ppm（小時值）' },
  ],
  'PM2.5': [
    { upper: 12.4, display: '0.0-12.4 μg/m³' },
    { upper: 30.4, display: '12.5-30.4 μg/m³' },
    { upper: 50.4, display: '30.5-50.4 μg/m³' },
    { upper: 125.4, display: '50.5-125.4 μg/m³' },
    { upper: 225.4, display: '125.5-225.4 μg/m³' },
    { upper: 500.4, display: '225.5-500.4 μg/m³' },
  ],
  PM10: [
    { upper: 30, display: '0-30 μg/m³' },
    { upper: 75, display: '31-75 μg/m³' },
    { upper: 190, display: '76-190 μg/m³' },
    { upper: 354, display: '191-354 μg/m³' },
    { upper: 424, display: '355-424 μg/m³' },
    { upper: 604, display: '425-604 μg/m³' },
  ],
  CO: [
    { upper: 4.4, display: '0-4.4 ppm' },
    { upper: 9.4, display: '4.5-9.4 ppm' },
    { upper: 12.4, display: '9.5-12.4 ppm' },
    { upper: 15.4, display: '12.5-15.4 ppm' },
    { upper: 30.4, display: '15.5-30.4 ppm' },
    { upper: 50.4, display: '30.5-50.4 ppm' },
  ],
  SO2: [
    { upper: 8, display: '0-8 ppb' },
    { upper: 65, display: '9-65 ppb' },
    { upper: 160, display: '66-160 ppb' },
    { upper: 304, display: '161-304 ppb' },
    { upper: 604, display: '305-604 ppb' },
    { upper: 1004, display: '605-1004 ppb' },
  ],
  NO2: [
    { upper: 21, display: '0-21 ppb' },
    { upper: 100, display: '22-100 ppb' },
    { upper: 360, display: '101-360 ppb' },
    { upper: 649, display: '361-649 ppb' },
    { upper: 1249, display: '650-1249 ppb' },
    { upper: 2049, display: '1250-2049 ppb' },
  ],
};

export function aqiRangeItems(parameter: string): DetailRangeItem[] {
  const ranges = AQI_RANGES[parameter];
  if (!ranges) return [];

  return ranges.map((range, index) => ({
    label: AQI_LABELS[index],
    range: range.display,
    upper: range.upper,
    ...AQI_COLORS[index],
  }));
}

export function statusColors(color: string): Pick<ParameterStatus, 'color' | 'alpha' | 'border'> {
  if (color === C.green) return { color: C.green, alpha: C.greenAlpha, border: C.greenBorder };
  if (color === C.amber) return { color: C.amber, alpha: C.amberAlpha, border: C.amberBorder };
  if (color === C.red) return { color: C.red, alpha: C.redAlpha, border: C.redBorder };
  if (color === C.orange) return { color: C.orange, alpha: C.orangeAlpha, border: C.orangeBorder };
  if (color === C.yellow) return { color: C.yellow, alpha: C.yellowAlpha, border: C.yellowBorder };
  if (color === C.purple) return { color: C.purple, alpha: C.purpleAlpha, border: C.purpleBorder };
  if (color === C.maroon) return { color: C.maroon, alpha: C.maroonAlpha, border: C.maroonBorder };
  return { color: C.primary, alpha: C.primaryAlpha, border: C.primaryBorder };
}

export function detailItem(label: string, range: string, color: string, upper = Number.POSITIVE_INFINITY): DetailRangeItem {
  return {
    label,
    range,
    upper,
    ...statusColors(color),
  };
}

export function parameterWeatherStatus(parameter: string, value: number): ParameterStatus | null {
  const ranges = detailRangeItems(parameter, '');
  if (!['氣溫', '風速', '1小時雨量'].includes(parameter) || ranges.length === 0) return null;

  const active = ranges.find(item => value <= item.upper) ?? ranges[ranges.length - 1];
  return {
    label: active.label,
    color: active.color,
    alpha: active.alpha,
    border: active.border,
  };
}

export function parameterStatus(parameter: string, value: number): ParameterStatus {
  const aqiItems = aqiRangeItems(parameter);
  if (aqiItems.length > 0) {
    const active = aqiItems.find(item => value <= item.upper) ?? aqiItems[aqiItems.length - 1];
    return {
      label: active.label,
      color: active.color,
      alpha: active.alpha,
      border: active.border,
    };
  }

  const weatherStatus = parameterWeatherStatus(parameter, value);
  if (weatherStatus) return weatherStatus;

  const color = parameterColor(parameter, value);
  const colors = statusColors(color);
  if (color === C.red) return { label: '異常', ...colors };
  if (color === C.amber) return { label: '注意', ...colors };
  return { label: '正常', ...colors };
}

export function detailRangeItems(parameter: string, unit: string): DetailRangeItem[] {
  const aqiItems = aqiRangeItems(parameter);
  if (aqiItems.length > 0) return aqiItems;

  switch (parameter) {
   case '氣溫':
    return [
      detailItem('非常寒冷', `6 ${unit} 以下`, C.orange, 6),
      detailItem('寒冷', `6–10 ${unit}`, C.yellow, 10),
      detailItem('一般', `10–36 ${unit}`, C.green, 36),
      detailItem('高溫黃燈', `36–38 ${unit}`, C.yellow, 38),
      detailItem('高溫橙燈', `38 ${unit} 以上`, C.orange),
    ];
    case '1小時雨量':
    return [
      detailItem('無雨', `0 ${unit}`, C.green, 0),
      detailItem('有雨', `0-10 ${unit}`, C.yellow, 10),
      detailItem('大雨', `10-40 ${unit}`, C.orange, 40),
      detailItem('豪雨', `40 ${unit} 以上`, C.maroon),
    ];
    case '風速':
      return [
        detailItem('0級', `0.0-0.2 ${unit}`, C.green, 0.2),
        detailItem('1級', `0.2-1.5 ${unit}`, C.green, 1.5),
        detailItem('2級', `1.5-3.3 ${unit}`, C.green, 3.3),
        detailItem('3級', `3.3-5.4 ${unit}`, C.green, 5.4),
        detailItem('4級', `5.4-7.9 ${unit}`, C.green, 7.9),
        detailItem('5級', `7.9-10.7 ${unit}`, C.green, 10.7),
        detailItem('6級', `10.7-13.8 ${unit}`, C.yellow, 13.8),
        detailItem('7級', `13.8-17.1 ${unit}`, C.yellow, 17.1),
        detailItem('8級', `17.1-20.7 ${unit}`, C.yellow, 20.7),
        detailItem('9級', `20.7-24.4 ${unit}`, C.yellow, 24.4),
        detailItem('10級', `24.4-28.4 ${unit}`, C.red, 28.4),
        detailItem('11級', `28.4-32.6 ${unit}`, C.red, 32.6),
        detailItem('12級', `32.6 ${unit} 以上`, C.maroon),
      ];
    default:
      return [];
  }
}

// 風速背面補充說明：點選各級風時，在同一張卡片內顯示簡短描述。
export const WIND_LEVEL_INFO: Record<string, string> = {
  '0級': '無風。',
  '1級': '煙會動，人較無感。',
  '2級': '感覺有微風，樹葉飄起，旗幟揚起。',
  '3級': '感覺有微風，樹葉飄起，旗幟揚起。',
  '4級': '明顯有風，枝葉擺動，水面有波紋。',
  '5級': '明顯有風，枝葉擺動，水面有波紋。',
  '6級': '感覺風大，戶外行動略不便，行人張傘困難。',
  '7級': '感覺風大，戶外行動略不便，行人張傘困難。',
  '8級': '風力強勁，物品易被吹倒，迎風前進困難。',
  '9級': '風力強勁，物品易被吹倒，迎風前進困難。',
  '10級': '盡量避免戶外活動，戶外大型物品易吹落傾倒、樹木枝幹斷裂。',
  '11級': '盡量避免戶外活動，戶外大型物品易吹落傾倒、樹木枝幹斷裂。',
  '12級': '極危險！易致災！勿出門！',
};
