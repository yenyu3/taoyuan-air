'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttributionControl, Map, useControl, type MapRef } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { AmbientLight, DirectionalLight, LightingEffect, type Layer, type PickingInfo } from '@deck.gl/core';
import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { LocateFixed, MoonStar, RotateCcw, Square, SunMedium } from 'lucide-react';
import type { Map as MapboxMap } from 'mapbox-gl';
import type { ExamPoint, GridCell, TEDSPoint } from '@shared/types';
import { getGridLocationName } from '@/app/map/_lib/search';
import { getPm25Rgb, getPm25Status } from '@/app/map/_lib/mapColors';
import styles from './PM25SceneMap.module.css';
import 'mapbox-gl/dist/mapbox-gl.css';

type CameraMode = 'top' | 'tilt';
type LightPreset = 'day' | 'dusk' | 'night';
type EmissionPoint = TEDSPoint | ExamPoint;
type RenderPoint = EmissionPoint & { layerKind: 'chimney' | 'mercury' };

interface PM25SceneMapProps {
  gridCells: GridCell[];
  chimneyPoints?: TEDSPoint[];
  mercuryPoints?: ExamPoint[];
  showPm25GridLayer?: boolean;
  showChimneyLayer?: boolean;
  showMercuryLayer?: boolean;
  showParticleLayer?: boolean;
  autoCruise?: boolean;
  selectedGrid?: GridCell | null;
  onGridPress?: (grid: GridCell) => void;
  focusGrid?: GridCell | null;
}

const MAP_CENTER = { longitude: 121.24, latitude: 24.97 };
const MAP_STYLE = 'mapbox://styles/mapbox/standard';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const PARTICLE_MIN_PM25 = 46;
const PARTICLE_BUDGET = 2600;
const HOTSPOT_COUNT = 6;

/** 以網格中心產生六邊形頂點（經緯度），做出「六角濃度地景」而非方格拉高。 */
const HEX_RADIUS_DEG = 0.0072;
function hexAround(
  { longitude, latitude }: GridCell['centerLatLng'],
  radiusDeg = HEX_RADIUS_DEG,
): [number, number][] {
  const lonScale = 1 / Math.max(0.2, Math.cos((latitude * Math.PI) / 180));
  const points: [number, number][] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI / 6 + (i * Math.PI) / 3;
    points.push([
      longitude + radiusDeg * Math.cos(angle) * lonScale,
      latitude + radiusDeg * Math.sin(angle),
    ]);
  }
  return points;
}

const fract = (x: number) => x - Math.floor(x);
const pseudo = (seed: number) => fract(Math.sin(seed) * 43758.5453);

interface DriftParticle {
  position: [number, number, number];
  color: [number, number, number, number];
  radius: number;
}

/** 高污染網格上空的飄浮微粒：數量 ∝ 濃度，沿風向漂移並緩慢上升後淡出重生。 */
function buildParticles(gridCells: GridCell[], time: number): DriftParticle[] {
  const out: DriftParticle[] = [];
  let budget = PARTICLE_BUDGET;

  for (let c = 0; c < gridCells.length && budget > 0; c += 1) {
    const cell = gridCells[c];
    const value = cell.values.value;
    if (!Number.isFinite(value) || value < PARTICLE_MIN_PM25) continue;

    const count = Math.min(56, Math.round((value - 40) / 5.5));
    const windRad = ((cell.meteo.windDir + 180) * Math.PI) / 180;
    const wx = Math.sin(windRad);
    const wy = Math.cos(windRad);
    const [r, g, b] = getPm25Rgb(value);
    const { longitude: cx, latitude: cy } = cell.centerLatLng;
    const lonScale = 1 / Math.max(0.2, Math.cos((cy * Math.PI) / 180));

    for (let i = 0; i < count && budget > 0; i += 1, budget -= 1) {
      const s1 = pseudo(c * 53.17 + i * 12.9898);
      const s2 = pseudo(c * 91.37 + i * 78.233);
      const s3 = pseudo(c * 27.61 + i * 37.719);
      const cycle = fract(time * (0.045 + s3 * 0.035) + s1);
      const altitude = 40 + cycle * 540;
      const drift = (0.004 + s2 * 0.012) * cycle * 2.4;
      const fade = Math.sin(cycle * Math.PI);
      out.push({
        position: [
          cx + (s1 - 0.5) * 0.013 * lonScale + wx * drift * lonScale,
          cy + (s2 - 0.5) * 0.013 + wy * drift,
          altitude,
        ],
        color: [r, g, b, Math.round(26 + fade * 92)],
        radius: 1.3 + s3 * 1.9,
      });
    }
  }
  return out;
}

