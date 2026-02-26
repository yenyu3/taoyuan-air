## 📊 基礎資料視覺化（Core Visualization）

### Matplotlib & Seaborn

```python
import matplotlib.pyplotas plt
import seabornas sns
```

**用途：**

- 時間序列圖（PM2.5 濃度變化）
- 統計分布圖
- 相關性熱圖（pollutant correlations）
- 風花圖（wind rose diagrams）

---

### Plotly

```python
import plotly.graph_objectsas go
import plotly.expressas px
```

**用途：**

- 互動式時間序列圖
- 3D 散點圖
- 動態污染濃度變化

---

## 🗺️ 地理空間視覺化（Geospatial Visualization）

### Folium

```python
import folium
from folium.pluginsimport HeatMap, TimestampedGeoJson
```

**用途：**

- 桃園市測站位置標記
- PM2.5 濃度熱圖（heatmap overlay）
- 污染擴散動態地圖

---

### Plotly + Mapbox

```python
import plotly.graph_objectsas go
```

**用途：**

- 互動式污染濃度地圖
- 3km × 3km 網格視覺化
- 多層次地圖展示

---

### GeoPandas + Contextily

```python
import geopandasas gpd
import contextilyas ctx
```

**用途：**

- 觀音工業區邊界繪製
- 行政區域疊加
- 背景地圖整合

---

## 🌐 3D 視覺化（3D Visualization）

### Plotly 3D

```python
import plotly.graph_objectsas go
```

**用途：**

- 垂直剖面圖（vertical profiles）
- 3D 污染物濃度分布
- 高度－時間－濃度立體圖

---

### PyVista

```python
import pyvistaas pv
```

**用途：**

- 進階 3D 體積渲染
- LiDAR 數據視覺化
- 大氣邊界層結構

---

### Mayavi（選用）

```python
from mayaviimport mlab
```

**用途：**

- 科學級 3D 視覺化
- 複雜氣流場展示

---

## 📈 儀表板開發（Dashboard）

### Streamlit ⭐（推薦）

```python
import streamlitas st
```

**優勢：**

- 快速開發 Web 介面
- 適合展示 AI 預報結果
- 即時數據更新

**範例應用：**

```python
st.title("桃園市空氣污染監測系統")
st.map(data)# 測站位置
st.line_chart(pm25_data)# PM2.5 趨勢
```

---

### Dash（Plotly）

```python
import dash
from dashimport dcc, html
```

**優勢：**

- 高度客製化
- 複雜互動功能
- 專業儀表板外觀

---

### Panel（HoloViz）

```python
import panelas pn
```

**優勢：**

- 支援多種繪圖庫
- Jupyter notebook 整合

---

## 🎯 專業氣象／空品視覺化

### MetPy

```python
from metpy.plotsimport SkewT, Hodograph
```

**用途：**

- 大氣垂直剖面圖
- 氣象探空圖
- 風場分析

---

### WindRose（Matplotlib）

```python
from windroseimport WindroseAxes
```

**用途：**

- 風向風速玫瑰圖
- 污染傳輸分析

---

### Py-ART（選用）

```python
import pyart
```

**用途：**

- 雷達資料視覺化
- 如需整合氣象雷達數據

---

## 🤖 AI 模型視覺化

### SHAP

```python
import shap
```

**用途：**

- AI 模型可解釋性
- 特徵重要性視覺化
- 專家事件分析支援

---

### YellowBrick

```python
from yellowbrick.model_selectionimport ValidationCurve
```

**用途：**

- 模型性能評估圖
- 預測結果視覺化

---

# 🌍 前端 Web 視覺化（React / 展示）

## 🗺️ 2D 地圖視覺化

### Leaflet.js ⭐⭐⭐⭐⭐（強烈推薦）

**優點：**

- ✅ 輕量、簡單、文檔完整
- ✅ React 整合容易（React-Leaflet）
- ✅ 插件豐富
- ✅ 開源免費

**適用場景：**

- 測站位置標記
- 即時數據展示
- 熱力圖
- 網格化展示

**安裝：**

```bash
npm install leaflet react-leaflet
```

**基礎範例：**

```jsx
import {MapContainer,TileLayer,Marker,Popup }from'react-leaflet';

functionAirQualityMap() {
return (
<MapContainercenter={[24.96,121.19]}zoom={11}style={{height: '600px' }}>
<TileLayer
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
attribution='&copy; OpenStreetMap contributors'
      />

      {/* 測站標記 */}
<Markerposition={[24.9675,121.1920]}>
<Popup>
<div>
<h3>中央大學測站</h3>
<p>PM2.5: 35 μg/m³</p>
<p>AQI: 100 (對敏感族群不健康)</p>
</div>
</Popup>
</Marker>
</MapContainer>
  );
}
```

