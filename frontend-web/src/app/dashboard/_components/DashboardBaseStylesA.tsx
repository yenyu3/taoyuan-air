'use client';

export function DashboardBaseStylesA() {
  return (
    <style>{`
      .dashboard-page {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        min-height: calc(100vh - 80px);
        padding: 12px 40px 32px;
        display: grid;
        grid-template-columns: minmax(380px, 36%) minmax(760px, 1fr);
        gap: 22px;
        overflow-x: hidden;
      }

      .dashboard-map-pane {
      align-self: start;
        position: relative;
        min-width: 0;
        padding: 26px 18px 42px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .dashboard-map-wrap {
        width: min(100%, 560px);
        height: min(68vh, 610px);
        overflow: hidden;
      }

      .dashboard-map-action {
        position: absolute;
        left: 32px;
        bottom: 16px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #315E8F;
        border-radius: 999px;
        padding: 10px 18px;
        background: #DCE8F3;
        color: #315E8F;
        font-size: 15px;
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
        margin-top: 10px;
        background: rgba(255, 255, 255, 0.97);
        border: 1px solid rgba(49, 94, 143, 0.08);
        border-radius: 20px;
        box-shadow: 0 4px 32px rgba(49, 94, 143, 0.08);
        padding: 26px 36px 24px;
        display: flex;
        flex-direction: column;
      }

      .district-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #315E8F;
        font-size: 22px;
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
        margin: 14px 0 18px;
        flex: 0 0 auto;
      }

      .weather-section {
        margin-top: 40px;
      }
`}</style>
  );
}
