"""
Generate figures for docs/補值統合報告.md

Outputs -> docs/assets/imputation_report/*.png

All numbers come from committed result files:
  data/exports/loo_results.csv
  data/exports/method_comparison.csv
  data/exports/grid_pm25_20240615_1400.parquet
  data/models/xgb_*_report.txt
  data/models/xgb_pm25_shap_importance.csv
  data/exports/*_hourly.parquet   (station coordinates + record counts)
"""

import sys
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np
import pandas as pd

ROOT = Path(__file__).parent.parent
EXPORTS = ROOT / 'data' / 'exports'
MODELS = ROOT / 'data' / 'models'
OUT = ROOT / 'docs' / 'assets' / 'imputation_report'
OUT.mkdir(parents=True, exist_ok=True)

for cand in ['Microsoft JhengHei', 'Microsoft YaHei', 'SimHei']:
    if cand in {f.name for f in fm.fontManager.ttflist}:
        plt.rcParams['font.family'] = cand
        break
plt.rcParams['axes.unicode_minus'] = False

BBOX = dict(lat_min=24.60, lat_max=25.16, lon_min=121.00, lon_max=121.50)
# grid bbox actually produced by ml/impute/predict.py
GRID_BBOX = dict(lat_min=24.77, lat_max=25.15, lon_min=121.05, lon_max=121.50)

PM25_NAMES = {
    '0604316A0003': '內壢', '0604616A0002': '新興國小', '0604816I0005': '華亞',
    '0605316I0004': '觀音_S', '17': '桃園', '18': '大園', '19': '觀音',
    '20': '平鎮', '21': '龍潭', '68': '中壢',
}

CONF_COLOR = {'high': '#2e9e5b', 'medium': '#f4c430', 'low': '#d1495b'}


def pm25_stations():
    df = pd.read_parquet(EXPORTS / 'pm25_hourly.parquet')
    df['station_id'] = df['station_id'].astype(str)
    g = df.groupby('station_id').agg(
        n=('monitor_date', 'size'),
        latitude=('latitude', 'first'),
        longitude=('longitude', 'first'),
    ).reset_index()
    g['name'] = g['station_id'].map(PM25_NAMES)
    return g


def cwa_stations():
    df = pd.read_parquet(EXPORTS / 'temperature_hourly.parquet')
    df['station_id'] = df['station_id'].astype(str)
    g = df.groupby('station_id').agg(
        n=('monitor_date', 'size'),
        latitude=('latitude', 'first'),
        longitude=('longitude', 'first'),
    ).reset_index()
    return g


def _basemap(ax, title, note=True):
    ax.set_xlim(BBOX['lon_min'], BBOX['lon_max'])
    ax.set_ylim(BBOX['lat_min'], BBOX['lat_max'])
    ax.set_xlabel('經度')
    ax.set_ylabel('緯度')
    ax.set_title(title, fontweight='bold')
    ax.grid(True, ls='--', lw=0.4, alpha=0.5)
    ax.set_aspect('equal')
    # rough mountain-zone marker (south-east Taoyuan)
    ax.axhline(24.83, color='grey', lw=0.8, ls=':', alpha=0.7)
    if note:
        ax.text(121.02, 24.82, '虛線以南：復興區山地，全區無 PM2.5 測站',
                fontsize=8, color='dimgrey', va='top')


