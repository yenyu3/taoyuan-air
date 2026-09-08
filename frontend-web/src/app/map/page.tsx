'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { getExamPoints, getGrid, getTEDSPoints, setScenario } from '@shared/api/index';
import { DISTRICTS } from '@shared/constants/districts';
import { palette } from '@shared/constants/theme';
import { useStore } from '@shared/store';
import type { ExamPoint, GridCell, TEDSPoint } from '@shared/types';
import { DATASET_CATALOG, type DatasetSite } from '@/app/explorer/_data/datasetCatalog';
import { generateDemoExamPoints, generateDemoTEDSPoints } from './_lib/demoData';
import { computePm25GridStats } from './_lib/mapStats';
import { FORECAST_STEPS, forecastGrid, type ForecastHour } from './_lib/forecast';
import {
  getGridLocationName,
  getNearestGridToDistrict,
  normalizeSearchText,
  type SearchResult,
  withDistrict,
} from './_lib/search';
import { CommandPanel, type LayerToggleItem, type MapMode, type MapViewMode } from './_components/CommandPanel';
import { MapSearchBox } from './_components/MapSearchBox';
import { MapLegendBar } from './_components/MapLegendBar';
import { GridDetailDrawer } from './_components/GridDetailDrawer';
import { MapLoadingOverlay } from './_components/MapLoadingOverlay';
import styles from './map.module.css';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });
const PM25SceneMap = dynamic(() => import('@/components/map/PM25SceneMap'), { ssr: false });
const PM25FlatMap = dynamic(() => import('@/components/map/PM25FlatMap'), { ssr: false });

const PM25_UNIT = 'μg/m³';
const MAPBOX_ENABLED = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
const FORECAST_PLAY_MS = 1800;

export interface SourceHighlightPoint {
  id: string;
  name: string;
  latLng: {
    latitude: number;
    longitude: number;
  };
  source: string;
  color: string;
}

function compactCount(value: number) {
  return new Intl.NumberFormat('zh-TW', { notation: value >= 1000 ? 'compact' : 'standard' }).format(value);
}

