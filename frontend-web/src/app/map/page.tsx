'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Layers, Search, X } from 'lucide-react';
import { getExamPoints, getGrid, getTEDSPoints, setScenario } from '@shared/api/index';
import { DISTRICTS } from '@shared/constants/districts';
import { palette } from '@shared/constants/theme';
import { useStore } from '@shared/store';
import type { ExamPoint, GridCell, TEDSPoint } from '@shared/types';
import { CardAQIGauge, CardPollutantArc, getAQIBadgeBg, getPollutantColor } from './_lib/airQuality';
import { generateDemoExamPoints, generateDemoTEDSPoints } from './_lib/demoData';
import { getPm25CssColor, getPm25Status } from './_lib/mapColors';
import {
  formatTime,
  getGridLocationName,
  getNearestGridToDistrict,
  normalizeSearchText,
  type SearchResult,
  withDistrict,
} from './_lib/search';
import { SENSITIVE_GROUPS } from './_data/sensitiveGroups';
import { IconCompass, IconHumidity, IconTemp, IconWind, SecLabel } from './_components/MapWidgets';
import { MapLoadingOverlay } from './_components/MapLoadingOverlay';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });
const TGOSMap = dynamic(() => import('@/components/map/TGOSMap'), { ssr: false });
const PM25DeckMap = dynamic(() => import('@/components/map/PM25DeckMap'), { ssr: false });

type MapViewMode = '2d' | '3d';
type LayerKey = 'pm25' | 'chimney' | 'mercury';

const Z = 1100;
const PM25_UNIT = 'μg/m³';

function compactCount(value: number) {
  return new Intl.NumberFormat('zh-TW', { notation: value >= 1000 ? 'compact' : 'standard' }).format(value);
}

function ToggleRow({
  label,
  detail,
  checked,
  color,
  onClick,
}: {
  label: string;
  detail: string;
  checked: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 42,
        border: `1px solid ${checked ? `${color}66` : palette.borderSoft}`,
        borderRadius: 10,
        background: checked ? `${color}12` : 'rgba(248, 249, 250, 0.78)',
        color: palette.textMain,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '8px 10px',
        cursor: 'pointer',
      }}
      title={detail}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          aria-hidden="true"
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: checked ? color : '#bcc7b8',
            boxShadow: checked ? `0 0 0 4px ${color}18` : 'none',
            flexShrink: 0,
          }}
        />
        <span style={{ minWidth: 0, textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 800, lineHeight: 1.15 }}>{label}</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: 10.5, color: palette.textSecondary, lineHeight: 1.2 }}>
            {detail}
          </span>
        </span>
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 34,
          height: 20,
          borderRadius: 999,
          background: checked ? color : 'rgba(106,141,115,0.18)',
          padding: 2,
          flexShrink: 0,
          transition: 'background 160ms ease',
        }}
      >
        <span
          style={{
            display: 'block',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(31,46,37,0.22)',
            transform: checked ? 'translateX(14px)' : 'translateX(0)',
            transition: 'transform 160ms ease',
          }}
        />
      </span>
    </button>
  );
}