# ---------------------------------------------------------------------------
# Fig 1 : PM2.5 station coverage + LOO error + confidence regions
# ---------------------------------------------------------------------------
def fig1_pm25_error_map():
    grid = pd.read_parquet(EXPORTS / 'grid_pm25_20240615_1400.parquet')
    loo = pd.read_csv(EXPORTS / 'loo_results.csv', dtype={'station_id': str})

    fig, ax = plt.subplots(figsize=(10, 10))

    for level in ['low', 'medium', 'high']:
        sub = grid[grid['confidence_level'] == level]
        ax.scatter(sub['longitude'], sub['latitude'], s=20, marker='s',
                   c=CONF_COLOR[level], alpha=0.45,
                   label=f'補值信心 {level}（{len(sub)} 格點，{len(sub)/len(grid)*100:.0f}%）')

    mae = loo['mae'].values
    sc = ax.scatter(loo['longitude'], loo['latitude'], c=mae, s=280,
                    cmap='OrRd', vmin=2, vmax=4, edgecolors='black',
                    linewidths=1.4, zorder=5)
    # manual label offsets (dx pt, dy pt) to avoid collisions in the central cluster
    off = {
        '中壢': (-70, -22), '平鎮': (-64, 20), '內壢': (14, -20),
        '新興國小': (10, 14), '桃園': (14, -6), '大園': (10, 12),
        '觀音': (-6, -24), '觀音_S': (8, 12), '華亞': (8, 8), '龍潭': (10, -6),
    }
    for _, r in loo.iterrows():
        dx, dy = off.get(r['station_name'], (8, 8))
        ax.annotate(f"{r['station_name']}  MAE={r['mae']:.2f}",
                    (r['longitude'], r['latitude']),
                    xytext=(dx, dy), textcoords='offset points', fontsize=8,
                    bbox=dict(boxstyle='round,pad=0.2', fc='white', alpha=0.85, ec='none'),
                    zorder=6)
    cbar = fig.colorbar(sc, ax=ax, fraction=0.035, pad=0.02)
    cbar.set_label('留一站交叉驗證 MAE (µg/m³)')

    _basemap(ax, 'PM2.5 補值：測站分佈、LOO 誤差與補值信心區\n'
                 '（2024-06-15 14:00 格點；紅色方塊＝周邊無測站、補值最不可靠）')
    ax.legend(loc='lower right', fontsize=8, framealpha=0.9)
    fig.tight_layout()
    fig.savefig(OUT / 'fig1_pm25_error_map.png', dpi=140, bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# Fig 2 : station density  PM2.5 (10)  vs  CWA meteo (22)
# ---------------------------------------------------------------------------
def fig2_density_compare():
    pm = pm25_stations()
    cwa = cwa_stations()

    fig, axes = plt.subplots(1, 2, figsize=(15, 8), sharey=True)

    axes[0].scatter(pm['longitude'], pm['latitude'], s=140, c='#d1495b',
                    edgecolors='black', zorder=5)
    for _, r in pm.iterrows():
        axes[0].annotate(r['name'], (r['longitude'], r['latitude']),
                         xytext=(5, 4), textcoords='offset points', fontsize=8)
    _basemap(axes[0], f'PM2.5 目標測站：{len(pm)} 站（MOE + TYDEP）\n集中在北部與中壢平原，海岸與山區近乎空白')

    axes[1].scatter(cwa['longitude'], cwa['latitude'], s=140, c='#2e6f95',
                    edgecolors='black', zorder=5)
    _basemap(axes[1], f'氣象目標測站：{len(cwa)} 站（CWA）\n含山區站（拉拉山、巴陵、復興），空間覆蓋明顯較佳')
    axes[1].set_ylabel('')

    fig.suptitle('資料密度落差是補值不確定性的根源：PM2.5 只有 10 站，氣象有 22 站',
                 fontsize=13, fontweight='bold')
    fig.tight_layout()
    fig.savefig(OUT / 'fig2_station_density.png', dpi=140, bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# Fig 3 : per-station LOO MAE + nearest-station distance
# ---------------------------------------------------------------------------
def fig3_loo_bars():
    loo = pd.read_csv(EXPORTS / 'loo_results.csv').sort_values('mae')
    fig, ax1 = plt.subplots(figsize=(11, 5.5))
    x = np.arange(len(loo))
    ax1.bar(x - 0.2, loo['mae'], width=0.4, color='#d1495b', label='LOO MAE (µg/m³)')
    ax1.bar(x - 0.2, loo['rmse'] - loo['mae'], width=0.4, bottom=loo['mae'],
            color='#e8a0ac', label='RMSE 減 MAE')
    ax1.set_xticks(x)
    ax1.set_xticklabels(loo['station_name'], rotation=30, ha='right')
    ax1.set_ylabel('誤差 (µg/m³)')

    ax2 = ax1.twinx()
    ax2.plot(x, loo['nearest_station_distance'], 'o--', color='#2e6f95',
             label='最近鄰站距離 (km)')
    ax2.set_ylabel('最近鄰站距離 (km)', color='#2e6f95')

    lines1, lab1 = ax1.get_legend_handles_labels()
    lines2, lab2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, lab1 + lab2, loc='upper left', fontsize=8)
    ax1.set_title('PM2.5 逐站 LOO 誤差（2024-06-01 ~ 06-08，每站約 143 個時間點）\n'
                  '誤差與最近站距離相關性極弱（corr 約 0.01）：中壢雖近平鎮仍系統性低估（bias -3.2）',
                  fontweight='bold')
    fig.tight_layout()
    fig.savefig(OUT / 'fig3_loo_bars.png', dpi=140, bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# Fig 4 : six-variable model performance
# ---------------------------------------------------------------------------
def fig4_model_perf():
    rows = [
        ('PM2.5',      2.641, 0.6907),
        ('氣溫',        0.427, 0.9887),
        ('相對濕度',    2.369, 0.9301),
        ('風速',        0.499, 0.8952),
        ('風向 sin',    0.235, 0.7043),
        ('風向 cos',    0.295, 0.5559),
        ('氣壓',        0.464, 0.9990),
    ]
    labels = [r[0] for r in rows]
    r2 = [r[2] for r in rows]
    x = np.arange(len(rows))

    fig, ax = plt.subplots(figsize=(10, 5))
    colors = ['#d1495b' if v < 0.75 else '#2e9e5b' for v in r2]
    bars = ax.bar(x, r2, color=colors)
    for b, v in zip(bars, r2):
        ax.text(b.get_x() + b.get_width() / 2, v + 0.01, f'{v:.3f}',
                ha='center', fontsize=9)
    ax.axhline(0.75, color='grey', ls='--', lw=1)
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylabel('驗證集 R²')
    ax.set_ylim(0, 1.08)
    ax.set_title('各變數 XGBoost 補值模型驗證集 R²\n'
                 '氣溫／濕度／氣壓／風速良好；PM2.5 與風向 cos 分量偏弱（紅色）', fontweight='bold')
    fig.tight_layout()
    fig.savefig(OUT / 'fig4_model_perf.png', dpi=140, bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# Fig 5 : confidence coverage donut + nearest-distance histogram
# ---------------------------------------------------------------------------
def fig5_confidence():
    grid = pd.read_parquet(EXPORTS / 'grid_pm25_20240615_1400.parquet')
    counts = grid['confidence_level'].value_counts().reindex(['high', 'medium', 'low'])

    fig, axes = plt.subplots(1, 2, figsize=(13, 5.2))
    axes[0].pie(counts, labels=[f'{k}\n{v} 格點\n{v/len(grid)*100:.1f}%'
                                for k, v in counts.items()],
                colors=[CONF_COLOR[k] for k in counts.index],
                wedgeprops=dict(width=0.45), startangle=90)
    axes[0].set_title('全桃園 1,748 格點的 PM2.5 補值信心分佈\n'
                      '逾七成格點無足夠鄰近測站支撐', fontweight='bold')

    axes[1].hist(grid['nearest_station_distance'], bins=30, color='#2e6f95', alpha=0.85)
    axes[1].axvline(3, color='#2e9e5b', ls='--', label='high 門檻 3 km')
    axes[1].axvline(8, color='#f4c430', ls='--', label='medium 門檻 8 km')
    axes[1].set_xlabel('格點到最近 PM2.5 測站距離 (km)')
    axes[1].set_ylabel('格點數')
    axes[1].set_title('中位距離約 8 km，僅約 5% 格點落在 high 門檻內', fontweight='bold')
    axes[1].legend()
    fig.tight_layout()
    fig.savefig(OUT / 'fig5_confidence.png', dpi=140, bbox_inches='tight')
    plt.close(fig)


# ---------------------------------------------------------------------------
# Fig 6 : PM2.5 SHAP top features
# ---------------------------------------------------------------------------
def fig6_shap():
    full = pd.read_csv(MODELS / 'xgb_pm25_shap_importance.csv')
    is_temporal = full['feature'].str.contains('lag|neighbor|rolling')
    share = full.loc[is_temporal, 'mean_abs_shap'].sum() / full['mean_abs_shap'].sum()

    imp = full.head(15).iloc[::-1]
    fig, ax = plt.subplots(figsize=(9, 6))
    colors = ['#d1495b' if ('lag' in f or 'neighbor' in f or 'rolling' in f)
              else '#2e6f95' for f in imp['feature']]
    ax.barh(imp['feature'], imp['mean_abs_shap'], color=colors)
    ax.set_xlabel('平均 |SHAP|（對 PM2.5 預測的平均貢獻，µg/m³）')
    ax.set_title('PM2.5 補值模型 SHAP 前 15 特徵\n'
                 f'紅＝自身與鄰站時序特徵（合計約占總貢獻 {share*100:.0f}%），藍＝氣象/座標/時間特徵',
                 fontweight='bold')
    fig.tight_layout()
    fig.savefig(OUT / 'fig6_pm25_shap.png', dpi=140, bbox_inches='tight')
    plt.close(fig)


if __name__ == '__main__':
    fig1_pm25_error_map()
    fig2_density_compare()
    fig3_loo_bars()
    fig4_model_perf()
    fig5_confidence()
    fig6_shap()
    print('figures written to', OUT)
