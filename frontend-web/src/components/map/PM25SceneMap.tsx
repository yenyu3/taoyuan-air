'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttributionControl, Map, useControl, type MapRef } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { AmbientLight, DirectionalLight, LightingEffect, type Layer, type PickingInfo } from '@deck.gl/core';
import { LineLayer, PolygonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
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

interface PM25SceneMapProps {
  gridCells: GridCell[];
  chimneyPoints?: TEDSPoint[];
  mercuryPoints?: ExamPoint[];
  showPm25GridLayer?: boolean;
  showChimneyLayer?: boolean;
  showMercuryLayer?: boolean;
  showParticleLayer?: boolean;
  autoCruise?: boolean;
  professionalMode?: boolean;
  selectedGrid?: GridCell | null;
  onGridPress?: (grid: GridCell) => void;
  focusGrid?: GridCell | null;
  sourceHighlightPoints?: SourceHighlightPoint[];
}

const MAP_CENTER = { longitude: 121.24, latitude: 24.97 };
const MAP_STYLE = 'mapbox://styles/mapbox/standard';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const PARTICLE_MIN_PM25 = 46;
const PARTICLE_BUDGET = 2600;
const HOTSPOT_COUNT = 6;

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

interface SourceLink {
  point: RenderPoint;
  source: [number, number, number];
  target: [number, number, number];
  distanceKm: number;
  alignment: number;
  label?: string;
}

interface DownwindMarker {
  position: [number, number, number];
  radiusM: number;
  alpha: number;
  label?: string;
}

interface WindArrow {
  polygon: [number, number, number][];
  color: [number, number, number, number];
}

/** 整個研究區的濃度量體外框（單一連續方塊，取代逐格堆疊）。 */
interface VolumeBox {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
  centerLng: number;
  centerLat: number;
  meanWindDir: number;
  meanWindSpeed: number;
  peak: number;
}

interface VolumeSlice {
  grid: GridCell;
  altitudeM: number;
  ratio: number;
}

interface VolumeWall {
  polygon: [number, number, number][];
  ratio: number;
  edge: number;
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

function polygonForGrid(grid: GridCell): [number, number][] {
  if (grid.polygonCoords.length >= 3) {
    return grid.polygonCoords.map((coord) => [coord.longitude, coord.latitude]);
  }
  return hexAround(grid.centerLatLng);
}

function windVector(windDir: number): { dx: number; dy: number } {
  const rad = ((windDir + 180) * Math.PI) / 180;
  return { dx: Math.sin(rad), dy: Math.cos(rad) };
}

function projectedKm(from: GridCell['centerLatLng'], to: GridCell['centerLatLng']) {
  const latKm = (to.latitude - from.latitude) * 111;
  const lonKm = (to.longitude - from.longitude) * 111 * Math.cos((from.latitude * Math.PI) / 180);
  return { x: lonKm, y: latKm, distance: Math.hypot(lonKm, latKm) };
}

function buildSourceLinks(selectedGrid: GridCell | null | undefined, points: RenderPoint[]): SourceLink[] {
  if (!selectedGrid || points.length === 0) return [];

  const { dx, dy } = windVector(selectedGrid.meteo.windDir);
  return points
    .map((point) => {
      const vector = projectedKm(selectedGrid.centerLatLng, point.latLng);
      const alignment = vector.distance > 0 ? -((vector.x / vector.distance) * dx + (vector.y / vector.distance) * dy) : 0;
      return {
        point,
        source: [
          point.latLng.longitude,
          point.latLng.latitude,
          point.layerKind === 'mercury'
            ? 180
            : Math.max(120, 'heightM' in point && point.heightM ? point.heightM : 90),
        ] as [number, number, number],
        target: [
          selectedGrid.centerLatLng.longitude,
          selectedGrid.centerLatLng.latitude,
          180,
        ] as [number, number, number],
        distanceKm: vector.distance,
        alignment,
      };
    })
    .filter((link) => link.distanceKm <= 14 && link.alignment > 0.25)
    .sort((a, b) => (b.alignment / Math.max(1.4, b.distanceKm)) - (a.alignment / Math.max(1.4, a.distanceKm)))
    .slice(0, 5)
    .map((link, index) => ({ ...link, label: index === 0 ? '上風來源' : undefined }));
}

function buildDownwindMarkers(selectedGrid: GridCell | null | undefined, tick: number): DownwindMarker[] {
  if (!selectedGrid) return [];

  const { dx, dy } = windVector(selectedGrid.meteo.windDir);
  const lonScale = 1 / Math.max(0.2, Math.cos((selectedGrid.centerLatLng.latitude * Math.PI) / 180));
  const pulse = 0.5 + 0.5 * Math.sin((tick / 38) * Math.PI * 2);

  return [1, 2, 3].map((step) => ({
    position: [
      selectedGrid.centerLatLng.longitude + dx * step * 0.012 * lonScale,
      selectedGrid.centerLatLng.latitude + dy * step * 0.012,
      90 + step * 34,
    ],
    radiusM: 520 + step * 270 + pulse * 120,
    alpha: Math.round(58 - step * 9 + pulse * 18),
    label: step === 2 ? '下風影響' : undefined,
  }));
}

function scaledGridPolygon(grid: GridCell, scale: number, altitudeM: number): [number, number, number][] {
  const source =
    grid.polygonCoords.length >= 3
      ? grid.polygonCoords.map((coord) => [coord.longitude, coord.latitude] as [number, number])
      : hexAround(grid.centerLatLng);
  const { longitude: cx, latitude: cy } = grid.centerLatLng;

  return source.map(([longitude, latitude]) => [
    cx + (longitude - cx) * scale,
    cy + (latitude - cy) * scale,
    altitudeM,
  ]);
}

/** 濃度量體：以整區網格外框做一塊連續的懸浮方塊。 */
const SLAB_BASE_M = 80;
const SLAB_THICKNESS_M = 920;
const SLAB_LAYERS = 13;
const WIND_ALTITUDE_M = SLAB_BASE_M + SLAB_THICKNESS_M + 90;

function computeVolumeBox(gridCells: GridCell[]): VolumeBox | null {
  const finite = gridCells.filter((grid) => Number.isFinite(grid.values.value));
  const strong = finite.filter((grid) => grid.values.value >= 10);
  const pool = strong.length >= 3 ? strong : finite;
  if (pool.length < 3) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let windX = 0;
  let windY = 0;
  let speed = 0;
  let peak = 0;

  pool.forEach((grid) => {
    const { longitude, latitude } = grid.centerLatLng;
    minLng = Math.min(minLng, longitude);
    maxLng = Math.max(maxLng, longitude);
    minLat = Math.min(minLat, latitude);
    maxLat = Math.max(maxLat, latitude);
    const rad = (grid.meteo.windDir * Math.PI) / 180;
    windX += Math.sin(rad);
    windY += Math.cos(rad);
    speed += grid.meteo.windSpeed;
    peak = Math.max(peak, grid.values.value);
  });

  const padLng = (maxLng - minLng) * 0.05 + 0.003;
  const padLat = (maxLat - minLat) * 0.05 + 0.003;

  return {
    minLng: minLng - padLng,
    maxLng: maxLng + padLng,
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
    centerLng: (minLng + maxLng) / 2,
    centerLat: (minLat + maxLat) / 2,
    meanWindDir: (Math.atan2(windX, windY) * 180) / Math.PI,
    meanWindSpeed: speed / pool.length,
    peak,
  };
}

/** 垂直色階：ratio 0 = 量體底部（暖／洋紅核心），1 = 頂部（冷色淡出）。 */
function verticalRampRgb(ratio: number, peak: number): [number, number, number] {
  const hot = Math.max(120, peak * 1.8);
  return getPm25Rgb(6 + (1 - ratio) * hot);
}

function buildVolumeSlices(gridCells: GridCell[], box: VolumeBox | null): VolumeSlice[] {
  if (!box) return [];
  const cells = gridCells.filter((grid) => Number.isFinite(grid.values.value) && grid.values.value >= 6);
  const slices: VolumeSlice[] = [];

  for (let layer = 0; layer < SLAB_LAYERS; layer += 1) {
    const ratio = layer / (SLAB_LAYERS - 1);
    const altitudeM = SLAB_BASE_M + ratio * SLAB_THICKNESS_M;
    cells.forEach((grid) => {
      slices.push({ grid, altitudeM, ratio });
    });
  }

  return slices;
}

function buildVolumeWalls(box: VolumeBox | null): VolumeWall[] {
  if (!box) return [];
  const walls: VolumeWall[] = [];
  const { centerLng: cx, centerLat: cy } = box;
  const corners: [number, number][] = [
    [box.minLng, box.minLat],
    [box.maxLng, box.minLat],
    [box.maxLng, box.maxLat],
    [box.minLng, box.maxLat],
  ];
  const strips = 12;
  // 牆面向外微張（上寬下窄），讓每個梯形在平面上有面積可三角化才畫得出來。
  const flare = 0.05;
  const at = (lng: number, lat: number, r: number, z: number): [number, number, number] => [
    cx + (lng - cx) * r,
    cy + (lat - cy) * r,
    z,
  ];

  for (let edge = 0; edge < 4; edge += 1) {
    const [ax, ay] = corners[edge];
    const [bx, by] = corners[(edge + 1) % 4];
    for (let s = 0; s < strips; s += 1) {
      const t0 = s / strips;
      const t1 = (s + 1) / strips;
      const r0 = 1 + flare * t0;
      const r1 = 1 + flare * t1;
      const z0 = SLAB_BASE_M + t0 * SLAB_THICKNESS_M;
      const z1 = SLAB_BASE_M + t1 * SLAB_THICKNESS_M;
      walls.push({
        polygon: [
          at(ax, ay, r0, z0),
          at(bx, by, r0, z0),
          at(bx, by, r1, z1),
          at(ax, ay, r1, z1),
        ],
        ratio: (t0 + t1) / 2,
        edge,
      });
    }
  }

  return walls;
}

function buildWindArrows(box: VolumeBox | null, tick: number): WindArrow[] {
  if (!box) return [];
  const arrows: WindArrow[] = [];
  const phase = fract(tick / 46);
  const cols = 7;
  const rows = 5;
  const { dx, dy } = windVector(box.meanWindDir);
  const px = -dy;
  const py = dx;
  const lonScale = 1 / Math.max(0.2, Math.cos((box.centerLat * Math.PI) / 180));
  const spanLng = box.maxLng - box.minLng;
  const spanLat = box.maxLat - box.minLat;
  const length = Math.min(spanLng, spanLat) * 0.11;
  const width = length * 0.32;
  const alpha = Math.round(150 + Math.sin(phase * Math.PI) * 80);

  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const baseLng = box.minLng - spanLng * 0.14 + spanLng * 1.28 * (c / (cols - 1));
      const baseLat = box.minLat - spanLat * 0.14 + spanLat * 1.28 * (r / (rows - 1));
      const drift = (phase - 0.5) * length * 2;
      const cx = baseLng + dx * drift * lonScale;
      const cy = baseLat + dy * drift;
      const point = (forward: number, side: number): [number, number, number] => [
        cx + (dx * forward + px * side) * lonScale,
        cy + dy * forward + py * side,
        WIND_ALTITUDE_M,
      ];

      arrows.push({
        polygon: [
          point(length * 0.5, 0),
          point(length * 0.1, width),
          point(length * 0.1, width * 0.4),
          point(-length * 0.5, width * 0.4),
          point(-length * 0.5, -width * 0.4),
          point(length * 0.1, -width * 0.4),
          point(length * 0.1, -width),
        ],
        color: [141, 235, 233, alpha],
      });
    }
  }

  return arrows;
}

