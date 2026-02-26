# 桃園市空氣污染監測系統 - 開發路線圖

## 📋 專案總覽

**專案目標**：建立整合多源數據、AI 預測與三維監測的空氣品質系統  
**預計總時程**：12 週  
**團隊規模**：建議 2-4 人  
**技術棧**：React Native + FastAPI + PostgreSQL + PostGIS

---

## 🎯 階段總覽

| 階段 | 時程 | 重點任務 | 完成標準 |
|------|------|---------|---------|
| **Phase 0** | Week 1 | 環境建置與準備 | 開發環境就緒 |
| **Phase 1** | Week 2-3 | 基礎數據整合 | 真實數據顯示 |
| **Phase 2** | Week 4-5 | 資料庫與後端 | API 完整運作 |
| **Phase 3** | Week 6-7 | 空間數據增強 | 高密度監測 |
| **Phase 4** | Week 8-9 | 垂直維度實現 | 3D 監測完成 |
| **Phase 5** | Week 10-11 | AI 功能強化 | 預測模型上線 |
| **Phase 6** | Week 12 | 優化與測試 | 系統穩定運行 |

---

## 📅 Phase 0：環境建置與準備（Week 1）

### 🔴 高優先級

#### 0.1 開發環境設定
- [ ] 安裝 Node.js 18+
- [ ] 安裝 PostgreSQL 15 + PostGIS 3.3
- [ ] 安裝 Redis 7
- [ ] 安裝 Python 3.10+（用於 AI 模型）
- [ ] 設定 Docker Desktop
- [ ] 安裝 VS Code + 必要擴充套件

**預計時間**：4 小時  
**負責人**：全員  
**驗收標準**：所有工具正常運行

#### 0.2 API 金鑰申請
- [ ] 申請環境部 API Key（https://data.moenv.gov.tw/）
- [ ] 申請中央氣象署 API Key（https://opendata.cwa.gov.tw/）
- [ ] 註冊 NASA Earthdata 帳號
- [ ] 申請 Google Earth Engine 權限（選用）
- [ ] 聯繫中央大學光達數據（王老師）

**預計時間**：8 小時（含等待審核）  
**負責人**：專案負責人  
**驗收標準**：取得所有必要 API Key

#### 0.3 專案初始化
- [ ] 建立 Git Repository
- [ ] 設定 .gitignore
- [ ] 建立專案資料夾結構
- [ ] 設定環境變數檔案（.env.example）
- [ ] 撰寫 README.md

**預計時間**：2 小時  
**負責人**：前端負責人  
**驗收標準**：專案結構清晰

#### 0.4 資料庫初始化
- [ ] 建立 PostgreSQL 資料庫
- [ ] 啟用 PostGIS 擴充功能
- [ ] 執行初始化 SQL 腳本
- [ ] 建立測試資料
- [ ] 設定資料庫備份機制

**預計時間**：4 小時  
**負責人**：後端負責人  
**驗收標準**：資料庫正常運作

### 🟡 中優先級

#### 0.5 文檔準備
- [ ] 閱讀計畫書（PROJECT_PLAN.md）
- [ ] 閱讀資料來源文檔（DATA_SOURCES.md）
- [ ] 閱讀評估建議（EVALUATION_RECOMMENDATIONS.md）
- [ ] 閱讀 API 設計（API_DATABASE_DESIGN.md）
- [ ] 團隊技術分享會議

**預計時間**：4 小時  
**負責人**：全員  
**驗收標準**：團隊理解專案需求

---

## 📅 Phase 1：基礎數據整合（Week 2-3）

### 🔴 高優先級

#### 1.1 環境部 API 整合
- [ ] 建立 EPA Service 類別
- [ ] 實作即時空品數據擷取
- [ ] 實作歷史數據擷取
- [ ] 實作測站資訊擷取
- [ ] 篩選桃園市 6 個測站
- [ ] 錯誤處理與重試機制
- [ ] 單元測試

**檔案位置**：`src/services/epa.service.ts`  
**預計時間**：8 小時  
**負責人**：後端開發  
**驗收標準**：成功取得桃園測站即時數據

