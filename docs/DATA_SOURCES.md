# 資料來源與 API 文檔 (Data Sources & APIs)

本文檔整理桃園市空氣污染物監測與 AI 預報系統所使用的所有公開資料來源、API 端點、資料格式與使用方式。

---

## 1. 空氣品質資料

### 環境部空氣品質監測網 ⭐

```python
# API URL
base_url ="https://data.moenv.gov.tw/api/v2/"

# 主要資料集
datasets = {
"即時空品":"aqx_p_432",# 測站即時污染指標
"PM2.5":"",# 細懸浮微粒
"臭氧":",# O3濃度
"VOCs":"ems_p_08",# 揮發性有機物
"大氣有毒物質":"", # 還沒找到
"測站資訊":"gisepa_p_03"# 測站座標
}
```

**用途：**

- 即時污染指標（每小時更新）
- 歷史資料下載（每小時/每日）
- 測站基本資訊（座標、站點屬性）

**桃園相關測站代碼：**

- 桃園站: `Taoyuan`
- 觀音站: `Guanyin`
- 大園站: `Dayuan`
- 平鎮站: `Pingzhen`
- 龍潭站: `Longtan`
- 中壢站

**使用範例：**

```python
import requests

api_key ="YOUR_API_KEY" # 至 https://data.moenv.gov.tw/ 申請
url =f"{base_url}aqx_p_432?api_key={api_key}&limit=1000&format=json"

response = requests.get(url)
data = response.json()
```

**資料頻率：** 每小時更新

**API 文件：** https://data.moenv.gov.tw/api-term

**參數寫法說明文件：**https://drive.google.com/file/d/13kPG4SJ_4IQI2mVBK_-i422U41BUb-d5/view

---

### 空氣品質監測網 Open Data（歷史資料）

```python
# 歷史資料下載
historical_data = {
"每小時":"https://data.moenv.gov.tw/api/v2/aqx_p_488",
"每日":"https://data.moenv.gov.tw/api/v2/aqx_p_488",
"測站基本資料":"https://data.moenv.gov.tw/api/v2/gisepa_p_03"
}
```

---

### 空氣網（IoT 微型感測器）⭐

```python
# 民生公共物聯網 - 空氣品質感測器
civil_iot_url ="https://ci.taiwan.gov.tw/dsp/dataset/iot"

# 感測器即時資料
sensor_api ="https://pm25.lass-net.org/API-1.0.0/device/"
```

**優勢：**

- 高密度分布
- 5 分鐘更新頻率

**桃園區域感測器查詢：**

```python
import requests

defget_taoyuan_sensors():
    url ="https://pm25.lass-net.org/API-1.0.0/project/taoyuan/"
    response = requests.get(url)
return response.json()
```

---

## 2️⃣ 氣象資料

### 中央氣象署開放資料平臺 ⭐

```python
# API基礎設定
cwa_base ="https://opendata.cwa.gov.tw/api/"

# 主要資料集
weather_apis = {
"觀測資料": {
"url":f"{cwa_base}v1/rest/datastore/O-A0001-001",
"參數": ["TEMP","HUMD","WDSD","WDIR","PRES"],
"頻率":"每10分鐘"
    },
"天氣預報": {
"url":f"{cwa_base}v1/rest/datastore/F-C0032-001",
"區域":"桃園市",
"頻率":"每3小時"
    },
"雷達資料": {
"url":f"{cwa_base}v1/rest/datastore/O-A0058-003",
"用途":"降雨、大氣條件"
    }
}
```

觀測資料：https://opendata.cwa.gov.tw/dataset/climate/O-A0001-001

天氣預報：https://opendata.cwa.gov.tw/dataset/climate/F-C0032-001

雷達資料：https://opendata.cwa.gov.tw/dataset/climate/O-A0058-003

**桃園相關測站：**

- `466900`（桃園）
- `C0C480`（觀音）

**使用範例：**

```python
import requests

defget_weather_data(station="466900"):# 桃園站代碼
    api_key ="YOUR_CWA_API_KEY"
    url =f"{cwa_base}v1/rest/datastore/O-A0001-001"
    params = {
"Authorization": api_key,
"StationId": station,
"format":"JSON"
    }
    response = requests.get(url, params=params)
return response.json()
```

**申請：** https://opendata.cwa.gov.tw/

使用說明：https://opendata.cwa.gov.tw/devManual/instruction

---

### 風場資料（Windy API，參考 要錢 這是免費版）

```python
# Windy Point Forecast API
windy_api ="https://api.windy.com/api/point-forecast/v2"

payload = {
"lat":25.0,
"lon":121.3,
"model":"gfs",
"parameters": ["wind","temp","pressure"],
"levels": ["surface","950h","900h","850h"],
"key":"YOUR_WINDY_API_KEY"
}
```

---

## 3️⃣ 垂直觀測資料

### Taiwan MPL Network（中央大學光達）⭐

```python
# 網站: https://lidar.atm.ncu.edu.tw/

lidar_data_structure = {
"MiniMPL": {
"檔案格式":"NetCDF",
"變數": ["backscatter","extinction","AOD"],
"高度範圍":"0-15 km",
"時間解析度":"30秒"
    },
"Wind LiDAR": {
"檔案格式":"NetCDF",
"變數": ["wind_speed","wind_direction"],
"高度範圍":"40m - 3km",
"時間解析度":"1秒"
    }
}
```