**常用插件：**

```bash
# 熱力圖
npm install leaflet.heat react-leaflet-heatmap-layer

# 繪圖工具（讓使用者畫監測區域）
npm install leaflet-draw

# 時間軸播放
npm install leaflet-timeline
```

---

### Mapbox GL JS ⭐⭐⭐⭐

**優點：**

- ✅ 視覺效果超美
- ✅ 3D 建築、地形支援
- ✅ 效能優異（WebGL 加速）
- ✅ 可自定義地圖樣式

**缺點：**

- ❌ 需要 API Key（有免費額度）
- ❌ 學習曲線較陡

**安裝：**

```bash
npm install mapbox-gl react-map-gl
```

**範例：**

```jsx
importMapfrom'react-map-gl';
import'mapbox-gl/dist/mapbox-gl.css';

functionMapboxMap() {
return (
<Map
mapboxAccessToken="YOUR_TOKEN"
initialViewState={{
longitude:121.19,
latitude:24.96,
zoom:11
      }}
style={{width: '100%',height:600 }}
mapStyle="mapbox://styles/mapbox/streets-v12"
    />
  );
}
```

---

### Google Maps API ⭐⭐⭐

**優點：**

- ✅ 大家熟悉的介面
- ✅ 衛星圖、街景支援
- ✅ 地點搜尋功能強

**缺點：**

- ❌ 需要 API Key（付費）
- ❌ 自定義能力較弱

**安裝：**

```bash
npm install @react-google-maps/api
```

---

## 🔥 熱力圖專用套件

### Leaflet.heat ⭐⭐⭐⭐⭐

**安裝：**

```bash
npm install leaflet.heat
```

**範例：**

```jsx
import Lfrom'leaflet';
import'leaflet.heat';

const heatmapData = [
  [24.96,121.19,35],// [lat, lon, intensity]
  [24.97,121.20,42],
  [24.98,121.21,28],
];

const heat = L.heatLayer(heatmapData, {
radius:25,
blur:15,
maxZoom:17,
}).addTo(map);
```

---

### Heatmap.js ⭐⭐⭐⭐

**安裝：**

```bash
npm install heatmap.js
```

**特點：**

- 可獨立使用（不依賴地圖庫）
- 高度自定義（顏色、半徑）

---

## 🌍 3D 地球／立體視覺化

### Cesium.js ⭐⭐⭐⭐⭐（3D 必選）

**適用場景：**

- 垂直剖面 3D 視覺化（重點）
- 3D 污染雲
- 時間動畫
- 高度分層展示

**安裝：**

```bash
npm install cesium resium
```

**範例：3D 污染點雲**

```jsx
import {Viewer,Entity }from'resium';
import {Cartesian3,Color }from'cesium';

functionPollution3DViewer({ data }) {
return (
<Viewer>
      {data.map((point, idx) => (
<Entity
key={idx}
position={Cartesian3.fromDegrees(point.lon,point.lat,point.height)}
point={{
pixelSize:10,
color:getPM25Color(point.pm25),
outlineColor:Color.WHITE,
outlineWidth:2
          }}
        />
      ))}
</Viewer>
  );
}

functiongetPM25Color(pm25) {
if (pm25 <15)returnColor.GREEN;
if (pm25 <35)returnColor.YELLOW;
if (pm25 <54)returnColor.ORANGE;
returnColor.RED;
}
```

**範例：垂直剖面（3D 柱狀體）**

```jsx
<Entity
  position={Cartesian3.fromDegrees(121.19, 24.96, 100)}
  cylinder={{
    length: 200,
    topRadius: 1000,
    bottomRadius: 1000,
    material: Color.RED.withAlpha(0.5),
  }}
/>
```

---

### Deck.gl ⭐⭐⭐⭐

**安裝：**

```bash
npm install deck.gl @deck.gl/react
```

**範例：3D 六角形網格**

```jsx
importDeckGLfrom'@deck.gl/react';
import {HexagonLayer }from'@deck.gl/aggregation-layers';

const layer =newHexagonLayer({
id:'hexagon-layer',
data: airQualityData,
getPosition:d => [d.lon, d.lat],
getElevationWeight:d => d.pm25,
elevationScale:100,
radius:1000,
extruded:true,
});

functionDeckMap() {
return (
<DeckGL
initialViewState={{
longitude:121.19,
latitude:24.96,
zoom:11,
pitch:45
      }}
layers={[layer]}
    />
  );
}
```

---

### Three.js ⭐⭐⭐

**安裝：**

```bash
npm install three @react-three/fiber @react-three/drei
```

**範例：3D 污染粒子**

