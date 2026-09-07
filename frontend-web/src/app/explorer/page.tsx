'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRightLeft,
  Check,
  Download,
  ExternalLink,
  FileSearch,
  Layers3,
  Search,
  Table2,
  X,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  DATASET_CATALOG,
  FIELD_GROUPS,
  PROCESSING_LABELS,
  STATUS_LABELS,
  type DatasetCatalogItem,
  type DatasetCategory,
} from './_data/datasetCatalog';
import styles from './explorer.module.css';

type ActiveCategory = DatasetCategory | 'all';
type DetailTab = 'overview' | 'fields' | 'quality' | 'coverage';

const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: '總覽' },
  { id: 'fields', label: '欄位' },
  { id: 'quality', label: '品質' },
  { id: 'coverage', label: '時空覆蓋' },
];

const CATEGORY_ORDER: ActiveCategory[] = [
  'all',
  'air-quality',
  'weather',
  'emission',
  'vertical',
  'model-feature',
];

const PROCESSING_ITEMS: Array<{
  key: keyof DatasetCatalogItem['processing'];
  label: string;
}> = [
  { key: 'fieldStandardized', label: '欄位標準化' },
  { key: 'missingValueHandled', label: '缺值處理' },
  { key: 'unitNormalized', label: '單位統一' },
  { key: 'timestampAligned', label: '時間戳對齊' },
  { key: 'coordinateNormalized', label: '座標整理' },
];

const QUALITY_ITEMS: Array<{
  key: keyof DatasetCatalogItem['quality'];
  label: string;
}> = [
  { key: 'completeness', label: '完整度' },
  { key: 'freshness', label: '即時性' },
  { key: 'schemaStandardized', label: '欄位標準化' },
  { key: 'spatialCoverage', label: '空間覆蓋' },
  { key: 'traceability', label: '可追溯性' },
];

function matchesDataset(dataset: DatasetCatalogItem, query: string, category: ActiveCategory) {
  if (category !== 'all' && dataset.category !== category) return false;
  if (!query.trim()) return true;

  const normalized = query.trim().toLowerCase();
  const haystack = [
    dataset.shortName,
    dataset.name,
    dataset.sourceAgency,
    dataset.sourceType,
    dataset.spatialType,
    ...dataset.parameters,
    ...dataset.regions,
    ...dataset.statuses.map(status => STATUS_LABELS[status]),
  ].join(' ').toLowerCase();

  return haystack.includes(normalized);
}

function statusClass(dataset: DatasetCatalogItem) {
  return dataset.statuses.some(status => status === 'pending' || status === 'mock')
    ? styles.statusWarning
    : '';
}

