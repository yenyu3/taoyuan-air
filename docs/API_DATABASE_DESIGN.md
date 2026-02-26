# API 串接建議與資料庫設計

## 📋 目錄

1. [API 架構設計](#api-架構設計)
2. [資料庫設計](#資料庫設計)
3. [API 串接實作](#api-串接實作)
4. [資料處理流程](#資料處理流程)
5. [部署與維護](#部署與維護)

---

## 🏗️ API 架構設計

### 整體架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React Native)                    │
│  Dashboard | Map | Explorer | Events | Alerts                │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API / GraphQL
┌────────────────────────┴────────────────────────────────────┐
│                    後端 API Server (FastAPI)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 即時監測 │  │ 預報服務 │  │ AI 分析  │  │ 資料查詢 │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   資料整合層 (ETL Pipeline)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ EPA API  │  │ CWA API  │  │ IoT API  │  │ 空間處理 │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              資料庫 (PostgreSQL + PostGIS + Redis)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 即時數據 │  │ 歷史數據 │  │ 空間數據 │  │ 快取層   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### API 端點設計

```typescript
// 基礎 URL
const BASE_URL = 'https://api.taoyuan-air.tw/v1';

// API 端點結構
interface APIEndpoints {
  // 即時監測
  realtime: {
    stations: '/realtime/stations',           // 測站即時數據
    grid: '/realtime/grid',                   // 網格即時數據
    sensors: '/realtime/sensors',             // 微型感測器
    weather: '/realtime/weather',             // 氣象數據
  },
  
  // 歷史數據
  historical: {
    stations: '/historical/stations',         // 測站歷史
    grid: '/historical/grid',                 // 網格歷史
    trends: '/historical/trends',             // 趨勢分析
  },
  
  // 預報服務
  forecast: {
    hourly: '/forecast/hourly',               // 逐時預報
    daily: '/forecast/daily',                 // 逐日預報
    vertical: '/forecast/vertical',           // 垂直剖面
  },
  
  // AI 分析
  ai: {
    prediction: '/ai/prediction',             // LSTM 預測
    spatial: '/ai/spatial',                   // RF 空間推估
    diagnosis: '/ai/diagnosis',               // LLM 診斷
    trajectory: '/ai/trajectory',             // HYSPLIT 軌跡
  },
  
  // 事件管理
  events: {
    list: '/events',                          // 事件列表
    detail: '/events/:id',                    // 事件詳情
    create: '/events',                        // 創建事件
  },
  
  // 警報系統
  alerts: {
    list: '/alerts',                          // 警報列表
    rules: '/alerts/rules',                   // 警報規則
    history: '/alerts/history',               // 歷史警報
  },
  
  // 空間數據
  spatial: {
    boundaries: '/spatial/boundaries',        // 行政區界
    industrial: '/spatial/industrial',        // 工業區
    traffic: '/spatial/traffic',              // 交通熱點
    poi: '/spatial/poi',                      // 興趣點
  }
}
```

---

## 🗄️ 資料庫設計

### PostgreSQL + PostGIS 架構

#### 1. 測站基本資料表

```sql
-- 測站資訊表
CREATE TABLE stations (
    station_id VARCHAR(20) PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    station_type VARCHAR(20) NOT NULL,  -- EPA, LOCAL, NCU, IOT
    location GEOMETRY(Point, 4326) NOT NULL,
    district VARCHAR(50),
    address TEXT,
    elevation FLOAT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 空間索引
CREATE INDEX idx_stations_location ON stations USING GIST(location);
CREATE INDEX idx_stations_type ON stations(station_type);
CREATE INDEX idx_stations_district ON stations(district);
```

#### 2. 即時監測數據表

```sql
-- 即時空氣品質數據（分區表 - 按月分區）
CREATE TABLE realtime_air_quality (
    id BIGSERIAL,
    station_id VARCHAR(20) REFERENCES stations(station_id),
    timestamp TIMESTAMP NOT NULL,
    pollutant VARCHAR(20) NOT NULL,  -- PM25, PM10, O3, NO2, SO2, CO
    value FLOAT NOT NULL,
    unit VARCHAR(20),
    aqi INTEGER,
    status VARCHAR(20),  -- good, moderate, unhealthy
    data_source VARCHAR(20),  -- EPA, IOT, NCU
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- 創建月度分區
CREATE TABLE realtime_air_quality_2025_01 
    PARTITION OF realtime_air_quality
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 索引
CREATE INDEX idx_realtime_timestamp ON realtime_air_quality(timestamp DESC);
CREATE INDEX idx_realtime_station ON realtime_air_quality(station_id, timestamp);
CREATE INDEX idx_realtime_pollutant ON realtime_air_quality(pollutant, timestamp);
```

#### 3. 氣象數據表

```sql
-- 氣象觀測數據
CREATE TABLE weather_observations (
    id BIGSERIAL PRIMARY KEY,
    station_id VARCHAR(20) REFERENCES stations(station_id),
    timestamp TIMESTAMP NOT NULL,
    temperature FLOAT,      -- 溫度 (°C)
    humidity FLOAT,         -- 濕度 (%)
    wind_speed FLOAT,       -- 風速 (m/s)
    wind_direction FLOAT,   -- 風向 (度)
    pressure FLOAT,         -- 氣壓 (hPa)
    rainfall FLOAT,         -- 降雨量 (mm)
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_weather_timestamp ON weather_observations(timestamp DESC);
CREATE INDEX idx_weather_station ON weather_observations(station_id, timestamp);
```

#### 4. 網格數據表

```sql
-- 3km x 3km 網格定義
CREATE TABLE grid_cells (
    grid_id VARCHAR(20) PRIMARY KEY,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    center_point GEOMETRY(Point, 4326) NOT NULL,
    district VARCHAR(50),
    area_km2 FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grid_geometry ON grid_cells USING GIST(geometry);
CREATE INDEX idx_grid_center ON grid_cells USING GIST(center_point);

-- 網格即時數據
CREATE TABLE grid_realtime_data (
    id BIGSERIAL,
    grid_id VARCHAR(20) REFERENCES grid_cells(grid_id),
    timestamp TIMESTAMP NOT NULL,
    pollutant VARCHAR(20) NOT NULL,
    value FLOAT NOT NULL,
    height_m INTEGER DEFAULT 0,  -- 高度層 (0, 100, 200, ..., 3000)
    data_type VARCHAR(20),  -- observed, interpolated, predicted
    confidence FLOAT,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE INDEX idx_grid_realtime_grid ON grid_realtime_data(grid_id, timestamp);
CREATE INDEX idx_grid_realtime_height ON grid_realtime_data(height_m, timestamp);
```

#### 5. 垂直剖面數據表

```sql
-- 光達垂直剖面數據
CREATE TABLE vertical_profiles (
    id BIGSERIAL PRIMARY KEY,
    grid_id VARCHAR(20) REFERENCES grid_cells(grid_id),
    timestamp TIMESTAMP NOT NULL,
    height_m INTEGER NOT NULL,
    pm25_value FLOAT,
    backscatter FLOAT,
    extinction FLOAT,
    aod FLOAT,
    data_source VARCHAR(20),  -- LIDAR, WRF, PREDICTED
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vertical_grid ON vertical_profiles(grid_id, timestamp);
CREATE INDEX idx_vertical_height ON vertical_profiles(height_m);
```

#### 6. 預報數據表

```sql
-- LSTM 時序預測結果
CREATE TABLE forecast_timeseries (
    id BIGSERIAL PRIMARY KEY,
    station_id VARCHAR(20) REFERENCES stations(station_id),
    forecast_time TIMESTAMP NOT NULL,  -- 預報發布時間
    target_time TIMESTAMP NOT NULL,    -- 預測目標時間
    pollutant VARCHAR(20) NOT NULL,
    predicted_value FLOAT NOT NULL,
    confidence_interval_lower FLOAT,
    confidence_interval_upper FLOAT,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_forecast_target ON forecast_timeseries(target_time);
CREATE INDEX idx_forecast_station ON forecast_timeseries(station_id, target_time);

-- RF 空間推估結果
CREATE TABLE forecast_spatial (
    id BIGSERIAL PRIMARY KEY,
    grid_id VARCHAR(20) REFERENCES grid_cells(grid_id),
    forecast_time TIMESTAMP NOT NULL,
    target_time TIMESTAMP NOT NULL,
    pollutant VARCHAR(20) NOT NULL,
    height_m INTEGER DEFAULT 0,
    predicted_value FLOAT NOT NULL,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_forecast_spatial_grid ON forecast_spatial(grid_id, target_time);
```

#### 7. 空間特徵表

```sql
-- 靜態空間特徵（用於 RF 模型）
CREATE TABLE spatial_features (
    grid_id VARCHAR(20) PRIMARY KEY REFERENCES grid_cells(grid_id),
    elevation FLOAT,
    
    -- 土地利用（多尺度環域）
    industrial_area_500m FLOAT,
    industrial_area_1000m FLOAT,
    industrial_area_3000m FLOAT,
    residential_area_500m FLOAT,
    residential_area_1000m FLOAT,
    
    -- 路網密度
    road_length_500m FLOAT,
    road_length_1000m FLOAT,
    highway_distance FLOAT,
    
    -- POI 密度
    factory_count_1000m INTEGER,
    factory_count_3000m INTEGER,
    restaurant_count_500m INTEGER,
    
    -- 植生指標
    ndvi_mean_500m FLOAT,
    ndvi_mean_1000m FLOAT,
    ndvi_mean_5000m FLOAT,
    
    -- 距離特徵
    distance_to_industrial FLOAT,
    distance_to_coast FLOAT,
    
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 8. 事件管理表

```sql
-- 污染事件表
CREATE TABLE pollution_events (
    event_id VARCHAR(50) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,  -- industrial, traffic, transboundary
    severity VARCHAR(20) NOT NULL,    -- low, medium, high
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location GEOMETRY(Point, 4326),
    affected_area GEOMETRY(Polygon, 4326),
    affected_grids TEXT[],  -- 影響的網格 ID 陣列
    pollutant VARCHAR(20),
    max_value FLOAT,
    population_exposed INTEGER,
    ai_confidence FLOAT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',  -- active, resolved, archived
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_time ON pollution_events(start_time DESC);
CREATE INDEX idx_events_location ON pollution_events USING GIST(location);
CREATE INDEX idx_events_status ON pollution_events(status);
```

#### 9. 警報系統表

```sql
-- 警報規則表
CREATE TABLE alert_rules (
    rule_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL,  -- health, governance
    pollutant VARCHAR(20) NOT NULL,
    threshold FLOAT NOT NULL,
    location_type VARCHAR(20),  -- station, grid, district
    location_id VARCHAR(50),
    notification_methods TEXT[],  -- push, email, sms
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 警報歷史表
CREATE TABLE alert_history (
    alert_id BIGSERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES alert_rules(rule_id),
    triggered_at TIMESTAMP NOT NULL,
    pollutant VARCHAR(20),
    measured_value FLOAT,
    threshold_value FLOAT,
    location VARCHAR(100),
    message TEXT,
    severity VARCHAR(20),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP
);

CREATE INDEX idx_alert_history_time ON alert_history(triggered_at DESC);
CREATE INDEX idx_alert_history_rule ON alert_history(rule_id);
```

#### 10. WRF 氣象預報表

```sql
-- WRF 預報數據
CREATE TABLE wrf_forecast (
    id BIGSERIAL PRIMARY KEY,
    grid_id VARCHAR(20) REFERENCES grid_cells(grid_id),
    forecast_time TIMESTAMP NOT NULL,
    target_time TIMESTAMP NOT NULL,
    height_m INTEGER NOT NULL,
    
    -- 風場
    u_wind FLOAT,  -- 東西向風速
    v_wind FLOAT,  -- 南北向風速
    w_wind FLOAT,  -- 垂直風速
    
    -- 溫濕度
    temperature FLOAT,
    relative_humidity FLOAT,
    
    -- 大氣參數
    pressure FLOAT,
    pblh FLOAT,  -- 混合層高度
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wrf_grid ON wrf_forecast(grid_id, target_time);
CREATE INDEX idx_wrf_height ON wrf_forecast(height_m, target_time);
```

---

## 🔌 API 串接實作

### 1. 環境部空氣品質 API

```typescript
// src/services/epa.service.ts
import axios from 'axios';

interface EPAStation {
  sitename: string;
  county: string;
  aqi: string;
  pollutant: string;
  status: string;
  pm25: string;
  pm10: string;
  o3: string;
  no2: string;
  so2: string;
  co: string;
  publishtime: string;
  latitude: string;
  longitude: string;
}

export class EPAService {
  private readonly baseUrl = 'https://data.moenv.gov.tw/api/v2';
  private readonly apiKey = process.env.EPA_API_KEY;

  async fetchRealtimeData(): Promise<EPAStation[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/aqx_p_432`, {
        params: {
          api_key: this.apiKey,
          limit: 1000,
          format: 'json',
          filters: 'County,EQ,桃園市'
        }
      });

      return response.data.records;
    } catch (error) {
      console.error('EPA API Error:', error);
      throw error;
    }
  }

  async fetchHistoricalData(startDate: string, endDate: string) {
    const response = await axios.get(`${this.baseUrl}/aqx_p_488`, {
      params: {
        api_key: this.apiKey,
        filters: `County,EQ,桃園市;MonitorDate,GTE,${startDate};MonitorDate,LTE,${endDate}`
      }
    });

    return response.data.records;
  }

  async fetchStationInfo() {
    const response = await axios.get(`${this.baseUrl}/gisepa_p_03`, {
      params: {
        api_key: this.apiKey,
        filters: 'County,EQ,桃園市'
      }
    });

    return response.data.records;
  }
}
```

### 2. 中央氣象署 API

```typescript
// src/services/cwa.service.ts
export class CWAService {
  private readonly baseUrl = 'https://opendata.cwa.gov.tw/api';
  private readonly apiKey = process.env.CWA_API_KEY;

  async fetchObservationData(stationId?: string) {
    const response = await axios.get(
      `${this.baseUrl}/v1/rest/datastore/O-A0001-001`,
      {
        params: {
          Authorization: this.apiKey,
          StationId: stationId,
          format: 'JSON'
        }
      }
    );

    return response.data.records.location;
  }

  async fetchForecast() {
    const response = await axios.get(
      `${this.baseUrl}/v1/rest/datastore/F-C0032-001`,
      {
        params: {
          Authorization: this.apiKey,
          locationName: '桃園市'
        }
      }
    );

    return response.data.records.location[0];
  }

  async fetchRadarData() {
    const response = await axios.get(
      `${this.baseUrl}/v1/rest/datastore/O-A0058-003`,
      {
        params: {
          Authorization: this.apiKey
        }
      }
    );

    return response.data;
  }
}
```

### 3. 空氣網微型感測器 API

```typescript
// src/services/iot.service.ts
export class IoTService {
  private readonly baseUrl = 'https://pm25.lass-net.org/API-1.0.0';

  async fetchTaoyuanSensors() {
    const response = await axios.get(`${this.baseUrl}/project/taoyuan/`);
    return response.data.feeds;
  }

  async fetchDeviceData(deviceId: string) {
    const response = await axios.get(`${this.baseUrl}/device/${deviceId}/`);
    return response.data;
  }

  async fetchLatestData() {
    const response = await axios.get(`${this.baseUrl}/device/latest/`);
    
    // 篩選桃園區域
    return response.data.feeds.filter((feed: any) => {
      const lat = parseFloat(feed.gps_lat);
      const lon = parseFloat(feed.gps_lon);
      return lat >= 24.8 && lat <= 25.2 && lon >= 121.0 && lon <= 121.5;
    });
  }
}
```

### 4. 資料整合服務

```typescript
// src/services/integration.service.ts
export class DataIntegrationService {
  private epaService: EPAService;
  private cwaService: CWAService;
  private iotService: IoTService;
  private db: Database;

  async syncRealtimeData() {
    try {
      // 1. 獲取所有資料源
      const [epaData, weatherData, iotData] = await Promise.all([
        this.epaService.fetchRealtimeData(),
        this.cwaService.fetchObservationData(),
        this.iotService.fetchLatestData()
      ]);

      // 2. 標準化數據格式
      const standardizedData = this.standardizeData(epaData, weatherData, iotData);

      // 3. 空間內插到網格
      const gridData = await this.interpolateToGrid(standardizedData);

      // 4. 存入資料庫
      await this.saveToDatabase(gridData);

      // 5. 觸發預報模型
      await this.triggerForecast();

      return { success: true, timestamp: new Date() };
    } catch (error) {
      console.error('Data sync error:', error);
      throw error;
    }
  }

  private standardizeData(epaData: any[], weatherData: any[], iotData: any[]) {
    // 統一數據格式
    return {
      stations: this.processStationData(epaData),
      weather: this.processWeatherData(weatherData),
      sensors: this.processSensorData(iotData)
    };
  }

  private async interpolateToGrid(data: any) {
    // 使用 Kriging 或 IDW 進行空間內插
    const grids = await this.db.query('SELECT grid_id, center_point FROM grid_cells');
    
    const interpolatedData = grids.map(grid => {
      const pm25 = this.krigingInterpolation(
        data.stations,
        grid.center_point,
        'pm25'
      );
      
      return {
        grid_id: grid.grid_id,
        pm25,
        timestamp: new Date()
      };
    });

    return interpolatedData;
  }
}
```

---

## 🔄 資料處理流程

### ETL Pipeline 架構

```typescript
// src/pipelines/etl.pipeline.ts
export class ETLPipeline {
  // 1. Extract - 資料擷取
  async extract() {
    const sources = {
      epa: await this.epaService.fetchRealtimeData(),
      cwa: await this.cwaService.fetchObservationData(),
      iot: await this.iotService.fetchLatestData(),
    };
    
    return sources;
  }

  // 2. Transform - 資料轉換
  async transform(rawData: any) {
    // 數據清洗
    const cleaned = this.cleanData(rawData);
    
    // 數據驗證
    const validated = this.validateData(cleaned);
    
    // 空間內插
    const interpolated = await this.spatialInterpolation(validated);
    
    // 特徵工程
    const features = await this.featureEngineering(interpolated);
    
    return features;
  }

  // 3. Load - 資料載入
  async load(processedData: any) {
    await this.db.transaction(async (trx) => {
      // 批次插入即時數據
      await trx('realtime_air_quality').insert(processedData.airQuality);
      
      // 更新網格數據
      await trx('grid_realtime_data').insert(processedData.gridData);
      
      // 更新氣象數據
      await trx('weather_observations').insert(processedData.weather);
    });
  }

  // 完整 ETL 流程
  async run() {
    console.log('[ETL] Starting pipeline...');
    
    const rawData = await this.extract();
    console.log('[ETL] Data extracted');
    
    const processedData = await this.transform(rawData);
    console.log('[ETL] Data transformed');
    
    await this.load(processedData);
    console.log('[ETL] Data loaded');
    
    return { success: true, recordsProcessed: processedData.length };
  }
}
```

### 定時任務設定

```typescript
// src/jobs/scheduler.ts
import cron from 'node-cron';

export class JobScheduler {
  private etlPipeline: ETLPipeline;
  private forecastService: ForecastService;

  start() {
    // 每小時執行 ETL
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly ETL...');
      await this.etlPipeline.run();
    });

    // 每 6 小時執行預報
    cron.schedule('0 */6 * * *', async () => {
      console.log('Running forecast models...');
      await this.forecastService.runLSTM();
      await this.forecastService.runRF();
    });

    // 每 5 分鐘更新 IoT 數據
    cron.schedule('*/5 * * * *', async () => {
      console.log('Updating IoT sensors...');
      await this.iotService.syncData();
    });

    // 每天凌晨 2 點清理舊數據
    cron.schedule('0 2 * * *', async () => {
      console.log('Cleaning old data...');
      await this.cleanupService.removeOldData(30); // 保留 30 天
    });
  }
}
```

---

## 🚀 部署與維護

### Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL + PostGIS
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: taoyuan_air
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  # Redis 快取
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # FastAPI 後端
  api:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/taoyuan_air
      REDIS_URL: redis://redis:6379
      EPA_API_KEY: ${EPA_API_KEY}
      CWA_API_KEY: ${CWA_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis

  # ETL Worker
  etl_worker:
    build: ./etl
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/taoyuan_air
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

### 環境變數設定

```bash
# .env
DATABASE_URL=postgresql://admin:password@localhost:5432/taoyuan_air
REDIS_URL=redis://localhost:6379

# API Keys
EPA_API_KEY=your_epa_api_key
CWA_API_KEY=your_cwa_api_key

# Azure
AZURE_STORAGE_CONNECTION_STRING=your_connection_string

# Model Paths
LSTM_MODEL_PATH=/models/lstm_model.h5
RF_MODEL_PATH=/models/rf_model.pkl
```

---

## 📊 效能優化建議

### 1. 資料庫索引優化

```sql
-- 複合索引
CREATE INDEX idx_realtime_station_time_pollutant 
ON realtime_air_quality(station_id, timestamp DESC, pollutant);

-- 部分索引（只索引最近數據）
CREATE INDEX idx_realtime_recent 
ON realtime_air_quality(timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '7 days';
```

### 2. Redis 快取策略

```typescript
// src/cache/redis.cache.ts
export class CacheService {
  private redis: Redis;

  async getRealtimeData(key: string) {
    // 先查快取
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    // 查資料庫
    const data = await this.db.query('...');
    
    // 存入快取（5 分鐘過期）
    await this.redis.setex(key, 300, JSON.stringify(data));
    
    return data;
  }
}
```

### 3. 分頁查詢

```typescript
// src/api/controllers/data.controller.ts
async getHistoricalData(req, res) {
  const { page = 1, limit = 100, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;

  const data = await this.db.query(`
    SELECT * FROM realtime_air_quality
    WHERE timestamp BETWEEN $1 AND $2
    ORDER BY timestamp DESC
    LIMIT $3 OFFSET $4
  `, [startDate, endDate, limit, offset]);

  const total = await this.db.query(`
    SELECT COUNT(*) FROM realtime_air_quality
    WHERE timestamp BETWEEN $1 AND $2
  `, [startDate, endDate]);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total: total.rows[0].count,
      pages: Math.ceil(total.rows[0].count / limit)
    }
  });
}
```

---

**最後更新**：2025-01-15  
**版本**：v1.0