**用途：**

- 垂直剖面結構（高度向）
- 邊界層/氣膠變化
- 風場垂直分層

**Python 讀取範例：**

```python
import netCDF4as nc

defread_lidar_data(file_path):
    dataset = nc.Dataset(file_path)
    backscatter = dataset.variables['backscatter'][:]
    height = dataset.variables['height'][:]
    time = dataset.variables['time'][:]
return backscatter, height, time
```

**申請方式：** 聯繫大氣系王老師

---

### NOAA HYSPLIT（後推軌跡模型 用來計算**大氣污染物傳輸與擴散**的模型）

```python
# HYSPLIT Trajectory Model API
hysplit_url ="https://www.ready.noaa.gov/hypub-bin/trajresults.pl"

from pysplitimport Trajectory

traj = Trajectory.generate(
    latitude=25.0,
    longitude=121.3,
    altitude=500,
    duration=-72,# 往回推72小時
    model="gdas1"
)
```

**安裝：**

```bash
pip install pysplit
```

**文件：** https://github.com/mscross/pysplit

---

## 4️⃣ 地理與人口資料

### 內政部國土測繪中心（NLSC）

```python
# 國土測繪圖資服務雲
nlsc_apis = {
"電子地圖": {
"WMTS":"https://wmts.nlsc.gov.tw/wmts",
"圖層":"EMAP",
"用途":"底圖"
    },
"航照影像": {
"WMTS":"https://wmts.nlsc.gov.tw/wmts",
"圖層":"PHOTO2",
"解析度":"25cm"
    }
}
```

**使用範例（Folium）：**

```python
import folium

m = folium.Map(location=[25.0,121.3])
folium.TileLayer(
    tiles='https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
    attr='NLSC',
    name='國土測繪中心電子地圖'
).add_to(m)
```

相關教學和其他相關可以用的：https://maps.nlsc.gov.tw/S09SOA/

---

### 政府資料開放平臺－人口資料 ⭐

桃園人口總數：https://data.gov.tw/dataset/168384

```python
# 桃園市人口統計
population_api ="https://data.gov.tw/api/v1/"

datasets = {
"村里人口": {
"id":"8410",
"url":"https://data.gov.tw/dataset/8410",
"格式":"CSV/JSON"
    },
"人口密度": {
"id":"102288",
"url":"https://data.gov.tw/dataset/102288"
    }
}
```

**下載範例：**

```python
import pandasas pd

url ="https://quality.data.gov.tw/dq_download_csv.php?nid=8410&md5_url=..."
population_df = pd.read_csv(url, encoding='utf-8')
```

---

### OpenStreetMap（街道資訊）⭐

```python
import osmnxas ox

place_name ="Taoyuan City, Taiwan"
G = ox.graph_from_place(place_name, network_type='drive')

buildings = ox.features_from_place(
    place_name,
    tags={'building':True}
)

industrial = ox.features_from_place(
"Guanyin Industrial Park, Taoyuan, Taiwan",
    tags={'landuse':'industrial'}
)
```

**安裝：**

```bash
pip install osmnx
```

---

### 桃園市政府資料開放

```python
taoyuan_data = {
"工業區資訊": {
"url":"https://data.tycg.gov.tw/api/v1/rest/datastore/...",
"內容":"工業區邊界、廠商資訊"
    },
"交通流量": {
"url":"https://data.tycg.gov.tw/opendata/datalist/datasetMeta/download?id=...",
"內容":"主要道路車流統計"
    }
}
```

**平台：** https://data.tycg.gov.tw/

API格式說明：https://opendata.tycg.gov.tw/api-docs

都市計畫(含工業區)面積但沒有邊界座標：https://opendata.tycg.gov.tw/datalist/68a7798a-3363-4412-9162-a9d37d3bc4ee
廠商資訊：https://opendata.tycg.gov.tw/datalist/fa368513-9d4a-43a9-8f0a-f9cfc269ff71

桃園市路段即時資料服務：https://opendata.tycg.gov.tw/datalist/7b879012-ec7f-4ea6-8af4-9e5ea1bcb39c
桃園市路況壅塞水準定義資料服務：https://opendata.tycg.gov.tw/datalist/750b8adf-d689-4903-adfb-a38be421f7a3

---

## 5️⃣ 衛星遙測資料

### NASA MODIS AOD

```python
from nasa_earthdataimport Earthdata

earthdata = Earthdata(username="YOUR_USERNAME", password="YOUR_PASSWORD")

modis_aod = earthdata.download(
    product="MOD04_L2",
    bbox=(120.8,24.8,121.5,25.3),
    start_date="2026-01-01",
    end_date="2026-01-31"
)
```

**申請帳號：** https://urs.earthdata.nasa.gov/

---

### Sentinel-5P（Google Earth Engine）

```python
import ee

ee.Initialize()

s5p = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_NO2')

taoyuan_roi = ee.Geometry.Rectangle([120.8,24.8,121.5,25.3])

no2_data = s5p.filterDate('2026-01-01','2026-01-31') \
               .filterBounds(taoyuan_roi) \
               .select('NO2_column_number_density')

mean_no2 = no2_data.mean()
```

**申請：** https://earthengine.google.com/
