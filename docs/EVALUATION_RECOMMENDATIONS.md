# 專案評估與改進建議

## 📊 現況評估總結

### ✅ 已實現的核心功能

#### 1. Dashboard（總覽頁面）
- ✅ AQI 圓形儀表板
- ✅ AI 趨勢分析卡片
- ✅ 臭氧濃度監測
- ✅ PM2.5 和 NO2 污染物卡片
- ⚠️ **缺少**：垂直高度數據展示

#### 2. Map（地圖監測）
- ✅ 3km 網格系統
- ✅ 三種地圖模式（2D/3D/衛星）
- ✅ 污染物切換（PM2.5/O3/NOX/VOCs）
- ✅ 即時/預報模式切換
- ✅ 底部彈窗詳細資訊
- ⚠️ **缺少**：真實測站標記、垂直剖面展示

#### 3. Explorer（資料檢索）
- ✅ 多維度篩選（時間/污染物/區域/資料來源）
- ✅ 監測動態卡片
- ✅ 狀態標記
- ⚠️ **缺少**：歷史趨勢圖表、資料匯出功能

#### 4. Events（事件庫）
- ✅ 事件篩選
- ✅ 互動式地圖
- ✅ 事件詳情展示
- ✅ AI 信心分數
- ⚠️ **缺少**：事件時間軸、污染源追溯

#### 5. Alerts（警報與 AI）
- ✅ 雙模式切換（個人健康/治理支援）
- ✅ 健康守護設定
- ✅ AI 分析工具（雷達圖/圓餅圖）
- ✅ 政策模擬
- ✅ AI 策略推薦
- ⚠️ **缺少**：即時警報推送、歷史警報記錄

---

## 🎯 計畫書核心需求對照

### 計畫書強調的關鍵技術

| 計畫書需求 | 目前實現狀態 | 建議改進 |
|-----------|------------|---------|
| **三維垂直監測** | ❌ 未實現 | 🔴 高優先 - 需整合光達數據 |
| **WRF 氣象預報** | ⚠️ 部分實現 | 🟡 中優先 - 需顯示風場/PBLH |
| **LSTM 時序預測** | ⚠️ Mock 數據 | 🟡 中優先 - 需真實模型 |
| **隨機森林空間推估** | ⚠️ Mock 數據 | 🟡 中優先 - 需真實模型 |
| **LLM 成因診斷** | ✅ 已有 UI | 🟢 低優先 - 需接入真實 LLM |
| **多源數據整合** | ❌ 未實現 | 🔴 高優先 - 需整合真實 API |

---

## 🔧 關鍵功能缺口與改進建議

### 🔴 高優先級（必須實現）

#### 1. 三維垂直剖面展示
**計畫書需求**：「重建 3 km × 3 km 高解析度的三維 PM2.5 分布模型」

**建議實現**：
- **Dashboard 新增**：垂直剖面圖表（0-3km 高度）
- **Map 新增**：高度拉桿（可切換不同高度層的污染分布）
- **資料來源**：中央大學光達數據（需申請）

```typescript
// 新增垂直剖面組件
interface VerticalProfileProps {
  gridId: string;
  heights: number[]; // [0, 100, 200, ..., 3000]
  pm25Values: number[];
}
```

#### 2. 真實測站數據整合
**計畫書需求**：「環境部監測站、中央氣象署觀測資料」

**建議實現**：
- **Map 頁面**：標記桃園 6 個測站位置
- **即時數據**：每小時更新環境部 API
- **氣象數據**：整合中央氣象署 API

**實作步驟**：
```typescript
// src/api/realtime.ts
export const fetchEPAStations = async () => {
  const response = await fetch(
    'https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=YOUR_KEY'
  );
  return response.json();
};

export const fetchWeatherData = async () => {
  const response = await fetch(
    'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001'
  );
  return response.json();
};
```

#### 3. 微型感測器高密度數據
**資料來源**：空氣網 IoT 感測器（5 分鐘更新）

**建議實現**：
- **Map 頁面**：顯示微型感測器分布（小圓點）
- **Explorer 頁面**：可篩選「微感測」資料來源
- **優勢**：提升空間解析度

---

### 🟡 中優先級（增強功能）

#### 4. WRF 氣象預報視覺化
**計畫書需求**：「WRF 數值天氣預報模式，提供三維大氣物理特徵」

**建議新增功能**：
- **Dashboard**：風場箭頭圖層
- **Map**：混合層高度（PBLH）等高線
- **Alerts**：未來 24-72 小時氣象預報

