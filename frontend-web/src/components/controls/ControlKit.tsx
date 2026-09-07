'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './ControlKit.module.css';

/* ── 容器 ─────────────────────────────────────────── */
export function ControlBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className ? `${styles.bar} ${className}` : styles.bar}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export function ControlRow({
  label,
  children,
}: {
  label?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      {label != null && <span className={styles.label}>{label}</span>}
      {children}
    </div>
  );
}

export function ControlLabel({ children }: { children: React.ReactNode }) {
  return <span className={styles.label}>{children}</span>;
}

export function ControlSubLabel({ children }: { children: React.ReactNode }) {
  return <span className={styles.subLabel}>{children}</span>;
}

export function ControlDivider({
  orientation = 'vertical',
}: {
  orientation?: 'vertical' | 'horizontal';
}) {
  return (
    <div className={orientation === 'vertical' ? styles.rowDivider : styles.barDivider} />
  );
}

export function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div className={styles.chipGroup}>{children}</div>;
}

/* ── Chip 膠囊 ─────────────────────────────────────── */
export function Chip({
  active = false,
  variant = 'solid',
  dot,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  /** solid = 單選分段（填滿）；soft = 多選開關（淡底 + 圓點） */
  variant?: 'solid' | 'soft';
  /** true 用預設灰點；字串則為啟用時的圓點顏色 */
  dot?: boolean | string;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const activeClass = active
    ? variant === 'soft'
      ? styles.chipSoftActive
      : styles.chipSolidActive
    : '';

  return (
    <button
      type="button"
      className={activeClass ? `${styles.chip} ${activeClass}` : styles.chip}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {dot != null && dot !== false && (
        <span
          className={styles.chipDot}
          style={typeof dot === 'string' && active ? { background: dot } : undefined}
        />
      )}
      {children}
    </button>
  );
}

/* ── 下拉膠囊 ──────────────────────────────────────── */
export interface SelectOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export function ControlSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder = '請選擇',
  disabled,
  ariaLabel,
}: {
  value: T | '';
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div className={open ? `${styles.select} ${styles.selectOpen}` : styles.select} ref={ref}>
      <button
        type="button"
        className={styles.selectButton}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        {current ? current.label : placeholder}
        <ChevronDown size={14} strokeWidth={2.5} className={styles.selectChevron} />
      </button>

      {open && (
        <div className={styles.menu} role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={
                o.value === value
                  ? `${styles.menuItem} ${styles.menuItemActive}`
                  : styles.menuItem
              }
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
