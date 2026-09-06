export const palette = {
  // Primary palette - CMYK 0 80 0 0 同色系
  primary: "#6a8d73",
  primarySoft: "#b5c99a",
  primaryMid: "#8fa96f",
  primaryDeep: "#6a8d73",
  
  // 特別標籤色系
  accentRed: "#3e5142", // CMYK 10 13 81 0
  accentYellow: "#B88A2E", // CMYK 10 13 81 0
  accentBlue: "#4f9d85",   // CMYK 46 0 70 0
  accentGreen: "#4F8D7A",  // CMYK 44 0 63 0


  // 基礎色彩
  bgBase: "#f4f2e9",
  bgCard: "#FFFFFF",
  surface: "#FFFFFF",
  background: "#f4f2e9",
  backgroundSecondary: "#F8F9FA",
  
  // 文字色彩
  text: "#2d3129",
  textMain: "#2d3129",
  textSecondary: "#5d6f49",
  textMuted: "#9CA3AF",
  
  // 邊框與陰影
  borderSoft: "#c3cfa8",
  borderLight: "#E5E7EB",
  shadow: "#3e5142",
} as const;

export const semantic = {
  success: palette.accentGreen,
  warning: palette.accentYellow,
  info: palette.accentBlue,
  danger: palette.accentRed,
} as const;

// 為了相容性，導出 Colors 物件
export const Colors = palette;

export const gradients = {
  page: [palette.bgBase, "#e8e6d3"] as [string, string],
  highlight: [palette.primarySoft, "#b5c99a"] as [string, string],
} as const;

export const elevation = {
  card: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;