**資料處理**：
```python
# 讀取 WRF NetCDF 檔案
import netCDF4 as nc
wrf_file = nc.Dataset('wrfout_d03_2025-01-15.nc')
u_wind = wrf_file.variables['U'][:]
v_wind = wrf_file.variables['V'][:]
pblh = wrf_file.variables['PBLH'][:]
```

#### 5. 歷史趨勢分析
**建議新增**：
- **Explorer 頁面**：時間序列圖表（24 小時/7 天/30 天）
- **Dashboard**：污染物濃度變化趨勢
- **Events**：事件時間軸

#### 6. 污染源追溯功能
**計畫書需求**：「辨識工業區主要污染熱點與排放源特徵」

**建議實現**：
- **Events 頁面**：HYSPLIT 後推軌跡圖
- **Map 頁面**：工業區/交通熱點標記
- **資料來源**：
  - 桃園市工業區資訊
  - 交通流量數據
  - HYSPLIT 軌跡模型

---

### 🟢 低優先級（優化體驗）

#### 7. 資料匯出功能
- CSV/Excel 匯出
- PDF 報告生成
- API 端點提供

#### 8. 多語言支援
- 英文介面
- 適合國際研討會展示

#### 9. 離線模式
- PWA 支援
- 本地快取

---

## 📦 資料來源應用方案

### 方案 A：快速原型（2-4 週）

**使用 Mock + 部分真實數據**

```typescript
// 優先整合的 API
1. 環境部空氣品質監測網（即時空品）
   - API: aqx_p_432
   - 更新頻率：每小時
   - 實作難度：⭐ 簡單

2. 中央氣象署觀測資料
   - API: O-A0001-001
   - 更新頻率：每 10 分鐘
   - 實作難度：⭐ 簡單

3. 空氣網微型感測器
   - API: pm25.lass-net.org
   - 更新頻率：5 分鐘
   - 實作難度：⭐⭐ 中等
```

### 方案 B：完整系統（2-3 個月）

**整合所有資料來源**

```typescript
// 完整資料流程
1. 即時監測層
   - 環境部測站（6 站）
   - 微型感測器（高密度）
   - 氣象觀測站

2. 空間資料層
   - 國土利用調查（工業區/住宅區）
   - 數值路網（交通污染源）
   - 營業登記（工廠/餐飲 POI）
   - DTM 地形模型

3. 遙測資料層
   - MODIS NDVI（植生指標）
   - Sentinel-5P NO2（衛星數據）

4. 預報模式層
   - WRF 氣象預報（需自行運算或取得）
   - HYSPLIT 軌跡模型

5. 垂直觀測層
   - 中央大學光達（需申請）
```

---

## 🎨 UI/UX 改進建議

### Dashboard 頁面

**新增組件**：
```typescript
// 1. 垂直剖面卡片
<VerticalProfileCard 
  title="垂直分布"
  heights={[0, 500, 1000, 1500, 2000, 3000]}
  pm25Values={[45, 38, 32, 28, 25, 20]}
/>

// 2. 測站即時數據
<StationGrid 
  stations={[
    { name: '桃園站', pm25: 52, status: 'moderate' },
    { name: '觀音站', pm25: 65, status: 'unhealthy' },
    // ...
  ]}
/>

// 3. 24 小時預報趨勢
<ForecastChart 
  hours={24}
  predictions={[...]}
/>
```

### Map 頁面

**新增功能**：
```typescript
// 1. 高度切換拉桿
<HeightSlider 
  min={0}
  max={3000}
  step={100}
  onChange={(height) => updateMapLayer(height)}
/>

// 2. 測站標記
<StationMarkers 
  stations={epaStations}
  onPress={(station) => showStationDetail(station)}
/>

// 3. 風場箭頭圖層
<WindFieldLayer 
  uWind={uData}
  vWind={vData}
  visible={showWindField}
/>
```

### Explorer 頁面

**新增功能**：
```typescript
// 1. 時間序列圖表
<TimeSeriesChart 
  pollutant="PM2.5"
  timeRange="7days"
  stations={selectedStations}
/>

// 2. 資料匯出按鈕
<ExportButton 
  format="csv"
  data={filteredData}
/>

// 3. 比較模式
<ComparisonView 
  stations={['桃園站', '觀音站']}
  pollutants={['PM2.5', 'O3']}
/>
```

### Events 頁面

**新增功能**：
```typescript
// 1. 事件時間軸
<EventTimeline 
  events={sortedEvents}
  onSelectEvent={(event) => showEventDetail(event)}
/>

// 2. 污染源追溯
<SourceTracking 
  eventId="E001"
  trajectoryData={hysplitData}
/>

// 3. 影響範圍動畫
<ImpactAnimation 
  center={eventLocation}
  radius={impactRadius}
  duration={eventDuration}
/>
```