**程式碼範例**：
```typescript
// src/services/epa.service.ts
export class EPAService {
  async fetchRealtimeData(): Promise<StationData[]> {
    const response = await fetch(
      `https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=${API_KEY}`
    );
    const data = await response.json();
    return data.records.filter(r => 
      ['桃園', '大園', '觀音', '平鎮', '龍潭', '中壢'].includes(r.sitename)
    );
  }
}
```

#### 1.2 中央氣象署 API 整合
- [ ] 建立 CWA Service 類別
- [ ] 實作觀測資料擷取
- [ ] 實作天氣預報擷取
- [ ] 實作雷達資料擷取（選用）
- [ ] 桃園測站數據處理
- [ ] 錯誤處理
- [ ] 單元測試

**檔案位置**：`src/services/cwa.service.ts`  
**預計時間**：6 小時  
**負責人**：後端開發  
**驗收標準**：成功取得桃園氣象數據

#### 1.3 資料標準化處理
- [ ] 建立統一數據格式介面
- [ ] EPA 數據轉換器
- [ ] CWA 數據轉換器
- [ ] 時間戳標準化（UTC/Local）
- [ ] 單位轉換處理
- [ ] 數據驗證機制

**檔案位置**：`src/utils/data-transformer.ts`  
**預計時間**：6 小時  
**負責人**：後端開發  
**驗收標準**：所有數據格式統一

#### 1.4 前端 API 層建立
- [ ] 建立 API Client 基礎類別
- [ ] 實作 EPA 數據請求
- [ ] 實作 CWA 數據請求
- [ ] 實作錯誤處理
- [ ] 實作 Loading 狀態管理
- [ ] 實作快取機制（React Query）

**檔案位置**：`src/api/client.ts`  
**預計時間**：8 小時  
**負責人**：前端開發  
**驗收標準**：前端可正常請求數據

#### 1.5 Dashboard 頁面更新
- [ ] 移除 Mock 數據
- [ ] 整合真實 EPA 數據
- [ ] 顯示 6 個測站即時數據
- [ ] 計算平均 AQI
- [ ] 更新污染物卡片數據
- [ ] 加入 Loading 動畫
- [ ] 錯誤處理 UI

**檔案位置**：`src/screens/DashboardScreen.tsx`  
**預計時間**：6 小時  
**負責人**：前端開發  
**驗收標準**：Dashboard 顯示真實數據

#### 1.6 Map 頁面測站標記
- [ ] 建立測站 Marker 組件
- [ ] 在地圖上標記 6 個測站
- [ ] 測站點擊顯示詳細資訊
- [ ] 測站數據即時更新
- [ ] 測站狀態顏色標示
- [ ] 測站資訊彈窗

**檔案位置**：`src/screens/MapScreen.tsx`  
**預計時間**：8 小時  
**負責人**：前端開發  
**驗收標準**：地圖顯示所有測站

### 🟡 中優先級

#### 1.7 資料快取機制
- [ ] 設定 React Query
- [ ] 配置快取策略（5 分鐘）
- [ ] 實作背景更新
- [ ] 實作離線快取
- [ ] 快取失效處理

**預計時間**：4 小時  
**負責人**：前端開發  
**驗收標準**：減少 API 請求次數

#### 1.8 錯誤監控
- [ ] 整合 Sentry（選用）
- [ ] 錯誤日誌記錄
- [ ] API 失敗通知
- [ ] 錯誤重試機制

**預計時間**：3 小時  
**負責人**：後端開發  
**驗收標準**：錯誤可追蹤

---

## 📅 Phase 2：資料庫與後端建置（Week 4-5）

### 🔴 高優先級

#### 2.1 PostgreSQL 資料表建立
- [ ] 建立 stations 表
- [ ] 建立 realtime_air_quality 表（分區表）
- [ ] 建立 weather_observations 表
- [ ] 建立 grid_cells 表
- [ ] 建立 grid_realtime_data 表
- [ ] 建立所有索引
- [ ] 建立空間索引（PostGIS）

**檔案位置**：`database/schema.sql`  
**預計時間**：6 小時  
**負責人**：後端開發  
**驗收標準**：所有資料表建立完成

**SQL 範例**：
```sql
CREATE TABLE stations (
    station_id VARCHAR(20) PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    station_type VARCHAR(20) NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    district VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stations_location 
ON stations USING GIST(location);
```

