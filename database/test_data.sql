-- 桃園市空氣污染監測系統 - 測試資料
-- 插入桃園市 6 個 EPA 測站

INSERT INTO stations (station_id, station_name, station_type, location, district, address, elevation, is_active) VALUES
('TY001', '桃園', 'EPA', ST_SetSRID(ST_MakePoint(121.3009, 24.9936), 4326), '桃園區', '桃園市桃園區', 120, true),
('TY002', '大園', 'EPA', ST_SetSRID(ST_MakePoint(121.2006, 25.0608), 4326), '大園區', '桃園市大園區', 30, true),
('TY003', '觀音', 'EPA', ST_SetSRID(ST_MakePoint(121.0822, 25.0353), 4326), '觀音區', '桃園市觀音區', 40, true),
('TY004', '平鎮', 'EPA', ST_SetSRID(ST_MakePoint(121.2041, 24.9533), 4326), '平鎮區', '桃園市平鎮區', 150, true),
('TY005', '龍潭', 'EPA', ST_SetSRID(ST_MakePoint(121.2168, 24.8633), 4326), '龍潭區', '桃園市龍潭區', 200, true),
('TY006', '中壢', 'EPA', ST_SetSRID(ST_MakePoint(121.2265, 24.9536), 4326), '中壢區', '桃園市中壢區', 140, true)
ON CONFLICT (station_id) DO NOTHING;

-- 插入測試空品資料（當前時間）
INSERT INTO realtime_air_quality (station_id, timestamp, aqi, pm25, pm10, o3, co, so2, no2, nox) VALUES
('TY001', NOW(), 55, 15.2, 28.5, 45.3, 0.4, 3.2, 18.5, 25.3),
('TY002', NOW(), 48, 12.8, 25.1, 42.1, 0.3, 2.8, 15.2, 21.8),
('TY003', NOW(), 62, 18.5, 32.4, 48.7, 0.5, 3.8, 22.1, 28.9),
('TY004', NOW(), 51, 14.1, 27.3, 43.5, 0.4, 3.1, 17.3, 23.7),
('TY005', NOW(), 45, 11.5, 23.8, 40.2, 0.3, 2.5, 14.8, 20.5),
('TY006', NOW(), 58, 16.8, 30.2, 46.9, 0.4, 3.5, 20.2, 26.8);

-- 插入測試氣象資料
INSERT INTO weather_observations (station_id, timestamp, temperature, humidity, pressure, wind_speed, wind_direction, rainfall) VALUES
('TY001', NOW(), 25.3, 68.5, 1013.2, 2.5, 135, 0),
('TY002', NOW(), 24.8, 72.1, 1013.5, 3.2, 120, 0),
('TY003', NOW(), 26.1, 65.3, 1012.8, 2.8, 150, 0),
('TY004', NOW(), 25.7, 67.9, 1013.1, 2.3, 140, 0),
('TY005', NOW(), 24.5, 70.2, 1013.8, 2.1, 125, 0),
('TY006', NOW(), 25.9, 66.7, 1013.0, 2.6, 145, 0);

-- 驗證資料
SELECT '測站數量: ' || COUNT(*) FROM stations;
SELECT '空品資料筆數: ' || COUNT(*) FROM realtime_air_quality;
SELECT '氣象資料筆數: ' || COUNT(*) FROM weather_observations;
