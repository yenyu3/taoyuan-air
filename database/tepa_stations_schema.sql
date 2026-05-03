-- TEPA（桃園市環保局）測站資料庫架構
-- 分支: feat/database-tepa-stations
-- 建立日期: 2026-05-03
-- 資料範圍: 2019-03 至 2026-03，4 個測站
-- 設計對齊 moe_stations_schema.sql

-- 0. 啟用必要擴充功能
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. 測站基本資料表
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tepa_stations (
    station_id   VARCHAR(20)      PRIMARY KEY,
    station_name VARCHAR(100)     NOT NULL,
    county       VARCHAR(50)      NOT NULL DEFAULT '桃園市',
    location     GEOMETRY(Point, 4326),
    latitude     DECIMAL(10, 8),
    longitude    DECIMAL(11, 8),
    address      TEXT,
    is_active    BOOLEAN          DEFAULT true,
    created_at   TIMESTAMP        DEFAULT NOW(),
    updated_at   TIMESTAMP        DEFAULT NOW()
);

-- 插入 4 個 TEPA 測站（座標來源：環保局測站編號對照表）
INSERT INTO tepa_stations
    (station_id, station_name, county, latitude, longitude, address)
VALUES
    ('0604616A0002', '新興國小', '桃園市', 25.0083, 121.2650, '蘆竹區'),
    ('0604316A0003', '內壢',     '桃園市', 24.9677, 121.2590, '中壢區'),
    ('0604816I0005', '華亞',     '桃園市', 25.0505, 121.3713, '龜山區'),
    ('0605316I0004', '觀音_S',   '桃園市', 25.0525, 121.1181, '觀音區')
ON CONFLICT (station_id) DO UPDATE SET
    station_name = EXCLUDED.station_name,
    latitude     = EXCLUDED.latitude,
    longitude    = EXCLUDED.longitude,
    updated_at   = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. 污染物種類表（對齊 moe_pollutants）
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tepa_pollutants (
    pollutant_id       VARCHAR(10)  PRIMARY KEY,
    pollutant_name     VARCHAR(50)  NOT NULL,
    pollutant_eng_name VARCHAR(50)  NOT NULL,
    unit               VARCHAR(20)  NOT NULL,
    aggregation_type   VARCHAR(20)  NOT NULL DEFAULT '1hr_mean',
    description        TEXT,
    created_at         TIMESTAMP    DEFAULT NOW()
);

INSERT INTO tepa_pollutants
    (pollutant_id, pollutant_name, pollutant_eng_name, unit, aggregation_type, description)
VALUES
    ('1',  '二氧化硫',   'SO2',   'ppb',   '1hr_mean', NULL),
    ('2',  '一氧化碳',   'CO',    'ppm',   '1hr_mean', NULL),
    ('3',  '臭氧',       'O3',    'ppb',   '1hr_mean', NULL),
    ('7',  '二氧化氮',   'NO2',   'ppb',   '1hr_mean', NULL),
    ('4',  '懸浮微粒',   'PM10',  'ug/m3', '1hr_mean', NULL),
    ('33', '細懸浮微粒', 'PM2.5', 'ug/m3', '1hr_mean', NULL)
