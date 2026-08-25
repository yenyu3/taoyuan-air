'use client';

import { palette } from '@shared/constants/theme';

export function MapLoadingOverlay({ isLoading }: { isLoading: boolean }) {
  return (
    <>
      {/* ── Loading overlay ──────────────────────────────────── */}
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.50)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, backdropFilter: 'blur(4px)' }}>
          <div style={{
            width: 270, backgroundColor: 'rgba(255,255,255,0.97)', border: `1px solid ${palette.borderSoft}`,
            borderRadius: 16, boxShadow: '0 16px 48px rgba(58,30,45,0.16)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 28,
          }}>
            <div className="map-spinner" />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 15, color: palette.textMain, fontWeight: 800 }}>載入地圖資料</p>
              <p style={{ margin: '5px 0 0', fontSize: 12, color: palette.textSecondary }}>正在同步最新空品資訊…</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .map-spinner {
          width: 38px; height: 38px; border-radius: 50%;
          border: 3.5px solid rgba(216,225,234,0.8);
          border-top-color: ${palette.primaryDeep};
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-body::-webkit-scrollbar { width: 4px; }
        .card-body::-webkit-scrollbar-track {
          background: rgba(246,200,214,0.18);
          border-radius: 999px;
          margin: 10px 0;
        }
        .card-body::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6F91B2, ${palette.primaryDeep});
          border-radius: 999px;
        }
        .card-body::-webkit-scrollbar-thumb:hover {
          background: ${palette.primaryDeep};
        }
        .pollutant-btn {
          min-width: 0;
          padding: 8px 6px;
          border-radius: 11px;
          text-align: center;
          cursor: pointer;
          border: 1.5px solid transparent;
          background-color: rgba(216,225,234,0.22);
          transition: all 0.18s;
        }
        .pollutant-btn.selected {
          border-color: ${palette.primaryDeep};
          background-color: rgba(49,94,143,0.09);
        }
        .pollutant-btn-name {
          font-size: 12px;
          font-weight: 800;
          color: ${palette.textMain};
          line-height: 1.2;
          white-space: nowrap;
        }
        .pollutant-btn.selected .pollutant-btn-name {
          color: ${palette.primaryDeep};
        }
        .pollutant-btn-label {
          margin-top: 2px;
          font-size: 9px;
          color: ${palette.textSecondary};
          line-height: 1.2;
          opacity: 0.85;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pollutant-btn.selected .pollutant-btn-label {
          color: ${palette.primaryDeep};
        }
      `}</style>
    </>
  );
}