```jsx
import {Canvas }from'@react-three/fiber';
import {Points,PointMaterial }from'@react-three/drei';

functionPollutionParticles({ data }) {
const positions =newFloat32Array(data.flatMap(d => [d.x, d.y, d.z]));

return (
<Canvas>
<Pointspositions={positions}>
<PointMaterialsize={0.05}color="red"transparentopacity={0.6} />
</Points>
</Canvas>
  );
}
```

---

## 📈 圖表視覺化（前端）

### Recharts ⭐⭐⭐⭐⭐（強烈推薦）

**安裝：**

```bash
npm install recharts
```

**範例：PM2.5 時序圖**

```jsx
import {LineChart,Line,XAxis,YAxis,Tooltip,Legend }from'recharts';

const data = [
  {time:'00:00',pm25:32,pm10:45 },
  {time:'01:00',pm25:35,pm10:48 },
  {time:'02:00',pm25:38,pm10:52 },
];

functionPM25TrendChart() {
return (
<LineChartwidth={800}height={400}data={data}>
<XAxisdataKey="time" />
<YAxis />
<Tooltip />
<Legend />
<Linetype="monotone"dataKey="pm25"stroke="#ff0000"name="PM2.5" />
<Linetype="monotone"dataKey="pm10"stroke="#0000ff"name="PM10" />
</LineChart>
  );
}
```

---

### Apache ECharts ⭐⭐⭐⭐⭐

**安裝：**

```bash
npm install echarts echarts-for-react
```

**範例：雷達圖（多污染物比較）**

```jsx
importReactEChartsfrom'echarts-for-react';

functionPollutionRadarChart() {
const option = {
radar: {
indicator: [
        {name:'PM2.5',max:100 },
        {name:'PM10',max:150 },
        {name:'O3',max:200 },
        {name:'NO2',max:100 },
        {name:'SO2',max:50 },
      ]
    },
series: [{
type:'radar',
data: [
        {value: [35,52,88,45,12],name:'中央大學' },
        {value: [42,65,95,52,18],name:'桃園測站' }
      ]
    }]
  };

return<ReactEChartsoption={option} />;
}
```

---

### Plotly.js ⭐⭐⭐⭐

**安裝：**

```bash
npm install plotly.js react-plotly.js
```

**範例：3D 表面圖（PM2.5 空間分布）**

```jsx
importPlotfrom'react-plotly.js';

functionPM25SurfacePlot() {
const data = [{
type:'surface',
z: [
      [30,32,35,38],
      [32,35,40,42],
      [35,38,42,45],
    ]
  }];

return<Plotdata={data} />;
}
```

---

### D3.js ⭐⭐⭐⭐⭐（進階）

```jsx
import *as d3from'd3';

useEffect(() => {
const svg = d3.select('#network-chart');

const nodes = [
    {id:'工廠A',type:'source' },
    {id:'測站1',type:'station' },
  ];

const links = [
    {source:'工廠A',target:'測站1',value:35 }
  ];

const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links))
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(400,300));

// 繪製...
}, []);
```

---

## 🧩 Dashboard UI（前端）

### Ant Design Charts ⭐⭐⭐⭐

**安裝：**

```bash
npm install @ant-design/charts
```

**範例：**

```jsx
import {Line,Column,Pie }from'@ant-design/charts';

functionDashboard() {
return (
<div>
<Linedata={trendData}xField="time"yField="pm25" />
<Columndata={stationData}xField="station"yField="aqi" />
<Piedata={pollutantData}angleField="value"colorField="type" />
</div>
  );
}
```

---

### React-Grid-Layout ⭐⭐⭐⭐⭐

**安裝：**

```bash
npm install react-grid-layout
```

**範例：可拖拽儀表板**

```jsx
importGridLayoutfrom'react-grid-layout';

const layout = [
  {i:'map',x:0,y:0,w:8,h:4 },
  {i:'chart1',x:8,y:0,w:4,h:2 },
  {i:'chart2',x:8,y:2,w:4,h:2 },
];

functionDashboard() {
return (
<GridLayoutlayout={layout}cols={12}rowHeight={100}>
<divkey="map"><MapComponent /></div>
<divkey="chart1"><TrendChart /></div>
<divkey="chart2"><StationComparison /></div>
</GridLayout>
  );
}
```

---

### Grafana（獨立部署）

**使用方式：**

```bash
docker run -d -p 3000:3000 grafana/grafana
```

**適用場景：**

- 即時監控大屏
- 內部管理介面
- 數據探索分析

---

## 🧰 特殊工具（前端）

### 時間軸播放器（react-player-controls）

```bash
npm install react-player-controls
```

**用途：**

- 播放歷史污染數據變化

---

