/* ══════════════════════════════════════════════════════════════
   建議書 / 報告書產出器
   將頁面內容轉為適合列印、簽核的正式文書，一鍵下載 A4 PDF
   風格：綠色系公文，含簽名 / 核章欄位
   ══════════════════════════════════════════════════════════════ */

/* ─── HTML 逃脫 ─────────────────────────────────────────────── */
function esc(s: unknown): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  );
}

/* ─── 時間 / 編號 ──────────────────────────────────────────── */
function pad(n: number) {
  return String(n).padStart(2, '0');
}
function docStamp(prefix: string, d: Date) {
  return `${prefix}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}`;
}
function printedAt(d: Date) {
  return d.toLocaleString('zh-TW', { hour12: true });
}

/* ─── 片段建構 ─────────────────────────────────────────────── */
function table(headers: string[], rows: string[][]): string {
  return (
    `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>` +
    `<tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`
  );
}
function steps(items: string[]): string {
  return `<ol class="steps">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`;
}
function paragraph(text: string): string {
  return `<p>${esc(text)}</p>`;
}

interface Section {
  heading: string;
  html: string;
}
interface Sign {
  role: string;
  note: string;
}

interface ReportOpts {
  org: string;
  title: string;
  subtitle: string;
  docNo: string;
  classification: string;
  printed: string;
  eventRows: [string, string][];
  eventTag?: string;
  highlights: { label: string; value: string }[];
  sections: Section[];
  signs: Sign[];
  footer: string;
}

/* ─── 樣式（全部收斂在 .rpt 之下，避免污染頁面）───────────── */
const REPORT_WIDTH_PX = 794;

const RPT_CSS = `
.rpt{width:794px;min-width:794px;max-width:794px;overflow:hidden;background:#fff;color:#2b3128;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC","Heiti TC",sans-serif;font-size:12.5px;line-height:1.75;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.rpt *{box-sizing:border-box;margin:0;padding:0}
.rpt p,.rpt td,.rpt th,.rpt li,.rpt .v,.rpt .strat .h{overflow-wrap:break-word;word-break:break-word}
.rpt .sheet{width:794px;padding:42px 50px}
.rpt .top{display:flex;justify-content:space-between;align-items:flex-start;gap:28px;border-bottom:3px solid #5c8a76;padding-bottom:16px}
.rpt .top>div:first-child{min-width:0}
.rpt .org{font-size:12px;font-weight:700;color:#5d6f49;letter-spacing:.5px}
.rpt .title{font-size:27px;font-weight:800;color:#2b3128;letter-spacing:3px;margin-top:7px}
.rpt .subtitle{margin-top:5px;font-size:10.5px;letter-spacing:1.6px;color:#9aa88a;font-family:"Courier New",monospace;text-transform:uppercase}
.rpt .meta{text-align:right;font-size:11px;line-height:2;color:#5d6f49;white-space:nowrap}
.rpt .meta b{color:#2b3128;font-weight:700}
.rpt .event{margin-top:18px;background:#edf3ec;border:1px solid #d6e1d4;border-radius:8px;padding:14px 20px}
.rpt .erow{display:flex;gap:10px;padding:3px 0;font-size:12.5px;line-height:1.55}
.rpt .erow .k{min-width:104px;flex-shrink:0;color:#5d6f49;font-weight:700}
.rpt .erow .v{min-width:0;color:#2b3128}
.rpt .tag{margin-left:7px;color:#4a6b58;font-weight:800}
.rpt .hl{margin-top:12px;padding-top:12px;border-top:1px dashed #c1d0be;display:flex;flex-wrap:wrap;gap:26px}
.rpt .hl .item{display:flex;flex-direction:column;gap:2px}
.rpt .hl .l{font-size:11px;font-weight:700;color:#5d6f49}
.rpt .hl .v{font-size:21px;font-weight:800;color:#5c8a76;line-height:1.1}
.rpt .section{margin-top:19px}
.rpt .section h2{font-size:15px;font-weight:800;color:#2b3128;padding-left:12px;border-left:4px solid #5c8a76;margin-bottom:10px}
.rpt .section p{margin-bottom:7px}
.rpt .section p:last-child{margin-bottom:0}
.rpt table{width:100%;border-collapse:collapse;margin:6px 0;font-size:12px}
.rpt th{background:#edf3ec;color:#3a4a33;font-weight:700;text-align:left;padding:7px 11px;border:1px solid #d6e1d4}
.rpt td{padding:7px 11px;border:1px solid #e2e8df;color:#2b3128;vertical-align:top}
.rpt ol.steps{list-style:none;counter-reset:s;margin:4px 0}
.rpt ol.steps li{counter-increment:s;display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:14px;align-items:start;position:relative;padding-left:0;margin-bottom:7px;font-size:12.5px;break-inside:avoid}
.rpt ol.steps li::before{content:counter(s);grid-column:1;width:20px;height:20px;margin-top:1px;border-radius:50%;background:#e3ebdf;color:#4a6b58;font-size:11px;font-weight:800;line-height:20px;text-align:center}
.rpt .strat{border:1px solid #e2e8df;border-radius:8px;padding:11px 14px;margin-bottom:9px;overflow:hidden;break-inside:avoid}
.rpt .strat .h{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:13px;font-weight:800;color:#2b3128;margin-bottom:3px;line-height:1.5}
.rpt .strat .b{display:inline-block;flex:0 0 auto;font-size:10px;font-weight:700;color:#5c8a76;background:#edf3ec;border-radius:99px;padding:1px 8px;line-height:1.5;white-space:nowrap}
.rpt .strat p{font-size:12px;color:#4a5442;margin:0}
.rpt .sheet-signs{padding-top:6px;padding-bottom:6px}
.rpt .sheet-signs .signs{margin-top:0}
.rpt .signs{margin-top:38px;display:flex;gap:30px}
.rpt .sign{flex:1;text-align:center}
.rpt .sign .r{font-size:13px;font-weight:800;color:#2b3128}
.rpt .sign .line{margin-top:42px;border-top:1px solid #7a8a70}
.rpt .sign .n{margin-top:6px;font-size:10.5px;color:#9aa88a}
.rpt .sign .d{margin-top:9px;font-size:10px;color:#b4c0a9;letter-spacing:1px}
.rpt .foot{margin-top:24px;padding-top:12px;border-top:1px solid #e2e8df;text-align:center;font-size:10.5px;color:#9aa88a}
`;