#### 2.2 3km 網格生成
- [ ] 計算桃園市邊界
- [ ] 生成 3km x 3km 網格
- [ ] 計算網格中心點
- [ ] 計算網格所屬行政區
- [ ] 插入 grid_cells 表
- [ ] 驗證網格覆蓋範圍

**檔案位置**：`scripts/generate-grid.py`  
**預計時間**：8 小時  
**負責人**：後端開發  
**驗收標準**：生成約 40-50 個網格

**Python 範例**：
```python
import geopandas as gpd
from shapely.geometry import box

# 桃園市邊界
bounds = {
    'north': 25.2, 'south': 24.8,
    'east': 121.5, 'west': 121.0
}

# 生成 3km 網格
lat_step = 0.027  # 約 3km
lng_step = 0.027

grids = []
grid_id = 1
for lat in range(bounds['south'], bounds['north'], lat_step):
    for lng in range(bounds['west'], bounds['east'], lng_step):
        polygon = box(lng, lat, lng + lng_step, lat + lat_step)
        grids.append({
            'grid_id': f'G{grid_id:03d}',
            'geometry': polygon
        })
        grid_id += 1
```

#### 2.3 FastAPI 後端建立
- [ ] 初始化 FastAPI 專案
- [ ] 設定資料庫連線
- [ ] 建立 API 路由結構
- [ ] 實作健康檢查端點
- [ ] 設定 CORS
- [ ] 設定環境變數
- [ ] Docker 配置

**檔案位置**：`backend/main.py`  
**預計時間**：6 小時  
**負責人**：後端開發  
**驗收標準**：API 伺服器正常運行

#### 2.4 即時數據 API 端點
- [ ] GET /api/v1/realtime/stations
- [ ] GET /api/v1/realtime/grid
- [ ] GET /api/v1/realtime/weather
- [ ] 實作分頁
- [ ] 實作篩選（時間、污染物）
- [ ] API 文檔（Swagger）

**檔案位置**：`backend/routers/realtime.py`  
**預計時間**：8 小時  
**負責人**：後端開發  
**驗收標準**：所有端點正常回應

#### 2.5 ETL Pipeline 建立
- [ ] 建立 ETL 基礎架構
- [ ] 實作 Extract（資料擷取）
- [ ] 實作 Transform（資料轉換）
- [ ] 實作 Load（資料載入）
- [ ] 錯誤處理與日誌
- [ ] 單元測試

**檔案位置**：`backend/etl/pipeline.py`  
**預計時間**：10 小時  
**負責人**：後端開發  
**驗收標準**：ETL 流程完整運作

#### 2.6 定時任務設定
- [ ] 安裝 APScheduler
- [ ] 設定每小時執行 ETL
- [ ] 設定每 5 分鐘更新 IoT
- [ ] 設定每日資料清理
- [ ] 任務監控與日誌
- [ ] 失敗重試機制

**檔案位置**：`backend/jobs/scheduler.py`  
**預計時間**：6 小時  
**負責人**：後端開發  
**驗收標準**：定時任務正常執行

### 🟡 中優先級

#### 2.7 Redis 快取層
- [ ] 設定 Redis 連線
- [ ] 實作快取裝飾器
- [ ] 設定快取過期時間
- [ ] 實作快取失效策略
- [ ] 監控快取命中率

**預計時間**：4 小時  
**負責人**：後端開發  
**驗收標準**：API 回應速度提升

#### 2.8 API 效能優化
- [ ] 資料庫查詢優化
- [ ] 批次查詢實作
- [ ] 連線池設定
- [ ] 壓縮回應內容
- [ ] 效能測試

**預計時間**：4 小時  
**負責人**：後端開發  
**驗收標準**：API 回應時間 < 500ms

---

## 📅 Phase 3：空間數據增強（Week 6-7）

### 🔴 高優先級

#### 3.1 空氣網 IoT 感測器整合
- [ ] 建立 IoT Service 類別
- [ ] 實作感測器數據擷取
- [ ] 篩選桃園區域感測器
- [ ] 數據品質檢查
- [ ] 存入資料庫
- [ ] 前端顯示感測器

**檔案位置**：`src/services/iot.service.ts`  
**預計時間**：8 小時  
**負責人**：後端開發  
**驗收標準**：顯示高密度感測器分布

#### 3.2 空間內插演算法
- [ ] 安裝 scipy/scikit-learn
- [ ] 實作 Kriging 內插
- [ ] 實作 IDW 內插
- [ ] 點位數據轉網格數據
- [ ] 內插結果驗證
- [ ] 效能優化

