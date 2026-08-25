'use client';

import { C } from './DashboardWidgets';

export function DashboardBaseStylesB() {
  return (
    <style>{`      .weather-card {
        background: rgba(255, 255, 255, 0.97);
        padding: 18px 20px;
        padding-top: 0;
      }
      .weather-temp-row {
        display: flex;
        flex-direction: row;
        align-items: flex-end; 
      }
      .weather-district-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        color: ${C.blue};
        background: ${C.blueLt};
        border: 1px solid ${C.blueBorder};
        border-radius: 10px;
        padding: 4px 10px;
        align-self: flex-end;   
        margin-top: 6px; 
        margin-left: 12px;       
      }
      .weather-current-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .weather-temp-big {
        font-size: 48px;
        font-weight: 700;
        color: ${C.text};
        line-height: 1.1;
      }
      .weather-desc {
        font-size: 14px;
        color: ${C.muted};
        margin: 2px 0 4px;
      }
      .weather-hilo-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
      }
      .weather-hi { color: #357DA4; }
      .weather-lo { color: #6F91B2; }
      .weather-sep { color: #bbb; font-size: 12px; }
      .weather-icon-circle {
        width: 64px;
        height: 64px;
        border-radius: 32px;
        background: ${C.blueLt};
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .weather-stats-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(0,0,0,0.025);
        border-radius: 12px;
        padding: 10px 8px;
      }
      .weather-stat-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
      }
      .weather-stat-val { font-size: 12px; font-weight: 700; color: ${C.text}; }
      .weather-stat-label { font-size: 10px; color: ${C.hint}; }
      .weather-stat-sep { width: 1px; height: 28px; background: rgba(0,0,0,0.07); }
`}</style>
  );
}
