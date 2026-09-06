'use client';

export function DashboardBaseStylesA() {
  return (
    <style>{`
      .dashboard-page {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        min-height: calc(100svh - 80px);
        padding: 10px 32px 22px;
        display: grid;
        grid-template-columns: minmax(320px, 32%) minmax(680px, 1fr);
        gap: 20px;
        overflow-x: hidden;
      }

      .dashboard-map-pane {
      align-self: start;
        position: relative;
        min-width: 0;
        padding: 12px 8px 34px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .dashboard-map-wrap {
        width: min(100%, 500px);
        height: clamp(360px, calc(100svh - 150px), 560px);
        overflow: hidden;
      }

      .dashboard-map-action {
        position: absolute;
        left: 20px;
        bottom: 6px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #6a8d73;
        border-radius: 999px;
        padding: 8px 14px;
        background: #e8e6d3;
        color: #6a8d73;
        font-size: 14px;
        font-weight: 800;
        white-space: nowrap;
      }

      .dashboard-panel {
        height: auto;
        min-height: 0;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        align-self: start;    
        margin-top: 20px;
        background: rgba(255, 255, 255, 0.97);
        border: 1px solid rgba(106, 141, 115, 0.08);
        border-radius: 16px;
        box-shadow: 0 4px 32px rgba(106, 141, 115, 0.08);
        padding: 22px 32px 20px;
        display: flex;
        flex-direction: column;
      }

      .district-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #6a8d73;
        font-size: 20px;
        font-weight: 900;
        letter-spacing: 0;
        flex: 0 0 auto;
        line-height: 1;
      }

      .district-heading h1 {
        margin: 0;
        font-size: inherit;
        line-height: 1;
      }

      .dash-divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.06);
        margin: 12px 0 16px;
        flex: 0 0 auto;
      }

      .weather-section {
        margin-top: 40px;
      }
`}</style>
  );
}