/** 低效能裝置（少核心 / 少記憶體 / 行動裝置）預設關閉粒子與巡航。 */
function detectLowPower(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return cores <= 4 || memory <= 4 || mobile;
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const store = useStore();
  const { mode, setMode, setGridCells, setSelectedGridId, selectedScenario, isLoading, setIsLoading } = store;
  const gridCells: GridCell[] = store.gridCells;

  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('2d');
  const [selectedGrid, setSelectedGrid] = useState<GridCell | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [focusedGrid, setFocusedGrid] = useState<GridCell | null>(null);
  const [tedsPoints, setTedsPoints] = useState<TEDSPoint[]>([]);
  const [examPoints, setExamPoints] = useState<ExamPoint[]>([]);
  const [showChimneyLayer, setShowChimneyLayer] = useState(true);
  const [showMercuryLayer, setShowMercuryLayer] = useState(true);
  const [showPm25GridLayer, setShowPm25GridLayer] = useState(true);
  const [showWindLayer, setShowWindLayer] = useState(true);
  // 低效能裝置預設關閉粒子與巡航（3D 特效切換器要到切到 3D 才渲染，故不會造成 hydration 落差）。
  const [showParticleLayer, setShowParticleLayer] = useState(() => !detectLowPower());
  const [autoCruise, setAutoCruise] = useState(() => !detectLowPower());
  const [forecastHour, setForecastHour] = useState<ForecastHour>(0);
  const [forecastPlaying, setForecastPlaying] = useState(false);

  const requestedSourceId = searchParams.get('source');
  const requestedHighlight = searchParams.get('highlight');
  const highlightedDataset = useMemo(
    () => DATASET_CATALOG.find((dataset) => dataset.id === requestedSourceId) ?? null,
    [requestedSourceId],
  );

  useEffect(() => {
    // Guard against an earlier scenario's responses resolving after a newer one
    // and clobbering its data / turning the spinner off prematurely.
    let cancelled = false;
    setIsLoading(true);
    setScenario(selectedScenario);
    getGrid({ pollutant: 'PM25' })
      .then((cells) => {
        if (!cancelled) setGridCells(cells);
      })
      .catch((error) => {
        if (!cancelled) console.error(error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    getTEDSPoints()
      .then((points) => {
        if (!cancelled) setTedsPoints(points.length > 0 ? points : generateDemoTEDSPoints());
      })
      .catch(() => {
        if (!cancelled) setTedsPoints(generateDemoTEDSPoints());
      });

    getExamPoints()
      .then((points) => {
        if (!cancelled) setExamPoints(points.length > 0 ? points : generateDemoExamPoints(19));
      })
      .catch(() => {
        if (!cancelled) setExamPoints(generateDemoExamPoints(19));
      });

    return () => {
      cancelled = true;
    };
  }, [selectedScenario, setGridCells, setIsLoading]);

  const handleGridPress = useCallback((grid: GridCell) => {
    // Always store the canonical "now" cell (looked up in the store's grid, which
    // is never the forecast projection) so the drawer does not keep showing a
    // stale +Nh snapshot after the forecast hour changes or NOW is re-selected.
    const baseGrid = gridCells.find((cell) => cell.gridId === grid.gridId) ?? grid;
    setSelectedGrid(withDistrict(baseGrid));
    setSelectedGridId(grid.gridId);
    setShowSheet(true);
  }, [gridCells, setSelectedGridId]);

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

  const isForecast = mode === 'FORECAST';

  const activeGrid = useMemo(
    () => (isForecast ? forecastGrid(gridCells, forecastHour) : gridCells),
    [isForecast, gridCells, forecastHour],
  );

  const stats = useMemo(() => computePm25GridStats(activeGrid), [activeGrid]);

  // 抽屜迷你趨勢圖的基準：永遠取「現在」的網格數值（預報模式下 selectedGrid 可能已是預報值）。
  const selectedGridBase = useMemo(
    () =>
      selectedGrid
        ? gridCells.find((cell) => cell.gridId === selectedGrid.gridId) ?? selectedGrid
        : null,
    [gridCells, selectedGrid],
  );

  // 抽屜與地圖高亮的網格：預報模式下同步顯示所選時間點的數值。
  const resolvedSelectedGrid = useMemo(() => {
    if (!selectedGrid) return null;
    if (!isForecast || forecastHour === 0) return selectedGrid;
    const fresh = activeGrid.find((cell) => cell.gridId === selectedGrid.gridId);
    return fresh ? { ...selectedGrid, values: fresh.values, health: fresh.health } : selectedGrid;
  }, [activeGrid, forecastHour, isForecast, selectedGrid]);

  // 預報播放：每 1.8 秒推進到下一個時間點，到 +24h 後回到現在。
  useEffect(() => {
    if (!isForecast || !forecastPlaying) return;
    const timer = window.setInterval(() => {
      setForecastHour((current) => {
        const index = FORECAST_STEPS.indexOf(current);
        return FORECAST_STEPS[(index + 1) % FORECAST_STEPS.length];
      });
    }, FORECAST_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [isForecast, forecastPlaying]);

  const changeMode = useCallback(
    (next: MapMode) => {
      setMode(next);
      if (next === 'NOW') {
        setForecastHour(0);
        setForecastPlaying(false);
      }
    },
    [setMode],
  );

  const visibleEmissionPoints = useMemo(
    () => [
      ...(showChimneyLayer ? tedsPoints : []),
      ...(showMercuryLayer ? examPoints : []),
    ],
    [examPoints, showChimneyLayer, showMercuryLayer, tedsPoints],
  );

  const effectiveMapViewMode: MapViewMode = isForecast ? '2d' : mapViewMode;
  const renderSceneMap = effectiveMapViewMode === '3d' || effectiveMapViewMode === 'professional';
  const professionalMode = effectiveMapViewMode === 'professional';

  const sourceHighlightPoints = useMemo<SourceHighlightPoint[]>(() => {
    if (!highlightedDataset || !requestedHighlight) return [];

    if (highlightedDataset.id === 'teds-point' && tedsPoints.length > 0) {
      return tedsPoints.map((point) => ({
        id: `highlight-${point.id}`,
        name: point.name || point.id,
        latLng: point.latLng,
        source: highlightedDataset.name,
        color: highlightedDataset.accent,
      }));
    }

    if (highlightedDataset.id === 'exam' && examPoints.length > 0) {
      return examPoints.map((point) => ({
        id: `highlight-${point.id}`,
        name: point.name || point.id,
        latLng: point.latLng,
        source: highlightedDataset.name,
        color: highlightedDataset.accent,
      }));
    }

    return highlightedDataset.sites.map((site: DatasetSite, index) => ({
      id: `highlight-${highlightedDataset.id}-${index}`,
      name: site.name,
      latLng: {
        latitude: site.lat,
        longitude: site.lng,
      },
      source: highlightedDataset.name,
      color: highlightedDataset.accent,
    }));
  }, [examPoints, highlightedDataset, requestedHighlight, tedsPoints]);

  // 鍵盤：Esc 關抽屜、2/3 切 2D/3D（即時）、空白鍵播放/暫停預報。
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      if (event.key === 'Escape') setShowSheet(false);
      if (!isForecast && event.key === '2') setMapViewMode('2d');
      if (!isForecast && event.key === '3') setMapViewMode('3d');
      if (!isForecast && event.key === '4') setMapViewMode('professional');
      // Space on a focused control (chip / layer toggle) already activates it — don't also toggle playback.
      if (isForecast && event.key === ' ' && tag !== 'BUTTON') {
        event.preventDefault();
        setForecastPlaying((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isForecast, setMapViewMode]);

  const showWindToggle = mode === 'NOW' && effectiveMapViewMode === '2d' && MAPBOX_ENABLED;
  const show3dEffectToggles = mode === 'NOW' && renderSceneMap && MAPBOX_ENABLED;

  const layers: LayerToggleItem[] = [
    {
      key: 'pm25',
      label: 'PM2.5 網格濃度',
      detail: `${gridCells.length} 格 · 主圖層`,
      checked: showPm25GridLayer,
      color: palette.primaryDeep,
      onToggle: () => setShowPm25GridLayer((value) => !value),
    },
    ...(showWindToggle
      ? [
          {
            key: 'wind',
            label: '風向流場',
            detail: '氣象風向 · 氛圍動畫',
            checked: showWindLayer,
            color: '#4f8d7a',
            onToggle: () => setShowWindLayer((value) => !value),
          } satisfies LayerToggleItem,
        ]
      : []),
    ...(show3dEffectToggles
      ? [
          {
            key: 'particles',
            label: '汙染粒子雲',
            detail: '高濃度區上空 · 隨風飄升',
            checked: showParticleLayer,
            color: '#8a5a9c',
            onToggle: () => setShowParticleLayer((value) => !value),
          } satisfies LayerToggleItem,
          {
            key: 'cruise',
            label: '自動巡航',
            detail: '待機時緩慢環繞 · 操作即停',
            checked: autoCruise,
            color: '#4f8d7a',
            onToggle: () => setAutoCruise((value) => !value),
          } satisfies LayerToggleItem,
        ]
      : []),
    {
      key: 'chimney',
      label: '點煙囪',
      detail: `${compactCount(tedsPoints.length)} 點 · 固定污染源`,
      checked: showChimneyLayer,
      color: '#2f6b55',
      onToggle: () => setShowChimneyLayer((value) => !value),
    },
    {
      key: 'mercury',
      label: '汞排放點',
      detail: `${compactCount(examPoints.length)} 點 · 輔助判讀`,
      checked: showMercuryLayer,
      color: '#7c5aa6',
      onToggle: () => setShowMercuryLayer((value) => !value),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.mapLayer}>
        {effectiveMapViewMode === '2d' && (
          <div className={styles.mapFill}>
            {MAPBOX_ENABLED ? (
              <PM25FlatMap
                gridCells={activeGrid}
                chimneyPoints={tedsPoints}
                mercuryPoints={examPoints}
                showPm25GridLayer={showPm25GridLayer}
                showChimneyLayer={showChimneyLayer && !isForecast}
                showMercuryLayer={showMercuryLayer && !isForecast}
                showWindLayer={showWindLayer && !isForecast}
                selectedGrid={resolvedSelectedGrid}
                onGridPress={handleGridPress}
                focusGrid={focusedGrid}
                sourceHighlightPoints={sourceHighlightPoints}
              />
            ) : (
              <LeafletMap
                gridCells={showPm25GridLayer ? activeGrid : []}
                tedsPoints={isForecast ? [] : visibleEmissionPoints}
                mapMode="2D"
                onGridPress={handleGridPress}
                focusGrid={focusedGrid}
                sourceHighlightPoints={sourceHighlightPoints}
              />
            )}
          </div>
        )}

        {renderSceneMap && (
          <div className={styles.mapFill}>
            <PM25SceneMap
              gridCells={activeGrid}
              chimneyPoints={tedsPoints}
              mercuryPoints={examPoints}
              showPm25GridLayer={showPm25GridLayer}
              showChimneyLayer={showChimneyLayer}
              showMercuryLayer={showMercuryLayer}
              showParticleLayer={showParticleLayer}
              autoCruise={autoCruise}
              professionalMode={professionalMode}
              selectedGrid={resolvedSelectedGrid}
              onGridPress={handleGridPress}
              focusGrid={focusedGrid}
              sourceHighlightPoints={sourceHighlightPoints}
            />
          </div>
        )}
      </div>

      {highlightedDataset && sourceHighlightPoints.length > 0 && (
        <div className={`${styles.sourceHighlightBanner} ${styles.glass}`} aria-live="polite">
          <span>來源標註</span>
          <strong>{highlightedDataset.name}</strong>
          <span>{compactCount(sourceHighlightPoints.length)} 個點位</span>
          <button
            type="button"
            className={styles.sourceHighlightClose}
            onClick={() => router.replace('/map')}
            aria-label="關閉來源標註"
            title="關閉來源標註"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <CommandPanel
        mode={mode as MapMode}
        onModeChange={changeMode}
        viewMode={mapViewMode}
        effectiveViewMode={effectiveMapViewMode}
        onViewModeChange={setMapViewMode}
        stats={stats}
        layers={layers}
        forecastLabel={isForecast ? (forecastHour === 0 ? '現在' : `+${forecastHour}h`) : undefined}
        search={
          <MapSearchBox
            value={search}
            results={searchResults}
            message={searchMessage}
            onChange={(value) => {
              setSearch(value);
              setSearchMessage('');
            }}
            onSelect={selectSearchResult}
            onSubmit={submitSearch}
            onClear={() => {
              setSearch('');
              setSearchMessage('');
            }}
          />
        }
      />

      <MapLegendBar
        forecast={isForecast}
        forecastHour={forecastHour}
        onForecastHourChange={setForecastHour}
        playing={forecastPlaying}
        onTogglePlay={() => setForecastPlaying((value) => !value)}
        peak={stats.maximum}
        highRiskCount={stats.highRiskCount}
      />

      <GridDetailDrawer
        grid={resolvedSelectedGrid}
        baseGrid={selectedGridBase}
        open={showSheet}
        onClose={() => setShowSheet(false)}
      />

      <MapLoadingOverlay isLoading={isLoading} />
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <MapPageContent />
    </Suspense>
  );
}
