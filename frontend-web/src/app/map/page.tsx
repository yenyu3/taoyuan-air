'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@shared/store';
import { getExamPoints, getGrid, setScenario, getTEDSPoints } from '@shared/api/index';
import { palette } from '@shared/constants/theme';
import { DISTRICTS } from '@shared/constants/districts';
import { ExamPoint, GridCell, TEDSPoint } from '@shared/types';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CardAQIGauge, CardPollutantArc, getAQIBadgeBg, getAQIColor, getPollutantColor, pollutantMeta } from './_lib/airQuality';
import { generateDemoExamPoints, generateDemoTEDSPoints } from './_lib/demoData';
import { formatTime, getGridLocationName, getNearestGridToDistrict, normalizeSearchText, withDistrict, type SearchResult } from './_lib/search';
import { SENSITIVE_GROUPS } from './_data/sensitiveGroups';
import { IconCompass, IconHumidity, IconTemp, IconWind, SecLabel } from './_components/MapWidgets';
import { MapLoadingOverlay } from './_components/MapLoadingOverlay';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });
const TGOSMap = dynamic(() => import('@/components/map/TGOSMap'), { ssr: false });

// ── Pollutant metadata ───────────────────────────────────────────
export default function MapPage() {
  const store = useStore();
  const { mode, setMode, setGridCells, setSelectedGridId, selectedScenario, isLoading, setIsLoading } = store;
  const gridCells: GridCell[] = store.gridCells;
  // 保留原 mapMode 狀態設計（目前固定僅使用 2D 地圖）
  // const [mapMode, setMapMode] = useState<'2D' | 'Satellite'>('2D');
  const mapMode = '2D' as const;
  const [selectedGrid, setSelectedGrid] = useState<GridCell | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [focusedGrid, setFocusedGrid] = useState<GridCell | null>(null);
  const [tedsPoints, setTedsPoints] = useState<TEDSPoint[]>([]);
  const [examPoints, setExamPoints] = useState<ExamPoint[]>([]);
  const [tedsPointsNotice, setTedsPointsNotice] = useState('');
  const [examPointsNotice, setExamPointsNotice] = useState('');
  const [showChimneyLayer, setShowChimneyLayer] = useState(true);
  const [showMercuryLayer, setShowMercuryLayer] = useState(true);
  const [showPm25GridLayer, setShowPm25GridLayer] = useState(false);
  const [activeLayerInfo, setActiveLayerInfo] = useState<'chimney' | 'mercury' | 'pm25'>('pm25');
  const Z = 1100;

  const layerStates = {
    chimney: showChimneyLayer,
    mercury: showMercuryLayer,
    pm25: showPm25GridLayer,
  } as const;

  const toggleLayer = (layer: 'chimney' | 'mercury' | 'pm25') => {
    if (layer === 'chimney') setShowChimneyLayer((prev) => !prev);
    if (layer === 'mercury') setShowMercuryLayer((prev) => !prev);
    if (layer === 'pm25') setShowPm25GridLayer((prev) => !prev);
  };

  useEffect(() => {
    setIsLoading(true);
    setScenario(selectedScenario);
    getGrid({ pollutant: 'PM25' })
      .then(setGridCells)
      .catch(console.error)
      .finally(() => setIsLoading(false));

    getTEDSPoints()
      .then((points) => {
        if (points.length > 0) {
          setTedsPoints(points);
          setTedsPointsNotice('');
          return;
        }

        const demoPoints = generateDemoTEDSPoints();
        setTedsPoints(demoPoints);
        setTedsPointsNotice(`TEDS 後端目前沒有回傳點位，已自動切換展示資料。`);
      })
      .catch((error) => {
        console.error(error);
        const demoPoints = generateDemoTEDSPoints();
        setTedsPoints(demoPoints);
        setTedsPointsNotice(`TEDS 後端暫時離線，已切換展示資料。`);
      });

    getExamPoints()
      .then((points) => {
        if (points.length > 0) {
          setExamPoints(points);
          setExamPointsNotice('');
          return;
        }

        const demoPoints = generateDemoExamPoints(19);
        setExamPoints(demoPoints);
        setExamPointsNotice('汞排放點後端目前沒有回傳點位，已自動切換展示資料（19 筆）。');
      })
      .catch((error) => {
        console.error(error);
        const demoPoints = generateDemoExamPoints(19);
        setExamPoints(demoPoints);
        setExamPointsNotice('汞排放點後端暫時離線，已切換展示資料。');
      });
  }, [selectedScenario, setGridCells, setIsLoading]);

  const handleGridPress = (grid: GridCell) => {
    setSelectedGrid(withDistrict(grid));
    setSelectedGridId(grid.gridId);
    setShowSheet(true);
  };

  const searchResults = useMemo<SearchResult[]>(() => {
    const query = normalizeSearchText(search);
    if (!query || gridCells.length === 0) return [];

    const results: SearchResult[] = [];
    const usedGridIds = new Set<string>();
    const matchedDistricts = DISTRICTS.filter((district) => {
      const normalizedDistrict = normalizeSearchText(district);
      const normalizedShort = normalizeSearchText(district.replace(/區$/, ''));
      return normalizedDistrict.includes(query) || normalizedShort.includes(query);
    });

    matchedDistricts.forEach((district) => {
      const grid = getNearestGridToDistrict(gridCells, district);
      if (!grid) return;
      usedGridIds.add(grid.gridId);
      results.push({
        key: `district-${district}`,
        label: district,
        detail: `前往 ${district} 附近網格 ${grid.gridId}`,
        grid: withDistrict(grid),
      });
    });

    // 保留舊搜尋邏輯（地點 alias + 網格 ID），目前依需求先註解僅保留行政區搜尋。
    // gridCells
    //   .filter((grid) => normalizeSearchText(grid.gridId).includes(query) && !usedGridIds.has(grid.gridId))
    //   .slice(0, 4)
    //   .forEach((grid) => {
    //     const location = getGridLocationName(grid);
    //     usedGridIds.add(grid.gridId);
    //     results.push({
    //       key: `grid-${grid.gridId}`,
    //       label: grid.gridId,
    //       detail: `${location} ｜ ${Math.round(grid.values.value)} ${grid.values.unit}`,
    //       grid: withDistrict(grid),
    //     });
    //   });

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
    if (search.trim()) setSearchMessage('找不到符合的行政區');
  };

  const selectedMeta = pollutantMeta.PM25;
  const gridValues   = useMemo(() => gridCells.map((g) => g.values.value), [gridCells]);
  const gridAverage  = gridValues.length ? Math.round(gridValues.reduce((s, v) => s + v, 0) / gridValues.length) : 0;
  const gridMaximum  = gridValues.length ? Math.round(Math.max(...gridValues)) : 0;
  const visibleEmissionPoints = useMemo(
    () => [
      ...(showChimneyLayer ? tedsPoints : []),
      ...(showMercuryLayer ? examPoints : []),
    ],
    [showChimneyLayer, showMercuryLayer, tedsPoints, examPoints],
  );

  const aqi       = selectedGrid?.health.aqi ?? 0;
  const aqiBadge  = getAQIBadgeBg(aqi);
  const pollValue = selectedGrid ? Math.round(selectedGrid.values.value) : 0;
  const pollColor = selectedGrid ? getPollutantColor(selectedGrid.values.value, selectedMeta.arcStandard) : '#76c476';

  return (
    <AuthGuard>
    <div style={{ position: 'relative', height: 'calc(100vh - 80px)', background: 'var(--app-bg-gradient)', overflow: 'hidden' }}>

      {/* ── Top-left controls: mode toggle + search ─────── */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: Z, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 25, padding: 4, boxShadow: '0 2px 12px rgba(58,30,45,0.12)', border: `1px solid ${palette.borderSoft}`, alignSelf: 'flex-start' }}>
          {(['NOW', 'FORECAST'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '7px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
              backgroundColor: mode === m ? palette.primaryDeep : 'transparent',
              color: mode === m ? '#fff' : palette.textSecondary,
              fontSize: 13, fontWeight: 700, transition: 'all 0.18s',
            }}>
              {m === 'NOW' ? '即時監測' : '預報模式'}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', width: 300 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 25,
            padding: '9px 16px',
            boxShadow: '0 2px 12px rgba(58,30,45,0.12)', border: `1px solid ${palette.borderSoft}`,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={palette.textSecondary} strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchMessage('');
              }}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitSearch();
                }
                if (e.key === 'Escape') setSearchFocused(false);
              }}
              placeholder="搜尋行政區"
              style={{
                flex: 1, minWidth: 0, border: 'none', background: 'transparent',
                fontSize: 13, color: palette.textMain, outline: 'none',
              }}
            />
            {search && (
              <button onClick={() => {
                setSearch('');
                setSearchMessage('');
                setSearchFocused(false);
              }} style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: palette.textSecondary, fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0,
              }}>×</button>
            )}
          </div>

          {(searchFocused && search.trim()) && (
            <div style={{
              position: 'absolute', top: 48, left: 0, right: 0,
              background: 'rgba(255,255,255,0.98)', border: `1px solid ${palette.borderSoft}`,
              borderRadius: 14, boxShadow: '0 12px 32px rgba(58,30,45,0.16)',
              overflow: 'hidden', backdropFilter: 'blur(18px)',
            }}>
              {searchResults.length > 0 ? searchResults.map((result) => (
                <button
                  key={result.key}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSearchResult(result)}
                  style={{
                    width: '100%', border: 'none', background: 'transparent',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    gap: 3, padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                    borderBottom: `1px solid ${palette.borderSoft}`,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800, color: palette.textMain }}>{result.label}</span>
                  <span style={{ fontSize: 11, color: palette.textSecondary }}>{result.detail}</span>
                </button>
              )) : (
                <div style={{ padding: '12px 14px', fontSize: 12, color: palette.textSecondary }}>
                  找不到符合的行政區
                </div>
              )}
            </div>
          )}

          {searchMessage && (
            <div style={{ marginTop: 6, paddingLeft: 14, fontSize: 11, fontWeight: 700, color: '#9F1239' }}>
              {searchMessage}
            </div>
          )}

          {(tedsPointsNotice || examPointsNotice) && (
            <div style={{ marginTop: 8, marginLeft: 4, padding: '8px 12px', maxWidth: 340, borderRadius: 12, background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(154,102,27,0.22)', boxShadow: '0 8px 24px rgba(58,30,45,0.12)', color: '#7C4A03', fontSize: 12, fontWeight: 700 }}>
              {tedsPointsNotice && <div>{tedsPointsNotice}</div>}
              {examPointsNotice && <div style={{ marginTop: tedsPointsNotice ? 4 : 0 }}>{examPointsNotice}</div>}
            </div>
          )}
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, display: mode === 'FORECAST' ? 'none' : 'block' }}>
          <LeafletMap
            gridCells={showPm25GridLayer ? gridCells : []}
            tedsPoints={visibleEmissionPoints}
            mapMode={mapMode}
            onGridPress={handleGridPress}
            focusGrid={focusedGrid}
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: mode === 'FORECAST' ? 'block' : 'none' }}>
          <TGOSMap gridCells={gridCells} onGridPress={handleGridPress} focusGrid={focusedGrid} />
        </div>
      </div>

      {/* ── Legend panel (bottom-left) ────────────────────── */}
      <div style={{ position: 'absolute', left: 20, bottom: 20, zIndex: Z }}>
        <div style={{
          width: 296, backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 16,
          padding: '16px 16px 14px', border: `1px solid ${palette.borderSoft}`,
          boxShadow: '0 8px 32px rgba(23,58,94,0.14)', backdropFilter: 'blur(18px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <SecLabel title="圖層控制" />
            <span style={{ padding: '3px 9px', borderRadius: 999, background: 'rgba(49,94,143,0.10)', color: palette.primaryDeep, fontSize: 11, fontWeight: 700 }}>
              {mode === 'NOW' ? '即時' : '預報'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
            {[
              { key: 'chimney' as const, label: '點煙囪' },
              { key: 'mercury' as const, label: '汞排放' },
              { key: 'pm25' as const, label: 'PM2.5' },
            ].map((tab) => {
              const on = activeLayerInfo === tab.key;
              const visible = layerStates[tab.key];
              return (
                <div
                  key={tab.key}
                  role="button"
                  onClick={() => setActiveLayerInfo(tab.key)}
                  style={{
                    border: `1px solid ${on ? palette.primaryDeep : palette.borderSoft}`,
                    background: on ? 'rgba(49,94,143,0.12)' : 'rgba(248,249,250,0.78)',
                    color: on ? palette.primaryDeep : palette.textSecondary,
                    borderRadius: 9,
                    cursor: 'pointer',
                    padding: '6px 6px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>{tab.label}</div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleLayer(tab.key);
                    }}
                    style={{
                      width: '100%',
                      border: `1px solid ${visible ? '#315E8F66' : palette.borderSoft}`,
                      borderRadius: 7,
                      background: visible ? 'rgba(49,94,143,0.12)' : '#fff',
                      color: visible ? palette.primaryDeep : palette.textSecondary,
                      padding: '3px 0',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {visible ? '已開啟' : '已關閉'}
                  </button>
                </div>
              );
            })}
          </div>

          {activeLayerInfo === 'chimney' && (
            <div style={{ borderRadius: 10, background: 'rgba(216,225,234,0.18)', border: `1px solid ${palette.borderSoft}`, padding: '10px 11px', marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: palette.textMain }}>點源煙囪說明</p>
              <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.6, color: palette.textSecondary }}>
                來源：2021年TEDS點源工廠排放資料。顯示工業排放點位置與煙囪資訊。
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: palette.primaryDeep, fontWeight: 700 }}>目前顯示：{showChimneyLayer ? `${tedsPoints.length} 筆` : '已關閉'}</p>
            </div>
          )}

          {activeLayerInfo === 'mercury' && (
            <div style={{ borderRadius: 10, background: 'rgba(210,224,255,0.24)', border: `1px solid ${palette.borderSoft}`, padding: '10px 11px', marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: palette.textMain }}>汞排放點說明</p>
              <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.6, color: palette.textSecondary }}>
                來源：環境部固定污染源排放檢測資料（HG 汞及其化合物）。顯示排放煙道位置與煙道資訊。
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#5f6f9c', fontWeight: 700 }}>目前顯示：{showMercuryLayer ? `${examPoints.length} 筆` : '已關閉'}</p>
            </div>
          )}

          {activeLayerInfo === 'pm25' && (
            <>
              
              <p style={{ margin: '0 0 12px', fontSize: 12, lineHeight: 1.65, color: palette.textSecondary }}>{selectedMeta.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[{ label: '桃園平均', value: gridAverage }, { label: '最高網格', value: gridMaximum }].map(({ label, value }) => (
                  <div key={label} style={{ borderRadius: 10, background: 'rgba(216,225,234,0.26)', padding: '9px 12px' }}>
                    <p style={{ margin: 0, fontSize: 11, color: palette.textSecondary }}>{label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 20, fontWeight: 800, color: palette.textMain, lineHeight: 1 }}>
                      {value}<span style={{ fontSize: 10, fontWeight: 500, color: palette.textSecondary, marginLeft: 3 }}>{selectedMeta.unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Color scale — matches getGridColor in LeafletMap */}
              <div style={{ marginBottom: 5 }}><SecLabel title="濃度由低→高" /></div>
              <div style={{ height: 7, borderRadius: 999, background: 'linear-gradient(to right, rgb(0,228,0), rgb(255,255,0), rgb(255,126,0), rgb(255,0,0), rgb(126,0,35))' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {selectedMeta.range.map((r) => <span key={r} style={{ fontSize: 10, color: palette.textSecondary }}>{r}</span>)}
              </div>
            </>
          )}

          {activeLayerInfo !== 'pm25' && (
            <div style={{ marginTop: 2, fontSize: 10.5, color: '#9a8b95' }}>
              提示：此分頁為資料說明。
            </div>
          )}
        </div>
      </div>

      {/* ── Layer switcher + attribution (bottom-right) ─────── */}
      <div style={{ position: 'absolute', right: 20, bottom: 20, zIndex: Z, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        {/*
          保留地圖/衛星切換 UI（目前依需求暫停，只保留一般地圖）
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 12, padding: 5,
          boxShadow: '0 4px 16px rgba(58,30,45,0.13)', border: `1px solid ${palette.borderSoft}`,
          display: 'flex', gap: 4,
        }}>
          {([
            { mode: '2D' as const,        label: '地圖',   icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            )},
            { mode: 'Satellite' as const, label: '衛星',   icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            )},
          ] as const).map(({ mode: m, label, icon }) => {
            const on = mapMode === m;
            return (
              <button key={m} onClick={() => setMapMode(m)} style={{
                width: 58, height: 50, borderRadius: 9, border: `1.5px solid ${on ? palette.primaryDeep : 'transparent'}`,
                cursor: 'pointer', background: on ? 'rgba(49,94,143,0.08)' : 'rgba(248,249,250,0.8)',
                color: on ? palette.primaryDeep : palette.textSecondary,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                transition: 'all 0.18s',
              }}>
                {icon}
                <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
              </button>
            );
          })}
        </div>
        */}

        {/* Attribution */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.80)', padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: palette.textSecondary }}>地圖來源：</span>
          <a href={mode === 'FORECAST' ? 'https://www.tgos.tw' : 'https://www.esri.com'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: palette.primaryDeep, textDecoration: 'none', fontWeight: 600 }}>
            {mode === 'FORECAST' ? 'TGOS 國土測繪' : 'Esri'}
          </a>
        </div>
      </div>

      {/* ── Grid detail card (right side) ────────────────────── */}
      {showSheet && selectedGrid && (
        <aside style={{
          position: 'absolute', top: 20, right: 20, width: 356,
          maxHeight: 'calc(100vh - 120px)', zIndex: 1210,
          backgroundColor: 'rgba(255,255,255,0.98)', border: `1px solid ${palette.borderSoft}`,
          borderRadius: 16, boxShadow: '0 12px 48px rgba(58,30,45,0.18)',
          backdropFilter: 'blur(20px)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>

          {/* Card header */}
          <div style={{ padding: '15px 18px 14px', borderBottom: `1px solid ${palette.borderSoft}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: palette.textSecondary, fontWeight: 600 }}>點選網格</p>
                <h2 style={{ margin: '2px 0 0', fontSize: 20, color: palette.textMain, fontWeight: 800 }}>
                  {getGridLocationName(selectedGrid)}
                </h2>
              </div>
              <button onClick={() => setShowSheet(false)} aria-label="關閉" style={{
                width: 30, height: 30, borderRadius: 15, border: `1px solid ${palette.borderSoft}`,
                background: '#f4f5f6', color: palette.textSecondary, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
              }}>×</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: '4px 12px', borderRadius: 999, backgroundColor: aqiBadge.bg, color: aqiBadge.color, fontSize: 12, fontWeight: 800 }}>
                {selectedGrid.health.level}
              </span>
              <span style={{ fontSize: 11, color: palette.textSecondary }}>更新 {formatTime(selectedGrid.updatedAt)}</span>
            </div>
          </div>

          <div className="card-body" style={{ padding: '16px 18px', flex: 1, overflowY: 'auto', minHeight: 0 }}>

            {/* AQI gauge + pollutant arc */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}><SecLabel title="AQI 空氣品質指標" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'center' }}>
                <div>
                  <CardAQIGauge key={`gauge-${aqi}`} aqi={aqi} />
                  <p style={{ margin: '6px 0 0', fontSize: 10, color: palette.textSecondary, textAlign: 'center' }}>數值 0–200，越低越好</p>
                </div>
                <div>
                  <CardPollutantArc
                    key={`arc-${pollValue}-PM25`}
                    value={pollValue}
                    max={selectedMeta.arcMax}
                    standard={selectedMeta.arcStandard}
                    color={pollColor}
                    unit={selectedMeta.unit}
                    label={selectedMeta.label}
                  />
                </div>
              </div>
            </div>

            {/* Health advisory + Sensitive groups */}
            <div style={{ borderRadius: 12, border: `1px solid ${palette.borderSoft}`, padding: '12px 14px', marginBottom: 14, background: 'rgba(250,251,252,0.9)' }}>
              <div style={{ marginBottom: 8 }}><SecLabel title="健康建議" /></div>
              <p style={{ margin: '0 0 10px', color: palette.textSecondary, fontSize: 12, lineHeight: 1.65 }}>{selectedGrid.health.summary}</p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: 'rgba(216,225,234,0.35)', fontSize: 12, color: palette.textMain }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={palette.primaryDeep} strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  戶外活動：{selectedGrid.health.outdoorActivity}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, fontSize: 12, color: palette.textMain, background: selectedGrid.health.maskRequired ? 'rgba(244,67,54,0.08)' : 'rgba(118,196,118,0.12)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={selectedGrid.health.maskRequired ? '#f44336' : '#2F6B3D'} strokeWidth="2.5" strokeLinecap="round">
                    {selectedGrid.health.maskRequired
                      ? <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      : <polyline points="20 6 9 17 4 12"/>}
                  </svg>
                  {selectedGrid.health.maskRequired ? '建議配戴口罩' : '無需口罩'}
                </div>
              </div>

              {/* Sensitive group icons */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${palette.borderSoft}` }}>
                <div style={{ marginBottom: 10 }}><SecLabel title="需特別留意的族群" /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {SENSITIVE_GROUPS.map(({ key, label, icon }) => {
                    const active = selectedGrid.health.sensitiveGroups.some((g) => g.includes(key));
                    const iconColor = active ? getAQIColor(aqi) : '#c8bfcb';
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 13,
                          background: active ? `${iconColor}1a` : 'rgba(0,0,0,0.03)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: iconColor,
                          boxShadow: active ? `0 2px 8px ${iconColor}30` : 'none',
                          transition: 'all 0.22s',
                        }}>
                          {icon}
                        </div>
                        <span style={{ fontSize: 10, color: iconColor, fontWeight: active ? 700 : 500, textAlign: 'center', lineHeight: 1.3 }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Weather */}
            <div style={{ marginBottom: 8 }}><SecLabel title="當地氣象" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, marginBottom: 14 }}>
              {[
                { icon: <IconTemp />,                                            label: '溫度', value: `${selectedGrid.meteo.temp.toFixed(1)}°C` },
                { icon: <IconHumidity />,                                        label: '濕度', value: `${selectedGrid.meteo.humidity.toFixed(0)}%` },
                { icon: <IconWind />,                                            label: '風速', value: `${selectedGrid.meteo.windSpeed.toFixed(1)} m/s` },
                { icon: <IconCompass deg={selectedGrid.meteo.windDir} />,        label: '風向', value: `${selectedGrid.meteo.windDir.toFixed(0)}°` },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ borderRadius: 10, background: 'rgba(249,250,251,0.95)', padding: '9px 6px', textAlign: 'center', border: `1px solid ${palette.borderSoft}` }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: palette.primaryDeep }}>{icon}</div>
                  <p style={{ margin: '0 0 2px', color: palette.textSecondary, fontSize: 10 }}>{label}</p>
                  <p style={{ margin: 0, color: palette.textMain, fontSize: 11, fontWeight: 700 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}

      <MapLoadingOverlay isLoading={isLoading} />
    </div>
    </AuthGuard>
  );
}