const VIEWS: Record<CameraMode, { pitch: number; bearing: number; zoom: number }> = {
  top: { pitch: 0, bearing: 0, zoom: 10.4 },
  tilt: { pitch: 52, bearing: -18, zoom: 10.5 },
};

const LIGHT_CYCLE: LightPreset[] = ['day', 'dusk', 'night'];
const LIGHT_LABEL: Record<LightPreset, string> = { day: '日光', dusk: '黃昏', night: '夜晚' };

const ambientLight = new AmbientLight({ color: [255, 255, 255], intensity: 1.15 });
const directionalLight = new DirectionalLight({
  color: [255, 246, 232],
  intensity: 1.75,
  direction: [-3, -5, -8],
});
const DECK_EFFECTS = [new LightingEffect({ ambientLight, directionalLight })];

function DeckGLOverlay(props: ConstructorParameters<typeof MapboxOverlay>[0]) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const deckTooltip = ({ object, layer }: PickingInfo) => {
  if (!object || !layer) return null;

  if (layer.id === 'pm25-hex') {
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

  return null;
};

function setupScene(map: MapboxMap, lightPreset: LightPreset) {
  try {
    map.setConfigProperty('basemap', 'lightPreset', lightPreset);
    map.setConfigProperty('basemap', 'show3dObjects', true);
    map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
    map.setConfigProperty('basemap', 'showTransitLabels', false);
  } catch (error) {
    console.warn('Mapbox Standard config unavailable', error);
  }

  try {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    }
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.7 });
    map.setFog({
      range: [1.5, 12],
      color: 'rgb(234, 240, 235)',
      'high-color': 'rgb(206, 223, 233)',
      'horizon-blend': 0.13,
      'space-color': 'rgb(210, 224, 222)',
      'star-intensity': lightPreset === 'night' ? 0.15 : 0,
    });
  } catch (error) {
    console.warn('3D terrain/fog could not be initialised', error);
  }
}