**檔案位置**：`backend/spatial/interpolation.py`  
**預計時間**：12 小時  
**負責人**：後端開發  
**驗收標準**：網格數據完整覆蓋

**Python 範例**：
```python
from scipy.interpolate import griddata
from pykrige.ok import OrdinaryKriging

def kriging_interpolation(points, values, grid_x, grid_y):
    lons = [p[0] for p in points]
    lats = [p[1] for p in points]
    
    OK = OrdinaryKriging(
        lons, lats, values,
        variogram_model='spherical'
    )
    
    z, ss = OK.execute('grid', grid_x, grid_y)
    return z
```

#### 3.3 工業區與 POI 標記
- [ ] 下載桃園市工業區資料
- [ ] 下載營業登記資料
- [ ] 地理編碼（TGOS API）
- [ ] 篩選工廠與餐飲業
- [ ] 存入 spatial_features 表
- [ ] 前端地圖標記

**檔案位置**：`scripts/import-poi.py`  
**預計時間**：10 小時  
**負責人**：後端開發  
**驗收標準**：地圖顯示工業區與 POI

#### 3.4 Map 頁面功能增強
- [ ] 顯示微型感測器（小圓點）
- [ ] 顯示工業區邊界
- [ ] 顯示 POI 標記
- [ ] 圖層切換控制
- [ ] 標記點擊事件
- [ ] 圖例更新

**檔案位置**：`src/screens/MapScreen.tsx`  
**預計時間**：8 小時  
**負責人**：前端開發  
**驗收標準**：地圖資訊豐富完整

### 🟡 中優先級

#### 3.5 交通流量數據
- [ ] 下載桃園市交通流量資料
- [ ] 數據清洗與處理
- [ ] 計算交通熱點
- [ ] 存入資料庫
- [ ] 前端顯示

**預計時間**：6 小時  
**負責人**：後端開發  
**驗收標準**：顯示交通熱點

#### 3.6 地形與 NDVI 數據
- [ ] 下載 DTM 地形模型
- [ ] 下載 MODIS NDVI 數據
- [ ] 計算網格海拔高度
- [ ] 計算網格 NDVI 值
- [ ] 存入 spatial_features 表

**預計時間**：8 小時  
**負責人**：後端開發  
**驗收標準**：空間特徵表完整

---

## 📅 Phase 4：垂直維度實現（Week 8-9）

### 🔴 高優先級

#### 4.1 光達數據申請與處理
- [ ] 聯繫中央大學取得光達數據
- [ ] 下載 NetCDF 檔案
- [ ] 解析垂直剖面數據
- [ ] 提取 0-3km 高度數據
- [ ] 存入 vertical_profiles 表
- [ ] 數據品質檢查

**檔案位置**：`scripts/import-lidar.py`  
**預計時間**：12 小時  
**負責人**：後端開發  
**驗收標準**：垂直剖面數據可用

**Python 範例**：
```python
import netCDF4 as nc

def read_lidar_data(file_path):
    dataset = nc.Dataset(file_path)
    backscatter = dataset.variables['backscatter'][:]
    height = dataset.variables['height'][:]
    time = dataset.variables['time'][:]
    return backscatter, height, time
```

#### 4.2 垂直剖面 API
- [ ] GET /api/v1/vertical/profile
- [ ] 查詢指定網格垂直數據
- [ ] 查詢指定時間範圍
- [ ] 數據插值處理
- [ ] API 文檔

**檔案位置**：`backend/routers/vertical.py`  
**預計時間**：6 小時  
**負責人**：後端開發  
**驗收標準**：API 正常回應垂直數據

#### 4.3 垂直剖面圖表組件
- [ ] 安裝 react-native-chart-kit
- [ ] 建立 VerticalProfile 組件
- [ ] 實作折線圖顯示
- [ ] 高度軸與濃度軸
- [ ] 互動式提示
- [ ] 樣式美化

**檔案位置**：`src/components/VerticalProfile.tsx`  
**預計時間**：8 小時  
**負責人**：前端開發  
**驗收標準**：圖表正確顯示垂直分布

