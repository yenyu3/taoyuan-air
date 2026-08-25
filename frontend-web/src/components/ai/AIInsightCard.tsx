'use client';

import type { AIInsightResponse } from '@/lib/ai-api';

export function AIInsightCard({ insight }: { insight: AIInsightResponse | null }) {
  if (!insight) return null;

  const actions = insight.activityAdvice.actions.slice(0, 3);
  const sources = insight.sources.slice(0, 4);

  return (
    <div className="ai-insight-meta" aria-label="AI 分析來源">
      {actions.length > 0 && (
        <div className="ai-action-row">
          {actions.map((action) => (
            <span className="ai-action-chip" key={action}>
              {action}
            </span>
          ))}
        </div>
      )}
      {sources.length > 0 && (
        <div className="ai-source-row">
          {sources.map((source) =>
            source.url ? (
              <a
                className="ai-source-chip"
                href={source.url}
                key={`${source.type}-${source.label}`}
                target="_blank"
                rel="noreferrer"
              >
                {source.label}
              </a>
            ) : (
              <span className="ai-source-chip" key={`${source.type}-${source.label}`}>
                {source.label}
              </span>
            ),
          )}
        </div>
      )}
      <p className="ai-disclaimer">AI 生成建議，請以官方資料與現場狀況為準。</p>
    </div>
  );
}
