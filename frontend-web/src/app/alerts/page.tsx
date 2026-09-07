'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity, BarChart2, Car, ClipboardList, Download, Factory,
  Lightbulb, MapPinned, Megaphone, RadioTower, ShieldAlert, Stethoscope, Target, Zap,
} from 'lucide-react';
import { useStore } from '@shared/store';
import { getAlerts, setScenario } from '@shared/api/index';
import { PentagonRadar } from '@/components/charts/PentagonRadar';
import { useLoginButton } from '@/lib/login-button-context';
import { downloadHealthReport, downloadGovReport } from './_report';

/* ─── Design tokens ──────────────────────────────────────────── */
const C = {
  primary:      '#6a8d73',
  primaryAlpha: 'rgba(106, 141, 115, 0.12)',
  primaryBorder:'rgba(106, 141, 115, 0.30)',
  blue:         '#7fae8a',
  blueAlpha:    'rgba(127, 174, 138, 0.12)',
  blueBorder:   'rgba(127, 174, 138, 0.35)',
  accent:       '#5c9a7a',
  accentAlpha:  'rgba(92, 154, 122, 0.13)',
  accentBorder: 'rgba(92, 154, 122, 0.28)',
  glass:        'rgba(255,255,255,0.52)',
  glassBorder:  'rgba(255,255,255,0.72)',
  glassShadow:  '0 4px 16px rgba(62, 81, 66, 0.10)',
  text:         '#2d3129',
  muted:        '#5d6f49',
  hint:         '#8fa96f',
};

const card: React.CSSProperties = {
  backgroundColor: C.glass,
  border: `1px solid ${C.glassBorder}`,
  borderRadius: 20,
  boxShadow: C.glassShadow,
};

const softPanel: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.42)',
  border: '1px solid rgba(106, 141, 115, 0.14)',
  borderRadius: 14,
};

const divider: React.CSSProperties = {
  height: 1,
  backgroundColor: 'rgba(106, 141, 115, 0.16)',
};

/* ─── Toggle ─────────────────────────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch" aria-checked={value} tabIndex={0}
      onClick={() => onChange(!value)}
      onKeyDown={(e) => e.key === ' ' && onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
        position: 'relative', flexShrink: 0, outline: 'none',
        backgroundColor: value ? C.primary : 'rgba(62, 81, 66, 0.25)',
        transition: 'background-color 0.2s',
        boxShadow: value ? `0 0 0 3px ${C.primaryAlpha}` : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }} />
    </div>
  );
}

/* ─── Custom Slider ──────────────────────────────────────────── */
interface SliderProps {
  min: number; max: number; value: number;
  onChange: (v: number) => void;
  color?: string;
}
function Slider({ min, max, value, onChange, color = C.primary }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center' }}>
      {/* track bg */}
      <div style={{
        position: 'absolute', width: '100%', height: 5, borderRadius: 3,
        backgroundColor: 'rgba(62, 81, 66, 0.15)',
      }} />
      {/* filled track */}
      <div style={{
        position: 'absolute', height: 5, borderRadius: 3,
        backgroundColor: color, width: `${pct}%`,
        transition: 'width 0.05s',
      }} />
      {/* thumb visual */}
      <div style={{
        position: 'absolute', width: 17, height: 17, borderRadius: '50%',
        backgroundColor: '#fff', border: `2.5px solid ${color}`,
        boxShadow: `0 2px 8px rgba(62, 81, 66, 0.25)`,
        left: `calc(${pct}% - 8.5px)`, pointerEvents: 'none', zIndex: 1,
        transition: 'left 0.05s',
      }} />
      {/* native input — transparent, sits on top for interaction */}
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: 'absolute', width: '100%', opacity: 0,
          cursor: 'pointer', height: 22, margin: 0, zIndex: 2,
        }}
      />
    </div>
  );
}