#### 4.4 Dashboard 垂直剖面卡片
- [ ] 新增垂直剖面卡片
- [ ] 整合 VerticalProfile 組件
- [ ] 顯示當前位置垂直數據
- [ ] 高度標註
- [ ] Loading 狀態

**檔案位置**：`src/screens/DashboardScreen.tsx`  
**預計時間**：4 小時  
**負責人**：前端開發  
**驗收標準**：Dashboard 顯示垂直剖面

#### 4.5 Map 高度切換功能
- [ ] 建立 HeightSlider 組件
- [ ] 實作高度拉桿（0-3000m）
- [ ] 切換不同高度層網格數據
- [ ] 更新地圖顯示
- [ ] 高度標籤顯示

**檔案位置**：`src/components/HeightSlider.tsx`  
**預計時間**：8 小時  
**負責人**：前端開發  
**驗收標準**：可切換不同高度層

### 🟡 中優先級

#### 4.6 WRF 預報數據整合
- [ ] 取得 WRF NetCDF 檔案
- [ ] 解析三維氣象場
- [ ] 提取風場（U, V, W）
- [ ] 提取 PBLH
- [ ] 存入 wrf_forecast 表

**預計時間**：10 小時  
**負責人**：後端開發  
**驗收標準**：WRF 數據可用

#### 4.7 風場視覺化
- [ ] 建立風場箭頭組件
- [ ] 計算風向與風速
- [ ] 在地圖上繪製箭頭
- [ ] 圖層開關控制
- [ ] 動畫效果（選用）

**預計時間**：8 小時  
**負責人**：前端開發  
**驗收標準**：顯示風場分布

---

**（續下一部分）**

## 📅 Phase 5：AI 功能強化（Week 10-11）

### 🔴 高優先級

#### 5.1 LSTM 時序預測模型訓練
- [ ] 準備訓練數據（歷史 PM2.5）
- [ ] 特徵工程（滑動視窗 24 小時）
- [ ] 建立 LSTM 模型架構
- [ ] 訓練模型（TensorFlow/Keras）
- [ ] 模型驗證與調參
- [ ] 儲存模型權重
- [ ] 模型效能評估（R², RMSE, MAE）

**檔案位置**：`ml_models/lstm_forecast.py`  
**預計時間**：16 小時  
**負責人**：AI/資料科學  
**驗收標準**：模型 R² > 0.75

**Python 範例**：
```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

def build_lstm_model(input_shape):
    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(64, return_sequences=False),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(24)  # 預測未來 24 小時
    ])
    
    model.compile(
        optimizer='adam',
        loss='mse',
        metrics=['mae']
    )
    
    return model
```

#### 5.2 隨機森林空間推估模型
- [ ] 準備空間特徵數據
- [ ] 整合靜態特徵（土地利用、POI、NDVI）
- [ ] 整合動態特徵（氣象、測站數據）
- [ ] 建立 RF 模型
- [ ] 訓練與驗證
- [ ] 特徵重要性分析
- [ ] 儲存模型

**檔案位置**：`ml_models/rf_spatial.py`  
**預計時間**：16 小時  
**負責人**：AI/資料科學  
**驗收標準**：模型 R² > 0.80

**Python 範例**：
```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score

def train_rf_model(X_train, y_train):
    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    
    # 交叉驗證
    scores = cross_val_score(rf, X_train, y_train, cv=10, scoring='r2')
    print(f'Cross-validation R²: {scores.mean():.3f} (+/- {scores.std():.3f})')
    
    # 訓練模型
    rf.fit(X_train, y_train)
    
    return rf
```

#### 5.3 預測服務 API
- [ ] POST /api/v1/ai/prediction（LSTM 預測）
- [ ] POST /api/v1/ai/spatial（RF 空間推估）
- [ ] 載入訓練好的模型
- [ ] 實作預測邏輯
- [ ] 結果快取
- [ ] API 文檔

**檔案位置**：`backend/routers/ai.py`  
**預計時間**：8 小時  
**負責人**：後端開發  
**驗收標準**：API 正常回應預測結果

#### 5.4 預報數據存儲
- [ ] 定時執行 LSTM 預測
- [ ] 定時執行 RF 推估
- [ ] 存入 forecast_timeseries 表
- [ ] 存入 forecast_spatial 表
- [ ] 預報數據版本管理
- [ ] 歷史預報保留策略