/* ─── 組裝內文（本文與簽名區分開，確保簽名區不被分頁切斷）── */
function buildBody(o: ReportOpts): string {
  const eventRows = o.eventRows
    .map(
      ([k, v], i) =>
        `<div class="erow"><span class="k">${esc(k)}</span><span class="v">${esc(v)}${
          i === 1 && o.eventTag ? `<span class="tag">〔${esc(o.eventTag)}〕</span>` : ''
        }</span></div>`,
    )
    .join('');
  const hl = o.highlights.length
    ? `<div class="hl">${o.highlights
        .map((h) => `<div class="item"><span class="l">${esc(h.label)}</span><span class="v">${esc(h.value)}</span></div>`)
        .join('')}</div>`
    : '';
  const sections = o.sections
    .map((s) => `<div class="section"><h2>${esc(s.heading)}</h2>${s.html}</div>`)
    .join('');

  return (
    `<div class="sheet">` +
    `<div class="top"><div>` +
    `<div class="org">${esc(o.org)}</div>` +
    `<div class="title">${esc(o.title)}</div>` +
    `<div class="subtitle">${esc(o.subtitle)}</div>` +
    `</div><div class="meta">` +
    `事件編號：<b>${esc(o.docNo)}</b><br>列印時間：<b>${esc(o.printed)}</b><br>機密等級：<b>${esc(
      o.classification,
    )}</b>` +
    `</div></div>` +
    `<div class="event">${eventRows}${hl}</div>` +
    `${sections}` +
    `</div>`
  );
}

function buildSigns(o: ReportOpts): string {
  const signs = `<div class="signs">${o.signs
    .map(
      (s) =>
        `<div class="sign"><div class="r">${esc(s.role)}</div><div class="line"></div><div class="n">${esc(
          s.note,
        )}</div><div class="d">日期：＿＿＿／＿＿／＿＿</div></div>`,
    )
    .join('')}</div>`;
  return `<div class="sheet sheet-signs">${signs}<div class="foot">${esc(o.footer)}</div></div>`;
}

