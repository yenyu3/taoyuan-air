type PM25Stop = {
  value: number;
  color: [number, number, number];
};

export const PM25_STOPS: PM25Stop[] = [
  { value: 0, color: [42, 166, 90] },
  { value: 15, color: [232, 190, 66] },
  { value: 35, color: [230, 127, 48] },
  { value: 54, color: [214, 68, 76] },
  { value: 150, color: [132, 64, 144] },
];

const toFiniteValue = (value: number) => (Number.isFinite(value) ? value : 0);

export const getPm25Status = (value: number) => {
  if (!Number.isFinite(value)) return '普通';
  if (value <= 15) return '良好';
  if (value <= 35) return '普通';
  if (value <= 54) return '偏高';
  if (value <= 150) return '高污染';
  return '嚴重';
};

export const getPm25Rgb = (value: number): [number, number, number] => {
  const clamped = Math.max(0, Math.min(150, toFiniteValue(value)));
  let lower = PM25_STOPS[0];
  let upper = PM25_STOPS[PM25_STOPS.length - 1];

  for (let i = 0; i < PM25_STOPS.length - 1; i += 1) {
    if (clamped >= PM25_STOPS[i].value && clamped <= PM25_STOPS[i + 1].value) {
      lower = PM25_STOPS[i];
      upper = PM25_STOPS[i + 1];
      break;
    }
  }

  const range = upper.value - lower.value || 1;
  const ratio = (clamped - lower.value) / range;
  return [
    Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * ratio),
    Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * ratio),
    Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * ratio),
  ];
};

export const getPm25CssColor = (value: number, alpha = 1) => {
  const [r, g, b] = getPm25Rgb(value);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getPm25HexColor = (value: number) => {
  const [r, g, b] = getPm25Rgb(value);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};
