'use client';

export function DashboardResponsiveStyles() {
  return (
    <style>{`      @media (max-width: 1280px) {
        .dashboard-page {
          grid-template-columns: 1fr;
          height: auto;
        }

        .dashboard-map-pane {
          min-height: auto;
          height: auto;
          max-height: none;
          padding: 20px 0 16px;
        }

        .dashboard-panel {
          min-height: auto;
          height: auto;
          max-height: none;
          margin-top: 0;
        }

        .dashboard-map-wrap {
          height: min(52vh, 520px);
          width: min(100%, 520px);
        }

        .dashboard-map-action {
          position: static;
          margin-top: 14px;
          align-self: flex-start;
        }
      }

      @media (max-width: 820px) {
        .dashboard-page {
          padding: 16px 20px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-x: hidden;
          overflow-x: clip;
        }

        .dashboard-panel {
          padding: 20px 18px;
          width: 100%;
          overflow: hidden;
        }

        .dashboard-map-wrap {
          width: min(88vw, 390px);
          height: auto;
          aspect-ratio: 1182 / 1330;
          max-height: min(48vh, 420px);
          max-height: min(48svh, 420px);
        }

        .dashboard-first-row {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .dashboard-second-row,
        .dashboard-lower-row {
          grid-template-columns: 1fr;
        }

        .dashboard-lower-row {
          align-items: start;
        }

        .trend-section {
          width: 100%;
          align-self: stretch;
        }

        .trend-scroll {
          flex: 0 0 auto;
          height: 196px;
          align-items: flex-start;
          padding: 4px 0 12px;
        }

        .insight-card {
          align-items: flex-start;
        }

        .row-divider {
          display: none;
        }

        .mini-gauge-row {
          grid-template-columns: 1fr 1px 1fr;
        }

        .mini-pollut-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 12px;
        }

        .metric-divider {
          display: none;
        }

        .trend-date-row {
          height: 30px;
        }

        .trend-date-label {
          top: 10px;
        }
      }

      @media (max-width: 480px) {
        .dashboard-page {
          padding: 12px clamp(14px, 4vw, 16px) calc(28px + env(safe-area-inset-bottom));
        }

        .dashboard-panel {
          padding: 18px 14px;
          border-radius: 16px;
        }

        .dashboard-map-wrap {
          width: min(82vw, 330px);
          max-height: min(42vh, 330px);
          max-height: min(42svh, 330px);
        }

        .dashboard-map-action {
          width: min(100%, 300px);
          justify-content: center;
          align-self: center;
          padding: 10px 14px;
          font-size: 14px;
        }

        .dashboard-first-row {
          gap: 12px;
        }

        .mini-gauge-row {
          grid-template-columns: 1fr 1px 1fr;
          gap: 0 8px;
        }

        .mini-arc {
          width: 120px;
          height: 60px;
        }

        .insight-card {
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .aqi-block {
          padding-top: 0;
        }

        .dashboard-lower-row {
          gap: 16px;
        }

        .dashboard-side-stack {
          gap: 14px;
        }

        .trend-date-row {
          height: 30px;
        }

        .trend-date-label {
          top: 10px;
        }

        .trend-bars,
        .trend-bar-wrap {
          height: 55px;
        }

        .trend-day-line {
          height: 50px;
        .trend-heading {
          height: auto;
          min-height: 22px;
        }

        .trend-scroll {
          margin-right: -2px;
        }
      }

      @media (max-height: 760px) and (min-width: 1281px) {
        .dashboard-page {
          overflow: auto;
          padding-top: 8px;
          padding-bottom: 14px;
        }

        .dashboard-map-pane {
          padding-top: 34px;
          padding-bottom: 24px;
        }

        .dashboard-map-wrap {
          height: min(60vh, 540px);
        }

        .dashboard-panel {
          margin-top: 12px;
          padding: 14px 24px 12px;
        }

        .dash-divider {
          margin: 9px 0 11px;
        }

        .dashboard-first-row {
          gap: 16px;
        }

        .dashboard-lower-row {
          gap: 16px;
          margin-top: 12px;
        }

        .dash-section-label {
          margin-bottom: 8px;
        }

        .mini-gauge-row {
          margin-bottom: 8px;
        }

        .mini-pollut-card {
          padding-top: 6px;
          padding-bottom: 6px;
        }

        .advice-card,
        .insight-card {
          padding: 10px 13px;
        }

        .trend-date-row {
          height: 22px;
        }

        .trend-bars,
        .trend-bar-wrap {
          height: 62px;
        }

        .trend-day-line {
          height: 58px;
        }

        .trend-footer {
          margin-top: 5px;
        }
      }
    `}</style>
  );
}