function MiniMap({ dataset }: { dataset: DatasetCatalogItem }) {
  const points = useMemo(() => {
    const seed = dataset.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return Array.from({ length: Math.min(9, Math.max(3, dataset.regions.length + 2)) }, (_, index) => ({
      left: 14 + ((seed + index * 19) % 68),
      top: 16 + ((seed * 3 + index * 23) % 62),
    }));
  }, [dataset.id, dataset.regions.length]);

  return (
    <div className={styles.miniMap} aria-label={`${dataset.name} 空間分布預覽`}>
      {points.map((point, index) => (
        <span
          key={`${dataset.id}-point-${index}`}
          className={styles.mapPoint}
          style={{
            '--accent': dataset.accent,
            left: `${point.left}%`,
            top: `${point.top}%`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function OverviewTab({ dataset }: { dataset: DatasetCatalogItem }) {
  const chartData = [
    { name: '完整', value: dataset.quality.completeness },
    { name: '即時', value: dataset.quality.freshness },
    { name: '欄位', value: dataset.quality.schemaStandardized },
    { name: '空間', value: dataset.quality.spatialCoverage },
  ];

  return (
    <>
      <div className={styles.datasetHeader} style={{ '--accent': dataset.accent } as React.CSSProperties}>
        <div>
          <h2>{dataset.name}</h2>
          <p>
            {dataset.sourceType} · {dataset.recordCountLabel} · {dataset.coverageLabel}
          </p>
        </div>
        <div className={styles.bigPercent}>
          {dataset.completeness}%
          <span>資料健康度</span>
        </div>
      </div>

      <div className={styles.visualGrid}>
        <div className={styles.naturalPanel}>
          <p className={styles.panelLabel}>空間資料預覽</p>
          <MiniMap dataset={dataset} />
        </div>
        <div className={styles.naturalPanel}>
          <p className={styles.panelLabel}>資料治理狀態</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 10, left: 4, bottom: 4 }}>
              <CartesianGrid stroke="rgba(31,42,37,0.08)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" width={42} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(31,42,37,0.04)' }} />
              <Bar dataKey="value" fill={dataset.accent} radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.flow}>
        {['原始資料', '欄位標準化', '缺值處理', '品質檢核', '資料庫取用'].map((step, index) => (
          <div
            key={step}
            className={styles.flowStep}
            style={{ '--accent': dataset.accent } as React.CSSProperties}
          >
            <strong>{step}</strong>
            <span>{index < 3 ? '已納入流程' : dataset.statuses.includes('pending') ? '逐步建置' : '可供檢索'}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function FieldsTab({ dataset }: { dataset: DatasetCatalogItem }) {
  const visibleDatasets = DATASET_CATALOG.filter(item =>
    item.category === dataset.category || item.id === dataset.id
  ).slice(0, 6);

  return (
    <div className={styles.naturalPanel}>
      <p className={styles.panelLabel}>欄位覆蓋矩陣</p>
      <table className={styles.fieldMatrix}>
        <thead>
          <tr>
            <th>欄位</th>
            {visibleDatasets.map(item => <th key={item.id}>{item.shortName}</th>)}
          </tr>
        </thead>
        <tbody>
          {FIELD_GROUPS.map(field => (
            <tr key={field}>
              <td>{field}</td>
              {visibleDatasets.map(item => (
                <td key={`${item.id}-${field}`}>
                  {item.parameters.includes(field) ? (
                    <span
                      className={styles.fieldDot}
                      style={{ '--accent': item.accent } as React.CSSProperties}
                      aria-label="已標準化"
                    />
                  ) : (
                    <span className={styles.fieldEmpty}>-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualityTab({ dataset }: { dataset: DatasetCatalogItem }) {
  return (
    <div className={styles.naturalPanel}>
      <p className={styles.panelLabel}>資料健康度</p>
      <div className={styles.qualityList}>
        {QUALITY_ITEMS.map(item => {
          const value = dataset.quality[item.key];
          return (
            <div key={item.key} className={styles.qualityRow}>
              <span>{item.label}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${value}%`, '--accent': dataset.accent } as React.CSSProperties}
                />
              </div>
              <strong>{value}%</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CoverageTab({ dataset }: { dataset: DatasetCatalogItem }) {
  const lines = [
    ['時間範圍', dataset.timeRange],
    ['時間解析度', dataset.temporalResolution],
    ['更新頻率', dataset.updateFrequency],
    ['最新狀態', dataset.latestAt],
    ['空間範圍', dataset.regions.join('、')],
    ['資料表', dataset.tableNames.join('、')],
  ];

  return (
    <div className={styles.naturalPanel}>
      <p className={styles.panelLabel}>時間與空間覆蓋</p>
      <div className={styles.coverageLines}>
        {lines.map(([label, value]) => (
          <div key={label} className={styles.lineItem}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function DatasetPreview({
  dataset,
  activeTab,
  setActiveTab,
}: {
  dataset: DatasetCatalogItem;
  activeTab: DetailTab;
  setActiveTab: (tab: DetailTab) => void;
}) {
  return (
    <>
      <div className={styles.detailTabs}>
        {DETAIL_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.detailTab} ${activeTab === tab.id ? styles.detailTabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'overview' && <OverviewTab dataset={dataset} />}
      {activeTab === 'fields' && <FieldsTab dataset={dataset} />}
      {activeTab === 'quality' && <QualityTab dataset={dataset} />}
      {activeTab === 'coverage' && <CoverageTab dataset={dataset} />}
    </>
  );
}

function AccessPanel({
  dataset,
  compareIds,
  toggleCompare,
}: {
  dataset: DatasetCatalogItem;
  compareIds: string[];
  toggleCompare: (id: string) => void;
}) {
  const compareSelected = compareIds.includes(dataset.id);
  const compareDisabled = !compareSelected && compareIds.length >= 3;

  return (
    <>
      <div className={styles.sideSection}>
        <h3>來源</h3>
        <div className={styles.sideList}>
          <div className={styles.sideLine}><span>來源單位</span><strong>{dataset.sourceAgency}</strong></div>
          <div className={styles.sideLine}><span>資料型態</span><strong>{dataset.sourceType}</strong></div>
          <div className={styles.sideLine}><span>更新頻率</span><strong>{dataset.updateFrequency}</strong></div>
          <div className={styles.sideLine}><span>狀態</span><strong>{dataset.statuses.map(status => STATUS_LABELS[status]).join('、')}</strong></div>
        </div>
      </div>

      <div className={styles.sideSection}>
        <h3>資料表</h3>
        <div className={styles.sideList}>
          {dataset.tableNames.map(table => <div key={table} className={styles.tableName}>{table}</div>)}
        </div>
      </div>

      <div className={styles.sideSection}>
        <h3>處理狀態</h3>
        <div className={styles.processGrid}>
          {PROCESSING_ITEMS.map(item => (
            <div key={item.key} className={styles.processItem}>
              <span>{item.label}</span>
              <strong>{PROCESSING_LABELS[dataset.processing[item.key]]}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sideSection}>
        <h3>取用</h3>
        <div className={styles.actionRow}>
          {dataset.apiPath ? (
            <Link className={styles.actionButton} href={dataset.apiPath} target="_blank">
              <FileSearch size={15} /> API
            </Link>
          ) : (
            <button className={styles.actionButton} type="button" disabled>
              <FileSearch size={15} /> 待開放
            </button>
          )}
          <button className={styles.actionButton} type="button" disabled>
            <Download size={15} /> 待開放
          </button>
          {dataset.mapLink ? (
            <Link className={styles.actionButton} href={dataset.mapLink}>
              <ExternalLink size={15} /> 跳轉
            </Link>
          ) : (
            <button className={styles.actionButton} type="button" disabled>
              <ExternalLink size={15} /> 待開放
            </button>
          )}
          <button
            className={styles.actionButton}
            type="button"
            disabled={compareDisabled}
            onClick={() => toggleCompare(dataset.id)}
          >
            {compareSelected ? <Check size={15} /> : <ArrowRightLeft size={15} />}
            {compareSelected ? '已加入' : '比較'}
          </button>
        </div>
        <p className={styles.sectionHint} style={{ marginTop: 12 }}>{dataset.accessNote}</p>
      </div>
    </>
  );
}

function CompareDrawer({
  datasets,
  onClose,
}: {
  datasets: DatasetCatalogItem[];
  onClose: () => void;
}) {
  const sharedFields = datasets.length
    ? FIELD_GROUPS.filter(field => datasets.every(dataset => dataset.parameters.includes(field)))
    : [];
  const sharedRegions = datasets.length
    ? datasets[0].regions.filter(region => datasets.every(dataset => dataset.regions.includes(region)))
    : [];

  return (
    <>
      <button className={styles.drawerBackdrop} type="button" aria-label="關閉比較" onClick={onClose} />
      <aside className={styles.compareDrawer} aria-label="資料集比較">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>Dataset Compare</p>
            <h2 className={styles.title} style={{ fontSize: 32 }}>資料集比較</h2>
          </div>
          <button className={styles.iconButton} type="button" aria-label="關閉比較" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.compareGrid}>
          {datasets.map(dataset => (
            <div key={dataset.id} className={styles.compareBlock}>
              <h4>{dataset.name}</h4>
              <p>{dataset.sourceAgency}</p>
              <p>{dataset.timeRange}</p>
              <p>健康度 {dataset.completeness}%</p>
            </div>
          ))}
        </div>

        <div className={styles.compareBlock}>
          <h4>共同欄位</h4>
          <p>{sharedFields.length ? sharedFields.join('、') : '目前沒有完整共同欄位'}</p>
        </div>
        <div className={styles.compareBlock}>
          <h4>共同空間範圍</h4>
          <p>{sharedRegions.length ? sharedRegions.join('、') : '空間尺度不同，需透過網格或行政區轉換後比較'}</p>
        </div>
        <div className={styles.compareBlock}>
          <h4>比較結論</h4>
          <p>
            第一版比較聚焦資料集結構、時間範圍、空間範圍、欄位交集與取用狀態；
            真實數值疊圖與相關性分析建議留到第二版串接統計 API 後實作。
          </p>
        </div>
      </aside>
    </>
  );
}

export default function ExplorerPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [selectedDatasetId, setSelectedDatasetId] = useState(DATASET_CATALOG[0].id);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('overview');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const filteredDatasets = useMemo(
    () => DATASET_CATALOG.filter(dataset => matchesDataset(dataset, query, activeCategory)),
    [query, activeCategory]
  );

  const effectiveSelectedDatasetId = filteredDatasets.some(dataset => dataset.id === selectedDatasetId)
    ? selectedDatasetId
    : filteredDatasets[0]?.id ?? selectedDatasetId;
  const selectedDataset = DATASET_CATALOG.find(dataset => dataset.id === effectiveSelectedDatasetId) ?? DATASET_CATALOG[0];
  const compareDatasets = DATASET_CATALOG.filter(dataset => compareIds.includes(dataset.id));
  const connectedCount = DATASET_CATALOG.filter(dataset =>
    !dataset.statuses.includes('pending') && !dataset.statuses.includes('mock')
  ).length;
  const totalFieldCount = new Set(DATASET_CATALOG.flatMap(dataset => dataset.parameters)).size;
  const avgCompleteness = Math.round(
    DATASET_CATALOG.reduce((sum, dataset) => sum + dataset.completeness, 0) / DATASET_CATALOG.length
  );

  const toggleCompare = (id: string) => {
    setCompareIds(current => {
      if (current.includes(id)) return current.filter(item => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const selectDataset = (id: string) => {
    setSelectedDatasetId(id);
    setActiveDetailTab('overview');
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <label className={styles.searchWrap}>
            <Search size={17} color="#65736d" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜尋來源、欄位、行政區..."
            />
            {query && (
              <button className={styles.iconButton} type="button" aria-label="清除搜尋" onClick={() => setQuery('')}>
                <X size={16} />
              </button>
            )}
          </label>
        </header>

        <div className={styles.metricRail}>
          <div className={styles.metric}><strong>{DATASET_CATALOG.length}</strong><span>資料源</span></div>
          <div className={styles.metric}><strong>{connectedCount}</strong><span>已串接/匯入</span></div>
          <div className={styles.metric}><strong>{totalFieldCount}</strong><span>標準欄位</span></div>
          <div className={styles.metric}><strong>{avgCompleteness}%</strong><span>平均健康度</span></div>
          <div className={styles.metric}><strong>{filteredDatasets.length}</strong><span>符合篩選</span></div>
        </div>

        <div className={styles.tabs} aria-label="資料類型篩選">
          {CATEGORY_ORDER.map(category => (
            <button
              key={category}
              type="button"
              className={`${styles.tab} ${activeCategory === category ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        <section className={styles.workspace}>
          <div className={`${styles.column} ${styles.cabinetColumn}`}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>資料檔案櫃</h2>
                <p className={styles.sectionHint}>篩選後符合的資料夾會被保留亮度</p>
              </div>
              <Layers3 size={18} color="#65736d" />
            </div>
            <div className={styles.cabinetShell}>
            <div className={styles.cabinet}>
              {DATASET_CATALOG.map(dataset => {
                const matched = filteredDatasets.some(item => item.id === dataset.id);
                const active = selectedDataset.id === dataset.id;
                const compareSelected = compareIds.includes(dataset.id);
                return (
                  <button
                    key={dataset.id}
                    type="button"
                    data-short={dataset.shortName}
                    className={[
                      styles.folder,
                      active ? styles.folderActive : '',
                      !matched ? styles.folderDimmed : '',
                    ].join(' ')}
                    style={{ '--accent': dataset.accent } as React.CSSProperties}
                    onClick={() => selectDataset(dataset.id)}
                    aria-pressed={active}
                  >
                    <span className={styles.folderMeta}>
                      <span>
                        <span className={styles.folderName}>{dataset.name}</span>
                        <span className={styles.folderDetail}>{CATEGORY_LABELS[dataset.category]} · {dataset.recordCountLabel}</span>
                      </span>
                      <span className={styles.folderPercent}>{dataset.completeness}%</span>
                    </span>
                    <span className={styles.statusRow}>
                      {dataset.statuses.map(status => (
                        <span key={status} className={`${styles.statusPill} ${statusClass(dataset)}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      ))}
                      {compareSelected && <span className={styles.statusPill}><Check size={12} />比較</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={styles.cabinetFront} aria-hidden="true">
              <span>{DATASET_CATALOG.length} 份資料夾</span>
              <span className={styles.cabinetHandle} />
            </div>
            </div>
          </div>

          <div className={styles.column}>
            <DatasetPreview
              dataset={selectedDataset}
              activeTab={activeDetailTab}
              setActiveTab={setActiveDetailTab}
            />
          </div>

          <aside className={styles.column}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>來源與取用</h2>
                <p className={styles.sectionHint}>正式、待串接與模擬狀態分開標示</p>
              </div>
              <Table2 size={18} color="#65736d" />
            </div>
            <AccessPanel dataset={selectedDataset} compareIds={compareIds} toggleCompare={toggleCompare} />
          </aside>
        </section>

        {compareIds.length > 0 && (
          <div className={styles.compareTray}>
            <div>
              <strong>比較 {compareIds.length}/3</strong>
              <div className={styles.compareNames}>
                {compareDatasets.map(dataset => (
                  <span key={dataset.id} className={styles.compareName}>{dataset.shortName} {dataset.name}</span>
                ))}
              </div>
            </div>
            <div className={styles.actionRow} style={{ display: 'flex' }}>
              <button className={styles.actionButton} type="button" onClick={() => setCompareOpen(true)}>
                <ArrowRightLeft size={15} /> 開始比較
              </button>
              <button className={styles.actionButton} type="button" onClick={() => setCompareIds([])}>
                <X size={15} /> 清除
              </button>
            </div>
          </div>
        )}

        {compareOpen && (
          <CompareDrawer datasets={compareDatasets} onClose={() => setCompareOpen(false)} />
        )}
      </div>
    </main>
  );
}
