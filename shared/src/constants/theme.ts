// 站內主題統一為暖綠/米色調（與 globals.css 的 --app-bg-gradient、#6a8d73 主色一致），
// 不再使用藍色系，避免與其他頁面（dashboard、地圖底圖）的配色衝突。
export const palette = {
  primary: "#6a8d73",
  primarySoft: "#d7e3d2",
  primaryMid: "#8fa96f",
  primaryDeep: "#6a8d73",
  accentRed: "#9F1239",
  accentYellow: "#7C4A03",
  accentBlue: "#4F8D7A",
  accentGreen: "#4F8D7A",
  bgBase: "#f4f2e9",
  bgCard: "#FFFFFF",
  surface: "#FFFFFF",
  background: "#f4f2e9",
  backgroundSecondary: "#f7f6ee",
  text: "#2d3129",
  textMain: "#2d3129",
  textSecondary: "#5d6f49",
  textMuted: "#9c9a8f",
  borderSoft: "rgba(106, 141, 115, 0.28)",
  borderLight: "#e4e9da",
  shadow: "#3a2e35",
} as const;

export const semantic = {
  success: palette.accentGreen,
  warning: palette.accentYellow,
  info: palette.accentBlue,
  danger: palette.accentRed,
} as const;

export const Colors = palette;

export const gradients = {
  page: [palette.bgBase, "#e3e8cd"] as [string, string],
  highlight: [palette.primarySoft, "#cfe0d6"] as [string, string],
} as const;