ON CONFLICT (pollutant_id) DO UPDATE SET
    pollutant_name     = EXCLUDED.pollutant_name,
    pollutant_eng_name = EXCLUDED.pollutant_eng_name,
    unit               = EXCLUDED.unit;
    aggregation_type   = EXCLUDED.aggregation_type,
    description        = EXCLUDED.description;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. 空氣品質小時值資料表（分區表，對齊 moe_hourly_data）
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tepa_hourly_data (
    id                   BIGSERIAL,
    station_id           VARCHAR(20)    NOT NULL,
    monitor_date         TIMESTAMP      NOT NULL,
    pollutant_id         VARCHAR(10)    NOT NULL,
    pollutant_name       VARCHAR(50)    NOT NULL,
    pollutant_eng_name   VARCHAR(50)    NOT NULL,
    unit                 VARCHAR(20)    NOT NULL,
    concentration        VARCHAR(20),
    concentration_numeric DECIMAL(10, 4),
    data_quality         VARCHAR(10)    DEFAULT 'good',
    period_start           TIMESTAMP,
    period_end             TIMESTAMP,
    source               VARCHAR(20)    DEFAULT 'history',
    created_at           TIMESTAMP      DEFAULT NOW(),
    PRIMARY KEY (id, monitor_date),
    FOREIGN KEY (station_id)   REFERENCES tepa_stations(station_id),
    FOREIGN KEY (pollutant_id) REFERENCES tepa_pollutants(pollutant_id),
    UNIQUE (station_id, monitor_date, pollutant_id)
) PARTITION BY RANGE (monitor_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. 分區表（2019-03 起，對應資料實際範圍）
-- ─────────────────────────────────────────────────────────────────────────────

-- 2019年（從 03 月開始）
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_03 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-03-01') TO ('2019-04-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_04 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-04-01') TO ('2019-05-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_05 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-05-01') TO ('2019-06-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_06 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-06-01') TO ('2019-07-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_07 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-07-01') TO ('2019-08-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_08 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-08-01') TO ('2019-09-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_09 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-09-01') TO ('2019-10-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_10 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-10-01') TO ('2019-11-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_11 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-11-01') TO ('2019-12-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2019_12 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2019-12-01') TO ('2020-01-01');

-- 2020年
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_01 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-01-01') TO ('2020-02-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_02 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-02-01') TO ('2020-03-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_03 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-03-01') TO ('2020-04-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_04 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-04-01') TO ('2020-05-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_05 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-05-01') TO ('2020-06-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_06 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-06-01') TO ('2020-07-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_07 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-07-01') TO ('2020-08-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_08 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-08-01') TO ('2020-09-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_09 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-09-01') TO ('2020-10-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_10 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-10-01') TO ('2020-11-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_11 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-11-01') TO ('2020-12-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2020_12 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2020-12-01') TO ('2021-01-01');

-- 2021年
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_01 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-01-01') TO ('2021-02-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_02 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-02-01') TO ('2021-03-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_03 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-03-01') TO ('2021-04-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_04 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-04-01') TO ('2021-05-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_05 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-05-01') TO ('2021-06-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_06 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-06-01') TO ('2021-07-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_07 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-07-01') TO ('2021-08-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_08 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-08-01') TO ('2021-09-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_09 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-09-01') TO ('2021-10-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_10 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-10-01') TO ('2021-11-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_11 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-11-01') TO ('2021-12-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2021_12 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2021-12-01') TO ('2022-01-01');

-- 2022年
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_01 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-01-01') TO ('2022-02-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_02 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-02-01') TO ('2022-03-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_03 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-03-01') TO ('2022-04-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_04 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-04-01') TO ('2022-05-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_05 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-05-01') TO ('2022-06-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_06 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-06-01') TO ('2022-07-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_07 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-07-01') TO ('2022-08-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_08 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-08-01') TO ('2022-09-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_09 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-09-01') TO ('2022-10-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_10 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-10-01') TO ('2022-11-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_11 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-11-01') TO ('2022-12-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2022_12 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2022-12-01') TO ('2023-01-01');

-- 2023年
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_01 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_02 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-02-01') TO ('2023-03-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_03 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-03-01') TO ('2023-04-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_04 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-04-01') TO ('2023-05-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_05 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-05-01') TO ('2023-06-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_06 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-06-01') TO ('2023-07-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_07 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-07-01') TO ('2023-08-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_08 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-08-01') TO ('2023-09-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_09 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-09-01') TO ('2023-10-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_10 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-10-01') TO ('2023-11-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_11 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-11-01') TO ('2023-12-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2023_12 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');

-- 2024年
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_01 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_02 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_03 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_04 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_05 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_06 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_07 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_08 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_09 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_10 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_11 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2024_12 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 2025年
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_01 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_02 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_03 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_04 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_05 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_06 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_07 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_08 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_09 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_10 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_11 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2025_12 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- 2026年（至 03 月）
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2026_01 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2026_02 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS tepa_hourly_data_2026_03 PARTITION OF tepa_hourly_data FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. 索引
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tepa_hourly_station      ON tepa_hourly_data(station_id);
CREATE INDEX IF NOT EXISTS idx_tepa_hourly_date         ON tepa_hourly_data(monitor_date);
CREATE INDEX IF NOT EXISTS idx_tepa_hourly_pollutant    ON tepa_hourly_data(pollutant_eng_name);
CREATE INDEX IF NOT EXISTS idx_tepa_hourly_station_date ON tepa_hourly_data(station_id, monitor_date);
CREATE INDEX IF NOT EXISTS idx_tepa_hourly_quality      ON tepa_hourly_data(data_quality);
-- 空間索引（支援 ST_DWithin、ST_Distance 等空間查詢）
CREATE INDEX IF NOT EXISTS idx_tepa_stations_location   ON tepa_stations USING GIST(location);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. 更新 PostGIS location 欄位
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE tepa_stations
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. 彙總視圖（對齊 moe_latest_data）
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW tepa_latest_data AS
SELECT
    s.station_id,
    s.station_name,
    s.county,
    h.monitor_date,
    MAX(CASE WHEN h.pollutant_eng_name = 'PM2.5' THEN h.concentration_numeric END) AS pm25,
    MAX(CASE WHEN h.pollutant_eng_name = 'PM10'  THEN h.concentration_numeric END) AS pm10,
    MAX(CASE WHEN h.pollutant_eng_name = 'O3'    THEN h.concentration_numeric END) AS o3,
    MAX(CASE WHEN h.pollutant_eng_name = 'CO'    THEN h.concentration_numeric END) AS co,
    MAX(CASE WHEN h.pollutant_eng_name = 'SO2'   THEN h.concentration_numeric END) AS so2,
    MAX(CASE WHEN h.pollutant_eng_name = 'NO2'   THEN h.concentration_numeric END) AS no2
FROM tepa_stations s
JOIN tepa_hourly_data h ON s.station_id = h.station_id
WHERE h.monitor_date >= NOW() - INTERVAL '24 hours'
GROUP BY s.station_id, s.station_name, s.county, s.district, h.monitor_date
ORDER BY h.monitor_date DESC;

-- 月度統計視圖（對齊 moe_monthly_stats）
CREATE OR REPLACE VIEW tepa_monthly_stats AS
SELECT
    s.station_id,
    s.station_name,
    DATE_TRUNC('month', h.monitor_date)  AS month,
    h.pollutant_eng_name,
    COUNT(*)                             AS record_count,
    AVG(h.concentration_numeric)         AS avg_concentration,
    MIN(h.concentration_numeric)         AS min_concentration,
    MAX(h.concentration_numeric)         AS max_concentration,
    STDDEV(h.concentration_numeric)      AS std_concentration
FROM tepa_stations s
JOIN tepa_hourly_data h ON s.station_id = h.station_id
WHERE h.concentration_numeric IS NOT NULL
GROUP BY s.station_id, s.station_name,
         DATE_TRUNC('month', h.monitor_date), h.pollutant_eng_name
ORDER BY month DESC, s.station_id, h.pollutant_eng_name;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. 資料品質檢查函數（對齊 check_moe_data_quality）
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_tepa_data_quality()
RETURNS TABLE(
    station_id         VARCHAR(20),
    station_name       VARCHAR(100),
    total_records      BIGINT,
    valid_records      BIGINT,
    invalid_records    BIGINT,
    data_quality_ratio NUMERIC(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.station_id,
        s.station_name,
        COUNT(h.station_id)                                         AS total_records,
        COUNT(CASE WHEN h.data_quality = 'good'    THEN 1 END)      AS valid_records,
        COUNT(CASE WHEN h.data_quality = 'invalid' THEN 1 END)      AS invalid_records,
        ROUND(
            CASE
                WHEN COUNT(h.station_id) = 0 THEN 0
                ELSE COUNT(CASE WHEN h.data_quality = 'good' THEN 1 END)::NUMERIC
                     / NULLIF(COUNT(h.station_id), 0)::NUMERIC * 100
            END, 2
        )                                                            AS data_quality_ratio
    FROM tepa_stations s
    LEFT JOIN tepa_hourly_data h ON s.station_id = h.station_id
    GROUP BY s.station_id, s.station_name
    ORDER BY s.station_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 註解
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE tepa_stations     IS 'TEPA 桃園市環保局空氣品質測站基本資料（4站）';
COMMENT ON TABLE tepa_pollutants   IS 'TEPA 污染物種類（對齊 MOE 六項）';
COMMENT ON TABLE tepa_hourly_data  IS 'TEPA 空氣品質小時值資料（分區表，2019-03 至 2026-03）';
COMMENT ON VIEW  tepa_latest_data  IS '最近 24 小時的 TEPA 空氣品質資料彙總';
COMMENT ON VIEW  tepa_monthly_stats IS 'TEPA 測站月度統計資料';
COMMENT ON FUNCTION check_tepa_data_quality() IS '檢查 TEPA 資料品質統計';
