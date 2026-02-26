# 桃園市空氣污染物監測與 AI 預報系統

一款專為桃園市設計的空氣品質監測應用程式，結合即時監測、預報分析、健康建議和 AI 輔助決策。

## 🚀 快速開始

### 📋 環境需求

- **Node.js 18+**
- **npm** 或 **yarn**
- **手機** (iOS 或 Android) 或 **模擬器**

### 📱 手機準備

在手機上安裝 **Expo Go** 應用程式：

- [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
- [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 💻 安裝與運行

```bash
# 進入前端目錄
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm start

# 或使用模擬器
npm run ios      # iOS 模擬器 (僅限 Mac)
npm run android  # Android 模擬器
npm run web      # 網頁版 (開發測試用)
```

使用 Expo Go 掃描終端機中的 QR 碼即可在手機上運行。

## 🎯 核心功能

### 📊 Dashboard（總覽）

- **AQI 儀表板**：大型圓形儀表顯示當前空氣品質指數
- **AI 趨勢分析**：AI 預測未來 3 小時的空氣品質變化
- **臭氧濃度監測**：即時臭氧濃度顯示與安全等級評估
- **污染物卡片**：PM2.5 和 NO2 的即時數值與趨勢圖表
- **情境模擬**：支援正常/工業/事件三種資料情境切換

### 🗺️ Map（地圖監測）

- **桃園地圖**：使用 react-native-maps 顯示真實地圖
- **3km 網格系統**：可互動的污染物濃度網格覆蓋
- **三種地圖模式**：
  - 2D 模式：多邊形網格顯示
  - 3D 模式：立體標記與傾斜視角
  - 衛星模式：衛星地圖底圖配合發光標記
- **污染物切換**：PM2.5 / O₃ / NOₓ / VOCs
- **即時/預報模式**：切換查看當前或預測數據
- **搜尋功能**：搜尋區域或監測站點

### 🔍 Explorer（資料檢索）

- **多維度篩選**：
  - 時間範圍（近24小時/近3天/近7天）
  - 污染物類型（PM2.5/O3/NOX/VOCs）
  - 區域選擇（全市/各區）
  - 資料來源（EPA/微感測/光達/LUV）
- **監測動態卡片**：顯示各站點即時數據
- **狀態標記**：通過/異常狀態即時顯示
- **健康建議**：根據當前空氣品質提供建議

### 📅 Events（事件庫）

- **事件篩選**：活躍事件/歷史事件/已解決事件
- **互動式地圖**：每個事件顯示實際地圖位置
- **事件詳情**：
  - 嚴重度標記（高/中/低風險）
  - 持續時間追蹤
  - 影響區域顯示
  - 暴露人口統計
  - AI 信心分數
- **事件類型**：工業排放異常、大氣流入等

### 🚨 Alerts（警報與 AI）

- **雙模式切換**：
  - 個人健康模式：自訂健康守護設定
  - 治理支援模式：政策分析與 AI 策略推薦
- **健康守護設定**：
  - 氣喘門檻調整
  - 活動強度設定
  - 通知緊急度控制
- **AI 分析工具**：
  - 異常偵測雷達圖
  - 來源歸因圓餅圖
  - 穩定指數評估
- **治理支援功能**：
  - 分析工作台（區域影響矩陣）
  - 政策模擬（工業產出削減預測）
  - AI 策略推薦（工業管制/交通分流/公眾通知）
- **重要門檻警報**：PM2.5 濃度超標通知

## 🛠 技術架構

### 主要技術棧

```json
{
  "框架": "React Native + Expo",
  "語言": "TypeScript",
  "導航": "React Navigation (Bottom Tabs)",
  "狀態管理": "Zustand",
  "地圖": "react-native-maps",
  "UI 組件": "expo-blur, expo-linear-gradient",
  "圖表": "@react-native-community/slider"
}
```

### 專案結構

```
taoyuan-air/
├── docs/                          # 📚 所有專案文檔
│   ├── GET_STARTED.md            # ⭐ 開始指南（從這裡開始）
│   ├── DEVELOPMENT_ROADMAP.md    # 開發路線圖與任務清單
│   ├── PROJECT_PLAN.md           # 計畫書
│   ├── DATA_SOURCES.md           # 資料來源與 API
│   ├── API_DATABASE_DESIGN.md    # API 與資料庫設計
│   ├── EVALUATION_RECOMMENDATIONS.md  # 評估與建議
│   └── VISUALIZATION_TOOLS.md    # 視覺化工具參考
│
├── frontend/                      # React Native 前端
│   ├── src/
│   │   ├── api/                  # API 呼叫
│   │   ├── components/           # UI 組件
│   │   ├── navigation/           # 導航配置
│   │   ├── screens/              # 頁面
│   │   ├── store/                # 狀態管理
│   │   └── types/                # TypeScript 類型
│   ├── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── .expo/                         # Expo 配置
├── .github/                       # GitHub 配置
├── .gitignore
└── README.md                      # 本檔案
```

## 📚 文檔

詳細的開發文檔請參考 `docs/` 資料夾：

- **GET_STARTED.md** - 開發入門指南
- **DEVELOPMENT_ROADMAP.md** - 開發路線圖
- **PROJECT_PLAN.md** - 專案計畫書
- **DATA_SOURCES.md** - 資料來源說明
- **API_DATABASE_DESIGN.md** - API 與資料庫設計

---
