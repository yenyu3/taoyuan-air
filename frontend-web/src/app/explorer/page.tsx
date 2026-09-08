'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  Download,
  ExternalLink,
  FileSearch,
  Layers3,
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

const DatasetMap = dynamic(() => import('./_components/DatasetMap'), {
  ssr: false,
  loading: () => <div className={styles.datasetMapFallback}><span>地圖載入中…</span></div>,
});

type ActiveCategory = DatasetCategory | 'all';
type DetailTab = 'overview' | 'fields' | 'quality' | 'coverage' | 'database';

const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: '總覽' },
  { id: 'fields', label: '欄位' },
  { id: 'quality', label: '品質' },
  { id: 'coverage', label: '時空覆蓋' },
  { id: 'database', label: '資料庫' },
];

const AVAILABILITY_LABELS: Record<DatasetCatalogItem['dataAvailability'], string> = {
  'public-download': '公開下載',
  'public-query': '公開查詢',
  internal: '內部資料',
  planned: '規劃中',
};

const CATEGORY_ORDER: ActiveCategory[] = [
  'all',
  'air-quality',
  'weather',
  'emission',
  'vertical',
  'model-feature',
];

const CABINET_INDEX_ITEMS = CATEGORY_ORDER.filter(
  (category): category is DatasetCategory => category !== 'all'
);

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

