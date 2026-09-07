'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Map, Marker, AttributionControl, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { DatasetCatalogItem } from '../_data/datasetCatalog';
import styles from '../explorer.module.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';
const TAOYUAN_CENTER = { longitude: 121.2, latitude: 24.96 };

type Bounds = [[number, number], [number, number]];

function siteBounds(dataset: DatasetCatalogItem): Bounds | null {
  if (!dataset.sites.length) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const site of dataset.sites) {
    minLng = Math.min(minLng, site.lng);
    maxLng = Math.max(maxLng, site.lng);
    minLat = Math.min(minLat, site.lat);
    maxLat = Math.max(maxLat, site.lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export default function DatasetMap({ dataset }: { dataset: DatasetCatalogItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const bounds = useMemo(() => siteBounds(dataset), [dataset]);

  const fit = useCallback(
    (duration: number) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      map.resize();
      if (bounds) map.fitBounds(bounds, { padding: 40, maxZoom: 11.5, duration });
    },
    [bounds],
  );

  useEffect(() => {
    fit(500);
  }, [fit]);

  // 抽屜 / 分頁切換或視窗縮放後容器尺寸才確定，補一次 resize
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => fit(0));
    observer.observe(node);
    return () => observer.disconnect();
  }, [fit]);

  if (!MAPBOX_TOKEN || !dataset.sites.length) {
    return (
      <div className={styles.datasetMapFallback}>
        <span>{dataset.sites.length ? '地圖需要 Mapbox token' : '此資料源尚無座標'}</span>
      </div>
    );
  }

  return (
    <div className={styles.datasetMap} ref={containerRef}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ ...TAOYUAN_CENTER, zoom: 9 }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        scrollZoom={false}
        dragRotate={false}
        touchPitch={false}
        pitchWithRotate={false}
        onLoad={() => fit(0)}
      >
        {dataset.sites.map((site) => (
          <Marker key={`${site.name}-${site.lat}-${site.lng}`} longitude={site.lng} latitude={site.lat}>
            <span
              className={styles.datasetMapPin}
              style={{ '--accent': dataset.accent } as React.CSSProperties}
              title={site.name}
            />
          </Marker>
        ))}
        <AttributionControl compact position="bottom-right" />
      </Map>
      <div className={styles.datasetMapMeta}>
        <span>{dataset.sites.length} 個點位</span>
        {dataset.sitesNote && <span className={styles.datasetMapNote}>{dataset.sitesNote}</span>}
      </div>
    </div>
  );
}
