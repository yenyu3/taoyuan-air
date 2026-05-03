@echo off
REM TEPA 測站資料庫建置腳本（Windows）
REM 執行前請確認 .env 已設定 POSTGRES_PASSWORD

echo ============================================================
echo  TEPA 測站資料庫建置
echo ============================================================

REM 1. 啟動 Docker 容器
echo [1/4] 啟動資料庫容器...
docker-compose up -d postgres
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker 啟動失敗，請確認 Docker Desktop 已開啟
    pause
    exit /b 1
)

REM 2. 等待資料庫就緒
echo [2/4] 等待資料庫就緒...
:WAIT_LOOP
docker exec taoyuan-air-db pg_isready -U taoyuan_user -d taoyuan_air >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    timeout /t 2 /nobreak >nul
    goto WAIT_LOOP
)
echo       資料庫已就緒

REM 3. 套用 Schema
echo [3/4] 建立 TEPA 資料表...
docker exec -i taoyuan-air-db psql -U taoyuan_user -d taoyuan_air < database\tepa_stations_schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Schema 建立失敗
    pause
    exit /b 1
)
echo       Schema 建立完成

REM 4. 匯入資料
echo [4/4] 匯入 TEPA 歷史資料...
python scripts\import_tepa_stations.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 資料匯入失敗
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  完成！可執行以下指令驗證：
echo  docker exec -it taoyuan-air-db psql -U taoyuan_user -d taoyuan_air
echo  SELECT COUNT(*) FROM tepa_hourly_data;
echo  SELECT * FROM check_tepa_data_quality();
echo ============================================================
pause
