'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UAVProfileChart, type ParamStats } from '@/components/UAV/UAVProfileChart';
import { UAVParameterSelector } from '@/components/UAV/UAVParameterSelector';
import { fetchFlights, fetchProfile, type FlightSummary } from '@/lib/uavApi';
import { ALL_PARAMETER_IDS, DEFAULT_PARAMETERS, type ParameterId } from '@/components/UAV/uavConfig';
import WindLidarPage from '@/components/WindLidar/WindLidarPage';
import {
  ControlBar,
  ControlRow,
  ControlLabel,
  ControlDivider,
  ControlSelect,
} from '@/components/controls/ControlKit';
import { ViewSwitcher } from './_components/EventControls';
import { C, type ActiveView } from './_lib/eventsConfig';

/* ──────────────────────────────────────────────────────────── */
/*  Design tokens                                               */
/* ──────────────────────────────────────────────────────────── */
export default function EventsPage() {
  // ── Tab 狀態 ──────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ActiveView>('uav');

  // ── UAV 狀態（保持 mounted，切 tab 不重置） ───────────────
  const [flights, setFlights]       = useState<FlightSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [parameters, setParameters] = useState<ParameterId[]>(DEFAULT_PARAMETERS);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [paramStats, setParamStats] = useState<Record<string, ParamStats>>({});
  const [availableParams, setAvailableParams] = useState<Set<ParameterId> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    fetchFlights()
      .then((data) => {
        setFlights(data);
        if (data.length > 0) setSelectedId(data[0].flight_id);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    fetchProfile(selectedId)
      .then((rows) => {
        if (cancelled || !mountedRef.current) return;

        const stats: Record<string, ParamStats> = {};
        const available = new Set<ParameterId>();

        for (const p of ALL_PARAMETER_IDS) {
          const vals = rows
            .map((r) => (r as unknown as Record<string, unknown>)[p] as number | null)
            .filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v));

          if (vals.length === 0) {
            stats[p] = { min: 0, max: 0, range: 1, hasData: false };
          } else {
            let min = vals[0], max = vals[0];
            for (const v of vals) {
              if (v < min) min = v;
              if (v > max) max = v;
            }
            stats[p] = { min, max, range: max - min || 1, hasData: true };
            available.add(p);
          }
        }

        setParamStats(stats);
        setAvailableParams(available);
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) {
          setAvailableParams(new Set(ALL_PARAMETER_IDS));
        }
      });

    return () => { cancelled = true; };
  }, [selectedId]);

  const handleStatsReady = useCallback(
    (stats: Record<string, ParamStats>) => setParamStats(stats),
    [],
  );

  const selectedFlight = flights.find((f) => f.flight_id === selectedId);

  return (
    <>
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>

      {/* 視圖切換 */}
      <ViewSwitcher active={activeView} onChange={setActiveView} />

      {/* ════════════════════════════════════════════════════ */}
      {/* UAV 子視圖（保持 mounted，靠 CSS display 切換）      */}
      {/* ════════════════════════════════════════════════════ */}
      <div style={{ display: activeView === 'uav' ? 'block' : 'none' }}>

        {/* ── 控制列 ── */}
        <div style={{ margin: '4px 40px 0' }}>
          <ControlBar>
            <ControlRow>
              <ControlLabel>飛行任務</ControlLabel>
              {loadError ? (
                <span style={{ fontSize: 13, color: '#c0392b', fontWeight: 700 }}>⚠ {loadError}</span>
              ) : flights.length === 0 ? (
                <span style={{ fontSize: 13, color: C.hint }}>載入中…</span>
              ) : (
                <ControlSelect
                  value={selectedId ?? ''}
                  options={flights.map((f) => ({
                    value: f.flight_id,
                    label: f.site_name ? `${f.flight_id} — ${f.site_name}` : f.flight_id,
                  }))}
                  onChange={(id) => {
                    setSelectedId(id);
                    setAvailableParams(null);
                  }}
                  placeholder="選擇飛行任務"
                  ariaLabel="飛行任務"
                />
              )}
            </ControlRow>

            <ControlDivider orientation="horizontal" />

            <UAVParameterSelector
              selected={parameters}
              onChange={setParameters}
              paramStats={paramStats}
              availableParams={availableParams}
            />

            {parameters.length > 1 && (
              <p style={{ margin: 0, fontSize: 11, color: C.hint }}>
                ℹ 各參數各自獨立座標軸，Y 軸高度已對齊。
              </p>
            )}
          </ControlBar>
        </div>

        {/* ── Chart area ── */}
        <div className="uav-chart-wrapper">
          {parameters.length === 0 ? (
            <div className="uav-placeholder">請至少選擇一個參數</div>
          ) : selectedId ? (
            <UAVProfileChart
              key={selectedId}
              flightId={selectedId}
              flightDirection={selectedFlight?.flight_direction ?? 'ascending'}
              parameters={parameters}
              onStatsReady={handleStatsReady}
            />
          ) : (
            <div className="uav-placeholder">請選擇飛行任務</div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* Wind Lidar 子視圖（切換時 mount / unmount）          */}
      {/* ════════════════════════════════════════════════════ */}
      {activeView === 'wind-lidar' && (
        <div style={{ margin: '20px 40px 0' }}>
          <WindLidarPage />
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        /* ── Chart wrapper ───────────────────────────────────── */
        .uav-chart-wrapper {
          margin: 20px 40px 0;
          min-height: 480px;
        }

        /* Loading / error card (single-chart states) */
        .uav-profile-card {
          display: flex;
          flex-direction: column;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          padding: 20px 4px;
          box-sizing: border-box;
          min-height: 200px;
        }

        /* ── Flight title ────────────────────────────────────── */
        .uav-flight-title { margin-bottom: 16px; }

        .uav-flight-title-inner {
          display: flex; flex-direction: column; gap: 6px;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--hairline);
          border-radius: 0;
          box-shadow: none;
          padding: 4px 2px 14px;
        }

        .uav-flight-id {
          font-size: 15px; font-weight: 800; color: ${C.blue}; letter-spacing: 0.3px;
        }

        .uav-flight-meta {
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
          font-size: 12px; color: ${C.muted}; font-weight: 500;
        }

        .uav-flight-meta-sep { color: ${C.hint}; font-size: 10px; }

        /* ── Small chart grid ────────────────────────────────── */
        .uav-chart-grid {
          display: grid; grid-template-columns: 1fr; gap: 16px;
        }
        @media (min-width: 769px)  { .uav-chart-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1200px) { .uav-chart-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1600px) { .uav-chart-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 768px)  {
          .uav-chart-grid { grid-template-columns: 1fr !important; }
          .uav-param-card { height: 360px !important; }
        }

        /* ── Individual parameter card ───────────────────────── */
        .uav-param-card {
          background: var(--section-tint);
          border: none;
          border-radius: 12px; box-shadow: none;
          padding: 16px 18px; box-sizing: border-box;
          height: 420px; display: flex; flex-direction: column;
        }
        .uav-param-card > .recharts-responsive-container { flex: 1 1 0; min-height: 0; }
        .uav-param-card-title {
          margin: 0 0 10px; font-size: 16px; font-weight: 800;
          letter-spacing: 0.2px; flex-shrink: 0;
        }
        .uav-param-card-unit { font-size: 12px; font-weight: 600; opacity: 0.75; margin-left: 2px; }

        /* ── Placeholder cards ───────────────────────────────── */
        .uav-placeholder {
          min-height: 480px; display: flex; align-items: center; justify-content: center;
          background: transparent; border: 1px dashed var(--hairline);
          border-radius: 12px; color: ${C.hint}; font-size: 14px; font-weight: 600;
        }

        /* ── Custom Tooltip ──────────────────────────────────── */
        .uav-tooltip {
          background: rgba(255,255,255,0.97);
          border: 1px solid rgba(106, 141, 115, 0.18);
          border-radius: 10px; padding: 10px 14px;
          box-shadow: 0 4px 20px rgba(62, 81, 66, 0.18);
          font-size: 12px; min-width: 160px;
        }
        .uav-tooltip-label { font-size: 11px; font-weight: 700; color: ${C.hint}; margin: 0 0 6px; }
        .uav-tooltip-row { display: flex; align-items: center; gap: 6px; margin: 3px 0; font-weight: 600; }
        .uav-tooltip-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* ── States ──────────────────────────────────────────── */
        .uav-loading, .uav-empty, .uav-error {
          padding: 40px 24px; text-align: center; font-size: 14px; font-weight: 600; flex-shrink: 0;
        }
        .uav-loading { color: ${C.hint}; }
        .uav-empty   { color: ${C.muted}; }
        .uav-error   { color: #c0392b; background: rgba(192,57,43,0.07); border-radius: 10px; margin: 16px 0; }

        /* ── Responsive ──────────────────────────────────────── */
        @media (max-width: 768px) {
          .uav-chart-wrapper { margin: 16px 16px 0; }
          .uav-flight-title-inner { padding: 12px 16px; }
        }
        @media (max-width: 600px) {
          .uav-chart-wrapper { margin: 12px 12px 0; }
        }
      `}</style>
    </div>
    </>
  );
}
