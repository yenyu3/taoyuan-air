# 桃園市空氣污染物監測與 AI 預報系統

一款專為桃園市設計的空氣品質監測應用程式，結合即時監測、預報分析、健康建議和 AI 輔助決策。

## 📂 專案結構

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

## 🚀 快速開始

### 1. 閱讀文檔（必讀）

**請先閱讀：`docs/GET_STARTED.md`** ⭐

這個文檔會告訴您：
- 如何開始專案開發
- 文檔閱讀順序
- 第一天該做什麼
- 開發路線圖

### 2. 開發任務清單

**主要工作清單：`docs/DEVELOPMENT_ROADMAP.md`**

包含 6 個開發階段、48 個具體任務，每個任務都有：
- 檔案位置
- 預計時間
- 驗收標準
- 程式碼範例

### 3. 啟動前端

```bash
cd frontend
npm install
npm start
```

使用 Expo Go 掃描 QR 碼即可在手機上運行。

## 📖 文檔導覽

### 新手必讀（按順序）
1. **GET_STARTED.md** - 專案啟動指南
2. **DEVELOPMENT_ROADMAP.md** - 開發任務清單
3. **PROJECT_PLAN.md** - 了解專案目標

### 開發參考
- **DATA_SOURCES.md** - 查詢可用的資料來源
- **API_DATABASE_DESIGN.md** - 查看技術設計
- **VISUALIZATION_TOOLS.md** - 查看視覺化工具

### 規劃參考
- **EVALUATION_RECOMMENDATIONS.md** - 查看改進建議

## 🎯 核心功能

### 📊 Dashboard（總覽）
- AQI 圓形儀表板
- AI 趨勢分析
- 臭氧濃度監測
- 污染物卡片（PM2.5、NO2）

### 🗺️ Map（地圖監測）
- 3km 網格系統
- 三種地圖模式（2D/3D/衛星）
- 污染物切換（PM2.5/O3/NOX/VOCs）
- 即時/預報模式

### 🔍 Explorer（資料檢索）
- 多維度篩選
- 監測動態卡片
- 健康建議

### 📅 Events（事件庫）
- 事件篩選與追蹤
- 互動式地圖
- AI 信心分數

### 🚨 Alerts（警報與 AI）
- 個人健康模式
- 治理支援模式
- AI 分析工具
- 政策模擬

## 🛠 技術棧

- **前端**：React Native + Expo
- **語言**：TypeScript
- **導航**：React Navigation
- **狀態管理**：Zustand
- **地圖**：react-native-maps
- **後端**（規劃中）：FastAPI + PostgreSQL + PostGIS
- **AI 模型**（規劃中）：LSTM + Random Forest

## 📞 開始開發

1. 打開 `docs/GET_STARTED.md`
2. 閱讀「第一天該做什麼」章節
3. 開始執行 Phase 0 任務

## 🎓 學習資源

所有學習資源都整理在 `docs/GET_STARTED.md` 中。

---

**桃園市空氣污染物監測與 AI 預報系統** - 智能空氣品質管理 🌱✨
