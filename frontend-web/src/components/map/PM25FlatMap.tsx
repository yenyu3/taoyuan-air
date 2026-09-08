'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttributionControl, Map, useControl, type MapRef } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer, PickingInfo } from '@deck.gl/core';
import { LineLayer, PolygonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { LocateFixed, Maximize2 } from 'lucide-react';
import type { ExamPoint, GridCell, TEDSPoint } from '@shared/types';
import { getGridLocationName } from '@/app/map/_lib/search';
import { getPm25Rgb, getPm25Status } from '@/app/map/_lib/mapColors';
import { HIGH_RISK_THRESHOLD } from '@/app/map/_lib/mapStats';
import styles from './PM25FlatMap.module.css';
import 'mapbox-gl/dist/mapbox-gl.css';

type EmissionPoint = TEDSPoint | ExamPoint;
type RenderPoint = EmissionPoint & { layerKind: 'chimney' | 'mercury' };
interface SourceHighlightPoint {
  id: string;
  name: string;
  latLng: {
    latitude: number;
    longitude: number;
  };
  source: string;
  color: string;
}

interface PM25FlatMapProps {
  gridCells: GridCell[];
  chimneyPoints?: TEDSPoint[];
  mercuryPoints?: ExamPoint[];
  showPm25GridLayer?: boolean;
  showChimneyLayer?: boolean;
  showMercuryLayer?: boolean;
  showWindLayer?: boolean;
  selectedGrid?: GridCell | null;
  onGridPress?: (grid: GridCell) => void;
  focusGrid?: GridCell | null;
  sourceHighlightPoints?: SourceHighlightPoint[];
}

const MAP_CENTER = { longitude: 121.22, latitude: 24.99 };
const INITIAL_ZOOM = 10.5;
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function sourceHighlightBounds(points: SourceHighlightPoint[]) {
  if (points.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  points.forEach((point) => {
    minLng = Math.min(minLng, point.latLng.longitude);
    maxLng = Math.max(maxLng, point.latLng.longitude);
    minLat = Math.min(minLat, point.latLng.latitude);
    maxLat = Math.max(maxLat, point.latLng.latitude);
  });
  return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
}

function DeckGLOverlay(props: ConstructorParameters<typeof MapboxOverlay>[0]) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const deckTooltip = ({ object, layer }: PickingInfo) => {
  if (!object || !layer) return null;

  if (layer.id === 'pm25-grid') {
    const grid = object as GridCell;
    return {
      text: `${getGridLocationName(grid)}\nPM2.5 ${Math.round(grid.values.value)} ${grid.values.unit}\n${getPm25Status(grid.values.value)} · AQI ${grid.health.aqi}`,
    };
  }

  if (layer.id === 'emission-points') {
    const point = object as RenderPoint;
    const kind = point.layerKind === 'mercury' ? '汞排放點' : '點煙囪';
    const height = 'heightM' in point && point.heightM ? `\n煙囪高度 ${Math.round(point.heightM)} m` : '';
    return { text: `${kind}\n${point.name || point.id}${height}` };
  }

  if (layer.id === 'source-highlight-points') {
    const point = object as SourceHighlightPoint;
    return { text: `${point.source}\n${point.name}` };
  }

  return null;
};

interface WindStreak {
  source: [number, number];
  target: [number, number];
  alpha: number;
}

/** 由網格中心與風向產生會沿風向漂移的短流線，純氛圍效果。 */
function buildWindStreaks(gridCells: GridCell[], phase: number): WindStreak[] {
  const streaks: WindStreak[] = [];
  for (const grid of gridCells) {
    const speed = grid.meteo.windSpeed;
    if (!Number.isFinite(speed) || speed < 0.4) continue;
    const rad = ((grid.meteo.windDir + 180) * Math.PI) / 180; // 氣象風向為「來向」，畫「去向」
    const dx = Math.sin(rad);
    const dy = Math.cos(rad);
    const len = Math.min(0.006, 0.0016 + speed * 0.0006);
    const { longitude: cx, latitude: cy } = grid.centerLatLng;

    for (let i = 0; i < 2; i += 1) {
      const local = (phase + i * 0.5) % 1;
      const travel = 0.011;
      const baseX = cx - dx * travel * 0.5 + dx * travel * local;
      const baseY = cy - dy * travel * 0.5 + dy * travel * local;
      const fade = Math.sin(local * Math.PI); // 兩端淡、中間亮
      streaks.push({
        source: [baseX, baseY],
        target: [baseX + dx * len, baseY + dy * len],
        alpha: Math.round(70 * fade),
      });
    }
  }
  return streaks;
}

export default function PM25FlatMap({
  gridCells,
  chimneyPoints = [],
  mercuryPoints = [],
  showPm25GridLayer = true,
  showChimneyLayer = true,
  showMercuryLayer = true,
  showWindLayer = true,
  selectedGrid,
  onGridPress,
  focusGrid,
  sourceHighlightPoints = [],
}: PM25FlatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  // 只脈動「最嚴重」的少數格，避免高污染情境下整張圖都是紅框而失去指示性。
  const hotspotGrids = useMemo(() => {
    const severe = gridCells
      .filter((grid) => grid.values.value > Math.max(HIGH_RISK_THRESHOLD + 36, 90))
      .sort((a, b) => b.values.value - a.values.value);
    return severe.slice(0, 14);
  }, [gridCells]);

  const visiblePoints = useMemo<RenderPoint[]>(
    () => [
      ...(showChimneyLayer ? chimneyPoints.map((point) => ({ ...point, layerKind: 'chimney' as const })) : []),
      ...(showMercuryLayer ? mercuryPoints.map((point) => ({ ...point, layerKind: 'mercury' as const })) : []),
    ],
    [chimneyPoints, mercuryPoints, showChimneyLayer, showMercuryLayer],
  );

  // 單一動畫迴圈：驅動高污染格呼吸外框與風流線。
  const animate = showWindLayer || hotspotGrids.length > 0;
  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (now - last > 55 && document.visibilityState === 'visible') {
        last = now;
        setTick((value) => (value + 1) % 100000);
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [animate]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const resize = () => window.requestAnimationFrame(() => mapRef.current?.getMap().resize());
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    if (!focusGrid) return;
    mapRef.current?.getMap().flyTo({
      center: [focusGrid.centerLatLng.longitude, focusGrid.centerLatLng.latitude],
      zoom: 12.2,
      duration: 900,
      curve: 1.42,
      essential: true,
    });
  }, [focusGrid]);

  useEffect(() => {
    if (!ready) return;
    const bounds = sourceHighlightBounds(sourceHighlightPoints);
    const map = mapRef.current?.getMap();
    if (!bounds || !map) return;
    map.fitBounds(bounds, {
      padding: 84,
      maxZoom: sourceHighlightPoints.length === 1 ? 13.4 : 11.8,
      duration: 900,
    });
  }, [ready, sourceHighlightPoints]);

  const resetView = useCallback(() => {
    mapRef.current?.getMap().easeTo({
      center: [MAP_CENTER.longitude, MAP_CENTER.latitude],
      zoom: INITIAL_ZOOM,
      duration: 700,
    });
  }, []);

  const locateSelected = useCallback(() => {
    if (!selectedGrid) return;
    mapRef.current?.getMap().flyTo({
      center: [selectedGrid.centerLatLng.longitude, selectedGrid.centerLatLng.latitude],
      zoom: 12.6,
      duration: 700,
      essential: true,
    });
  }, [selectedGrid]);

  const phase = (tick % 48) / 48;

  const layers = useMemo<Layer[]>(() => {
    const deckLayers: Layer[] = [];

    if (showWindLayer) {
      deckLayers.push(
        new LineLayer<WindStreak>({
          id: 'wind-flow',
          data: buildWindStreaks(gridCells, phase),
          getSourcePosition: (streak) => streak.source,
          getTargetPosition: (streak) => streak.target,
          getColor: (streak) => [86, 112, 122, streak.alpha],
          getWidth: 1.4,
          widthUnits: 'pixels',
          pickable: false,
        }),
      );
    }

    if (showPm25GridLayer) {
      deckLayers.push(
        new PolygonLayer<GridCell>({
          id: 'pm25-grid',
          data: gridCells,
          getPolygon: (grid) => grid.polygonCoords.map((coord) => [coord.longitude, coord.latitude]),
          getFillColor: (grid) => {
            const [r, g, b] = getPm25Rgb(grid.values.value);
            return [r, g, b, 102];
          },
          getLineColor: (grid) => {
            const [r, g, b] = getPm25Rgb(grid.values.value);
            return [Math.round(r * 0.78), Math.round(g * 0.78), Math.round(b * 0.78), 40];
          },
          getLineWidth: 1,
          lineWidthUnits: 'pixels',
          extruded: false,
          stroked: true,
          filled: true,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 70],
          transitions: { getFillColor: 260 },
          onClick: ({ object }) => {
            if (object) onGridPress?.(object);
          },
        }),
      );
    }

    if (showPm25GridLayer && hotspotGrids.length > 0) {
      const pulse = 0.32 + 0.5 * (0.5 + 0.5 * Math.sin((tick / 44) * Math.PI * 2));
      deckLayers.push(
        new PolygonLayer<GridCell>({
          id: 'pm25-hotspot-pulse',
          data: hotspotGrids,
          getPolygon: (grid) => grid.polygonCoords.map((coord) => [coord.longitude, coord.latitude]),
          filled: false,
          stroked: true,
          getLineColor: [150, 36, 58, Math.round(pulse * 255)],
          getLineWidth: 2.4,
          lineWidthUnits: 'pixels',
          updateTriggers: { getLineColor: tick },
          pickable: false,
        }),
      );
    }

    if (selectedGrid) {
      deckLayers.push(
        new PolygonLayer<GridCell>({
          id: 'pm25-selected',
          data: [selectedGrid],
          getPolygon: (grid) => grid.polygonCoords.map((coord) => [coord.longitude, coord.latitude]),
          filled: false,
          stroked: true,
          getLineColor: [106, 141, 115, 255],
          getLineWidth: 3,
          lineWidthUnits: 'pixels',
          pickable: false,
        }),
      );
    }

    deckLayers.push(
      new ScatterplotLayer<RenderPoint>({
        id: 'emission-points',
        data: visiblePoints,
        getPosition: (point) => [point.latLng.longitude, point.latLng.latitude],
        getRadius: (point) => (point.layerKind === 'mercury' ? 78 : 46),
        getFillColor: (point) => (point.layerKind === 'mercury' ? [124, 90, 166, 220] : [47, 107, 85, 210]),
        getLineColor: [255, 255, 255, 230],
        getLineWidth: 1.4,
        radiusUnits: 'meters',
        radiusMinPixels: 2.5,
        radiusMaxPixels: 9,
        stroked: true,
        filled: true,
        pickable: true,
      }),
    );

    if (sourceHighlightPoints.length > 0) {
      deckLayers.push(
        new ScatterplotLayer<SourceHighlightPoint>({
          id: 'source-highlight-points',
          data: sourceHighlightPoints,
          getPosition: (point) => [point.latLng.longitude, point.latLng.latitude],
          getRadius: 130,
          getFillColor: [190, 82, 58, 230],
          getLineColor: [255, 255, 255, 245],
          getLineWidth: 2,
          radiusUnits: 'meters',
          radiusMinPixels: 7,
          radiusMaxPixels: 18,
          stroked: true,
          filled: true,
          pickable: true,
        }),
        new TextLayer<SourceHighlightPoint>({
          id: 'source-highlight-labels',
          data: sourceHighlightPoints.slice(0, 80),
          characterSet: 'auto',
          getPosition: (point) => [point.latLng.longitude, point.latLng.latitude],
          getText: (point) => point.name,
          getSize: 12,
          getPixelOffset: [0, -18],
          getColor: [45, 49, 41, 230],
          getBackgroundColor: [255, 255, 255, 220],
          background: true,
          backgroundPadding: [5, 3],
          billboard: true,
          pickable: false,
        }),
      );
    }

    return deckLayers;
  }, [gridCells, hotspotGrids, onGridPress, phase, selectedGrid, showPm25GridLayer, showWindLayer, sourceHighlightPoints, tick, visiblePoints]);

  if (!MAPBOX_TOKEN) {
    return null;
  }

  return (
    <div className={ready ? `${styles.mapShell} ${styles.mapShellReady}` : styles.mapShell} ref={containerRef}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: MAP_CENTER.longitude,
          latitude: MAP_CENTER.latitude,
          zoom: INITIAL_ZOOM,
          pitch: 0,
          bearing: 0,
        }}
        maxPitch={0}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        onLoad={() => {
          mapRef.current?.getMap().resize();
          setReady(true);
        }}
        onError={() => setReady(true)}
      >
        <AttributionControl compact position="bottom-right" />
        <DeckGLOverlay layers={layers} getTooltip={deckTooltip} />
      </Map>

      <div className={styles.hud} aria-label="地圖視角">
        <button type="button" className={styles.hudBtn} onClick={resetView} title="重設視角" aria-label="重設視角">
          <Maximize2 size={17} />
        </button>
        <button
          type="button"
          className={styles.hudBtn}
          onClick={locateSelected}
          disabled={!selectedGrid}
          title="定位選取網格"
          aria-label="定位選取網格"
        >
          <LocateFixed size={17} />
        </button>
      </div>
    </div>
  );
}