**檔案位置**：`backend/jobs/forecast_job.py`  
**預計時間**：6 小時  
**負責人**：後端開發  
**驗收標準**：每 6 小時自動預報

#### 5.5 前端預報顯示
- [ ] Dashboard 顯示 24 小時預報趨勢
- [ ] Map 顯示預報網格數據
- [ ] 預報與實測對比
- [ ] 預報信心區間顯示
- [ ] 切換預報時間

**檔案位置**：`src/screens/DashboardScreen.tsx`  
**預計時間**：8 小時  
**負責人**：前端開發  
**驗收標準**：顯示完整預報資訊

### 🟡 中優先級

#### 5.6 LLM 成因診斷整合
- [ ] 選擇 LLM 服務（OpenAI/Claude/本地）
- [ ] 建立 Prompt 模板
- [ ] 實作 RAG 架構
- [ ] 整合空氣品質知識庫
- [ ] 異常偵測觸發診斷
- [ ] 前端顯示診斷結果

**檔案位置**：`backend/ai/llm_diagnosis.py`  
**預計時間**：12 小時  
**負責人**：AI/後端開發  
**驗收標準**：提供可解釋的診斷報告

**Python 範例**：
```python
from openai import OpenAI

def diagnose_pollution(data):
    client = OpenAI(api_key=API_KEY)
    
    prompt = f"""
    根據以下空氣品質數據，分析污染成因：
    - PM2.5: {data['pm25']} μg/m³
    - 風速: {data['wind_speed']} m/s
    - 風向: {data['wind_direction']}°
    - 溫度: {data['temperature']}°C
    - 濕度: {data['humidity']}%
    - 位置: {data['location']}
    
    請分析可能的污染來源（工業排放/交通/境外傳輸/本地累積）
    並提供應對建議。
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content
```

#### 5.7 HYSPLIT 污染源追溯
- [ ] 安裝 pysplit
- [ ] 實作後推軌跡計算
- [ ] 繪製軌跡圖
- [ ] 前端顯示軌跡
- [ ] Events 頁面整合

**預計時間**：10 小時  
**負責人**：後端開發  
**驗收標準**：顯示污染物傳輸路徑

---

## 📅 Phase 6：優化與測試（Week 12）

### 🔴 高優先級

#### 6.1 效能優化
- [ ] 資料庫查詢優化
- [ ] 索引調整
- [ ] API 回應時間優化
- [ ] 前端渲染優化
- [ ] 圖片與資源壓縮
- [ ] 網格渲染效能提升
- [ ] 記憶體使用優化

**預計時間**：8 小時  
**負責人**：全員  
**驗收標準**：頁面載入 < 2 秒

#### 6.2 錯誤處理完善
- [ ] 所有 API 錯誤處理
- [ ] 前端錯誤邊界
- [ ] 網路斷線處理
- [ ] 數據異常處理
- [ ] 友善錯誤訊息
- [ ] 錯誤日誌記錄

**預計時間**：6 小時  
**負責人**：全員  
**驗收標準**：無未處理錯誤

#### 6.3 使用者測試
- [ ] 準備測試案例
- [ ] 邀請 5-10 位測試者
- [ ] 收集使用回饋
- [ ] 記錄問題與建議
- [ ] 優先級排序
- [ ] 修復關鍵問題

**預計時間**：12 小時  
**負責人**：專案負責人  
**驗收標準**：使用者滿意度 > 4.0/5.0

#### 6.4 文檔撰寫
- [ ] API 文檔完善（Swagger）
- [ ] 使用者手冊
- [ ] 開發者文檔
- [ ] 部署文檔
- [ ] 資料庫 Schema 文檔
- [ ] 系統架構圖更新

**預計時間**：8 小時  
**負責人**：全員  
**驗收標準**：文檔完整清晰

#### 6.5 部署準備
- [ ] Docker Compose 配置
- [ ] 環境變數設定
- [ ] 資料庫遷移腳本
- [ ] 備份與還原機制
- [ ] 監控設定（選用）
- [ ] CI/CD 設定（選用）

**預計時間**：8 小時  
**負責人**：後端開發  
**驗收標準**：可一鍵部署

### 🟡 中優先級

#### 6.6 單元測試
- [ ] 後端 API 測試
- [ ] 前端組件測試
- [ ] ETL 流程測試
- [ ] 模型預測測試
- [ ] 測試覆蓋率 > 60%