### Alerts 頁面

**新增功能**：
```typescript
// 1. 即時警報推送
<AlertNotification 
  type="health"
  severity="high"
  message="PM2.5 濃度超過 70 μg/m³"
/>

// 2. 歷史警報記錄
<AlertHistory 
  filters={{ dateRange, severity, type }}
  onSelectAlert={(alert) => showAlertDetail(alert)}
/>

// 3. 自訂警報規則
<AlertRuleBuilder 
  pollutant="PM2.5"
  threshold={35}
  location="中壢區"
  notificationMethod={['push', 'email']}
/>
```

---

## 🚀 實作優先順序建議

### Phase 1：基礎數據整合（2 週）
1. ✅ 整合環境部空氣品質 API
2. ✅ 整合中央氣象署氣象 API
3. ✅ 在 Map 頁面顯示真實測站
4. ✅ 更新 Dashboard 使用真實數據

### Phase 2：空間數據增強（2 週）
1. ✅ 整合微型感測器數據
2. ✅ 加入工業區/交通熱點標記
3. ✅ 實作空間內插演算法
4. ✅ 優化網格渲染效能

### Phase 3：垂直維度實現（3 週）
1. ✅ 申請中央大學光達數據
2. ✅ 實作垂直剖面圖表
3. ✅ 加入高度切換功能
4. ✅ 整合 WRF 預報數據

### Phase 4：AI 功能強化（3 週）
1. ✅ 訓練 LSTM 時序預測模型
2. ✅ 訓練隨機森林空間推估模型
3. ✅ 整合 LLM 成因診斷
4. ✅ 實作 HYSPLIT 污染源追溯

### Phase 5：優化與測試（2 週）
1. ✅ 效能優化
2. ✅ 使用者測試
3. ✅ Bug 修復
4. ✅ 文件撰寫

---

## 📝 具體程式碼建議

### 1. 真實 API 整合範例

```typescript
// src/api/epa.ts
export const fetchEPAData = async () => {
  const API_KEY = process.env.EPA_API_KEY;
  const url = `https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=${API_KEY}&limit=1000&format=json`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // 篩選桃園測站
  const taoyuanStations = ['桃園', '大園', '觀音', '平鎮', '龍潭', '中壢'];
  return data.records.filter(record => 
    taoyuanStations.includes(record.sitename)
  );
};

// src/api/weather.ts
export const fetchWeatherData = async (stationId: string) => {
  const API_KEY = process.env.CWA_API_KEY;
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': API_KEY }
  });
  return response.json();
};
```

### 2. 垂直剖面組件

```typescript
// src/components/VerticalProfile.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface VerticalProfileProps {
  heights: number[];
  pm25Values: number[];
}

export const VerticalProfile: React.FC<VerticalProfileProps> = ({
  heights,
  pm25Values
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>垂直剖面 (0-3km)</Text>
      <LineChart
        data={{
          labels: heights.map(h => `${h}m`),
          datasets: [{ data: pm25Values }]
        }}
        width={300}
        height={200}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          color: (opacity = 1) => `rgba(106, 190, 116, ${opacity})`
        }}
      />
    </View>
  );
};
```

### 3. 高度切換拉桿

```typescript
// src/components/HeightSlider.tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

export const HeightSlider = ({ onHeightChange }) => {
  const [height, setHeight] = useState(0);
  
  return (
    <View style={styles.container}>
      <Text>高度: {height}m</Text>
      <Slider
        minimumValue={0}
        maximumValue={3000}
        step={100}
        value={height}
        onValueChange={(value) => {
          setHeight(value);
          onHeightChange(value);
        }}
      />
    </View>
  );
};
```

---

## 🎓 計畫書對齊檢查表

- [ ] **三維監測**：實作垂直剖面展示
- [ ] **多源整合**：整合 5+ 種資料來源
- [ ] **LSTM 預測**：實作時序預測模型
- [ ] **RF 推估**：實作空間推估模型
- [ ] **WRF 整合**：顯示氣象預報數據
- [ ] **LLM 診斷**：接入大語言模型
- [ ] **3km 網格**：已實現 ✅
- [ ] **即時更新**：每小時自動更新
- [ ] **視覺化**：互動式地圖與圖表
- [ ] **決策支援**：政策模擬與策略推薦

---

**最後更新**：2025-01-15  
**版本**：v1.0
