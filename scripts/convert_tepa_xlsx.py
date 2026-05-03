#!/usr/bin/env python3
"""
TEPA（桃園市環保局）測站資料轉換腳本
將 Excel 原始資料轉換為按測站+月份分割的 JSON 檔

輸入：data/raw/tepa-stations/桃園市空氣品質測站監測數據(108-115).xlsx
輸出：data/processed/tepa-stations/<station_id>/<YYYY_MM>.json

保留污染物（對齊 MOE/CWA 六項）：
  SO2, CO, O3, NO2, PM10, PM2.5

時間範圍：2019-03-01 起
"""

import json
import os
import sys
from collections import defaultdict
from datetime import datetime
from typing import Optional

# ── 資料起始日期過濾 ──────────────────────────────────────────────────────────
DATA_START = datetime(2019, 3, 1)

try:
    import openpyxl
except ImportError:
    print("請先安裝 openpyxl：pip3 install openpyxl")
    sys.exit(1)

# ── 路徑設定 ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.dirname(SCRIPT_DIR)
INPUT_FILE = os.path.join(ROOT_DIR, "data", "raw", "tepa-stations",
                          "桃園市空氣品質測站監測數據(108-115).xlsx")
OUTPUT_DIR = os.path.join(ROOT_DIR, "data", "processed", "tepa-stations")

# ── 測站 ID 對照表（局內代碼 → 系統 station_id）────────────────────────────
STATION_MAP = {
    "(局)新興國小": {"id": "0604616A0002", "name": "新興國小", "district": "蘆竹區"},
    "(局)內壢":     {"id": "0604316A0003", "name": "內壢",     "district": "中壢區"},
    "(局)華亞":     {"id": "0604816I0005", "name": "華亞",     "district": "龜山區"},
    "(局)觀音":     {"id": "0605316I0004", "name": "觀音_S",   "district": "觀音區"},
}

# ── 欄位索引（對應 Excel 標頭）────────────────────────────────────────────────
COL = {
    "datetime": 0,
    "date":     1,
    "station":  2,
    # 保留的六項污染物
    "so2":      6,
    "co":       7,
    "o3":       8,
    "no2":      4,
    "pm25":     12,
    "pm10":     13,
    # 氣象欄位
    "rh":       14,
    "at":       15,
    "wd":       16,
    "ws":       17,
}

INVALID_TOKENS = {"無資料", "缺值", "維修", "校正", "#", "N/A", ""}


def to_float(val) -> Optional[float]:
    """將儲存格值轉為 float，無效值回傳 None。"""
    if val is None:
        return None
    s = str(val).strip()
    if s in INVALID_TOKENS:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_row(row: tuple) -> Optional[dict]:
    """將一列資料解析為標準化 dict，失敗或超出時間範圍回傳 None。"""
    raw_dt = row[COL["datetime"]]
    if not isinstance(raw_dt, datetime):
        return None

    # 時間過濾：只保留 2019-03-01 起的資料
    if raw_dt < DATA_START:
        return None

    station_raw = row[COL["station"]]
    if station_raw not in STATION_MAP:
        return None

    station_info = STATION_MAP[station_raw]

    return {
        "station_id":   station_info["id"],
        "station_name": station_info["name"],
        "monitor_date": raw_dt.strftime("%Y-%m-%dT%H:%M:%S"),
        "pollutants": {
            "so2":  to_float(row[COL["so2"]]),
            "co":   to_float(row[COL["co"]]),
            "o3":   to_float(row[COL["o3"]]),
            "no2":  to_float(row[COL["no2"]]),
            "pm25": to_float(row[COL["pm25"]]),
            "pm10": to_float(row[COL["pm10"]]),
        },
        "meteo": {
            "rh": to_float(row[COL["rh"]]),   # 相對濕度 %
            "at": to_float(row[COL["at"]]),   # 氣溫 °C
            "wd": row[COL["wd"]] if row[COL["wd"]] not in INVALID_TOKENS else None,  # 風向（中文）
            "ws": to_float(row[COL["ws"]]),   # 風速 m/s
        },
    }


def main():
    print(f"讀取：{INPUT_FILE}")
    if not os.path.exists(INPUT_FILE):
        print(f"[錯誤] 找不到輸入檔案：{INPUT_FILE}")
        sys.exit(1)

    wb = openpyxl.load_workbook(INPUT_FILE, read_only=True, data_only=True)
    ws = wb.active
    print(f"工作表：{ws.title}")

    # 按 (station_id, YYYY_MM) 分組
    # 結構：buckets[station_id][YYYY_MM] = [record, ...]
    buckets: dict = defaultdict(lambda: defaultdict(list))

    total = 0
    skipped = 0

    for row in ws.iter_rows(min_row=2, values_only=True):
        record = parse_row(row)
        if record is None:
            skipped += 1
            continue

        dt = datetime.fromisoformat(record["monitor_date"])
        month_key = dt.strftime("%Y_%m")
        buckets[record["station_id"]][month_key].append(record)
        total += 1

        if total % 50000 == 0:
            print(f"  已處理 {total:,} 筆...")

    wb.close()
    print(f"解析完成：{total:,} 筆有效，{skipped:,} 筆跳過")

    # 輸出 JSON 檔
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    file_count = 0

    for station_id, months in sorted(buckets.items()):
        station_dir = os.path.join(OUTPUT_DIR, station_id)
        os.makedirs(station_dir, exist_ok=True)

        # 找出對應的測站 meta
        station_meta = next(
            v for v in STATION_MAP.values() if v["id"] == station_id
        )

        for month_key, records in sorted(months.items()):
            # 依時間排序
            records.sort(key=lambda r: r["monitor_date"])

            output = {
                "meta": {
                    "station_id":   station_id,
                    "station_name": station_meta["name"],
                    "district":     station_meta["district"],
                    "source":       "TEPA",
                    "month":        month_key.replace("_", "-"),
                    "record_count": len(records),
                    "generated_at": datetime.now().isoformat(),
                },
                "records": records,
            }

            out_path = os.path.join(station_dir, f"{month_key}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(output, f, ensure_ascii=False, indent=2)

            file_count += 1

    print(f"輸出完成：{file_count} 個 JSON 檔 → {OUTPUT_DIR}")

    # 輸出測站 meta 彙總
    stations_meta = []
    for raw_name, info in STATION_MAP.items():
        station_id = info["id"]
        if station_id in buckets:
            months = sorted(buckets[station_id].keys())
            stations_meta.append({
                "station_id":   station_id,
                "station_name": info["name"],
                "district":     info["district"],
                "raw_name":     raw_name,
                "source":       "TEPA",
                "data_start":   months[0].replace("_", "-") if months else None,
                "data_end":     months[-1].replace("_", "-") if months else None,
                "total_months": len(months),
                "total_records": sum(len(r) for r in buckets[station_id].values()),
            })

    meta_path = os.path.join(OUTPUT_DIR, "stations_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(stations_meta, f, ensure_ascii=False, indent=2)
    print(f"測站 meta：{meta_path}")


if __name__ == "__main__":
    main()
