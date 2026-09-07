'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AttributionControl, Map, useControl, type MapRef } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { AmbientLight, DirectionalLight, LightingEffect, type Layer, type PickingInfo } from '@deck.gl/core';
import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { Box, LocateFixed, RotateCcw, Square } from 'lucide-react';
import type { Map as MapboxMap } from 'mapbox-gl';
import type { ExamPoint, GridCell, TEDSPoint } from '@shared/types';
import { getGridLocationName } from '@/app/map/_lib/search';
import { getPm25Rgb, getPm25Status } from '@/app/map/_lib/mapColors';
import styles from './PM25DeckMap.module.css';
import 'mapbox-gl/dist/mapbox-gl.css';

type CameraMode = 'top' | 'tilt';
type EmissionPoint = TEDSPoint | ExamPoint;

interface PM25DeckMapProps {
  gridCells: GridCell[];
  chimneyPoints?: TEDSPoint[];
  mercuryPoints?: ExamPoint[];
  showPm25GridLayer?: boolean;
  showChimneyLayer?: boolean;
  showMercuryLayer?: boolean;
  onGridPress?: (grid: GridCell) => void;
  focusGrid?: GridCell | null;
}

const MAP_CENTER = { longitude: 121.25, latitude: 25.0 };
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.25,
});

const directionalLight = new DirectionalLight({
  color: [230, 245, 238],
  intensity: 1.6,
  direction: [-3, -4, -8],
});

const lightingEffect = new LightingEffect({ ambientLight, directionalLight });
const DECK_EFFECTS = [lightingEffect];

const VIEWS: Record<CameraMode, { pitch: number; bearing: number; zoom: number }> = {
  top: { pitch: 0, bearing: 0, zoom: 10.6 },
  tilt: { pitch: 64, bearing: -30, zoom: 11.35 },
};

function DeckGLOverlay(props: ConstructorParameters<typeof MapboxOverlay>[0]) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

type RenderPoint = EmissionPoint & { layerKind: 'chimney' | 'mercury' };

const deckTooltip = ({ object, layer }: PickingInfo) => {
  if (!object || !layer) return null;

  if (layer.id === 'pm25-grid-extrusion') {
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

function addTerrainAndBuildings(map: MapboxMap) {
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });
  }
  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.18 });
  map.setFog({
    color: 'rgb(236, 241, 235)',
    'high-color': 'rgb(210, 225, 219)',
    'horizon-blend': 0.16,
  });

  if (map.getLayer('taoyuan-3d-buildings')) return;
  const labelLayerId = map.getStyle().layers?.find((layer) => layer.type === 'symbol' && 'text-field' in (layer.layout ?? {}))?.id;
  map.addLayer(
    {
      id: 'taoyuan-3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 12,
      paint: {
        'fill-extrusion-color': '#b9c5b6',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.38,
      },
    },
    labelLayerId,
  );
}