### 數據表格（React Table ⭐⭐⭐⭐⭐）

```bash
npm install @tanstack/react-table
```

**用途：**

- 測站數據列表
- 可排序、篩選
- 分頁

---

### 顏色映射（Chroma.js）

```bash
npm install chroma-js
```

**用途：**

- 將 PM2.5 數值轉為顏色

```jsx
import chromafrom'chroma-js';

const colorScale = chroma.scale(['green','yellow','orange','red'])
  .domain([0,15,35,54,150]);

const color =colorScale(pm25Value).hex();
```

---

## 📦 建議安裝套件組合（Python）

### 基礎套件

```bash
pip install matplotlib seaborn plotly pandas numpy
pip install folium geopandas contextily
pip install streamlit
```

### 進階套件

```bash
pip install pyvista metpy windrose
pip install shap yellowbrick
pip install dash jupyter
```

---

## 📝 套件安裝清單（一鍵安裝）（前端）

### 基礎依賴

```bash
npm install react react-dom typescript
```

### 地圖相關

```bash
npm install leaflet react-leaflet
npm install leaflet.heat
npm install leaflet-draw
```

### 3D 視覺化

```bash
npm install cesium resium
```

### 圖表

```bash
npm install recharts
npm install echarts echarts-for-react
```

### UI 框架

```bash
npm install antd
npm install react-grid-layout
```

### 工具庫

```bash
npm install axios
npm install dayjs
npm install chroma-js
npm install lodash
```

---

## 🏆 推薦組合方案

### 📦 方案一：基礎版（快速開發）

```
2D 地圖: Leaflet.js + React-Leaflet
圖表: Recharts
UI: Ant Design
部署: 簡單快速
```

**優點：**

- 學習曲線平緩
- 開發快
  **適合：**
- 時間緊迫、團隊新手多

---

### 📦 方案二：專業版（推薦）⭐

```
2D 地圖: Leaflet.js
3D 視覺化: Cesium.js
圖表: ECharts
UI: Ant Design + React-Grid-Layout
```

**優點：**

- 功能完整、視覺效果好
  **適合：**
- 你們的專題（有 3D 需求）

---

### 📦 方案三：高質感版

```
2D/3D 地圖: Mapbox GL JS
3D 場景: Deck.gl
圖表: Plotly + D3.js
UI: 自定義設計
```

**優點：**

- 視覺效果頂級
  **缺點：**
- 開發時間長

---

## 🎨 針對你的專案特殊需求（Python）

### 1️⃣ 垂直剖面資料（LiDAR／無人機）

```python
# 使用 Plotly 3D Surface
import plotly.graph_objectsas go

fig = go.Figure(data=[go.Surface(
    x=time, y=height, z=pm25_concentration,
    colorscale='RdYlGn_r'
)])
fig.update_layout(title='PM2.5垂直剖面圖')
```

---

### 2️⃣ 3km × 3km 網格地圖

```python
# 使用 Folium + HeatMap
import folium
from folium.pluginsimport HeatMap

m = folium.Map(location=[25.0,121.3], zoom_start=11)
HeatMap(grid_data).add_to(m)
```

---

### 3️⃣ AI 預報介面

```python
# 使用 Streamlit
import streamlitas st

st.title("桃園市空品AI預報系統")
forecast_time = st.slider("預報時間 (小時)",1,24)
st.plotly_chart(forecast_map)
```

### 補) 各套件相對應用面

| 層級        | 套件                 | 實作                 |
| ----------- | -------------------- | -------------------- |
| Python 分析 | GeoPandas            | 空間資料整理與前處理 |
| Python Demo | Folium               | 快速產出互動地圖成果 |
| Web 2D 地圖 | Leaflet / OpenLayers | 主要空間分布展示     |
| Web 3D 地圖 | CesiumJS             | 進階立體與高度呈現   |
| 視覺化整合  | ECharts              | 時間序列與比較圖表   |
| Web 架構    | 前後端分離           | 支援互動與擴充       |

### **環境部\_桃園市觀測站座標**

資料來源：https://data.moenv.gov.tw/dataset/detail/AQX_P_07

| 測站英文名稱 | 經度(TWD97)  | 緯度(TWD97) | 測站類型 |
| ------------ | ------------ | ----------- | -------- |
| Zhongli      | 121.221667   | 24.953278   | 交通站   |
| Longtan      | 121.21645772 | 24.86400048 | 一般站   |
| Guanyin      | 121.08283092 | 25.03556747 | 背景站   |
| Dayuan       | 121.20251473 | 25.06100357 | 一般站   |
| Taoyuan      | 121.30500531 | 24.9947107  | 一般站   |
| Pingzhen     | 121.203986   | 24.952786   | 一般站   |