/* 由下往上找出實際內容底端，去掉截圖尾端多餘空白 */
function contentBottom(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.height;
  const { width, height } = canvas;
  try {
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4;
        if (data[i + 3] !== 0 && (data[i] < 248 || data[i + 1] < 248 || data[i + 2] < 248)) {
          return Math.min(height, y + 28);
        }
      }
    }
  } catch {
    /* getImageData 失敗時退回完整高度 */
  }
  return height;
}

/* 從理想分頁點往回找一條全白的橫列，讓分頁落在段落之間而非切穿文字；
   若分頁點正上方只是一個孤立標題，會再往上找，避免標題與內文被拆到兩頁 */
function findBreak(canvas: HTMLCanvasElement, idealY: number, lookBack: number): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return idealY;
  const { width } = canvas;
  const minY = Math.max(0, idealY - lookBack);
  try {
    const data = ctx.getImageData(0, 0, width, idealY + 1).data;
    const isWhite = (y: number) => {
      const base = y * width * 4;
      for (let x = 0; x < width; x += 4) {
        const i = base + x * 4;
        if (data[i + 3] !== 0 && (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250)) return false;
      }
      return true;
    };
    // 這個區塊左緣是否為章節標題那條實心綠色色條（#5c8a76，且需縱向連續）
    const hasHeadingBar = (yTop: number, yBot: number) => {
      let hit = 0;
      let total = 0;
      for (let y = yTop; y <= yBot; y++) {
        total++;
        for (let x = 98; x <= 114; x++) {
          const i = (y * width + x) * 4;
          if (
            Math.abs(data[i] - 92) < 42 &&
            Math.abs(data[i + 1] - 138) < 42 &&
            Math.abs(data[i + 2] - 118) < 42
          ) {
            hit++;
            break;
          }
        }
      }
      return total > 0 && hit / total > 0.5;
    };

    let y = idealY;
    while (y > minY) {
      while (y > minY && !isWhite(y)) y--;
      if (y <= minY) break;
      let bandTop = y;
      while (bandTop > 0 && isWhite(bandTop - 1)) bandTop--;
      const contentBottomY = bandTop - 1;
      if (contentBottomY <= minY) return y;
      let contentTopY = contentBottomY;
      while (contentTopY > 0 && !isWhite(contentTopY - 1)) contentTopY--;
      // 上方是一個孤立章節標題 → 跳過它，把整個章節推到下一頁
      if (contentBottomY - contentTopY <= 90 && hasHeadingBar(contentTopY, contentBottomY)) {
        y = contentTopY - 1;
        continue;
      }
      return y;
    }
  } catch {
    /* 失敗時用原本的分頁點 */
  }
  return idealY;
}

/* ─── 產生並下載 A4 PDF ────────────────────────────────────── */
async function downloadPdf(filename: string, opts: ReportOpts) {
  const [{ jsPDF }, html2canvasMod] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = html2canvasMod.default;

  const makeHolder = (inner: string) => {
    const holder = document.createElement('div');
    holder.className = 'rpt';
    holder.style.cssText = `position:fixed;left:-10000px;top:0;z-index:-1;width:${REPORT_WIDTH_PX}px;min-width:${REPORT_WIDTH_PX}px;max-width:${REPORT_WIDTH_PX}px;`;
    const style = document.createElement('style');
    style.textContent = RPT_CSS;
    holder.appendChild(style);
    const content = document.createElement('div');
    content.innerHTML = inner;
    holder.appendChild(content);
    document.body.appendChild(holder);
    return holder;
  };

  const bodyHolder = makeHolder(buildBody(opts));
  const signHolder = makeHolder(buildSigns(opts));

  try {
    if (document.fonts?.ready) await document.fonts.ready;

    const shot = (el: HTMLElement) =>
      html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        windowWidth: REPORT_WIDTH_PX,
        width: REPORT_WIDTH_PX,
        logging: false,
      });
    const [bodyCanvas, signCanvas] = await Promise.all([shot(bodyHolder), shot(signHolder)]);

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 26;
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;
    const pxToPt = usableW / bodyCanvas.width; // 兩張截圖同寬

    /** 把 canvas 的某段垂直區間畫到 PDF 目前頁的 (x, y) */
    const place = (src: HTMLCanvasElement, fromPx: number, hPx: number, y: number) => {
      const slice = document.createElement('canvas');
      slice.width = src.width;
      slice.height = hPx;
      const ctx = slice.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(src, 0, fromPx, src.width, hPx, 0, 0, src.width, hPx);
      }
      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, y, usableW, hPx * pxToPt);
    };

    const bodyPx = contentBottom(bodyCanvas);
    const signPx = contentBottom(signCanvas);
    const slicePx = Math.floor(usableH / pxToPt);

    // 本文：逐頁鋪排
    let rendered = 0;
    let usedPt = 0; // 最後一頁已使用的高度
    while (rendered < bodyPx) {
      let hPx = Math.min(slicePx, bodyPx - rendered);
      if (rendered + hPx < bodyPx) {
        // 還有下一頁：把分頁點退到最近的空白列（但不要退太多）
        const broken = findBreak(bodyCanvas, rendered + hPx, Math.round(slicePx * 0.22)) - rendered;
        if (broken > slicePx * 0.6) hPx = broken;
      }
      if (rendered > 0) pdf.addPage();
      place(bodyCanvas, rendered, hPx, margin);
      usedPt = hPx * pxToPt;
      rendered += hPx;
    }

    // 簽名區：整塊放在最後一頁剩餘空間，放不下就換新頁
    const signPt = signPx * pxToPt;
    if (usedPt + 18 + signPt <= usableH) {
      place(signCanvas, 0, signPx, margin + usedPt + 18);
    } else {
      pdf.addPage();
      place(signCanvas, 0, signPx, margin);
    }

    pdf.save(filename);
  } finally {
    bodyHolder.remove();
    signHolder.remove();
  }
}