export default function PM25DeckMap({
  gridCells,
  chimneyPoints = [],
  mercuryPoints = [],
  showPm25GridLayer = true,
  showChimneyLayer = true,
  showMercuryLayer = true,
  onGridPress,
  focusGrid,
}: PM25DeckMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('tilt');
  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;

  const visiblePoints = useMemo(
    () => [
      ...(showChimneyLayer ? chimneyPoints.map((point) => ({ ...point, layerKind: 'chimney' as const })) : []),
      ...(showMercuryLayer ? mercuryPoints.map((point) => ({ ...point, layerKind: 'mercury' as const })) : []),
    ],
    [chimneyPoints, mercuryPoints, showChimneyLayer, showMercuryLayer],
  );

  const moveCamera = useCallback((mode: CameraMode) => {
    const map = mapRef.current?.getMap();
    const view = VIEWS[mode];
    map?.easeTo({
      pitch: view.pitch,
      bearing: view.bearing,
      zoom: view.zoom,
      duration: 800,
    });
    setCameraMode(mode);
  }, []);

  const resetCamera = useCallback(() => {
    const map = mapRef.current?.getMap();
    const view = VIEWS[cameraMode];
    map?.easeTo({
      center: [MAP_CENTER.longitude, MAP_CENTER.latitude],
      pitch: view.pitch,
      bearing: view.bearing,
      zoom: view.zoom,
      duration: 800,
    });
  }, [cameraMode]);

  useEffect(() => {
    if (!focusGrid) return;
    const view = VIEWS[cameraModeRef.current];
    mapRef.current?.getMap().easeTo({
      center: [focusGrid.centerLatLng.longitude, focusGrid.centerLatLng.latitude],
      zoom: 12.2,
      pitch: view.pitch,
      bearing: view.bearing,
      duration: 700,
    });
  }, [focusGrid]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const resize = () => {
      window.requestAnimationFrame(() => mapRef.current?.getMap().resize());
    };
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
    try {
      addTerrainAndBuildings(map);
    } catch (error) {
      console.warn('3D terrain/building layer could not be initialized.', error);
    }
  }, []);

  const layers = useMemo<Layer[]>(() => {
    const deckLayers: Layer[] = [];

    if (showPm25GridLayer) {
      deckLayers.push(
        new PolygonLayer<GridCell>({
          id: 'pm25-grid-extrusion',
          data: gridCells,
          getPolygon: (grid) => grid.polygonCoords.map((coord) => [coord.longitude, coord.latitude]),
          getFillColor: (grid) => {
            const [r, g, b] = getPm25Rgb(grid.values.value);
            return [r, g, b, 176];
          },
          getLineColor: [255, 255, 255, 95],
          getLineWidth: 18,
          getElevation: (grid) => {
            const value = Number.isFinite(grid.values.value) ? Math.max(0, Math.min(150, grid.values.value)) : 0;
            return Math.max(80, value * 38);
          },
          elevationScale: 1.25,
          extruded: true,
          wireframe: false,
          stroked: true,
          filled: true,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 90],
          material: {
            ambient: 0.45,
            diffuse: 0.55,
            shininess: 18,
            specularColor: [220, 238, 224],
          },
          onClick: ({ object }) => {
            if (object) onGridPress?.(object);
          },
        }),
      );
    }

    deckLayers.push(
      new ScatterplotLayer<RenderPoint>({
        id: 'emission-points',
        data: visiblePoints,
        getPosition: (point) => [point.latLng.longitude, point.latLng.latitude, point.layerKind === 'mercury' ? 120 : 80],
        getRadius: (point) => (point.layerKind === 'mercury' ? 95 : 55),
        getFillColor: (point) => (point.layerKind === 'mercury' ? [130, 90, 176, 220] : [45, 92, 75, 210]),
        getLineColor: [255, 255, 255, 230],
        getLineWidth: 3,
        radiusUnits: 'meters',
        stroked: true,
        filled: true,
        opacity: 0.9,
        pickable: true,
      }),
    );

    return deckLayers;
  }, [gridCells, onGridPress, showPm25GridLayer, visiblePoints]);

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
    <div className={styles.mapShell} ref={containerRef}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: MAP_CENTER.longitude,
          latitude: MAP_CENTER.latitude,
          zoom: VIEWS[cameraMode].zoom,
          pitch: VIEWS[cameraMode].pitch,
          bearing: VIEWS[cameraMode].bearing,
        }}
        mapStyle={MAP_STYLE}
        onLoad={handleLoad}
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
          <Square size={18} />
        </button>
        <button
          type="button"
          className={cameraMode === 'tilt' ? styles.iconButtonActive : styles.iconButton}
          onClick={() => moveCamera('tilt')}
          title="傾斜 3D"
          aria-label="傾斜 3D"
        >
          <Box size={18} />
        </button>
        <button type="button" className={styles.iconButton} onClick={resetCamera} title="重設視角" aria-label="重設視角">
          <RotateCcw size={18} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => focusGrid && mapRef.current?.getMap().easeTo({
            center: [focusGrid.centerLatLng.longitude, focusGrid.centerLatLng.latitude],
            zoom: 12.2,
            duration: 700,
          })}
          title="定位選取網格"
          aria-label="定位選取網格"
        >
          <LocateFixed size={18} />
        </button>
      </div>
    </div>
  );
}
