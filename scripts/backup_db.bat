@echo off
REM 桃園市空氣污染監測系統 - 資料庫備份腳本
REM 使用方式: backup_db.bat

SET BACKUP_DIR=database\backups
SET TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
SET TIMESTAMP=%TIMESTAMP: =0%
SET BACKUP_FILE=%BACKUP_DIR%\taoyuan_air_%TIMESTAMP%.sql

IF NOT EXIST %BACKUP_DIR% mkdir %BACKUP_DIR%

echo 開始備份資料庫...
docker exec taoyuan-air-db pg_dump -U taoyuan_user taoyuan_air > %BACKUP_FILE%

IF %ERRORLEVEL% EQU 0 (
    echo 備份完成: %BACKUP_FILE%
) ELSE (
    echo 備份失敗！
)

pause