export default function PM25SceneMap({
  gridCells,
  chimneyPoints = [],
  mercuryPoints = [],
  showPm25GridLayer = true,
  showChimneyLayer = true,
  showMercuryLayer = true,
  showParticleLayer = true,
  autoCruise = true,
  selectedGrid,
  onGridPress,
  focusGrid,
}: PM25SceneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const [ready, setReady] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('tilt');
  const [lightPreset, setLightPreset] = useState<LightPreset>('day');
  const [tick, setTick] = useState(0);
  const cameraModeRef = useRef(cameraMode);
  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  const selectedGridId = selectedGrid?.gridId ?? null;

  const hotspots = useMemo(
    () =>
      [...gridCells]
        .filter((grid) => Number.isFinite(grid.values.value) && grid.values.value >= 72)
        .sort((a, b) => b.values.value - a.values.value)
        .slice(0, HOTSPOT_COUNT),
    [gridCells],
  );

  const particlesActive = showParticleLayer && showPm25GridLayer && cameraMode === 'tilt';
  const animateScene = particlesActive || hotspots.length > 0;

  useEffect(() => {
    if (!animateScene) return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (now - last > 55 && document.visibilityState === 'visible') {
        last = now;
        setTick((value) => (value + 1) % 1_000_000);
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [animateScene]);

  const visiblePoints = useMemo<RenderPoint[]>(
    () => [
      ...(showChimneyLayer ? chimneyPoints.map((point) => ({ ...point, layerKind: 'chimney' as const })) : []),
      ...(showMercuryLayer ? mercuryPoints.map((point) => ({ ...point, layerKind: 'mercury' as const })) : []),
    ],
    [chimneyPoints, mercuryPoints, showChimneyLayer, showMercuryLayer],
  );

  const moveCamera = useCallback((mode: CameraMode) => {
    const view = VIEWS[mode];
    mapRef.current?.getMap().easeTo({
      pitch: view.pitch,
      bearing: view.bearing,
      zoom: view.zoom,
      duration: 850,
    });
    setCameraMode(mode);
  }, []);

  const resetCamera = useCallback(() => {
    const view = VIEWS[cameraModeRef.current];
    mapRef.current?.getMap().easeTo({
      center: [MAP_CENTER.longitude, MAP_CENTER.latitude],
      pitch: view.pitch,
      bearing: view.bearing,
      zoom: view.zoom,
      duration: 850,
    });
  }, []);

  const locateSelected = useCallback(() => {
    if (!selectedGrid) return;
    const view = VIEWS[cameraModeRef.current];
    mapRef.current?.getMap().flyTo({
      center: [selectedGrid.centerLatLng.longitude, selectedGrid.centerLatLng.latitude],
      zoom: 13.4,
      pitch: view.pitch,
      duration: 900,
      essential: true,
    });
  }, [selectedGrid]);

  const cycleLight = useCallback(() => {
    setLightPreset((current) => {
      const next = LIGHT_CYCLE[(LIGHT_CYCLE.indexOf(current) + 1) % LIGHT_CYCLE.length];
      const map = mapRef.current?.getMap();
      try {
        map?.setConfigProperty('basemap', 'lightPreset', next);
        map?.setFog({ 'star-intensity': next === 'night' ? 0.15 : 0 });
      } catch {
        /* Standard style not ready */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!focusGrid) return;
    const view = VIEWS[cameraModeRef.current];
    mapRef.current?.getMap().flyTo({
      center: [focusGrid.centerLatLng.longitude, focusGrid.centerLatLng.latitude],
      zoom: 12.6,
      pitch: view.pitch,
      duration: 900,
      curve: 1.42,
      essential: true,
    });
  }, [focusGrid]);

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

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.resize();
    setupScene(map, lightPreset);
    setReady(true);
  }, [lightPreset]);

  // 待機時緩慢巡航；任何操作後暫停 12 秒。
  useEffect(() => {
    if (!autoCruise || !ready) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    let raf = 0;
    let last = 0;
    let pausedUntil = performance.now() + 3000;
    const nudge = () => {
      pausedUntil = performance.now() + 12000;
    };
    const events = ['mousedown', 'wheel', 'touchstart', 'dragstart'] as const;
    events.forEach((event) => map.on(event, nudge));

    const loop = (now: number) => {
      if (
        now - last > 32 &&
        now > pausedUntil &&
        document.visibilityState === 'visible' &&
        !map.isMoving()
      ) {
        last = now;
        map.setBearing(map.getBearing() + 0.05);
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(raf);
      events.forEach((event) => map.off(event, nudge));
    };
  }, [autoCruise, ready]);

  const elevationScale = cameraMode === 'top' ? 0.02 : 1;

  const staticLayers = useMemo<Layer[]>(() => {
    const deckLayers: Layer[] = [];

    if (showPm25GridLayer && gridCells.length > 0) {
      deckLayers.push(
        new PolygonLayer<GridCell>({
          id: 'pm25-hex',
          data: gridCells,
          getPolygon: (grid) => hexAround(grid.centerLatLng),
          getFillColor: (grid) => {
            const [r, g, b] = getPm25Rgb(grid.values.value);
            const dimmed = selectedGridId !== null && grid.gridId !== selectedGridId;
            return [r, g, b, dimmed ? 58 : 186];
          },
          getLineColor: (grid) => {
            const highlight = grid.gridId === selectedGridId;
            return highlight ? [255, 255, 255, 235] : [255, 255, 255, 70];
          },
          getLineWidth: (grid) => (grid.gridId === selectedGridId ? 22 : 5),
          getElevation: (grid) => {
            const value = Number.isFinite(grid.values.value) ? Math.max(0, Math.min(160, grid.values.value)) : 0;
            return Math.max(40, value * 13);
          },
          elevationScale,
          extruded: true,
          stroked: true,
          filled: true,
          wireframe: false,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 70],
          material: { ambient: 0.48, diffuse: 0.6, shininess: 24, specularColor: [216, 232, 224] },
          transitions: { elevationScale: 480, getElevation: 360, getFillColor: 220 },
          updateTriggers: {
            elevationScale: cameraMode,
            getFillColor: selectedGridId,
            getLineColor: selectedGridId,
            getLineWidth: selectedGridId,
          },
          onClick: (info) => {
            const grid = info.object as GridCell | undefined;
            if (!grid) return false;
            onGridPress?.(grid);
            return true;
          },
        }),
      );
    }

    deckLayers.push(
      new ScatterplotLayer<RenderPoint>({
        id: 'emission-points',
        data: visiblePoints,
        getPosition: (point) => [
          point.latLng.longitude,
          point.latLng.latitude,
          point.layerKind === 'mercury' ? 140 : 90,
        ],
        getRadius: (point) => (point.layerKind === 'mercury' ? 90 : 55),
        getFillColor: (point) => (point.layerKind === 'mercury' ? [124, 90, 166, 224] : [47, 107, 85, 214]),
        getLineColor: [255, 255, 255, 232],
        getLineWidth: 2,
        radiusUnits: 'meters',
        radiusMinPixels: 2.5,
        radiusMaxPixels: 11,
        stroked: true,
        filled: true,
        pickable: true,
      }),
    );

    return deckLayers;
  }, [cameraMode, elevationScale, gridCells, onGridPress, selectedGridId, showPm25GridLayer, visiblePoints]);

  const animatedLayers = useMemo<Layer[]>(() => {
    const deckLayers: Layer[] = [];

    if (showPm25GridLayer && hotspots.length > 0) {
      const beamPulse = 0.5 + 0.5 * Math.sin((tick / 20) * Math.PI);
      deckLayers.push(
        new PolygonLayer<GridCell>({
          id: 'pm25-hotspot-beams',
          data: hotspots,
          getPolygon: (grid) => hexAround(grid.centerLatLng, HEX_RADIUS_DEG * 0.34),
          getElevation: (grid) => Math.min(160, grid.values.value) * 20,
          elevationScale,
          extruded: true,
          filled: true,
          stroked: false,
          getFillColor: (grid) => {
            const [r, g, b] = getPm25Rgb(grid.values.value);
            return [Math.min(255, r + 40), Math.min(255, g + 24), Math.min(255, b + 40), Math.round(120 + beamPulse * 110)];
          },
          material: false,
          updateTriggers: { getFillColor: tick, elevationScale: cameraMode },
          pickable: false,
        }),
        new ScatterplotLayer<GridCell>({
          id: 'pm25-hotspot-glow',
          data: hotspots,
          getPosition: (grid) => [
            grid.centerLatLng.longitude,
            grid.centerLatLng.latitude,
            Math.min(160, grid.values.value) * 20 * elevationScale + 30,
          ],
          getRadius: 6 + beamPulse * 4,
          getFillColor: (grid) => {
            const [r, g, b] = getPm25Rgb(grid.values.value);
            return [Math.min(255, r + 70), Math.min(255, g + 55), Math.min(255, b + 70), 220];
          },
          radiusUnits: 'pixels',
          stroked: false,
          billboard: true,
          updateTriggers: { getPosition: [tick, cameraMode], getRadius: tick, getFillColor: tick },
          pickable: false,
        }),
      );
    }

    if (particlesActive) {
      deckLayers.push(
        new ScatterplotLayer<DriftParticle>({
          id: 'pm25-particles',
          data: buildParticles(gridCells, tick * 0.055),
          getPosition: (particle) => particle.position,
          getFillColor: (particle) => particle.color,
          getRadius: (particle) => particle.radius,
          radiusUnits: 'pixels',
          billboard: true,
          stroked: false,
          filled: true,
          pickable: false,
          updateTriggers: { getPosition: tick, getFillColor: tick },
        }),
      );
    }

    return deckLayers;
  }, [cameraMode, elevationScale, gridCells, hotspots, particlesActive, showPm25GridLayer, tick]);

  const layers = useMemo(() => [...staticLayers, ...animatedLayers], [staticLayers, animatedLayers]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={styles.mapShell}>
        <div className={styles.tokenMissing}>
          <div className={styles.tokenMissingPanel}>
            <strong>需要 Mapbox Access Token</strong>
            <p>請在 frontend-web/.env.local 加入 NEXT_PUBLIC_MAPBOX_TOKEN，並重啟 Next.js dev server。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={ready ? `${styles.mapShell} ${styles.mapShellReady}` : styles.mapShell} ref={containerRef}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: MAP_CENTER.longitude,
          latitude: MAP_CENTER.latitude,
          zoom: VIEWS.tilt.zoom,
          pitch: VIEWS.tilt.pitch,
          bearing: VIEWS.tilt.bearing,
        }}
        maxPitch={80}
        mapStyle={MAP_STYLE}
        onLoad={handleLoad}
        onError={() => setReady(true)}
        attributionControl={false}
      >
        <AttributionControl compact position="bottom-right" />
        <DeckGLOverlay effects={DECK_EFFECTS} layers={layers} getTooltip={deckTooltip} />
      </Map>

      <div className={styles.hud} aria-label="3D 地圖視角">
        <button
          type="button"
          className={cameraMode === 'top' ? styles.iconButtonActive : styles.iconButton}
          onClick={() => moveCamera('top')}
          title="俯視"
          aria-label="俯視"
        >
          <Square size={17} />
        </button>
        <button
          type="button"
          className={cameraMode === 'tilt' ? styles.iconButtonActive : styles.iconButton}
          onClick={() => moveCamera('tilt')}
          title="傾斜 3D"
          aria-label="傾斜 3D"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 2 7l10 5 10-5-10-5Z" />
            <path d="m2 17 10 5 10-5" />
            <path d="m2 12 10 5 10-5" />
          </svg>
        </button>
        <button type="button" className={styles.iconButton} onClick={resetCamera} title="重設視角" aria-label="重設視角">
          <RotateCcw size={17} />
        </button>
        <div className={styles.hudDivider} aria-hidden="true" />
        <button
          type="button"
          className={styles.iconButton}
          onClick={cycleLight}
          title={`光線：${LIGHT_LABEL[lightPreset]}`}
          aria-label={`切換光線，目前 ${LIGHT_LABEL[lightPreset]}`}
        >
          {lightPreset === 'night' ? <MoonStar size={17} /> : <SunMedium size={17} />}
        </button>
        <button
          type="button"
          className={styles.iconButton}
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