**預計時間**：10 小時  
**負責人**：全員  
**驗收標準**：關鍵功能有測試

#### 6.7 安全性檢查
- [ ] API 認證機制（選用）
- [ ] SQL 注入防護
- [ ] XSS 防護
- [ ] CORS 設定檢查
- [ ] 敏感資料加密
- [ ] API Rate Limiting

**預計時間**：6 小時  
**負責人**：後端開發  
**驗收標準**：通過基本安全檢查

---

## 🎯 額外功能（選用，依時間調整）

### 🟢 低優先級

#### 7.1 Explorer 頁面增強
- [ ] 時間序列圖表
- [ ] 多站點比較
- [ ] 資料匯出（CSV/Excel）
- [ ] 進階篩選
- [ ] 統計分析

**預計時間**：12 小時  
**驗收標準**：提供完整資料分析功能

#### 7.2 Events 頁面增強
- [ ] 事件時間軸
- [ ] 事件自動偵測
- [ ] 事件影響範圍動畫
- [ ] 事件報告生成
- [ ] 事件通知

**預計時間**：10 小時  
**驗收標準**：完整事件管理功能

#### 7.3 Alerts 頁面增強
- [ ] 推播通知（Expo Notifications）
- [ ] Email 通知
- [ ] 自訂警報規則
- [ ] 警報歷史記錄
- [ ] 警報統計分析

**預計時間**：12 小時  
**驗收標準**：完整警報系統

#### 7.4 多語言支援
- [ ] i18n 設定
- [ ] 英文翻譯
- [ ] 語言切換功能
- [ ] 日期時間本地化

**預計時間**：8 小時  
**驗收標準**：支援中英文切換

#### 7.5 離線模式
- [ ] PWA 配置
- [ ] Service Worker
- [ ] 離線資料快取
- [ ] 同步機制

**預計時間**：10 小時  
**驗收標準**：離線可瀏覽歷史數據

---

## 📊 進度追蹤表

### 完成度計算

| 階段 | 任務數 | 預計時間 | 完成數 | 完成率 |
|------|--------|----------|--------|--------|
| Phase 0 | 5 | 22h | 0 | 0% |
| Phase 1 | 8 | 54h | 0 | 0% |
| Phase 2 | 8 | 58h | 0 | 0% |
| Phase 3 | 6 | 52h | 0 | 0% |
| Phase 4 | 7 | 62h | 0 | 0% |
| Phase 5 | 7 | 76h | 0 | 0% |
| Phase 6 | 7 | 58h | 0 | 0% |
| **總計** | **48** | **382h** | **0** | **0%** |

### 每週檢查點

**Week 1 結束**：
- [ ] 開發環境完成
- [ ] API Key 取得
- [ ] 資料庫建立

**Week 3 結束**：
- [ ] EPA + CWA API 整合完成
- [ ] Dashboard 顯示真實數據
- [ ] Map 顯示測站

**Week 5 結束**：
- [ ] 資料庫完整建立
- [ ] ETL Pipeline 運作
- [ ] 後端 API 完成

**Week 7 結束**：
- [ ] IoT 感測器整合
- [ ] 空間內插完成
- [ ] 工業區/POI 標記

**Week 9 結束**：
- [ ] 垂直剖面顯示
- [ ] 高度切換功能
- [ ] WRF 數據整合

**Week 11 結束**：
- [ ] LSTM 模型上線
- [ ] RF 模型上線
- [ ] 預報功能完成

**Week 12 結束**：
- [ ] 系統優化完成
- [ ] 測試通過
- [ ] 文檔完成
- [ ] 可部署上線

---

## 🚨 風險管理

### 高風險項目

| 風險 | 影響 | 機率 | 應對策略 |
|------|------|------|---------|
| **光達數據取得困難** | 高 | 中 | 使用 WRF 模擬數據替代 |
| **API 限流或失效** | 高 | 低 | 建立備用數據源、本地快取 |
| **模型訓練時間過長** | 中 | 中 | 使用預訓練模型、減少特徵 |
| **空間內插效能問題** | 中 | 中 | 優化演算法、使用 GPU 加速 |
| **團隊人力不足** | 高 | 中 | 調整優先級、延後選用功能 |

### 應變計畫

