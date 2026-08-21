'use client';

import { C, GAUGE_SIZE } from './DashboardWidgets';

export function DashboardBaseStylesC() {
  return (
    <style>{`      .weather-forecast-title {
        font-size: 11px;
        font-weight: 700;
        color: ${C.hint};
        letter-spacing: 0.6px;
        margin: 16px 0 12px;
      }
      .weather-forecast-row {
        display: flex;
        justify-content: space-between;
      }
      .weather-forecast-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .weather-forecast-col-border {
        border-right: 1px solid rgba(0,0,0,0.07);
      }
      .weather-forecast-label { font-size: 12px; font-weight: 700; color: ${C.text}; }
      .weather-forecast-date { font-size: 10px; color: ${C.hint}; margin-top: 2px; }
      .weather-forecast-temp-row { font-size: 13px; }
      .weather-forecast-hi { font-weight: 700; color: #357DA4; }
      .weather-forecast-lo { font-weight: 600; color: #6F91B2; }
      .weather-forecast-pop-row {
        display: flex;
        align-items: center;
        gap: 3px;
        margin-top: 4px;
        font-size: 11px;
        font-weight: 600;
        color: #bbb;
      }

      .dashboard-first-row,
      .dashboard-second-row,
      .dashboard-lower-row {
        display: grid;
        gap: 20px;
        min-width: 0;
      }

      .dashboard-first-row {
        grid-template-columns: minmax(190px, 0.78fr) minmax(430px, 1.9fr);
        align-items: start;
        gap: 30px;
        min-height: 0;
        flex: 0 0 auto;
      }

      .dashboard-second-row {
        grid-template-columns: minmax(310px, 1fr) 1px minmax(360px, 1.12fr);
        align-items: start;
        margin-top: 14px;
        min-height: 0;
        flex: 0 0 auto;
      }

      .dashboard-lower-row {
        grid-template-columns: minmax(220px, 2fr) minmax(360px, 3fr);
        align-items: stretch;
        gap: 40px;
        margin-top: 35px;
        min-height: 0;
        flex: 0 0 auto;
      }

      .dashboard-side-stack {
        display: flex;
        flex-direction: column;
        gap: 22px;
        height: 100%;
        min-width: 0;
      }

      .dashboard-first-row > *,
      .dashboard-second-row > *,
      .dashboard-lower-row > * {
        min-width: 0;
      }

      .dash-section-label {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 16px;
        margin-bottom: 16px;
        color: ${C.text};
        font-size: 12px;
        font-weight: 800;
      }

      .dash-section-dot {
        width: 3px;
        height: 14px;
        flex-shrink: 0;
        border-radius: 2px;
        background: ${C.blue};
        box-shadow: 0 0 8px ${C.blueBorder};
      }

      .dash-section-label small {
        color: #aaa;
        font-size: 11px;
        font-weight: 600;
      }

      .aqi-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 6px;
      }

      .aqi-gauge {
        position: relative;
        width: ${GAUGE_SIZE}px;
        height: ${GAUGE_SIZE}px;
        display: grid;
        place-items: center;
      }

      .aqi-gauge svg {
        position: absolute;
        inset: 0;
      }

      .aqi-gauge circle {
        transition: stroke 0.18s ease;
      }

      .aqi-gauge-inner {
        position: relative;
        z-index: 1;
        width: ${GAUGE_SIZE - 46}px;
        height: ${GAUGE_SIZE - 46}px;
        border-radius: 50%;
        background: ${C.glass};
        border: 1px solid ${C.glassInner};
        box-shadow: 0 3px 12px ${C.glassShadow};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .aqi-label {
        color: ${C.hint};
        font-family: monospace;
        font-size: 8px;
        letter-spacing: 1.5px;
      }

      .aqi-gauge-inner strong {
        font-size: 32px;
        line-height: 34px;
        font-weight: 900;
      }

      .aqi-pill {
        margin-top: 4px;
        padding: 2px 8px;
        border: 1.2px solid;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
      }

      .aqi-hint {
        margin-top: 12px;
        color: ${C.hint};
        font-size: 10px;
        font-weight: 600;
      }

      .pollutant-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .mini-gauge-row,
      .mini-pollut-strip {
        display: grid;
      }

      .mini-gauge-row {
        grid-template-columns: 1fr 1px 1fr;
        gap: 0 18px;
        margin-bottom: 18px;
      }

      .mini-gauge-card {
        min-width: 0;
        padding: 6px 4px 2px;
        text-align: center;
      }

      .mini-gauge-card h3 {
        margin: 0;
        color: #444;
        font-size: 17px;
        line-height: 1;
        font-weight: 800;
      }

      .mini-gauge-card p {
        margin: 6px 0 4px;
        color: ${C.muted};
        font-size: 9px;
        font-weight: 600;
      }

      .mini-gauge-card small {
        display: block;
        margin-bottom: 4px;
        color: #aaa;
        font-size: 8px;
      }

      .mini-divider,
      .metric-divider,
      .row-divider {
        background: rgba(0, 0, 0, 0.08);
      }

      .mini-divider {
        margin: 8px 0;
      }

      .mini-arc {
        display: block;
        margin: 0 auto;
        overflow: visible;
        width: 152px;
        height: 72px;
      }

      .mini-arc path,
      .mini-arc text {
        transition: fill 0.18s ease;
      }

      .mini-pollut-strip {
        grid-template-columns: repeat(7, auto);
        gap: 0 10px;
      }

      .mini-pollut-card {
        min-width: 0;
        padding: 10px 12px;
        text-align: center;
      }

      .metric-divider {
        width: 1px;
        margin: 8px 0;
      }

      .mini-pollut-card h4 {
        margin: 0;
        color: #555;
        font-size: 15px;
        line-height: 1.1;
        font-weight: 800;
      }

      .mini-pollut-card p {
        margin: 6px 0 9px;
        color: ${C.muted};
        font-size: 9px;
        font-weight: 600;
      }

      .mini-pollut-value {
        display: inline-flex;
        align-items: baseline;
        justify-content: center;
        gap: 7px;
      }

      .mini-pollut-value strong {
        color: #315E8F;
        font-size: 16px;
        line-height: 1;
        font-weight: 800;
      }

      .mini-pollut-value small {
        color: #aaa;
        font-size: 9px;
        font-weight: 700;
      }

      .advice-card,
      .insight-card {
        display: flex;
        align-items: center;
        gap: 14px;
        border-radius: 12px;
        padding: 16px 18px;
        min-width: 0;
      }

      .advice-icon,
      .insight-icon {
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
      }

      .advice-icon {
        box-shadow: none;
      }

      .advice-card p,
      .insight-card p {
        margin: 0;
      }

      .advice-card p {
        color: ${C.muted};
        font-size: 13px;
        line-height: 1.5;
        font-weight: 700;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .row-divider {
        width: 1px;
        align-self: stretch;
      }

      .insight-card {
        background: ${C.blueLt};
        border: 1px solid ${C.blueBorder};
      }

      .insight-icon {
        background: rgba(49, 94, 143, 0.16);
        color: ${C.blue};
      }

      .insight-copy {
        flex: 1;
        min-width: 0;
      }

      .insight-copy strong {
        display: block;
        color: ${C.blue};
        font-size: 13px;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .insight-copy span {
        display: block;
        margin-top: 6px;
        color: ${C.muted};
        font-size: 11px;
        font-weight: 600;
        overflow-wrap: anywhere;
      }

      .ai-insight-meta {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }

      .ai-action-row,
      .ai-source-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        min-width: 0;
      }

      .ai-action-chip,
      .ai-source-chip {
        max-width: 100%;
        border-radius: 999px;
        padding: 4px 8px;
        font-size: 10px;
        line-height: 1.35;
        font-weight: 800;
        text-decoration: none;
        overflow-wrap: anywhere;
      }

      .ai-action-chip {
        border: 1px solid rgba(49, 94, 143, 0.22);
        background: rgba(49, 94, 143, 0.08);
        color: ${C.blue};
      }

      .ai-source-chip {
        border: 1px solid rgba(80, 103, 128, 0.18);
        background: rgba(255, 255, 255, 0.58);
        color: ${C.muted};
      }

      .ai-disclaimer {
        margin: 0;
        color: ${C.hint};
        font-size: 10px;
        line-height: 1.45;
        font-weight: 700;
      }

      .trend-section {
        display: flex;
        flex-direction: column;
        align-self: stretch;
        margin-top: 0;
        min-height: 0;
        min-width: 0;
        max-width: 100%;
      }

      .trend-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        height: 22px;
      }

      .scroll-hint {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid ${C.blueBorder};
        border-radius: 999px;
        padding: 4px 10px;
        background: rgba(49, 94, 143, 0.10);
        color: ${C.blue};
        font-size: 11px;
        font-weight: 800;
      }

      .trend-scroll {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 0 0 8px 0;
        overscroll-behavior-inline: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: rgba(49, 94, 143, 0.28) transparent;
      }

      .trend-scroll::-webkit-scrollbar {
        height: 3px;
      }

      .trend-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .trend-scroll::-webkit-scrollbar-thumb {
        background: rgba(49, 94, 143, 0.28);
        border-radius: 99px;
      }

      .trend-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(49, 94, 143, 0.55);
      }

      .trend-inner {
        min-width: max-content;
      }

      .trend-date-row {
        position: relative;
        height: 20px;
        margin-bottom: 0;
      }

      .trend-date-label {
        position: absolute;
        top: 0;
        color: ${C.blue};
        font-size: 11px;
        font-weight: 800;
        white-space: nowrap;
      }

      .trend-bars {
        height: 80px;
        display: flex;
        align-items: flex-end;
      }

      .trend-bar-wrap {
        position: relative;
        height: 80px;
        flex-shrink: 0;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .trend-day-line {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 1.5px;
        height: 70px;
        transform: translateX(-50%);
        background: ${C.blue};
        z-index: 0;
      }

      .trend-bar {
        position: relative;
        z-index: 1;
        display: block;
        border: 1px solid transparent;
        border-radius: 4px;
      }

      .trend-hour-row {
        position: relative;
        height: 22px;
        margin-top: 6px;
      }

      .trend-hour {
        position: absolute;
        top: 2px;
        width: 20px;
        text-align: center;
        color: rgba(93, 115, 137, 0.6);
        font-size: 9px;
        font-weight: 700;
      }

      .trend-hour.now {
        color: ${C.blue};
        font-size: 9px;
        font-weight: 900;
      }

      .trend-hour.prediction {
        color: rgba(93, 115, 137, 0.4);
        font-style: italic;
      }

      .trend-footer {
        position: relative;
        height: 22px;
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
        color: ${C.hint};
        font-size: 11px;
        font-weight: 800;
      }

      .trend-footer strong {
        position: absolute;
        top: 0;
        color: ${C.blue};
        font-size: 11px;
        font-weight: 900;
      }

`}</style>
  );
}
