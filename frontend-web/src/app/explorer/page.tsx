'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Activity, Database, MapPin, Search, Shield, X } from 'lucide-react';
import type { MoeStationData } from '@shared/api/moe';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Dropdown } from './_components/Dropdown';
import { StationCard, StatChip } from './_components/StationCard';
import { MICRO_SENSOR_MOCK_DATA, NAQO_MOCK_DATA, DEFAULT_REGION, PARAMETER_OPTIONS, REGIONS, SOURCE_PARAMETER_OPTIONS, SOURCE_REGION_OPTIONS, SOURCES, TIME_TABS } from './_data/explorerConfig';
import { buildCwaCards, buildMoeCards, getParameterDisplay } from './_lib/buildCards';
import { C } from './_lib/parameterStatus';
import type { CwaApiResponse, ExplorerHistoryResponse, MoeApiResponse, StationData } from './_types';

/* ─── Design tokens ──────────────────────────────────────────── */
export default function ExplorerPage() {
  const [searchText, setSearchText]           = useState('');
  const [activeTime, setActiveTime]           = useState<typeof TIME_TABS[number]>('近24小時');
  const [selectedParameter, setSelectedParameter] = useState(PARAMETER_OPTIONS[0]);
  const [selectedRegion, setSelectedRegion]   = useState(DEFAULT_REGION);
  const [selectedSource, setSelectedSource]   = useState(SOURCES[0]);
  const [openId, setOpenId]                   = useState<string | null>(null);
  const [isMobile, setIsMobile]               = useState(false);
  const [moeStations, setMoeStations]         = useState<MoeStationData[]>([]);
  const [cwaCards, setCwaCards]               = useState<StationData[]>([]);
  const [historyData, setHistoryData]         = useState<StationData[]>([]);
  const [moeLoading, setMoeLoading]           = useState(true);
  const [cwaLoading, setCwaLoading]           = useState(true);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [historyLatestAt, setHistoryLatestAt] = useState<Record<string, string>>({});
  const [moeError, setMoeError]               = useState('');
  const [cwaError, setCwaError]               = useState('');
  const [historyError, setHistoryError]       = useState('');

  const parameterOptions = SOURCE_PARAMETER_OPTIONS[selectedSource] ?? PARAMETER_OPTIONS;
  const regionOptions = SOURCE_REGION_OPTIONS[selectedSource] ?? REGIONS;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/moe', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<MoeApiResponse>;
      })
      .then(response => {
        setMoeStations(response.data);
        if (response.isFallback) {
          setMoeError('環境部目前沒有可顯示的資料，請確認 API 金鑰與連線狀態。');
        }
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setMoeError('環境部資料載入失敗，請稍後再試。');
      })
      .finally(() => {
        if (!controller.signal.aborted) setMoeLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadCwaCards = async () => {
      // The CWA API route accepts one district at a time, so "all regions"
      // fan out to the visible Taoyuan districts instead of defaulting to Zhongli.
      const districts = selectedRegion === DEFAULT_REGION ? regionOptions.slice(1) : [selectedRegion];

      setCwaLoading(true);
      try {
        const results = await Promise.all(
          districts.map(async district => {
            const response = await fetch(`/api/cwa?district=${encodeURIComponent(district)}`, {
              signal: controller.signal,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return {
              district,
              payload: await response.json() as CwaApiResponse,
            };
          })
        );

        if (controller.signal.aborted) return;
        setCwaCards(
          results
            .filter(({ payload }) => !payload.isFallback)
            .flatMap(({ district, payload }) => buildCwaCards({
              ...payload.data,
              isFallback: payload.isFallback,
            }, district))
        );
        setCwaError(results.some(({ payload }) => payload.isFallback)
          ? '氣象署 API 金鑰尚未設定或部分測站無資料，目前未顯示 fallback 氣象資料。'
          : '');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setCwaCards([]);
        setCwaError('氣象署資料載入失敗，請稍後再試。');
      } finally {
        if (!controller.signal.aborted) setCwaLoading(false);
      }
    };

    void loadCwaCards();

    return () => controller.abort();
  }, [selectedRegion, regionOptions]);

  useEffect(() => {
    if (activeTime === '近24小時') {
      return;
    }

    const days = activeTime === '近7天' ? 7 : 3;
    const controller = new AbortController();

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await fetch(`/api/explorer/history?days=${days}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as ExplorerHistoryResponse;

        if (controller.signal.aborted) return;
        setHistoryData(data.data);
        setHistoryLatestAt(data.latestAt ?? {});
        setHistoryError(data.error ? '歷史資料庫查詢失敗，請確認後端與資料庫連線。' : '');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setHistoryError('歷史資料庫尚未連線，請確認 FastAPI 後端與 PostgreSQL 已啟動。');
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    };

    void loadHistory();

    return () => controller.abort();
  }, [activeTime]);

  const closeDropdown = useCallback(() => setOpenId(null), []);

  const handleSourceSelect = useCallback((source: string) => {
    const nextOptions = SOURCE_PARAMETER_OPTIONS[source] ?? PARAMETER_OPTIONS;
    const nextRegionOptions = SOURCE_REGION_OPTIONS[source] ?? REGIONS;

    // 切換來源時，同步校正參數與區域；例如環境部只保留六個官方測站所在區。
    setSelectedSource(source);
    setSelectedParameter(current =>
      nextOptions.includes(current) ? current : nextOptions[0]
    );
    setSelectedRegion(current =>
      nextRegionOptions.includes(current) ? current : nextRegionOptions[0]
    );
  }, []);

  const allMonitoringData = useMemo(() => {
    const moeCards = buildMoeCards(moeStations);

    // 資料顯示規則：
    // 1. 即時 API 資料在所有時間分頁都顯示，方便使用者看到最新狀態。
    // 2. 歷史資料只在近 3 天 / 近 7 天分頁補上，避免近 24 小時重複顯示。
    const moeHistory = historyData.filter(d => d.source === '環境部');
    const cwaHistory = historyData.filter(d => d.source === '氣象署');
    const tydepSource = historyData.filter(d => d.source === '桃園市環保局');
    const historySource = activeTime === '近24小時' ? [] : [...tydepSource, ...moeHistory, ...cwaHistory];

    return [...moeCards, ...cwaCards, ...historySource, ...NAQO_MOCK_DATA, ...MICRO_SENSOR_MOCK_DATA];
  }, [activeTime, historyData, moeStations, cwaCards]);

  const filtered = useMemo(() => allMonitoringData.filter(item => {
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!item.district.toLowerCase().includes(q) && !item.station.toLowerCase().includes(q)) return false;
    }
    if (selectedParameter !== parameterOptions[0] && item.parameter !== selectedParameter) return false;
    if (selectedRegion    !== DEFAULT_REGION && item.region    !== selectedRegion)    return false;
    if (selectedSource    !== SOURCES[0]    && item.source    !== selectedSource)    return false;
    return true;
  }), [allMonitoringData, searchText, selectedParameter, selectedRegion, selectedSource, parameterOptions]);

  const stationSummary = useMemo(() => {
    const stations = new Map<string, StationData>();
    allMonitoringData.forEach(item => {
      const key = `${item.source}:${item.station}`;
      if (!stations.has(key)) stations.set(key, item);
    });
    return Array.from(stations.values());
  }, [allMonitoringData]);

  const passedCount = stationSummary.filter(item => item.passed).length;
  const failedCount = stationSummary.filter(item => !item.passed).length;
  const aqiStations = stationSummary.filter(item => item.source !== '氣象署');
  const avgAqi = aqiStations.length
    ? Math.round(aqiStations.reduce((sum, item) => sum + item.aqi, 0) / aqiStations.length)
    : null;

  const loadingMessage = [
    historyLoading ? '歷史資料庫' : '',
    moeLoading ? '環境部' : '',
    cwaLoading ? '氣象署' : '',
  ].filter(Boolean).join('、');

  const hasTydepHistory = historyData.some(item => item.source === '桃園市環保局');

  const dbLatestBanner = activeTime !== '近24小時' && Object.keys(historyLatestAt).length > 0
    ? '資料截至：' + Object.entries(historyLatestAt)
        .map(([src, date]) => `${src} ${date}`)
        .join('、')
    : '';

  const sourceNotice = selectedSource === '桃園市環保局' && !hasTydepHistory && activeTime !== '近24小時'
    ? '桃園市環保局資料庫目前尚未匯入觀測資料，或後端尚未連上 PostgreSQL。'
    : selectedSource === '微感測器'
      ? '微感測器資料庫尚未建立，目前顯示的是介面測試用模擬資料。'
      : selectedSource === '中大空品站'
        ? '中大空品站資料庫尚未建立，目前顯示的是介面測試用模擬資料。'
      : activeTime !== '近24小時' && historyError
        ? historyError
      : selectedSource === '環境部' && moeError
        ? moeError
        : selectedSource === '氣象署' && cwaError
          ? cwaError
          : '';

  return (
    <AuthGuard>
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--app-bg-gradient)',
        paddingBottom: 60,
        maxWidth: '100vw',
        overflowX: 'hidden',
      }}
      onClick={closeDropdown}
    >
      <div style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        padding: isMobile ? '16px 16px 0' : '28px 40px 0',
      }}>

        {/* ── Search bar + stat chips ──────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 10 : 14, marginBottom: 16,
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(255,255,255,0.92)',
            borderRadius: 999,
            boxShadow: '0 4px 16px rgba(23,58,94,0.10)',
            display: 'flex', alignItems: 'center', padding: '10px 18px', gap: 10,
            ...(isMobile ? {} : { width: 340, flexShrink: 0 }),
          }}>
            <Search size={16} strokeWidth={2} color={C.hint} />
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜尋區域或感測器 ID..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 14, color: C.text, outline: 'none', fontFamily: 'inherit',
              }}
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.hint, padding: 2, display: 'flex', borderRadius: 99 }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
            <StatChip icon={Database} value={stationSummary.length} label="站"  color={C.primary} />
            <span style={{ color: C.hint, fontSize: 15 }}>·</span>
            <StatChip icon={Shield}   value={passedCount}     label="正常" color={C.green}   />
            <span style={{ color: C.hint, fontSize: 15 }}>·</span>
            <StatChip icon={Activity} value={failedCount}     label="異常" color={failedCount > 0 ? C.red : C.green} />
            <span style={{ color: C.hint, fontSize: 15 }}>·</span>
            <StatChip icon={MapPin}   value={avgAqi === null ? 'AQI --' : `AQI ${avgAqi}`} color={C.amber} />
          </div>
        </div>

        {/* ── Controls bar ─────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>
          {TIME_TABS.map(tab => {
            const active = activeTime === tab;
            return (
              <button key={tab} onClick={(e) => { e.stopPropagation(); setActiveTime(tab); }} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 999, cursor: 'pointer',
                backgroundColor: active ? C.primaryAlpha : C.glass,
                border: `1px solid ${active ? C.primaryBorder : C.glassBorder}`,
                boxShadow: C.glassShadow,
                fontWeight: 700, fontSize: 13, letterSpacing: 0.2,
                color: active ? C.primary : C.hint,
                transition: 'all 0.18s',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: active ? C.primary : 'rgba(23,58,94,0.35)',
                  transition: 'background-color 0.18s',
                }} />
                {tab}
              </button>
            );
          })}

          {!isMobile && <div style={{ width: 1, height: 24, backgroundColor: 'rgba(23,58,94,0.20)', margin: '0 2px' }} />}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
            <Dropdown id="parameter" value={selectedParameter} options={parameterOptions} onSelect={setSelectedParameter} openId={openId} setOpenId={setOpenId} renderOption={getParameterDisplay} />
            <Dropdown id="region"    value={selectedRegion}    options={regionOptions}    onSelect={setSelectedRegion}    openId={openId} setOpenId={setOpenId} />
            <Dropdown id="source"    value={selectedSource}    options={SOURCES}    onSelect={handleSourceSelect}    openId={openId} setOpenId={setOpenId} />
          </div>

          <span style={{ marginLeft: 'auto', fontSize: 13, color: C.muted, fontWeight: 600, minWidth: 0 }}>
            共 {filtered.length} 筆資料
          </span>
        </div>

        {(loadingMessage || sourceNotice) && (
          <div style={{
            marginBottom: 8,
            padding: '11px 15px',
            borderRadius: 12,
            backgroundColor: sourceNotice ? C.amberAlpha : C.primaryAlpha,
            border: `1px solid ${sourceNotice ? C.amberBorder : C.primaryBorder}`,
            color: sourceNotice ? C.amber : C.primary,
            fontSize: 13,
            fontWeight: 600,
          }}>
            {sourceNotice || `正在載入${loadingMessage}資料…`}
          </div>
        )}
        {dbLatestBanner && (
          <div style={{
            marginBottom: 18,
            padding: '9px 15px',
            borderRadius: 12,
            backgroundColor: 'rgba(80,103,128,0.08)',
            border: '1px solid rgba(80,103,128,0.20)',
            color: C.muted,
            fontSize: 12,
            fontWeight: 500,
          }}>
            {dbLatestBanner}
          </div>
        )}

        {/* ── Cards grid ───────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.60)',
            border: '1px solid rgba(255,255,255,0.80)',
            borderRadius: 20, boxShadow: C.glassShadow,
            padding: '56px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 15,
              backgroundColor: C.primaryAlpha, border: `1px solid ${C.primaryBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={24} color={C.primary} strokeWidth={2} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.muted }}>
              {selectedSource === '桃園市環保局' ? '環保局目前尚無可顯示資料' : '目前沒有符合條件的監測資料'}
            </p>
            <p style={{ fontSize: 13, color: C.hint }}>
              {selectedSource === '桃園市環保局'
                ? '完成 TYDEP 資料匯入與 API 串接後，資料會顯示在這裡'
                : '嘗試調整時間、量測參數、區域或來源篩選條件'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
            gap: 20,
            // 防止某張卡片內容變長時，CSS grid 把同一列其他卡片一起拉高。
            alignItems: 'start',
            width: '100%',
            maxWidth: '100%',
            paddingBottom: 60,
          }}>
            {filtered.map(station => <StationCard key={station.id} station={station} />)}
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