/* ─── Section label ──────────────────────────────────────────── */
function SectionLabel({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingLeft: 2 }}>
      <div style={{
        width: 3, height: 14, borderRadius: 2,
        backgroundColor: C.primary,
        boxShadow: `0 0 6px ${C.primaryAlpha}`,
      }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 0.2 }}>{title}</span>
    </div>
  );
}

/* ─── Column header — 固定高度，讓左右兩欄的內容起點對齊 ────── */
function ColumnHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, minHeight: 34, marginBottom: 14, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 2 }}>
        <div style={{
          width: 3, height: 14, borderRadius: 2,
          backgroundColor: C.primary,
          boxShadow: `0 0 6px ${C.primaryAlpha}`,
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 0.2 }}>{title}</span>
      </div>
      {action}
    </div>
  );
}

/* ─── Download report button ─────────────────────────────────── */
function DownloadReportButton({ onClick }: { onClick: () => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try {
          await onClick();
        } catch (e) {
          console.error(e);
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        padding: '7px 14px', borderRadius: 99, cursor: busy ? 'default' : 'pointer',
        backgroundColor: C.primaryAlpha, border: `1px solid ${C.primaryBorder}`,
        fontSize: 12, fontWeight: 700, color: C.primary, opacity: busy ? 0.65 : 1,
        transition: 'all 0.15s',
      }}
    >
      <Download size={14} strokeWidth={2.2} />
      {busy ? '產生 PDF…' : '下載完整報告'}
    </button>
  );
}