/* ══════════════════════════════════════════════════════════════
   個人健康防護建議書
   ══════════════════════════════════════════════════════════════ */
export interface HealthReportInput {
  healthGuardEnabled: boolean;
  thresholds: { asthma: number; activity: number; urgency: number };
  thresholdLabel: (type: string, value: number) => string;
  summary: { label: string; value: string; detail: string }[];
  actions: string[];
  advice: string;
}

export async function downloadHealthReport(input: HealthReportInput) {
  const now = new Date();
  const { thresholds: t, thresholdLabel: tl } = input;
  const activityLabel = tl('activity', t.activity);

  await downloadPdf('個人健康防護建議書.pdf', {
    org: '桃園市政府環境保護局 ｜ 智慧空品健康防護平台',
    title: '個人健康防護建議書',
    subtitle: 'Personal Air Quality Health Advisory',
    docNo: docStamp('health', now),
    classification: '個人使用',
    printed: printedAt(now),
    eventRows: [
      ['產出時間', now.toLocaleString('zh-TW', { hour12: false })],
      ['適用地區', '桃園市中壢區'],
      ['守護狀態', input.healthGuardEnabled ? '主動健康守護：啟用' : '主動健康守護：關閉'],
      [
        input.summary[0]?.label ?? '今日建議',
        input.summary[0] ? `${input.summary[0].value}（${input.summary[0].detail}）` : '—',
      ],
    ],
    highlights: [
      { label: 'PM2.5 注意門檻', value: `${t.asthma} µg/m³` },
      { label: '活動強度基準', value: activityLabel },
      { label: '通知緊急度', value: tl('urgency', t.urgency) },
    ],
    sections: [
      {
        heading: '一、健康守護設定',
        html: table(
          ['設定項目', '目前設定值'],
          [
            ['主動健康守護', input.healthGuardEnabled ? '啟用' : '關閉'],
            ['氣喘 / 敏感門檻', tl('asthma', t.asthma)],
            ['活動強度基準', activityLabel],
            ['通知緊急度', tl('urgency', t.urgency)],
          ],
        ),
      },
      {
        heading: '二、個人健康摘要',
        html: table(
          ['項目', '結果', '說明'],
          input.summary.map((s) => [s.label, s.value, s.detail]),
        ),
      },
      {
        heading: '三、通知門檻',
        html:
          table(['指標', '門檻值'], [['PM2.5 注意', `${t.asthma} µg/m³`]]) +
          paragraph(
            `中壢區 PM2.5 濃度超過 ${t.asthma} µg/m³ 時發出通知，活動建議目前以「${activityLabel}」為基準。`,
          ),
      },
      { heading: '四、今日行動建議', html: steps(input.actions) },
      { heading: '五、AI 健康建議', html: paragraph(input.advice) },
    ],
    signs: [
      { role: '使用者確認', note: '（本人已閱讀並了解）' },
      { role: '健康 / 照護人員', note: '（簽章區，選填）' },
    ],
    footer: '本建議書由桃園市智慧空品健康防護平台 AI 系統產出，供個人健康防護參考，不具醫療診斷效力。',
  });
}

