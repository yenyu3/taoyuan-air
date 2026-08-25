'use client';

import { DashboardBaseStylesA } from './DashboardBaseStylesA';
import { DashboardBaseStylesB } from './DashboardBaseStylesB';
import { DashboardBaseStylesC } from './DashboardBaseStylesC';
import { DashboardResponsiveStyles } from './DashboardResponsiveStyles';

export function DashboardStyles() {
  return (
    <>
      <DashboardBaseStylesA />
      <DashboardBaseStylesB />
      <DashboardBaseStylesC />
      <DashboardResponsiveStyles />
    </>
  );
}
