-- 桃園市空氣污染監測系統 - 資料庫初始化腳本
-- 建立日期: 2024
-- PostgreSQL 15 + PostGIS 3.3

-- 啟用 PostGIS 擴充功能
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 建立測站資料表
CREATE TABLE IF NOT EXISTS stations (
    station_id VARCHAR(20) PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    station_type VARCHAR(20) NOT NULL CHECK (station_type IN ('EPA', 'IoT', 'Lidar')),
    location GEOMETRY(Point, 4326) NOT NULL,
    district VARCHAR(50),
    address TEXT,
    elevation FLOAT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 建立即時空品資料表（分區表）
CREATE TABLE IF NOT EXISTS realtime_air_quality (
    id SERIAL,
    station_id VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    aqi INTEGER,
    pm25 FLOAT,
    pm10 FLOAT,
    o3 FLOAT,
    co FLOAT,
    so2 FLOAT,
    no2 FLOAT,
    nox FLOAT,
    PRIMARY KEY (id, timestamp),
    FOREIGN KEY (station_id) REFERENCES stations(station_id)
) PARTITION BY RANGE (timestamp);

-- 建立氣象觀測資料表
CREATE TABLE IF NOT EXISTS weather_observations (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(20),
    timestamp TIMESTAMP NOT NULL,
    temperature FLOAT,
    humidity FLOAT,
    pressure FLOAT,
    wind_speed FLOAT,
    wind_direction FLOAT,
    rainfall FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 建立網格資料表
CREATE TABLE IF NOT EXISTS grid_cells (
    grid_id VARCHAR(10) PRIMARY KEY,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    center_point GEOMETRY(Point, 4326) NOT NULL,
    district VARCHAR(50),
    area_km2 FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 建立網格即時資料表
CREATE TABLE IF NOT EXISTS grid_realtime_data (
    id SERIAL PRIMARY KEY,
    grid_id VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    pollutant VARCHAR(20) NOT NULL,
    value FLOAT NOT NULL,
    interpolation_method VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (grid_id) REFERENCES grid_cells(grid_id)
);

-- 建立空間特徵資料表
CREATE TABLE IF NOT EXISTS spatial_features (
    id SERIAL PRIMARY KEY,
    feature_type VARCHAR(50) NOT NULL,
    name VARCHAR(200),
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 建立垂直剖面資料表
CREATE TABLE IF NOT EXISTS vertical_profiles (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(20),
    timestamp TIMESTAMP NOT NULL,
    height_m INTEGER NOT NULL,
    backscatter FLOAT,
    extinction FLOAT,
    pm25_estimate FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_stations_location ON stations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_stations_type ON stations(station_type);
CREATE INDEX IF NOT EXISTS idx_realtime_timestamp ON realtime_air_quality(timestamp);
CREATE INDEX IF NOT EXISTS idx_realtime_station ON realtime_air_quality(station_id);
CREATE INDEX IF NOT EXISTS idx_weather_timestamp ON weather_observations(timestamp);
CREATE INDEX IF NOT EXISTS idx_grid_geometry ON grid_cells USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_grid_center ON grid_cells USING GIST(center_point);
CREATE INDEX IF NOT EXISTS idx_grid_data_timestamp ON grid_realtime_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_spatial_geometry ON spatial_features USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_vertical_timestamp ON vertical_profiles(timestamp);

-- 建立分區表（最近3個月）
CREATE TABLE IF NOT EXISTS realtime_air_quality_current PARTITION OF realtime_air_quality
    FOR VALUES FROM (CURRENT_DATE - INTERVAL '3 months') TO (MAXVALUE);

COMMENT ON TABLE stations IS '監測站點資料表';
COMMENT ON TABLE realtime_air_quality IS '即時空氣品質資料表';
COMMENT ON TABLE weather_observations IS '氣象觀測資料表';
COMMENT ON TABLE grid_cells IS '3km網格資料表';
COMMENT ON TABLE grid_realtime_data IS '網格即時數據表';
COMMENT ON TABLE spatial_features IS '空間特徵資料表（工業區、POI等）';
COMMENT ON TABLE vertical_profiles IS '垂直剖面資料表（光達數據）';
