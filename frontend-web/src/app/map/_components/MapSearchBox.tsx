'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { SearchResult } from '../_lib/search';
import styles from '../map.module.css';

interface MapSearchBoxProps {
  value: string;
  results: SearchResult[];
  message: string;
  onChange: (value: string) => void;
  onSelect: (result: SearchResult) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function MapSearchBox({ value, results, message, onChange, onSelect, onSubmit, onClear }: MapSearchBoxProps) {
  const [focused, setFocused] = useState(false);
  const showMenu = focused && value.trim().length > 0;

  return (
    <div className={styles.searchWrap}>
      <div className={styles.searchBox}>
        <Search size={16} color="var(--map-fg-dim)" />
        <input
          className={styles.searchInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit();
            }
            // Blur (not just setFocused) so the menu can reopen on the next
            // keystroke — otherwise focused stays false while the input keeps
            // DOM focus and the results list never comes back.
            if (event.key === 'Escape') event.currentTarget.blur();
          }}
          placeholder="搜尋行政區或網格"
        />
        {value && (
          <button type="button" className={styles.searchClear} onClick={onClear} aria-label="清除搜尋">
            <X size={15} />
          </button>
        )}
      </div>

      {showMenu && (
        <div className={styles.searchMenu}>
          {results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.key}
                type="button"
                className={styles.searchItem}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(result);
                  setFocused(false);
                }}
              >
                <span className={styles.searchItemLabel}>{result.label}</span>
                <span className={styles.searchItemDetail}>{result.detail}</span>
              </button>
            ))
          ) : (
            <div className={styles.searchEmpty}>找不到相符的行政區或網格</div>
          )}
        </div>
      )}

      {message && <div className={styles.searchError}>{message}</div>}
    </div>
  );
}