const VIEWS: Record<CameraMode, { pitch: number; bearing: number; zoom: number }> = {
  top: { pitch: 0, bearing: 0, zoom: 10.4 },
  tilt: { pitch: 52, bearing: -18, zoom: 10.5 },
};
const PROFESSIONAL_VIEW = { pitch: 62, bearing: -32, zoom: 10.8 };

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

  if (layer.id === 'source-highlight-points') {
    const point = object as SourceHighlightPoint;
    return { text: `${point.source}\n${point.name}` };
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
  professionalMode = false,
  selectedGrid,
  onGridPress,
  focusGrid,
  sourceHighlightPoints = [],
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
  const professionalModeRef = useRef(professionalMode);
  useEffect(() => {
    professionalModeRef.current = professionalMode;
  }, [professionalMode]);

  const selectedGridId = selectedGrid?.gridId ?? null;

  const hotspots = useMemo(
    () =>
      [...gridCells]
        .filter((grid) => Number.isFinite(grid.values.value) && grid.values.value >= 72)
        .sort((a, b) => b.values.value - a.values.value)
        .slice(0, HOTSPOT_COUNT),
    [gridCells],
  );

  const volumeBox = useMemo(
    () => (professionalMode && showPm25GridLayer ? computeVolumeBox(gridCells) : null),
    [gridCells, professionalMode, showPm25GridLayer],
  );

  const volumePeak = volumeBox?.peak ?? 0;

  const particlesActive = showParticleLayer && showPm25GridLayer && cameraMode === 'tilt' && !professionalMode;
  // 只有真的有在動的內容（微粒、熱點光束、風場箭頭、下風脈動）才啟動重繪迴圈。
  const animateScene =
    particlesActive ||
    hotspots.length > 0 ||
    Boolean(volumeBox) ||
    Boolean(selectedGrid && showPm25GridLayer);

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

  const sourceLinks = useMemo(
    () => buildSourceLinks(selectedGrid, visiblePoints),
    [selectedGrid, visiblePoints],
  );

  const sourceLinkIds = useMemo(
    () => new Set(sourceLinks.map((link) => link.point.id)),
    [sourceLinks],
  );

  // 用實際命中的來源點 id 集合做 updateTrigger，避免切換到「上風來源數相同但點不同」的網格時高亮沒更新。
  const sourceLinkKey = useMemo(
    () => sourceLinks.map((link) => link.point.id).join('|'),
    [sourceLinks],
  );

  const downwindMarkers = useMemo(
    () => buildDownwindMarkers(selectedGrid, tick),
    [selectedGrid, tick],
  );

  const volumeSlices = useMemo(
    () => (volumeBox ? buildVolumeSlices(gridCells, volumeBox) : []),
    [gridCells, volumeBox],
  );

  const volumeWalls = useMemo(
    () => (volumeBox ? buildVolumeWalls(volumeBox) : []),
    [volumeBox],
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
    const view = professionalMode ? PROFESSIONAL_VIEW : VIEWS[cameraModeRef.current];
    mapRef.current?.getMap().easeTo({
      center: [MAP_CENTER.longitude, MAP_CENTER.latitude],
      pitch: view.pitch,
      bearing: view.bearing,
      zoom: view.zoom,
      duration: 850,
    });
  }, [professionalMode]);

  const locateSelected = useCallback(() => {
    if (!selectedGrid) return;
    const view = professionalMode ? PROFESSIONAL_VIEW : VIEWS[cameraModeRef.current];
    mapRef.current?.getMap().flyTo({
      center: [selectedGrid.centerLatLng.longitude, selectedGrid.centerLatLng.latitude],
      zoom: 13.4,
      pitch: view.pitch,
      duration: 900,
      essential: true,
    });
  }, [professionalMode, selectedGrid]);

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
    const view = professionalMode ? PROFESSIONAL_VIEW : VIEWS[cameraModeRef.current];
    mapRef.current?.getMap().flyTo({
      center: [focusGrid.centerLatLng.longitude, focusGrid.centerLatLng.latitude],
      zoom: 12.6,
      pitch: view.pitch,
      duration: 900,
      curve: 1.42,
      essential: true,
    });
  }, [focusGrid, professionalMode]);

  // 只在 ready 或來源高亮點位改變時重新取景；切換 3D↔專業視角不應把鏡頭拉回高亮範圍
  // （pitch 由下方專屬 effect 負責），故 professionalMode 以 ref 讀取、不列入相依。
  useEffect(() => {
    const bounds = sourceHighlightBounds(sourceHighlightPoints);
    const map = mapRef.current?.getMap();
    if (!bounds || !map || !ready) return;
    map.fitBounds(bounds, {
      padding: 96,
      maxZoom: sourceHighlightPoints.length === 1 ? 13.2 : 11.6,
      pitch: professionalModeRef.current ? PROFESSIONAL_VIEW.pitch : VIEWS[cameraModeRef.current].pitch,
      duration: 950,
      essential: true,
    });
  }, [ready, sourceHighlightPoints]);

  useEffect(() => {
    if (!ready) return;
    const target = professionalMode ? PROFESSIONAL_VIEW : VIEWS[cameraModeRef.current];
    mapRef.current?.getMap().easeTo({
      pitch: target.pitch,
      bearing: target.bearing,
      zoom: target.zoom,
      duration: 900,
    });
  }, [professionalMode, ready]);

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

  const elevationScale = cameraMode === 'top' && !professionalMode ? 0.01 : 1;

  const staticLayers = useMemo<Layer[]>(() => {
    const deckLayers: Layer[] = [];

    if (showPm25GridLayer && gridCells.length > 0) {
      deckLayers.push(
        new PolygonLayer<GridCell>({
          id: 'pm25-hex',
          data: gridCells,
          getPolygon: polygonForGrid,
          getFillColor: (grid) => {
            const [r, g, b] = getPm25Rgb(grid.values.value);
            const dimmed = selectedGridId !== null && grid.gridId !== selectedGridId;
            return [r, g, b, professionalMode ? (dimmed ? 20 : 55) : dimmed ? 42 : 138];
          },
          getLineColor: (grid) => {
            const highlight = grid.gridId === selectedGridId;
            return highlight ? [255, 255, 255, 235] : [255, 255, 255, 70];
          },
          getLineWidth: (grid) => (grid.gridId === selectedGridId ? 22 : 5),
          getElevation: (grid) => {
            const value = Number.isFinite(grid.values.value) ? Math.max(0, Math.min(160, grid.values.value)) : 0;
            const excess = Math.max(0, value - 15);
            return professionalMode ? 2 : 24 + excess * 5.4;
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
            getElevation: professionalMode,
            getFillColor: [selectedGridId, professionalMode],
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
        getRadius: (point) => {
          const related = sourceLinkIds.has(point.id);
          const base = point.layerKind === 'mercury' ? 90 : 55;
          return related ? base * 1.65 : base;
        },
        getFillColor: (point) => {
          if (sourceLinkIds.has(point.id)) return [190, 82, 58, 238];
          return point.layerKind === 'mercury' ? [124, 90, 166, 205] : [47, 107, 85, 196];
        },
        getLineColor: [255, 255, 255, 232],
        getLineWidth: 2,
        radiusUnits: 'meters',
        radiusMinPixels: 2.5,
        radiusMaxPixels: 11,
        stroked: true,
        filled: true,
        pickable: true,
        updateTriggers: {
          getRadius: sourceLinkKey,
          getFillColor: sourceLinkKey,
        },
      }),
    );

    if (sourceHighlightPoints.length > 0) {
      deckLayers.push(
        new ScatterplotLayer<SourceHighlightPoint>({
          id: 'source-highlight-points',
          data: sourceHighlightPoints,
          getPosition: (point) => [point.latLng.longitude, point.latLng.latitude, 210],
          getRadius: 150,
          getFillColor: [190, 82, 58, 236],
          getLineColor: [255, 255, 255, 245],
          getLineWidth: 2.4,
          radiusUnits: 'meters',
          radiusMinPixels: 7,
          radiusMaxPixels: 20,
          stroked: true,
          filled: true,
          pickable: true,
        }),
        new TextLayer<SourceHighlightPoint>({
          id: 'source-highlight-labels',
          data: sourceHighlightPoints.slice(0, 80),
          characterSet: 'auto',
          getPosition: (point) => [point.latLng.longitude, point.latLng.latitude, 260],
          getText: (point) => point.name,
          getSize: 13,
          getPixelOffset: [0, -18],
          getColor: [45, 49, 41, 230],
          getBackgroundColor: [255, 255, 255, 220],
          background: true,
          backgroundPadding: [6, 4],
          billboard: true,
          pickable: false,
        }),
      );
    }

    if (volumeBox && volumeWalls.length > 0) {
      deckLayers.push(
        new PolygonLayer<VolumeWall>({
          id: 'pm25-professional-volume-walls',
          data: volumeWalls,
          getPolygon: (wall) => wall.polygon,
          getFillColor: (wall) => {
            const [r, g, b] = verticalRampRgb(wall.ratio, volumePeak);
            return [r, g, b, Math.round(88 + (1 - wall.ratio) * 96)];
          },
          getLineColor: (wall) => [235, 250, 255, wall.ratio > 0.94 || wall.ratio < 0.06 ? 150 : 40],
          getLineWidth: 1,
          lineWidthUnits: 'pixels',
          stroked: true,
          filled: true,
          extruded: false,
          pickable: false,
          updateTriggers: {
            getPolygon: volumeWalls.length,
            getFillColor: [volumeWalls.length, volumePeak],
          },
        }),
      );
    }

    if (volumeBox && volumeSlices.length > 0) {
      deckLayers.push(
        new PolygonLayer<VolumeSlice>({
          id: 'pm25-professional-volume',
          data: volumeSlices,
          getPolygon: (slice) => scaledGridPolygon(slice.grid, 1, slice.altitudeM),
          getFillColor: (slice) => {
            const isCap = slice.ratio > 0.9;
            const isFloor = slice.ratio < 0.08;
            const [hr, hg, hb] = getPm25Rgb(slice.grid.values.value);
            const [vr, vg, vb] = verticalRampRgb(slice.ratio, volumePeak);
            const w = isCap ? 0.2 : 0.68;
            const alpha = isCap ? 74 : isFloor ? 58 : Math.round(14 + (1 - slice.ratio) * 12);
            return [
              Math.round(hr * (1 - w) + vr * w),
              Math.round(hg * (1 - w) + vg * w),
              Math.round(hb * (1 - w) + vb * w),
              alpha,
            ];
          },
          getLineColor: [255, 255, 255, 18],
          getLineWidth: 1,
          lineWidthUnits: 'pixels',
          stroked: true,
          filled: true,
          extruded: false,
          pickable: false,
          updateTriggers: {
            getPolygon: volumeSlices.length,
            getFillColor: [volumeSlices.length, volumePeak],
          },
        }),
      );
    }

    return deckLayers;
  }, [cameraMode, elevationScale, gridCells, onGridPress, professionalMode, selectedGridId, showPm25GridLayer, sourceHighlightPoints, sourceLinkIds, sourceLinkKey, visiblePoints, volumeBox, volumePeak, volumeSlices, volumeWalls]);

  const animatedLayers = useMemo<Layer[]>(() => {
    const deckLayers: Layer[] = [];

    if (showPm25GridLayer && hotspots.length > 0 && !professionalMode) {
      const beamPulse = 0.5 + 0.5 * Math.sin((tick / 20) * Math.PI);
      deckLayers.push(
        new PolygonLayer<GridCell>({
          id: 'pm25-hotspot-beams',
          data: hotspots,
          getPolygon: (grid) => hexAround(grid.centerLatLng, HEX_RADIUS_DEG * 0.3),
          getElevation: (grid) => 220 + Math.min(160, grid.values.value) * 7.5,
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

    if (volumeBox) {
      deckLayers.push(
        new PolygonLayer<WindArrow>({
          id: 'professional-wind-arrows',
          data: buildWindArrows(volumeBox, tick),
          getPolygon: (arrow) => arrow.polygon,
          getFillColor: (arrow) => arrow.color,
          getLineColor: [220, 250, 255, 190],
          getLineWidth: 1.2,
          lineWidthUnits: 'pixels',
          stroked: true,
          filled: true,
          extruded: false,
          pickable: false,
          updateTriggers: {
            getPolygon: tick,
            getFillColor: tick,
          },
        }),
      );
    }

    if (selectedGrid && showPm25GridLayer) {
      deckLayers.push(
        new ScatterplotLayer<DownwindMarker>({
          id: 'pm25-downwind-zone',
          data: downwindMarkers,
          getPosition: (marker) => marker.position,
          getRadius: (marker) => marker.radiusM,
          getFillColor: (marker) => {
            const [r, g, b] = getPm25Rgb(selectedGrid.values.value);
            return [r, g, b, marker.alpha];
          },
          radiusUnits: 'meters',
          stroked: true,
          getLineColor: [255, 255, 255, 88],
          getLineWidth: 1.2,
          lineWidthUnits: 'pixels',
          billboard: false,
          pickable: false,
          updateTriggers: { getPosition: tick, getRadius: tick, getFillColor: tick },
        }),
      );
    }

    if (sourceLinks.length > 0) {
      deckLayers.push(
        new LineLayer<SourceLink>({
          id: 'upwind-source-links',
          data: sourceLinks,
          getSourcePosition: (link) => link.source,
          getTargetPosition: (link) => link.target,
          getColor: (link) => [
            link.point.layerKind === 'mercury' ? 144 : 45,
            link.point.layerKind === 'mercury' ? 82 : 116,
            link.point.layerKind === 'mercury' ? 178 : 94,
            Math.round(120 + link.alignment * 110),
          ],
          getWidth: (link) => Math.max(1.8, 5.6 - link.distanceKm * 0.22),
          widthUnits: 'pixels',
          pickable: false,
        }),
        new TextLayer<SourceLink>({
          id: 'upwind-source-labels',
          data: sourceLinks.filter((link) => link.label),
          characterSet: 'auto',
          getPosition: (link) => link.source,
          getText: (link) => link.label ?? '',
          getSize: 13,
          getColor: [38, 46, 39, 225],
          getBackgroundColor: [255, 255, 255, 210],
          background: true,
          backgroundPadding: [6, 4],
          billboard: true,
          pickable: false,
        }),
      );
    }

    if (downwindMarkers.some((marker) => marker.label)) {
      deckLayers.push(
        new TextLayer<DownwindMarker>({
          id: 'downwind-zone-label',
          data: downwindMarkers.filter((marker) => marker.label),
          characterSet: 'auto',
          getPosition: (marker) => marker.position,
          getText: (marker) => marker.label ?? '',
          getSize: 13,
          getColor: [38, 46, 39, 225],
          getBackgroundColor: [255, 255, 255, 210],
          background: true,
          backgroundPadding: [6, 4],
          billboard: true,
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
  }, [cameraMode, downwindMarkers, elevationScale, gridCells, hotspots, particlesActive, professionalMode, selectedGrid, showPm25GridLayer, sourceLinks, tick, volumeBox]);

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
    <div
      className={[
        styles.mapShell,
        ready ? styles.mapShellReady : '',
        selectedGrid ? styles.mapShellDiagnostic : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={containerRef}
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: MAP_CENTER.longitude,
          latitude: MAP_CENTER.latitude,
          zoom: professionalMode ? PROFESSIONAL_VIEW.zoom : VIEWS.tilt.zoom,
          pitch: professionalMode ? PROFESSIONAL_VIEW.pitch : VIEWS.tilt.pitch,
          bearing: professionalMode ? PROFESSIONAL_VIEW.bearing : VIEWS.tilt.bearing,
        }}
        maxPitch={80}
        mapStyle={MAP_STYLE}
        onLoad={handleLoad}
        onError={() => setReady(true)}
        attributionControl={false}
      >
        <AttributionControl compact position="bottom-left" />
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

      {professionalMode && (
        <div className={styles.professionalBadge} aria-live="polite">
          <strong>專業視角</strong>
          <span>風場箭頭動畫 / PM2.5 厚度層</span>
        </div>
      )}

      {selectedGrid && (
        <div className={styles.diagnosticPanel} aria-live="polite">
          <div className={styles.diagnosticHeader}>
            <span>3D 診斷</span>
            <strong>{getGridLocationName(selectedGrid)}</strong>
          </div>
          <div className={styles.diagnosticGrid}>
            <div>
              <span>PM2.5</span>
              <strong>{Math.round(selectedGrid.values.value)}</strong>
            </div>
            <div>
              <span>風速</span>
              <strong>{selectedGrid.meteo.windSpeed.toFixed(1)} m/s</strong>
            </div>
            <div>
              <span>風向</span>
              <strong>{Math.round(selectedGrid.meteo.windDir)} deg</strong>
            </div>
            <div>
              <span>上風來源</span>
              <strong>{sourceLinks.length}</strong>
            </div>
          </div>
          <p className={styles.diagnosticNote}>
            已淡化非選取網格，線段標示可能上風來源，半透明圈標示下風影響帶。
          </p>
        </div>
      )}
    </div>
  );
}