/* ══════════════════════════════════════════════════════════════
   空品治理決策建議書（公文簽核）
   ══════════════════════════════════════════════════════════════ */
export interface GovReportInput {
  govThresholds: { industrial: number; traffic: string; alert: number };
  summary: { label: string; value: string; detail: string }[];
  checklist: string[];
  strategies: { title: string; badge: string; desc: string }[];
}

export async function downloadGovReport(input: GovReportInput) {
  const now = new Date();
  const g = input.govThresholds;
  const improve = Math.round(g.industrial * 0.8);

  const stratHtml = input.strategies
    .map(
      (s) =>
        `<div class="strat"><div class="h">${esc(s.title)}<span class="b">${esc(s.badge)}</span></div>` +
        `<p>${esc(s.desc)}</p></div>`,
    )
    .join('');

  await downloadPdf('空品治理決策建議書.pdf', {
    org: '桃園市政府環境保護局 ｜ 空氣品質治理科',
    title: '空品治理決策建議書',
    subtitle: 'AI Air Quality Governance Decision Proposal',
    docNo: docStamp('gov', now),
    classification: '內部公務件',
    printed: printedAt(now),
    eventTag: '空品應變 / 管制',
    eventRows: [
      ['事件名稱', '空氣品質惡化跨區應變'],
      ['時間與類型', now.toLocaleString('zh-TW', { hour12: false })],
      ['重點區域', '中壢、觀音、大園（工業排放與下風處交會）'],
      ['預估高峰', '18:00 - 22:00（晚尖峰與邊界層下降）'],
      ['目前管制狀態', `交通管制「${g.traffic}」｜公眾警報 AQI > ${g.alert}`],
    ],
    highlights: [
      { label: '固定源降載幅度', value: `${g.industrial}%` },
      { label: '預估 PM2.5 改善', value: `約 ${improve}%` },
      { label: '公眾警報門檻', value: `AQI > ${g.alert}` },
    ],
    sections: [
      {
        heading: '一、政策模擬參數與判定依據',
        html:
          table(
            ['模擬參數', '設定值'],
            [
              ['工業產出汙染物削減', `${g.industrial}%`],
              ['交通管制強度', g.traffic],
              ['公眾警報門檻', `AQI > ${g.alert}`],
            ],
          ) +
          paragraph(
            `依即時空品監測、風場條件與污染源分布研判，於工業排放與交通移動源交會之下風處（中壢、觀音、大園）建議啟動分級管制：固定源降載 ${g.industrial}%、交通採「${g.traffic}」等級、公眾警報門檻設為 AQI > ${g.alert}。`,
          ),
      },
      {
        heading: '二、管制決策摘要',
        html: table(
          ['項目', '研判', '說明'],
          input.summary.map((s) => [s.label, s.value, s.detail]),
        ),
      },
      {
        heading: '三、政策模擬結果',
        html:
          table(
            ['措施', '幅度', '預估成效'],
            [['固定源降載', `${g.industrial}%`, `大園區 48 小時內 PM2.5 平均濃度預計改善 ${improve}%`]],
          ) +
          paragraph(
            `固定源降載 ${g.industrial}% 條件下，大園區 48 小時內 PM2.5 平均濃度預計改善 ${improve}%，下風處暴露風險同步下降。`,
          ),
      },
      { heading: '四、執行檢核清單', html: steps(input.checklist) },
      { heading: '五、AI 策略推薦', html: stratHtml },
    ],
    signs: [
      { role: 'AI 決策系統運算', note: '（系統自動簽核）' },
      { role: '值班人員簽章', note: '（簽章區）' },
      { role: '空品治理科主管核定', note: '（核定簽章）' },
    ],
    footer: '本建議書由桃園市政府環境保護局 AI 智慧治理系統產出，供內部決策與公文簽核參考。',
  });
}
