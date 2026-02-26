@echo off
REM 桃園市空氣污染監測系統 - 資料庫狀態檢查
REM 使用方式: check_db.bat

echo ========================================
echo 桃園市空氣污染監測系統 - 資料庫狀態
echo ========================================
echo.

echo [1] 檢查容器狀態...
docker-compose ps
echo.

echo [2] 檢查 PostgreSQL 版本...
docker exec taoyuan-air-db psql -U taoyuan_user -d taoyuan_air -c "SELECT version();"
echo.

echo [3] 檢查 PostGIS 版本...
docker exec taoyuan-air-db psql -U taoyuan_user -d taoyuan_air -c "SELECT PostGIS_version();"
echo.

echo [4] 檢查資料表...
docker exec taoyuan-air-db psql -U taoyuan_user -d taoyuan_air -c "\dt public.*"
echo.

echo [5] 檢查資料筆數...
docker exec taoyuan-air-db psql -U taoyuan_user -d taoyuan_air -c "SELECT '測站數量: ' || COUNT(*) FROM stations; SELECT '空品資料: ' || COUNT(*) FROM realtime_air_quality; SELECT '氣象資料: ' || COUNT(*) FROM weather_observations;"
echo.

echo ========================================
echo 檢查完成
echo ========================================
pause