**如果進度落後**：
1. 優先完成 Phase 1-3（基礎功能）
2. Phase 4-5 使用 Mock 數據展示
3. 延後選用功能到後續版本

**如果 API 無法取得**：
1. 使用歷史數據建立 Mock API
2. 展示系統架構與設計
3. 說明真實整合方案

**如果模型效果不佳**：
1. 使用簡單統計模型
2. 展示系統框架
3. 說明改進方向

---

## 📝 開發規範

### Git 工作流程

```bash
# 主分支
main          # 穩定版本
develop       # 開發分支

# 功能分支
feature/phase1-epa-api
feature/phase2-database
feature/phase3-iot-sensors
feature/phase4-vertical-profile
feature/phase5-lstm-model

# 提交訊息格式
feat: 新增 EPA API 整合
fix: 修復地圖渲染問題
docs: 更新 API 文檔
style: 調整 Dashboard 樣式
refactor: 重構 ETL Pipeline
test: 新增單元測試
chore: 更新依賴套件
```

### 程式碼規範

**TypeScript/JavaScript**：
- 使用 ESLint + Prettier
- 遵循 Airbnb Style Guide
- 函式命名：camelCase
- 組件命名：PascalCase
- 常數命名：UPPER_SNAKE_CASE

**Python**：
- 使用 Black + Flake8
- 遵循 PEP 8
- 函式命名：snake_case
- 類別命名：PascalCase
- 常數命名：UPPER_SNAKE_CASE

### 文檔規範

**程式碼註解**：
```typescript
/**
 * 擷取環境部即時空氣品質數據
 * @returns {Promise<StationData[]>} 桃園市測站數據陣列
 * @throws {APIError} API 請求失敗時拋出錯誤
 */
async fetchRealtimeData(): Promise<StationData[]> {
  // 實作...
}
```

**API 文檔**：
- 使用 Swagger/OpenAPI
- 包含請求/回應範例
- 錯誤碼說明

---

## 🎓 學習資源

### 必讀文檔
- [ ] React Native 官方文檔
- [ ] FastAPI 官方文檔
- [ ] PostGIS 教學
- [ ] TensorFlow/Keras 教學
- [ ] Scikit-learn 文檔

### 推薦課程
- Udemy: React Native 完整課程
- Coursera: Machine Learning Specialization
- YouTube: PostGIS 空間分析教學

### 參考專案
- AirVisual 開源專案
- OpenAQ 資料平台
- PurpleAir 感測器網路

---

## ✅ 最終檢查清單

### 功能完整性
- [ ] 所有 5 大頁面功能正常
- [ ] 真實數據整合完成
- [ ] 三維監測實現
- [ ] AI 預測功能運作
- [ ] 地圖互動流暢

### 效能指標
- [ ] 頁面載入時間 < 2 秒
- [ ] API 回應時間 < 500ms
- [ ] 地圖渲染流暢（60 FPS）
- [ ] 記憶體使用合理

### 品質標準
- [ ] 無嚴重 Bug
- [ ] 錯誤處理完善
- [ ] 使用者體驗良好
- [ ] 程式碼可維護
- [ ] 文檔完整

### 計畫書對齊
- [ ] 三維垂直監測 ✓
- [ ] 多源數據整合 ✓
- [ ] LSTM 時序預測 ✓
- [ ] RF 空間推估 ✓
- [ ] WRF 氣象預報 ✓
- [ ] LLM 成因診斷 ✓
- [ ] 3km 網格系統 ✓
- [ ] 即時更新機制 ✓
- [ ] 視覺化展示 ✓
- [ ] 決策支援功能 ✓

---

## 📞 聯絡資訊

**專案負責人**：[姓名]  
**Email**：[email]  
**GitHub**：[repository]  
**文檔**：[documentation]

---

**文檔版本**：v1.0  
**最後更新**：2025-01-15  
**下次更新**：每週一

---

## 🎉 結語

這份開發路線圖涵蓋了從環境建置到系統上線的完整流程。請依照優先級執行任務，並在每個階段結束時進行檢查點驗收。

**記住**：
1. 🔴 高優先級任務必須完成
2. 🟡 中優先級任務盡量完成
3. 🟢 低優先級任務依時間調整
4. 保持彈性，適時調整計畫
5. 定期溝通，及時解決問題

**祝開發順利！** 🚀
