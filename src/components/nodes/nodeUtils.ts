import { useEffect, useRef, useState } from 'react';

export interface PowerBINodeProps {
  data: {
    label: string;
    componentType: string;
    value?: number | string;
    wowPct?: string;
    ytdPriorYear?: string;
    variancePct?: string;
    cardTheme?: 'light' | 'gray';
    chartData?: number[];
    pieLabels?: string[];
    seriesData?: number[][];
    seriesLabels?: string[];
    seriesColors?: string[];
    matrixData?: Array<Array<number | string>>;
    matrixFirstColumnWidth?: number;
    matrixShowColorBlocks?: boolean;
    mapData?: string;
    axisLabels?: { x?: string; y?: string; third?: string };
    xAxisLabels?: string[];
    thirdAxisEnabled?: boolean;
    thirdAxisData?: number[];
    expectedRealityData?: { expected: number[]; reality: number[] };
    columnLabels?: string[];
    reportingYear?: number;
    reportingWeek?: number;
    reportDate?: string;
    selectionMode?: 'yearWeek' | 'reportDate';
    hideHeader?: boolean;
    lineCleanView?: boolean;
    isPreview?: boolean;
  };
  selected?: boolean;
}

export const getDefaultMatrixColumns = (count: number) => Array.from({ length: Math.max(count, 1) }, (_, index) => `Col ${index + 1}`);
export const defaultBarData = [65, 85, 45, 92, 78];
export const defaultLineData = [30, 65, 50, 75, 85, 60, 90];
export const defaultThirdAxisData = [70, 80, 55, 88, 76];
export const DEFAULT_MATRIX_FIRST_COLUMN_WIDTH = 150;
export const CHART_COLOR_PALETTE = ['#EA0029', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'];
export const getDefaultXAxisLabels = (length: number) => Array.from({ length }, (_, index) => `${index + 1}`);
export const normalizeSeriesLength = (series: number[], targetLength: number, fallbackValue = 0) => {
  if (targetLength <= 0) return [];
  if (series.length === targetLength) return series;
  if (series.length > targetLength) return series.slice(0, targetLength);
  const padValue = series.length ? series[series.length - 1] : fallbackValue;
  return [...series, ...Array.from({ length: targetLength - series.length }, () => padValue)];
};

export const expectedRealityLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
export const expectedRealityExpectedData = [44, 47, 50, 53, 57, 60, 63, 66];
export const expectedRealityRealityData = [39, 45, 53, 56, 52, 61, 67, 60];

export const resolveChartBounds = ({
  size,
  fallback,
  margin,
}: {
  size: { width: number; height: number };
  fallback: { width: number; height: number };
  margin: { top: number; right: number; bottom: number; left: number };
}) => {
  const width = Math.max(size.width || fallback.width, margin.left + margin.right + 40);
  const height = Math.max(size.height || fallback.height, margin.top + margin.bottom + 40);
  const plotWidth = Math.max(width - margin.left - margin.right, 20);
  const plotHeight = Math.max(height - margin.top - margin.bottom, 20);
  return { width, height, plotWidth, plotHeight };
};

export const useElementSize = <T extends HTMLElement>() => {
  const elementRef = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { elementRef, size };
};
