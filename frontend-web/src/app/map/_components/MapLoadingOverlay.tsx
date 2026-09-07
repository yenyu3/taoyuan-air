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
          border: 3.5px solid rgba(205, 213, 180, 0.8);
          border-top-color: ${palette.primaryDeep};
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