/* ─── Donut chart ────────────────────────────────────────────── */
function DonutChart() {
  return (
    <div style={{
      width: 88, height: 88, borderRadius: '50%',
      background: `conic-gradient(${C.primary} 0% 70%, rgba(93, 111, 73, 0.42) 70% 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 4px 16px rgba(106, 141, 115, 0.15)`,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        backgroundColor: 'rgba(248,251,255,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>70%</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function AlertsPage() {
  const { setAlerts, selectedScenario, setIsLoading } = useStore();
  const { role } = useLoginButton();
  const activeTab: 'HEALTH' | 'GOV' = role === 'government' ? 'GOV' : 'HEALTH';
  const [healthGuardEnabled, setHealthGuardEnabled] = useState(true);
  const [thresholds, setThresholds] = useState({ asthma: 35, activity: 80, urgency: 20 });
  const [govThresholds, setGovThresholds] = useState({
    industrial: 10,
    traffic: '輕度' as '輕度' | '中管制' | '強管制' | '極強管制',
    alert: 30,
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setScenario(selectedScenario);
    getAlerts().then(setAlerts).catch(console.error).finally(() => setIsLoading(false));
  }, [selectedScenario, setAlerts, setIsLoading]);

  const getThresholdLabel = (type: string, value: number) => {
    if (type === 'asthma') return `${value} µg/m³`;
    if (type === 'activity') return value > 70 ? '劇烈運動' : value > 40 ? '中等運動' : '輕度運動';
    if (type === 'urgency') return value < 30 ? '僅重要' : value < 70 ? '一般' : '全部';
    return `${value}`;
  };

  const healthSliders = [
    { key: 'asthma'  as const, label: '氣喘門檻',   Icon: Stethoscope, left: '嚴格', right: '寬鬆', color: C.primary },
    { key: 'activity'as const, label: '活動強度',   Icon: Activity,    left: '輕度', right: '劇烈', color: C.primary },
    { key: 'urgency' as const, label: '通知緊急度', Icon: Zap,         left: '全部', right: '緊急', color: C.primary },
  ];

  const strategies = [
    {
      Icon: Factory, bg: C.primaryAlpha, color: C.primary,
      title: '固定污染源協調', badge: '高優先', badgeBg: C.primaryAlpha, badgeColor: C.primary,
      desc: `通知觀音、大園工業區高排放製程於 18:00 後降載 ${govThresholds.industrial}%，同步要求回報燃料使用、洗滌塔運轉與異常排放紀錄。`,
    },
    {
      Icon: Car, bg: C.blueAlpha, color: C.blue,
      title: '交通熱區分流', badge: '跨局處', badgeBg: C.blueAlpha, badgeColor: C.blue,
      desc: `依 ${govThresholds.traffic} 等級調整中壢、桃園幹道號誌週期，必要時啟動大型車改道與停車場導引，降低尖峰 NO₂ 與 PM2.5 累積。`,
    },
    {
      Icon: Megaphone, bg: C.accentAlpha, color: C.accent,
      title: '分眾通報發布', badge: '預備發布', badgeBg: C.accentAlpha, badgeColor: C.accent,
      desc: `AQI 超過 ${govThresholds.alert} 時，優先對學校、長照機構與戶外作業單位發布低暴露時段建議，並附上課程與勤務調整指引。`,
    },
  ];

  const govSummary = [
    { label: '重點區域', value: '中壢、觀音、大園', detail: '下風處與工業排放交會' },
    { label: '預估高峰', value: '18:00-22:00', detail: '晚尖峰與邊界層下降' },
    { label: '管制狀態', value: govThresholds.traffic, detail: `公眾警報 AQI > ${govThresholds.alert}` },
  ];

  const actionChecklist = [
    '通知環保稽查隊檢視高排放源即時監測與歷史異常紀錄',
    '同步交通局評估幹道號誌調整、大型車分流與施工時段限制',
    '將學校、醫療與長照機構列入分眾通報清單並準備發布稿',
  ];

  const healthSummary = [
    { label: '今日建議', value: '可正常外出', detail: '敏感族群避開尖峰車流路段' },
    { label: '適合時段', value: '06:00-10:00', detail: '晨間擴散條件較穩定' },
    { label: '提醒門檻', value: `${thresholds.asthma} µg/m³`, detail: `通知緊急度: ${getThresholdLabel('urgency', thresholds.urgency)}` },
  ];

  const personalActions = [
    '戶外運動優先安排在上午或風速較穩定時段',
    '氣喘、過敏或年長者外出可攜帶口罩與常用藥物',
    '若系統推播 PM2.5 或臭氧升高，改採室內活動或降低運動強度',
  ];

  const healthAdvice = '上午空氣品質較穩定，適合散步、通勤與中低強度運動；若下午接近交通尖峰，敏感族群建議縮短戶外停留時間並避開車流密集道路。';

  const handleDownloadHealthReport = () =>
    downloadHealthReport({
      healthGuardEnabled,
      thresholds,
      thresholdLabel: getThresholdLabel,
      summary: healthSummary,
      actions: personalActions,
      advice: healthAdvice,
    });

  const handleDownloadGovReport = () =>
    downloadGovReport({
      govThresholds,
      summary: govSummary,
      checklist: actionChecklist,
      strategies: strategies.map((s) => ({ title: s.title, badge: s.badge, desc: s.desc })),
    });

  return (
    <>
    <div style={{ minHeight: '100vh', background: 'var(--app-bg-gradient)', paddingBottom: 100 }}>
      <div style={{ padding: isMobile ? '20px 16px 28px' : '28px 40px 32px' }}>

        {/* ════════════════════════════════════════════════════
            個人健康
        ════════════════════════════════════════════════════ */}
        {activeTab === 'HEALTH' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>

            {/* Left — 健康守護設定 */}
            <div style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : undefined }}>
              <ColumnHeader title="健康守護設定" />
              <div style={{ ...card, padding: isMobile ? 20 : 28 }}>
                {/* card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5 }}>主動健康守護</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.hint, letterSpacing: 1.2 }}>自訂敏感度</p>
                  </div>
                  <Toggle value={healthGuardEnabled} onChange={setHealthGuardEnabled} />
                </div>

                {/* sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                  {healthSliders.map(({ key, label, Icon, left, right, color }) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <Icon size={16} color={color} strokeWidth={2.2} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</span>
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 700, color,
                          backgroundColor: C.primaryAlpha, padding: '3px 10px', borderRadius: 99,
                        }}>
                          {getThresholdLabel(key, thresholds[key])}
                        </span>
                      </div>
                      <Slider
                        min={0} max={100} value={thresholds[key]} color={color}
                        onChange={(v) => setThresholds(prev => ({ ...prev, [key]: v }))}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.hint, letterSpacing: 0.5 }}>{left}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.hint, letterSpacing: 0.5 }}>{right}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — 分析結果 */}
            <div style={{ flex: isMobile ? 'none' : 1.7, width: isMobile ? '100%' : undefined, display: 'flex', flexDirection: 'column', gap: 0 }}>
              <ColumnHeader title="分析結果" action={<DownloadReportButton onClick={handleDownloadHealthReport} />} />

              <div style={{ ...card, padding: isMobile ? 18 : 24, borderRadius: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>個人健康摘要</p>
                    <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      依目前空氣品質、活動強度與通知設定，整理今天最需要留意的外出與運動建議。
                    </p>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 800, color: healthGuardEnabled ? C.primary : C.hint,
                    backgroundColor: healthGuardEnabled ? C.primaryAlpha : 'rgba(62, 81, 66, 0.08)',
                    padding: '5px 12px', borderRadius: 99, whiteSpace: 'nowrap',
                  }}>{healthGuardEnabled ? '守護啟用' : '守護關閉'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 0, ...softPanel, overflow: 'hidden', marginBottom: 22 }}>
                  {healthSummary.map((item, index) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '15px 16px',
                        borderRight: !isMobile && index < healthSummary.length - 1 ? '1px solid rgba(106, 141, 115, 0.14)' : undefined,
                        borderBottom: isMobile && index < healthSummary.length - 1 ? '1px solid rgba(106, 141, 115, 0.14)' : undefined,
                      }}
                    >
                      <p style={{ fontSize: 10, fontWeight: 800, color: C.hint, letterSpacing: 0.8, marginBottom: 6 }}>{item.label}</p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 5 }}>{item.value}</p>
                      <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.45 }}>{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 18 : 24, alignItems: 'stretch', marginBottom: 22 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Activity size={16} color={C.primary} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>身體負擔判讀</span>
                    </div>
                    <div style={{ ...softPanel, padding: 16, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 4 }}>環境穩定度</p>
                          <p style={{ fontSize: 11, color: C.muted }}>穩定指數: 92%</p>
                        </div>
                        <PentagonRadar data={[0.9, 0.7, 0.8, 0.6, 0.75]} labels={['化學', '粉塵', '生物', '氣體', '氣候']} size={96} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <ShieldAlert size={16} color={C.primary} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>主要影響來源</span>
                    </div>
                    <div style={{ ...softPanel, padding: 16, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
                      <DonutChart />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {[{ color: C.primary, label: '工廠周邊', value: '70%' }, { color: '#5d6f49', label: '交通路段', value: '30%' }].map(({ color, label, value }) => (
                          <div key={label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{label}</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color }}>{value}</span>
                            </div>
                            <div style={{ height: 5, borderRadius: 99, backgroundColor: 'rgba(106, 141, 115, 0.12)', overflow: 'hidden' }}>
                              <div style={{ width: value, height: '100%', backgroundColor: color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={divider} />

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.9fr 1.1fr', gap: isMobile ? 18 : 28, paddingTop: 20, paddingBottom: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Megaphone size={16} color={C.primary} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>通知門檻</span>
                    </div>
                    <div style={{ ...softPanel, padding: '13px 15px', backgroundColor: C.accentAlpha }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>PM<sub className="text-xs">2.5</sub> 注意</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: C.accent }}>{thresholds.asthma}</span>
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                        中壢區濃度超過 {thresholds.asthma} µg/m³ 時通知，活動建議目前以{getThresholdLabel('activity', thresholds.activity)}為基準。
                      </p>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <ClipboardList size={16} color={C.primary} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>今天可以怎麼做</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {personalActions.map((item, index) => (
                        <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{
                            flex: '0 0 auto',
                            width: 20, height: 20, borderRadius: 10,
                            display: 'grid', placeItems: 'center',
                            backgroundColor: C.primaryAlpha,
                            color: C.primary,
                            fontSize: 10,
                            fontWeight: 900,
                          }}>{index + 1}</span>
                          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={divider} />

                <div style={{ paddingTop: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    backgroundColor: C.primaryAlpha,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Lightbulb size={18} color={C.primary} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 0.8, marginBottom: 5 }}>AI 健康建議</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.6 }}>
                      {healthAdvice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            治理支援
        ════════════════════════════════════════════════════ */}
        {activeTab === 'GOV' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>

            {/* Left — 治理參數調整 */}
            <div style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : undefined }}>
              <ColumnHeader title="治理參數調整" />
              <div style={{ ...card, padding: isMobile ? 20 : 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5 }}>政策模擬參數</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.hint, letterSpacing: 1.2 }}>調整治理強度</p>
                  </div>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    backgroundColor: C.primaryAlpha, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BarChart2 size={18} color={C.primary} strokeWidth={2} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                  {/* 工業產出削減 */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Factory size={16} color={C.primary} strokeWidth={2} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>工業產出汙染物削減</span>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: C.primary,
                        backgroundColor: C.primaryAlpha, padding: '3px 10px', borderRadius: 99,
                      }}>削減 {govThresholds.industrial}%</span>
                    </div>
                    <Slider min={0} max={50} value={govThresholds.industrial} color={C.primary}
                      onChange={(v) => setGovThresholds(p => ({ ...p, industrial: v }))} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.hint }}>0%</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.hint }}>50%</span>
                    </div>
                  </div>

                  {/* 交通管制強度 */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Car size={16} color={C.blue} strokeWidth={2} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>交通管制強度</span>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: C.blue,
                        backgroundColor: C.blueAlpha, padding: '3px 10px', borderRadius: 99,
                      }}>{govThresholds.traffic}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 8 }}>
                      {(['輕度', '中管制', '強管制', '極強管制'] as const).map((opt) => {
                        const active = govThresholds.traffic === opt;
                        return (
                          <button key={opt} onClick={() => setGovThresholds(p => ({ ...p, traffic: opt }))} style={{
                            flex: isMobile ? '1 1 calc(50% - 4px)' : 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                            fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                            backgroundColor: active ? C.blueAlpha : C.glass,
                            border: `1px solid ${active ? C.blueBorder : C.glassBorder}`,
                            color: active ? C.blue : C.muted,
                          }}>{opt}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 公眾警報門檻 */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Megaphone size={16} color={C.accent} strokeWidth={2} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>公眾警報門檻</span>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: C.accent,
                        backgroundColor: C.accentAlpha, padding: '3px 10px', borderRadius: 99,
                      }}>AQI &gt; {govThresholds.alert}</span>
                    </div>
                    <Slider min={0} max={200} value={govThresholds.alert} color={C.accent}
                      onChange={(v) => setGovThresholds(p => ({ ...p, alert: v }))} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.hint }}>AQI 0</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.hint }}>AQI 200</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — 治理分析結果 */}
            <div style={{ flex: isMobile ? 'none' : 1.7, width: isMobile ? '100%' : undefined, display: 'flex', flexDirection: 'column', gap: 0 }}>
              <ColumnHeader title="治理分析結果" action={<DownloadReportButton onClick={handleDownloadGovReport} />} />

              <div style={{ ...card, padding: isMobile ? 18 : 24, borderRadius: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>管制決策摘要</p>
                    <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      依即時監測、風場條件與污染源分布，彙整未來數小時可執行的治理優先序。
                    </p>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 800, color: C.primary,
                    backgroundColor: C.primaryAlpha, padding: '5px 12px', borderRadius: 99,
                    whiteSpace: 'nowrap',
                  }}>建議啟動</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 0, ...softPanel, overflow: 'hidden', marginBottom: 22 }}>
                  {govSummary.map((item, index) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '15px 16px',
                        borderRight: !isMobile && index < govSummary.length - 1 ? '1px solid rgba(106, 141, 115, 0.14)' : undefined,
                        borderBottom: isMobile && index < govSummary.length - 1 ? '1px solid rgba(106, 141, 115, 0.14)' : undefined,
                      }}
                    >
                      <p style={{ fontSize: 10, fontWeight: 800, color: C.hint, letterSpacing: 0.8, marginBottom: 6 }}>{item.label}</p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 5 }}>{item.value}</p>
                      <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.45 }}>{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 18 : 24, alignItems: 'stretch', marginBottom: 22 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Target size={16} color={C.primary} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>風險來源判讀</span>
                    </div>
                    <div style={{ ...softPanel, padding: 16, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 4 }}>異常偵測</p>
                          <p style={{ fontSize: 11, color: C.muted }}>穩定指數: 85%</p>
                        </div>
                        <PentagonRadar data={[0.8, 0.6, 0.7, 0.9, 0.5]} labels={['化學', '粉塵', '生物', '氣體', '氣候']} size={96} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <MapPinned size={16} color={C.primary} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>來源歸因</span>
                    </div>
                    <div style={{ ...softPanel, padding: 16, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
                      <DonutChart />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {[{ color: C.primary, label: '工業排放', value: '70%' }, { color: '#5d6f49', label: '交通移動源', value: '30%' }].map(({ color, label, value }) => (
                          <div key={label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{label}</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color }}>{value}</span>
                            </div>
                            <div style={{ height: 5, borderRadius: 99, backgroundColor: 'rgba(106, 141, 115, 0.12)', overflow: 'hidden' }}>
                              <div style={{ width: value, height: '100%', backgroundColor: color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={divider} />

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.95fr 1.05fr', gap: isMobile ? 18 : 28, paddingTop: 20, paddingBottom: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <RadioTower size={16} color={C.primary} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>政策模擬結果</span>
                    </div>
                    <div style={{ ...softPanel, padding: '13px 15px', backgroundColor: C.primaryAlpha }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>固定源降載</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: C.primary }}>{govThresholds.industrial}%</span>
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                        大園區 48 小時內 PM2.5 平均濃度預計改善 {Math.round(govThresholds.industrial * 0.8)}%，下風處暴露風險同步下降。
                      </p>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <ClipboardList size={16} color={C.primary} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>執行檢核</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {actionChecklist.map((item, index) => (
                        <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{
                            flex: '0 0 auto',
                            width: 20, height: 20, borderRadius: 10,
                            display: 'grid', placeItems: 'center',
                            backgroundColor: C.primaryAlpha,
                            color: C.primary,
                            fontSize: 10,
                            fontWeight: 900,
                          }}>{index + 1}</span>
                          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={divider} />

                <div style={{ paddingTop: 20 }}>
                  <SectionLabel title="AI 策略推薦" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {strategies.map(({ Icon, bg, color, title, badge, badgeBg, badgeColor, desc }, index) => (
                      <div
                        key={title}
                        style={{
                          display: 'flex',
                          gap: 14,
                          alignItems: 'flex-start',
                          padding: index === 0 ? '0 0 16px' : '16px 0',
                          borderBottom: index < strategies.length - 1 ? '1px solid rgba(106, 141, 115, 0.14)' : undefined,
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={17} color={color} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 5 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{title}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 800, color: badgeColor, letterSpacing: 0.5,
                              backgroundColor: badgeBg, padding: '3px 10px', borderRadius: 99,
                              whiteSpace: 'nowrap',
                            }}>{badge}</span>
                          </div>
                          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
    </>
  );
}