export default function MapPage() {
  const store = useStore();
  const { mode, setMode, setGridCells, setSelectedGridId, selectedScenario, isLoading, setIsLoading } = store;
  const gridCells: GridCell[] = store.gridCells;

  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('2d');
  const [selectedGrid, setSelectedGrid] = useState<GridCell | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [focusedGrid, setFocusedGrid] = useState<GridCell | null>(null);
  const [tedsPoints, setTedsPoints] = useState<TEDSPoint[]>([]);
  const [examPoints, setExamPoints] = useState<ExamPoint[]>([]);
  const [showChimneyLayer, setShowChimneyLayer] = useState(true);
  const [showMercuryLayer, setShowMercuryLayer] = useState(true);
  const [showPm25GridLayer, setShowPm25GridLayer] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setScenario(selectedScenario);
    getGrid({ pollutant: 'PM25' })
      .then(setGridCells)
      .catch(console.error)
      .finally(() => setIsLoading(false));

    getTEDSPoints()
      .then((points) => setTedsPoints(points.length > 0 ? points : generateDemoTEDSPoints()))
      .catch(() => {
        setTedsPoints(generateDemoTEDSPoints());
      });

    getExamPoints()
      .then((points) => setExamPoints(points.length > 0 ? points : generateDemoExamPoints(19)))
      .catch(() => {
        setExamPoints(generateDemoExamPoints(19));
      });
  }, [selectedScenario, setGridCells, setIsLoading]);

  const handleGridPress = useCallback((grid: GridCell) => {
    setSelectedGrid(withDistrict(grid));
    setSelectedGridId(grid.gridId);
    setShowSheet(true);
  }, [setSelectedGridId]);

  const searchResults = useMemo<SearchResult[]>(() => {
    const query = normalizeSearchText(search);
    if (!query || gridCells.length === 0) return [];

    const results: SearchResult[] = [];
    const matchedDistricts = DISTRICTS.filter((district) => {
      const normalizedDistrict = normalizeSearchText(district);
      const normalizedShort = normalizeSearchText(district.replace(/區$/, ''));
      return normalizedDistrict.includes(query) || normalizedShort.includes(query);
    });

    matchedDistricts.forEach((district) => {
      const grid = getNearestGridToDistrict(gridCells, district);
      if (!grid) return;
      results.push({
        key: `district-${district}`,
        label: district,
        detail: `定位到 ${district} 附近 PM2.5 網格`,
        grid: withDistrict(grid),
      });
    });

    gridCells
      .filter((grid) => normalizeSearchText(grid.gridId).includes(query))
      .slice(0, 4)
      .forEach((grid) => {
        results.push({
          key: `grid-${grid.gridId}`,
          label: grid.gridId,
          detail: `${getGridLocationName(grid)} · ${Math.round(grid.values.value)} ${PM25_UNIT}`,
          grid: withDistrict(grid),
        });
      });

    return results.slice(0, 6);
  }, [gridCells, search]);

  const selectSearchResult = (result: SearchResult) => {
    setSearch(result.label);
    setSearchMessage('');
    setSearchFocused(false);
    setFocusedGrid(result.grid);
    handleGridPress(result.grid);
  };

  const submitSearch = () => {
    if (searchResults.length > 0) {
      selectSearchResult(searchResults[0]);
      return;
    }
    if (search.trim()) setSearchMessage('找不到相符的行政區或網格');
  };

  const gridValues = useMemo(() => gridCells.map((grid) => grid.values.value), [gridCells]);
  const gridAverage = gridValues.length ? Math.round(gridValues.reduce((sum, value) => sum + value, 0) / gridValues.length) : 0;
  const gridMaximum = gridValues.length ? Math.round(Math.max(...gridValues)) : 0;
  const highRiskCount = gridValues.filter((value) => value > 54).length;
  const lastUpdated = gridCells[0]?.updatedAt;
  const visibleEmissionPoints = useMemo(
    () => [
      ...(showChimneyLayer ? tedsPoints : []),
      ...(showMercuryLayer ? examPoints : []),
    ],
    [examPoints, showChimneyLayer, showMercuryLayer, tedsPoints],
  );

  const aqi = selectedGrid?.health.aqi ?? 0;
  const aqiBadge = getAQIBadgeBg(aqi);
  const pollValue = selectedGrid ? Math.round(selectedGrid.values.value) : 0;
  const pollColor = selectedGrid ? getPollutantColor(selectedGrid.values.value, 15.4) : '#76c476';
  const effectiveMapViewMode: MapViewMode = mode === 'FORECAST' ? '2d' : mapViewMode;
  const activeMapSource = mode === 'FORECAST' ? 'TGOS' : effectiveMapViewMode === '3d' ? 'Mapbox + deck.gl' : 'Esri';

  const layerSummary: Array<{
    key: LayerKey;
    label: string;
    detail: string;
    checked: boolean;
    color: string;
    onClick: () => void;
  }> = [
    {
      key: 'pm25',
      label: 'PM2.5 網格濃度',
      detail: `${gridCells.length} 格 · 主圖層`,
      checked: showPm25GridLayer,
      color: palette.primaryDeep,
      onClick: () => setShowPm25GridLayer((value) => !value),
    },
    {
      key: 'chimney',
      label: '點煙囪',
      detail: `${compactCount(tedsPoints.length)} 點 · 固定污染源`,
      checked: showChimneyLayer,
      color: '#2f6b55',
      onClick: () => setShowChimneyLayer((value) => !value),
    },
    {
      key: 'mercury',
      label: '汞排放點',
      detail: `${compactCount(examPoints.length)} 點 · 輔助判讀`,
      checked: showMercuryLayer,
      color: '#7c5aa6',
      onClick: () => setShowMercuryLayer((value) => !value),
    },
  ];

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {mode === 'NOW' && effectiveMapViewMode === '2d' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <LeafletMap
            gridCells={showPm25GridLayer ? gridCells : []}
            tedsPoints={visibleEmissionPoints}
            mapMode="2D"
            onGridPress={handleGridPress}
            focusGrid={focusedGrid}
          />
        </div>
        )}

        {mode === 'NOW' && effectiveMapViewMode === '3d' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <PM25DeckMap
            gridCells={gridCells}
            chimneyPoints={tedsPoints}
            mercuryPoints={examPoints}
            showPm25GridLayer={showPm25GridLayer}
            showChimneyLayer={showChimneyLayer}
            showMercuryLayer={showMercuryLayer}
            onGridPress={handleGridPress}
            focusGrid={focusedGrid}
          />
        </div>
        )}

        {mode === 'FORECAST' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <TGOSMap gridCells={showPm25GridLayer ? gridCells : []} onGridPress={handleGridPress} focusGrid={focusedGrid} />
        </div>
        )}
      </div>

      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: Z, display: 'flex', flexDirection: 'column', gap: 10, width: 330, maxWidth: 'calc(100vw - 40px)' }}>
        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 999, padding: 4, boxShadow: '0 6px 16px rgba(31,46,37,0.10)', border: `1px solid ${palette.borderSoft}`, alignSelf: 'flex-start' }}>
          {([
            { key: 'NOW' as const, label: '即時監測' },
            { key: 'FORECAST' as const, label: 'PM2.5 預報' },
          ]).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mode === item.key ? palette.primaryDeep : 'transparent',
                color: mode === item.key ? '#fff' : palette.textSecondary,
                fontSize: 13,
                fontWeight: 800,
                transition: 'all 0.18s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 999, padding: '10px 14px', boxShadow: '0 6px 16px rgba(31,46,37,0.10)', border: `1px solid ${palette.borderSoft}` }}>
            <Search size={16} color={palette.textSecondary} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchMessage('');
              }}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitSearch();
                }
                if (event.key === 'Escape') setSearchFocused(false);
              }}
              placeholder="搜尋行政區或網格"
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: 13, color: palette.textMain, outline: 'none' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchMessage('');
                  setSearchFocused(false);
                }}
                aria-label="清除搜尋"
                style={{ width: 24, height: 24, border: 'none', borderRadius: '50%', background: 'transparent', color: palette.textSecondary, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {searchFocused && search.trim() && (
            <div style={{ position: 'absolute', top: 50, left: 0, right: 0, background: 'rgba(255,255,255,0.98)', border: `1px solid ${palette.borderSoft}`, borderRadius: 14, boxShadow: '0 16px 36px rgba(31,46,37,0.16)', overflow: 'hidden', backdropFilter: 'blur(18px)' }}>
              {searchResults.length > 0 ? searchResults.map((result) => (
                <button
                  key={result.key}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSearchResult(result)}
                  style={{ width: '100%', border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, padding: '11px 14px', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${palette.borderSoft}` }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800, color: palette.textMain }}>{result.label}</span>
                  <span style={{ fontSize: 11, color: palette.textSecondary }}>{result.detail}</span>
                </button>
              )) : (
                <div style={{ padding: '12px 14px', fontSize: 12, color: palette.textSecondary }}>找不到相符的行政區或網格</div>
              )}
            </div>
          )}

          {searchMessage && <div style={{ marginTop: 6, paddingLeft: 14, fontSize: 11, fontWeight: 800, color: palette.accentRed }}>{searchMessage}</div>}
        </div>

        {mode === 'NOW' && (
          <div style={{ display: 'flex', alignSelf: 'flex-start', gap: 5, padding: 5, borderRadius: 999, background: 'rgba(255,255,255,0.90)', border: `1px solid ${palette.borderSoft}`, boxShadow: '0 8px 22px rgba(31,46,37,0.10)' }}>
            {([
              { key: '2d' as const, label: '2D 網格', icon: <Layers size={15} /> },
              { key: '3d' as const, label: '3D 濃度', icon: <Box size={15} /> },
            ]).map((item) => {
              const active = mapViewMode === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMapViewMode(item.key)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, border: 'none', background: active ? '#2d3129' : 'transparent', color: active ? '#fff' : palette.textSecondary, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', left: 20, bottom: 20, zIndex: Z, width: 318, maxWidth: 'calc(100vw - 40px)' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, padding: '16px', border: `1px solid ${palette.borderSoft}`, boxShadow: 'var(--panel-float-shadow)', backdropFilter: 'blur(18px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 5 }}><SecLabel title={mode === 'NOW' ? 'PM2.5 即時濃度' : 'PM2.5 預報濃度'} /></div>
              <div style={{ fontSize: 11, color: palette.textSecondary, lineHeight: 1.5 }}>
                {mode === 'NOW' ? `${effectiveMapViewMode === '3d' ? '3D 濃度地景' : '2D 網格監測'} · 更新 ${formatTime(lastUpdated)}` : '2D 預報網格 · 未來趨勢'}
              </div>
            </div>
            <span style={{ padding: '4px 9px', borderRadius: 999, background: getPm25CssColor(gridMaximum, 0.14), color: getPm25CssColor(gridMaximum, 1), fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>
              {getPm25Status(gridMaximum)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            {[
              { label: '平均', value: gridAverage },
              { label: '最高', value: gridMaximum },
              { label: '高風險格', value: highRiskCount, unit: '格' },
            ].map((item) => (
              <div key={item.label} style={{ borderRadius: 10, background: 'rgba(244, 247, 240, 0.9)', border: `1px solid ${palette.borderSoft}`, padding: '9px 9px 8px' }}>
                <p style={{ margin: 0, fontSize: 10.5, color: palette.textSecondary }}>{item.label}</p>
                <p style={{ margin: '4px 0 0', color: palette.textMain, fontSize: 20, lineHeight: 1, fontWeight: 900 }}>
                  {item.value}
                  <span style={{ marginLeft: 3, color: palette.textSecondary, fontSize: 9.5, fontWeight: 700 }}>{item.unit || PM25_UNIT}</span>
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 13 }}>
            <div style={{ height: 9, borderRadius: 999, background: 'linear-gradient(to right, #2aa65a, #e8be42, #e67f30, #d6444c, #844090)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.45)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: palette.textSecondary }}>
              <span>0</span><span>15</span><span>35</span><span>54</span><span>150+</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {layerSummary.map(({ key, ...layer }) => <ToggleRow key={key} {...layer} />)}
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', right: 20, bottom: 20, zIndex: Z, backgroundColor: 'rgba(255,255,255,0.78)', padding: '4px 10px', borderRadius: 8, fontSize: 10, color: palette.textSecondary, boxShadow: '0 6px 16px rgba(31,46,37,0.08)' }}>
        地圖資料：<span style={{ color: palette.primaryDeep, fontWeight: 800 }}>{activeMapSource}</span>
      </div>

      {showSheet && selectedGrid && (
        <aside style={{ position: 'absolute', top: 20, right: 20, width: 356, maxWidth: 'calc(100vw - 40px)', maxHeight: 'calc(100vh - 120px)', zIndex: 1210, backgroundColor: 'rgba(255,255,255,0.96)', border: `1px solid ${palette.borderSoft}`, borderRadius: 14, boxShadow: 'var(--panel-float-shadow)', backdropFilter: 'blur(20px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 18px 14px', borderBottom: `1px solid ${palette.borderSoft}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: palette.textSecondary, fontWeight: 700 }}>PM2.5 網格</p>
                <h2 style={{ margin: '3px 0 0', fontSize: 20, color: palette.textMain, fontWeight: 900 }}>{getGridLocationName(selectedGrid)}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSheet(false)}
                aria-label="關閉詳情"
                style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${palette.borderSoft}`, background: '#f4f5f2', color: palette.textSecondary, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: 999, backgroundColor: aqiBadge.bg, color: aqiBadge.color, fontSize: 12, fontWeight: 900 }}>{selectedGrid.health.level}</span>
              <span style={{ fontSize: 11, color: palette.textSecondary }}>更新 {formatTime(selectedGrid.updatedAt)}</span>
            </div>
          </div>

          <div style={{ padding: '16px 18px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}><SecLabel title="空氣品質摘要" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'center' }}>
                <div>
                  <CardAQIGauge key={`gauge-${aqi}`} aqi={aqi} />
                  <p style={{ margin: '6px 0 0', fontSize: 10, color: palette.textSecondary, textAlign: 'center' }}>AQI 0-200 指標</p>
                </div>
                <div>
                  <CardPollutantArc
                    key={`arc-${pollValue}-PM25`}
                    value={pollValue}
                    max={100}
                    standard={15.4}
                    color={pollColor}
                    unit={PM25_UNIT}
                    label="PM2.5"
                  />
                </div>
              </div>
            </div>

            <div style={{ borderRadius: 12, border: `1px solid ${palette.borderSoft}`, padding: '12px 14px', marginBottom: 14, background: 'rgba(250,251,248,0.92)' }}>
              <div style={{ marginBottom: 8 }}><SecLabel title="健康建議" /></div>
              <p style={{ margin: '0 0 10px', color: palette.textSecondary, fontSize: 12, lineHeight: 1.65 }}>{selectedGrid.health.summary}</p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(205, 213, 180, 0.35)', fontSize: 12, color: palette.textMain }}>
                  戶外活動：{selectedGrid.health.outdoorActivity}
                </span>
                <span style={{ padding: '5px 10px', borderRadius: 999, fontSize: 12, color: palette.textMain, background: selectedGrid.health.maskRequired ? 'rgba(159,18,57,0.09)' : 'rgba(79,141,122,0.12)' }}>
                  {selectedGrid.health.maskRequired ? '建議配戴口罩' : '一般族群可正常活動'}
                </span>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${palette.borderSoft}` }}>
                <div style={{ marginBottom: 10 }}><SecLabel title="敏感族群" /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  {SENSITIVE_GROUPS.map(({ key, label, icon }) => {
                    const active = selectedGrid.health.sensitiveGroups.some((group) => group.includes(key));
                    const iconColor = active ? getPm25CssColor(selectedGrid.values.value, 1) : '#c2c7bd';
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: active ? getPm25CssColor(selectedGrid.values.value, 0.13) : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
                          {icon}
                        </div>
                        <span style={{ fontSize: 10, color: iconColor, fontWeight: active ? 800 : 600, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}><SecLabel title="氣象條件" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
              {[
                { icon: <IconTemp />, label: '溫度', value: `${selectedGrid.meteo.temp.toFixed(1)}°C` },
                { icon: <IconHumidity />, label: '濕度', value: `${selectedGrid.meteo.humidity.toFixed(0)}%` },
                { icon: <IconWind />, label: '風速', value: `${selectedGrid.meteo.windSpeed.toFixed(1)} m/s` },
                { icon: <IconCompass deg={selectedGrid.meteo.windDir} />, label: '風向', value: `${selectedGrid.meteo.windDir.toFixed(0)}°` },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ borderRadius: 10, background: 'rgba(249,250,247,0.95)', padding: '9px 6px', textAlign: 'center', border: `1px solid ${palette.borderSoft}` }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: palette.primaryDeep }}>{icon}</div>
                  <p style={{ margin: '0 0 2px', color: palette.textSecondary, fontSize: 10 }}>{label}</p>
                  <p style={{ margin: 0, color: palette.textMain, fontSize: 11, fontWeight: 800 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}

      <MapLoadingOverlay isLoading={isLoading} />
    </div>
  );
}
