'use client';

import React from 'react';

export const SENSITIVE_GROUPS = [
  {
    key: '兒童',
    label: '兒童',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="6" r="4"/>
        <path d="M8 12h8l1.5 8H6.5z"/>
      </svg>
    ),
  },
  {
    key: '老人',
    label: '老人',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10.5" cy="5" r="3"/>
        <path d="M8 9h5l-0.5 7H8.5z"/>
        <path d="M10 16v5M8 21h4"/>
        <line x1="14.5" y1="9.5" x2="18" y2="21"/>
      </svg>
    ),
  },
  {
    key: '孕婦',
    label: '孕婦',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="3.2"/>
        <path d="M9.5 9.5c-1.5 2-1.5 4.5 0 6.5s2.5 3 2.5 3 1-1 2.5-3 1.5-4.5 0-6.5"/>
        <path d="M12 19v3"/>
      </svg>
    ),
  },
  {
    key: '心肺',
    label: '心肺疾病',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        <polyline points="8 12 10 10 12 14 14 11 16 12"/>
      </svg>
    ),
  },
  {
    key: '氣喘',
    label: '氣喘患者',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v5"/>
        <path d="M8.5 9C5 10 4 13 4 15s2 4.5 5 4.5h1.5V9"/>
        <path d="M15.5 9C19 10 20 13 20 15s-2 4.5-5 4.5H13.5V9"/>
      </svg>
    ),
  },
] as const;

// ── Helpers ──────────────────────────────────────────────────────