function OverviewTab({ dataset }: { dataset: DatasetCatalogItem }) {
  const governance = [
    { label: '完整度', value: dataset.quality.completeness },
    { label: '即時性', value: dataset.quality.freshness },
    { label: '欄位標準化', value: dataset.quality.schemaStandardized },
    { label: '空間覆蓋', value: dataset.quality.spatialCoverage },
  ];

  return (
    <>
      <div className={styles.visualGrid}>
        <div className={styles.naturalPanel}>
          <p className={styles.panelLabel}>空間資料預覽</p>
          <DatasetMap dataset={dataset} />
        </div>
        <div className={styles.naturalPanel}>
          <p className={styles.panelLabel}>資料治理狀態</p>
          <div className={styles.qualityList}>
            {governance.map(item => (
              <div key={item.label} className={styles.qualityRow}>
                <span>{item.label}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${item.value}%`, '--accent': dataset.accent } as React.CSSProperties}
                  />
                </div>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
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

function CoverageTab({ dataset, liveLatestAt }: { dataset: DatasetCatalogItem; liveLatestAt?: string }) {
  const lines = [
    ['時間範圍', dataset.timeRange],
    ['時間解析度', dataset.temporalResolution],
    ['更新頻率', dataset.updateFrequency],
    ['最新狀態', liveLatestAt ? `資料庫最新 ${liveLatestAt}` : dataset.latestAt],
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

function DatabaseTab({ dataset }: { dataset: DatasetCatalogItem }) {
  const groups = [
    ['核心資料表', dataset.databaseAssets.coreTables],
    ['彙總視圖', dataset.databaseAssets.views],
    ['品質檢查', dataset.databaseAssets.qualityChecks],
    ['匯入腳本', dataset.databaseAssets.importScripts],
    ['更新腳本', dataset.databaseAssets.updateScripts ?? []],
  ];

  return (
    <div className={styles.naturalPanel}>
      <p className={styles.panelLabel}>資料庫完整性</p>
      <div className={styles.coverageLines}>
        {groups.map(([label, values]) => (
          <div key={label as string} className={styles.lineItem}>
            <span>{label as string}</span>
            <strong>{(values as string[]).length ? (values as string[]).join('、') : '未設定'}</strong>
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
  liveLatestAt,
}: {
  dataset: DatasetCatalogItem;
  activeTab: DetailTab;
  setActiveTab: (tab: DetailTab) => void;
  liveLatestAt?: string;
}) {
  return (
    <>
      <div
        className={styles.previewHead}
        style={{ '--accent': dataset.accent } as React.CSSProperties}
      >
        <div>
          <span className={styles.previewAgency}>{dataset.sourceAgency}</span>
          <h2>{dataset.name}</h2>
          <span className={styles.previewMeta}>
            {dataset.sourceType} · {dataset.recordCountLabel}
          </span>
        </div>
        <div className={styles.previewHealth}>
          <strong>{dataset.completeness}%</strong>
          <span>資料健康度</span>
        </div>
      </div>
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
      {activeTab === 'coverage' && <CoverageTab dataset={dataset} liveLatestAt={liveLatestAt} />}
      {activeTab === 'database' && <DatabaseTab dataset={dataset} />}
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
  const mapLinkLabel = dataset.mapLink === '/events' ? '事件記錄' : '監測地圖';

  return (
    <>
      <div className={styles.sideSection}>
        <h3>來源</h3>
        <div className={styles.sideList}>
          <div className={styles.sideLine}><span>來源單位</span><strong>{dataset.sourceAgency}</strong></div>
          <div className={styles.sideLine}><span>資料型態</span><strong>{dataset.sourceType}</strong></div>
          <div className={styles.sideLine}><span>更新頻率</span><strong>{dataset.updateFrequency}</strong></div>
          <div className={styles.sideLine}><span>取得方式</span><strong>{AVAILABILITY_LABELS[dataset.dataAvailability]}</strong></div>
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
            <Link
              className={styles.actionButton}
              href={dataset.apiPath}
              target="_blank"
              rel="noopener noreferrer"
              title={`在新分頁開啟 API：${dataset.apiPath}`}
            >
              <ExternalLink size={15} /> API 預覽
            </Link>
          ) : (
            <button
              className={styles.actionButton}
              type="button"
              disabled
              title="此資料源尚未提供即時 API"
            >
              <FileSearch size={15} /> API 待開放
            </button>
          )}
          {dataset.officialDownloadUrl ? (
            <Link
              className={styles.actionButton}
              href={dataset.officialDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`前往官方資料頁：${dataset.officialDownloadLabel ?? dataset.officialDownloadUrl}`}
            >
              <Download size={15} /> 官方資料
            </Link>
          ) : (
            <button
              className={styles.actionButton}
              type="button"
              disabled
              title={dataset.dataAvailability === 'internal' ? '此資料源為內部任務資料，尚未提供公開下載' : '資料匯出功能開發中'}
            >
              <Download size={15} /> 下載待開放
            </button>
          )}
          {dataset.mapLink ? (
            <Link
              className={styles.actionButton}
              href={dataset.mapLink}
              title={`前往${mapLinkLabel}頁`}
            >
              <ArrowUpRight size={15} /> {mapLinkLabel}
            </Link>
          ) : (
            <button
              className={styles.actionButton}
              type="button"
              disabled
              title="此資料源尚無對應的視覺化頁面"
            >
              <ArrowUpRight size={15} /> 無對應頁面
            </button>
          )}
          <button
            className={styles.actionButton}
            type="button"
            disabled={compareDisabled}
            onClick={() => toggleCompare(dataset.id)}
            title={
              compareDisabled
                ? '最多同時比較 3 個資料源'
                : compareSelected
                  ? '從比較清單移除'
                  : '加入比較清單'
            }
          >
            {compareSelected ? <Check size={15} /> : <ArrowRightLeft size={15} />}
            {compareSelected ? '移除比較' : '加入比較'}
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
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [selectedDatasetId, setSelectedDatasetId] = useState(DATASET_CATALOG[0].id);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('overview');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  // 資料庫端點可回報最新時間時，覆蓋靜態 latestAt 文案（無法取得時維持靜態文案）。
  const [liveLatestAt, setLiveLatestAt] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const SOURCE_TO_ID: Record<string, string> = {
      環境部: 'moe',
      桃園市環保局: 'tydep',
      氣象署: 'cwa',
    };

    fetch('/api/explorer/history?latest_only=true')
      .then(response => (response.ok ? response.json() : null))
      .then((payload: { latestAt?: Record<string, string | null> } | null) => {
        if (cancelled || !payload?.latestAt) return;
        const mapped: Record<string, string> = {};
        for (const [source, value] of Object.entries(payload.latestAt)) {
          const datasetId = SOURCE_TO_ID[source];
          if (datasetId && typeof value === 'string' && value.trim()) {
            mapped[datasetId] = value;
          }
        }
        if (Object.keys(mapped).length > 0) setLiveLatestAt(mapped);
      })
      .catch(() => {
        /* 端點不可用時靜默退回靜態 latestAt 文案 */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDatasets = useMemo(
    () => DATASET_CATALOG.filter(dataset => matchesDataset(dataset, '', activeCategory)),
    [activeCategory]
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
  const formalDatasets = DATASET_CATALOG.filter(dataset =>
    !dataset.statuses.includes('pending') && !dataset.statuses.includes('mock')
  );
  const avgCompleteness = Math.round(
    formalDatasets.reduce((sum, dataset) => sum + dataset.completeness, 0) / Math.max(1, formalDatasets.length)
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

  const selectCategory = (category: ActiveCategory) => {
    setActiveCategory(category);
    if (category === 'all') return;
    const firstInCategory = DATASET_CATALOG.find(dataset => dataset.category === category);
    if (firstInCategory) selectDataset(firstInCategory.id);
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.layout}>
          <aside className={`${styles.rail} ${styles.cabinetColumn}`}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>資料檔案櫃</h2>
                <p className={styles.sectionHint}>
                  依類型篩選，符合 {filteredDatasets.length} / {DATASET_CATALOG.length} 份
                </p>
              </div>
              <Layers3 size={18} color="#65736d" />
            </div>
            <div className={styles.cabinetFilter} role="group" aria-label="資料類型篩選">
              {CATEGORY_ORDER.map(category => (
                <button
                  key={category}
                  type="button"
                  className={`${styles.tab} ${activeCategory === category ? styles.tabActive : ''}`}
                  onClick={() => selectCategory(category)}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
            <div
              className={styles.cabinetShell}
              style={{ '--selected-accent': selectedDataset.accent } as React.CSSProperties}
            >
              <div className={styles.cabinetIndexRail} aria-label="資料分類索引">
                {CABINET_INDEX_ITEMS.map((category, index) => (
                  <button
                    key={category}
                    type="button"
                    className={[
                      styles.cabinetIndexTab,
                      selectedDataset.category === category ? styles.cabinetIndexTabActive : '',
                    ].join(' ')}
                    style={{ '--index': index } as React.CSSProperties}
                    onClick={() => selectCategory(category)}
                    aria-pressed={selectedDataset.category === category}
                  >
                    {CATEGORY_LABELS[category]}
                  </button>
                ))}
              </div>
            <div
              className={styles.cabinet}
              style={{
                '--selected-accent': selectedDataset.accent,
              } as React.CSSProperties}
            >
              <div className={styles.cabinetPocket} aria-hidden="true" />
              {DATASET_CATALOG.map((dataset, index) => {
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
                    style={{
                      '--accent': dataset.accent,
                      '--stack-index': index,
                    } as React.CSSProperties}
                    onClick={() => selectDataset(dataset.id)}
                    aria-pressed={active}
                  >
                    <span className={styles.folderMeta}>
                      <span>
                        <span className={styles.folderName}>{dataset.name}</span>
                        <span className={styles.folderDetail}>{CATEGORY_LABELS[dataset.category]} · {dataset.recordCountLabel}</span>
                      </span>
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
          </aside>

          <div className={styles.main}>
            <div className={styles.metricRail}>
              <div className={styles.metric}><strong>{DATASET_CATALOG.length}</strong><span>資料源</span></div>
              <div className={styles.metric}><strong>{connectedCount}</strong><span>已串接/匯入</span></div>
              <div className={styles.metric}><strong>{totalFieldCount}</strong><span>標準欄位</span></div>
              <div className={styles.metric}><strong>{avgCompleteness}%</strong><span>正式資料健康度</span></div>
              <div className={styles.metric}><strong>{filteredDatasets.length}</strong><span>符合篩選</span></div>
            </div>

            <section className={styles.detail}>
              <div className={styles.previewColumn}>
                <DatasetPreview
                  dataset={selectedDataset}
                  activeTab={activeDetailTab}
                  setActiveTab={setActiveDetailTab}
                  liveLatestAt={liveLatestAt[selectedDataset.id]}
                />
              </div>

              <aside className={styles.accessColumn}>
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
          </div>
        </div>

        {compareIds.length > 0 && (
          <div className={styles.compareTray}>
            <div>
              <strong>比較清單 {compareIds.length}/3</strong>
              <div className={styles.compareNames}>
                {compareDatasets.map(dataset => (
                  <span key={dataset.id} className={styles.compareName}>{dataset.shortName} {dataset.name}</span>
                ))}
              </div>
              {compareIds.length < 2 && (
                <p className={styles.compareHint}>再加入 1 個資料源即可開始比較</p>
              )}
            </div>
            <div className={styles.actionRow} style={{ display: 'flex' }}>
              <button
                className={styles.actionButton}
                type="button"
                disabled={compareIds.length < 2}
                onClick={() => setCompareOpen(true)}
              >
                <ArrowRightLeft size={15} /> 開始比較
              </button>
              <button
                className={styles.actionButton}
                type="button"
                onClick={() => {
                  setCompareIds([]);
                  setCompareOpen(false);
                }}
              >
                <X size={15} /> 清除
              </button>
            </div>
          </div>
        )}

        {compareOpen && compareDatasets.length > 1 && (
          <CompareDrawer datasets={compareDatasets} onClose={() => setCompareOpen(false)} />
        )}
      </div>
    </main>
  );
}
