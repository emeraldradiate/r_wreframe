import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

export interface PowerBINodeProps {
  data: {
    label: string;
    componentType: string;
    value?: number | string;
    wowPct?: {
      percentage: string;
      dollarValue?: string; // Make dollarValue optional
    };
    ytdPriorYear?: string;
    ytdPriorYearPct?: string;
    variancePct?: {
      percentage: string;
      dollarValue?: string; // Make dollarValue optional
      flatValue?: string;
    };
    cardLayout?: 'periodKpi' | 'revenueOrdersKpi' | 'ordersPassedKpi';
    cardHeroFontSize?: 'default' | 'compact';
    cardPrimaryDeltaLabel?: string;
    cardPrimaryDeltaDollarOnly?: boolean;
    cardSecondaryDeltaLabel?: string;
    cardBottomDollarLabel?: string;
    cardBottomPercentLabel?: string;
    cardShowSecondaryDelta?: boolean;
    cardPriorActualLabel?: string;
    cardSecondaryPriorValue?: string;
    cardSecondaryPriorActualLabel?: string;
    cardBudgetLabel?: string;
    cardPriorLabel?: string;
    budgetVariance?: {
      dollarValue: string;
      percentage: string;
    };
    priorVariance?: {
      dollarValue: string;
      percentage: string;
    };
    cardOrdersPassed?: {
      totalOrders: string;
      rscOrders: string;
      dropshipOrders: string;
      totalValue: string;
      rscLabel?: string;
      dropshipLabel?: string;
      totalValueLabel?: string;
    };
    chartData?: number[];
    pieLabels?: string[];
    pieColors?: string[];
    pieScalePercent?: number;
    pieShowCalloutLabels?: boolean;
    pieValueFormat?: 'currencyK';
    pieShowLegend?: boolean;
    pieOffsetX?: number;
    pieOffsetY?: number;
    seriesData?: number[][];
    seriesLabels?: string[];
    seriesColors?: string[];
    seriesDashed?: boolean[];
    stackedBudgetLineColor?: string;
    stackedPyLineColor?: string;
    stackedYAxisLabelOffset?: number;
    matrixData?: Array<Array<number | string>>;
    matrixGroupedColumns?: Array<{
      label: string;
      subLabels?: string[];
    }>;
    matrixSubRows?: Array<Array<{
      label: string;
      share: number;
      revenueMix?: {
        cw?: number;
        mtd?: number;
        ytd?: number;
      };
      cmPercent?: {
        cw?: number;
        mtd?: number;
        ytd?: number;
      };
      yoyRevenueMix?: {
        mtd?: number;
        ytd?: number;
      };
      yoyCmPercent?: {
        mtd?: number;
        ytd?: number;
      };
    }>>;
    matrixSubRowColors?: string[];
    matrixSubRowColorBlocks?: boolean;
    matrixRowColors?: string[];
    matrixFirstColumnWidth?: number;
    matrixShowColorBlocks?: boolean;
    matrixRegularFirstColumn?: boolean;
    matrixGroupMode?: boolean;
    matrixTotalRows?: number[];
    matrixHighlightColumns?: number[];
    matrixStripedRows?: boolean;
    matrixColorBlockColumnIndex?: number;
    matrixLeftAlignedColumns?: number[];
    matrixColumnWidths?: Array<number | null>;
    matrixColumnWidthWeights?: Array<number | null>;
    matrixColumnWidthTuning?: {
      weekly?: number;
      variance?: number;
    };
    matrixScaleColumns?: boolean;
    matrixWideColumns?: boolean;
    matrixWrapColumnHeaders?: boolean;
    matrixInvertVarianceColors?: boolean;
    matrixDisableVarianceColors?: boolean;
    cardInvertVarianceColors?: boolean;
    cardDisableVarianceColors?: boolean;
    matrixShowSubColumnHeaders?: boolean;
    matrixSubRowData?: Array<Array<Array<number | string>>>;
    mapData?: string;
    mapImageSrc?: string;
    axisLabels?: { x?: string; y?: string; third?: string };
    xAxisLabels?: string[];
    thirdAxisEnabled?: boolean;
    thirdAxisData?: number[];
    expectedRealityData?: { expected: number[]; reality: number[] };
    expectedRealityPointLabelFormat?: 'difference' | 'currencyK';
    expectedRealityShowBudgetLine?: boolean;
    xAxisDisplayLabelIndices?: number[];
    columnLabels?: string[];
    reportingYear?: number;
    reportingWeek?: number;
    reportDate?: string;
    selectionMode?: 'yearWeek' | 'reportDate';
    slicerLayout?: 'filterBar' | 'default';
    slicerFilters?: Array<
      | { type: 'dateRange'; label: string; startValue?: string; endValue?: string }
      | {
          type: 'dropdown';
          label: string;
          value?: string;
          options?: string[];
          panel?: 'bubble' | 'checklist';
          selected?: string[];
        }
    >;
    fieldChooserFields?: Array<{ label: string; checked?: boolean }>;
    hideHeader?: boolean;
    lineCleanView?: boolean;
    lineDataLabelFormat?: 'currencyK';
    barDataLabelFormat?: 'currencyK';
    xAxisLabelRotation?: number;
    isPreview?: boolean;
  };
  selected?: boolean;
}

export const getDefaultMatrixColumns = (count: number) => Array.from({ length: Math.max(count, 1) }, (_, index) => `Col ${index + 1}`);
export const defaultBarData = [65, 85, 45, 92, 78];
export const defaultLineData = [30, 65, 50, 75, 85, 60, 90];
export const defaultThirdAxisData = [70, 80, 55, 88, 76];
export const DEFAULT_MATRIX_FIRST_COLUMN_WIDTH = 150;
export const CHART_COLOR_PALETTE = [
  '#D3D3D3',
  '#808080',
  '#404040',
  '#000000',
  '#003A8C',
  '#0B77DB',
  '#7DF9FF',
  '#8072E8',
  '#C8A2FF',
  '#C71585',
  '#FF7FA3',
  '#7B3FB3',
];
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

/** Left-click only: keep node drag from stealing focus. Right-click: allow canvas pan. */
export const stopLeftMousePropagation = (event: MouseEvent) => {
  if (event.button === 2) {
    event.preventDefault();
    return;
  }
  if (event.button === 0) {
    event.stopPropagation();
  }
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
