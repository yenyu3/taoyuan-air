@echo off
REM 桃園市空氣污染監測系統 - 資料庫還原腳本
REM 使用方式: restore_db.bat [備份檔案路徑]

IF "%1"=="" (
    echo 請指定備份檔案路徑
    echo 使用方式: restore_db.bat database\backups\taoyuan_air_20240101_120000.sql
    pause
    exit /b 1
)

echo 警告：此操作將覆蓋現有資料庫！
echo 按任意鍵繼續，或關閉視窗取消...
pause

echo 開始還原資料庫...
type %1 | docker exec -i taoyuan-air-db psql -U taoyuan_user -d taoyuan_air

IF %ERRORLEVEL% EQU 0 (
    echo 還原完成！
) ELSE (
    echo 還原失敗！
)

pause
