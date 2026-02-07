# 桃園市空氣污染物三維監測與 AI 預報系統

一款專為桃園市設計的空氣品質監測應用程式，結合了即時監測、預報分析、健康建議和 AI 輔助決策，讓空氣品質管理變得更智能、更高效！

## 🎬 Demo 特色

- **真實地圖顯示**：使用 react-native-maps 顯示桃園市地圖
- **3km×3km 網格**：地圖上疊加可互動的污染物濃度網格
- **玻璃擬態 UI**：簡約清透的科技感設計風格
- **多情境模擬**：正常/工業/事件三種資料情境
- **健康建議系統**：即時的健康風險評估與行為建議

## 🚀 快速開始

### 📋 環境需求
- **Node.js 18+** (推薦使用 LTS 版本)
- **npm** 或 **yarn**
- **手機** (iOS 或 Android) 或 **模擬器**

### 📱 手機準備 (推薦方式)
1. 在手機上安裝 **Expo Go** 應用程式
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 💻 安裝步驟

#### 步驟 1: 安裝依賴
```bash
# 安裝所有依賴
npm install
```

#### 步驟 2: 啟動開發伺服器
```bash
# 啟動 Expo 開發伺服器
npm start

# 如果遇到快取問題，可以清除快取
npm start --clear
```

#### 步驟 3: 在裝置上運行

**方法一：使用 Expo Go (推薦)**
1. 確保手機和電腦連接同一個 WiFi 網路
2. 開啟手機上的 Expo Go 應用程式
3. 掃描終端機中顯示的 QR 碼
4. 等待應用程式載入完成

**方法二：使用模擬器**
```bash
# iOS 模擬器 (僅限 Mac)
npm run ios

# Android 模擬器
npm run android

# 網頁版 (開發測試用)
npm run web
```

## 🎯 五大核心功能

### 📊 Dashboard（總覽）
- **Hero 區塊**：大標題展示系統名稱和核心功能
- **角色切換**：EPA（決策）/ Team（技術）視角切換
- **情境模擬**：正常/工業/事件三種資料情境
- **KPI 卡片**：關鍵指標即時顯示
- **健康狀況**：整體空氣品質健康評估

### 🗺️ Map（地圖監測）
- **桃園地圖**：真實地圖顯示桃園市區域
- **3km 網格**：可互動的污染物濃度網格覆蓋
- **污染物切換**：PM2.5 / O₃ / NOₓ / VOCs
- **模式切換**：即時 / 預報模式
- **Bottom Sheet**：點擊網格顯示詳細資訊、垂直剖面、健康建議

### 🔍 Explorer（資料檢索）
- **查詢條件**：污染物、時間範圍、空間範圍、資料來源
- **結果展示**：結構化的查詢結果列表
- **資料血緣**：完整的資料處理流程追蹤
- **匯出功能**：CSV 下載和 API 複製

### 📅 Events（事件庫）
- **事件列表**：污染事件的完整記錄
- **證據資料**：地圖回放、趨勢分析、風場資料、垂直剖面
- **專家註記**：可編輯的專家分析意見
- **健康影響**：事件對健康的影響評估

### 🚨 Alerts（警報與 AI）
- **雙重警報**：治理警報 + 健康提醒
- **門檻設定**：可調整的警報觸發條件
- **AI 分析**：異常偵測、成因分析、預報建議
- **智能建議**：AI 推薦的應對措施

## 🛠 技術架構

### 主要技術
- **React Native + TypeScript** - 類型安全的跨平台開發
- **Expo** - 開發工具鏈和部署平台
- **React Navigation** - 底部浮動 Tab 導航
- **Zustand** - 輕量級狀態管理
- **react-native-maps** - 地圖顯示和互動
- **@gorhom/bottom-sheet** - 流暢的底部彈窗
- **expo-blur** - 玻璃擬態效果
- **victory-native** - 圖表繪製

### 專案結構
```
src/
├── api/                    # Mock API 和資料服務
│   └── index.ts
├── components/             # 可重用 UI 組件
│   ├── GlassCard.tsx      # 玻璃擬態卡片
│   ├── HealthBadge.tsx    # 健康等級徽章
│   └── KpiCard.tsx        # KPI 指標卡片
├── navigation/             # 導航配置
│   └── BottomTabNavigator.tsx
├── screens/               # 頁面組件
│   ├── DashboardScreen.tsx
│   ├── MapScreen.tsx
│   ├── ExplorerScreen.tsx
│   ├── EventsScreen.tsx
│   └── AlertsScreen.tsx
├── store/                 # 狀態管理
│   └── index.ts
└── types/                 # TypeScript 類型定義
    └── index.ts
```

## 🎨 設計系統

### 配色方案
- **Primary**: #6A8D73 (主要互動色)
- **Secondary**: #B5C99A (輔助色)
- **Background**: #F4F2E9 (背景色)

### 視覺特色
- **玻璃擬態**：半透明卡片 + 模糊效果
- **浮動導航**：底部圓角浮動 Tab Bar
- **漸層背景**：柔和的色彩過渡
- **圓角設計**：24-32px 的大圓角

## 📊 資料情境

### 三種模擬情境
1. **正常情境** (normal)
   - PM2.5: 45-65 µg/m³
   - AQI: 50-70 (普通)
   - 均勻分布

2. **工業情境** (industrial)
   - 觀音/大園/龜山區域較高
   - PM2.5: 80-120 µg/m³
   - AQI: 101-150 (對敏感族群不健康)

3. **事件情境** (event)
   - 全區同步抬升
   - PM2.5: 100-160 µg/m³
   - AQI: 120-180 (對所有族群不健康)

### 切換方式
在 Dashboard 頁面的「情境模式」區塊可以切換不同情境，切換後：
- 地圖網格顏色會即時更新
- 相關警報和事件會相應變化
- 健康建議會自動調整

## 🗺️ 地圖與網格說明

### 地圖實現
- 使用 `react-native-maps` 顯示真實地圖
- 初始視角聚焦桃園市 (25.0°N, 121.25°E)
- 地圖範圍涵蓋桃園市主要區域

### 網格生成
- **網格大小**：3km × 3km
- **生成方式**：基於桃園市邊界框 (bbox) 生成
- **座標範圍**：
  - 緯度：24.8°N - 25.2°N
  - 經度：121.0°E - 121.5°E
- **互動功能**：點擊網格開啟詳細資訊面板

### 未來擴展
- 可替換為正式的桃園市行政邊界檔案
- 支援更精細的網格劃分
- 整合真實的監測站點資料

## 🔧 開發指南

### 新增頁面
1. 在 `src/screens/` 創建新的 Screen 組件
2. 在 `src/navigation/BottomTabNavigator.tsx` 添加路由
3. 更新相關的類型定義

### 新增 API
1. 在 `src/api/index.ts` 添加新的 API 函數
2. 更新 `src/types/index.ts` 的類型定義
3. 在相關 Screen 中調用 API

### 狀態管理
使用 Zustand 進行狀態管理，主要狀態包括：
- 用戶角色和模式
- 選中的污染物和時間
- 網格和站點資料
- 警報和事件資料

## 🚀 部署說明

### Expo 部署
```bash
# 構建 APK (Android)
expo build:android

# 構建 IPA (iOS)
expo build:ios

# 發布到 Expo
expo publish
```

### 獨立應用
```bash
# 使用 EAS Build
eas build --platform android
eas build --platform ios
```

---

**桃園市空氣污染物三維監測與 AI 預報系統** - 智能空氣品質管理的未來！ 🌱✨