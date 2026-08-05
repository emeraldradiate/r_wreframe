import { Fragment } from 'react';
import { getDefaultMatrixColumns, DEFAULT_MATRIX_FIRST_COLUMN_WIDTH, CHART_COLOR_PALETTE } from '../nodeUtils';

type GroupedColumnLabel = {
  label: string;
  subLabels?: string[];
};

type PeriodValues = {
  cw?: number;
  mtd?: number;
  ytd?: number;
};

type YoyPeriodValues = {
  mtd?: number;
  ytd?: number;
};

type MatrixSubRow = {
  label: string;
  share: number;
  revenueMix?: PeriodValues;
  cmPercent?: PeriodValues;
  yoyRevenueMix?: YoyPeriodValues;
  yoyCmPercent?: YoyPeriodValues;
};

const getPeriodValue = (values: PeriodValues | undefined, columnLabel: string, fallback: number) => {
  if (!values) {
    return fallback;
  }

  const normalized = columnLabel.toLowerCase();
  if (normalized.includes('mtd')) {
    return values.mtd ?? fallback;
  }
  if (normalized.includes('ytd')) {
    return values.ytd ?? fallback;
  }
  if (normalized.includes('cw')) {
    return values.cw ?? fallback;
  }

  return fallback;
};

const isRevenueMixColumn = (columnLabel: string) => {
  const normalized = columnLabel.toLowerCase();
  return (/% of revenue/i.test(columnLabel) || /%rev/i.test(columnLabel) || /% mix/i.test(columnLabel))
    && !/% mix yoy/i.test(normalized);
};
const isCmPercentColumn = (columnLabel: string) => /cm\s*%/i.test(columnLabel);
const isYoyRevenueMixColumn = (columnLabel: string) => {
  const normalized = columnLabel.toLowerCase();
  return /yoy.*% of revenue/i.test(columnLabel)
    || /yoy.*%rev/i.test(columnLabel)
    || /yoy.*% mix/i.test(columnLabel)
    || /% mix yoy/i.test(normalized);
};
const isYoyCmPercentColumn = (columnLabel: string) => {
  const normalized = columnLabel.trim().toLowerCase();
  return /yoy.*cm\s*%/i.test(columnLabel)
    || /cm\s*%.*yoy/i.test(normalized)
    || normalized === 'mtd % yoy'
    || normalized === 'ytd % yoy';
};

const getMatrixContainerClassName = (scrollable: boolean) =>
  scrollable
    ? 'w-full h-full min-h-0 overflow-x-hidden overflow-y-auto'
    : 'w-full h-full min-h-0 overflow-hidden';

const isPercentHeaderLabel = (label: string) => {
  const normalized = label.trim().toLowerCase();
  if (normalized === '%') {
    return true;
  }

  return isRevenueMixColumn(label)
    || isCmPercentColumn(label)
    || isYoyRevenueMixColumn(label)
    || isYoyCmPercentColumn(label)
    || (/%/.test(normalized) && !/\$/.test(normalized));
};

const parseMatrixCell = (value: number | string) => {
  const raw = String(value ?? '').trim();
  const isPercent = raw.includes('%');
  const isCurrency = raw.includes('$');
  const hasKSuffix = /k$/i.test(raw);
  const isNegative = raw.startsWith('-') || (raw.startsWith('(') && raw.endsWith(')'));
  const hasExplicitPositive = raw.trimStart().startsWith('+');
  const numericText = raw.replace(/[,$()%kK]/g, '');
  const numericValue = Number(numericText);

  return {
    raw,
    isPercent,
    isCurrency,
    hasKSuffix,
    isNegative,
    hasExplicitPositive,
    numericValue: Number.isFinite(numericValue) ? numericValue : null,
  };
};

const formatScaledCell = (source: number | string, scaledValue: number) => {
  if (typeof source === 'number') {
    return String(Math.round(scaledValue));
  }

  const parsed = parseMatrixCell(source);

  if (parsed.numericValue === null) {
    return parsed.raw;
  }

  if (parsed.isPercent) {
    return parsed.raw;
  }

  const roundedValue = Math.round(Math.abs(scaledValue));
  const isNeg = parsed.isNegative && roundedValue !== 0;
  const prefix = isNeg ? '-' : parsed.hasExplicitPositive && roundedValue !== 0 ? '+' : '';
  const currency = parsed.isCurrency ? '$' : '';
  const suffix = parsed.hasKSuffix ? 'k' : '';
  const hasCommas = /,/.test(parsed.raw);
  const formattedValue = hasCommas ? roundedValue.toLocaleString('en-US') : String(roundedValue);

  return `${prefix}${currency}${formattedValue}${suffix}`;
};

const getDecimalPlaces = (rawValue: string) => {
  const match = rawValue.match(/\.(\d+)/);
  return match ? match[1].length : 0;
};

const formatPercentCell = (sourceRaw: string, numericValue: number) => {
  const decimals = getDecimalPlaces(sourceRaw);
  const trimmed = sourceRaw.trimStart();
  const hasExplicitSign = trimmed.startsWith('+') || trimmed.startsWith('-');
  const clamped = Math.max(-100, Math.min(100, numericValue));
  const fixed = Math.abs(clamped).toFixed(decimals);

  if (clamped < 0) {
    return `-${fixed}%`;
  }

  return `${hasExplicitSign ? '+' : ''}${fixed}%`;
};

const buildSubRowValues = (
  row: Array<number | string>,
  subRows: MatrixSubRow[],
  columnLabels?: string[],
) => {
  if (!subRows.length) {
    return [] as Array<Array<string>>;
  }

  const resolvedRows = subRows.map(() => row.map(() => ''));

  row.forEach((cell, columnIndex) => {
    const parsed = parseMatrixCell(cell);
    const columnLabel = columnLabels?.[columnIndex] ?? '';

    if (parsed.numericValue === null) {
      subRows.forEach((_, subRowIndex) => {
        resolvedRows[subRowIndex][columnIndex] = parsed.raw;
      });
      return;
    }

    if (parsed.isPercent) {
      if (isRevenueMixColumn(columnLabel)) {
        subRows.forEach((subRow, subRowIndex) => {
          const mixValue = getPeriodValue(subRow.revenueMix, columnLabel, subRow.share * 100);
          resolvedRows[subRowIndex][columnIndex] = formatPercentCell(parsed.raw, mixValue);
        });
        return;
      }

      if (isCmPercentColumn(columnLabel)) {
        subRows.forEach((subRow, subRowIndex) => {
          const cmValue = getPeriodValue(subRow.cmPercent, columnLabel, parsed.numericValue ?? 0);
          resolvedRows[subRowIndex][columnIndex] = formatPercentCell(parsed.raw, cmValue);
        });
        return;
      }

      if (isYoyRevenueMixColumn(columnLabel)) {
        subRows.forEach((subRow, subRowIndex) => {
          const mixValue = getPeriodValue(subRow.yoyRevenueMix, columnLabel, 0);
          resolvedRows[subRowIndex][columnIndex] = formatPercentCell(parsed.raw, mixValue);
        });
        return;
      }

      if (isYoyCmPercentColumn(columnLabel)) {
        subRows.forEach((subRow, subRowIndex) => {
          const cmValue = getPeriodValue(subRow.yoyCmPercent, columnLabel, parsed.numericValue ?? 0);
          resolvedRows[subRowIndex][columnIndex] = formatPercentCell(parsed.raw, cmValue);
        });
        return;
      }

      const numericValue = parsed.numericValue;
      const safeShares = subRows.map((subRow) => Math.max(subRow.share, 0));
      const averageShare = safeShares.reduce((sum, share) => sum + share, 0) / safeShares.length;
      const spread = 1.8;

      const subPercentValues = safeShares.map((share, subRowIndex) => {
        if (subRowIndex === safeShares.length - 1) {
          const previousTotal = safeShares.slice(0, -1).reduce((sum, _, previousIndex) => sum + (resolvedRows[previousIndex][columnIndex] ? Number(String(resolvedRows[previousIndex][columnIndex]).replace(/[^0-9.-]/g, '')) : 0), 0);
          return (numericValue * safeShares.length) - previousTotal;
        }

        return numericValue + ((share - averageShare) * spread);
      });

      subPercentValues.forEach((subPercentValue, subRowIndex) => {
        resolvedRows[subRowIndex][columnIndex] = formatPercentCell(parsed.raw, subPercentValue);
      });
      return;
    }

    const numericValue = parsed.numericValue;

    const roundedValues = subRows.map((subRow, subRowIndex) => {
      if (subRowIndex === subRows.length - 1) {
        const previousTotal = subRows.slice(0, -1).reduce((sum, currentSubRow) => {
          return sum + Math.round(numericValue * Math.max(currentSubRow.share, 0));
        }, 0);
        return numericValue - previousTotal;
      }

      return Math.round(numericValue * Math.max(subRow.share, 0));
    });

    roundedValues.forEach((scaledValue, subRowIndex) => {
      resolvedRows[subRowIndex][columnIndex] = formatScaledCell(cell, scaledValue);
    });
  });

  return resolvedRows;
};

const resolveSubRowValues = (
  rowIndex: number,
  row: Array<number | string>,
  subRows: MatrixSubRow[],
  headerLabels: string[],
  subRowData?: Array<Array<Array<number | string>>>,
) => {
  const explicitRows = subRowData?.[rowIndex];
  if (explicitRows?.length) {
    return explicitRows.map((subRow) => [...subRow]);
  }

  return buildSubRowValues(row, subRows, headerLabels);
};

const isVarianceSubRowLabel = (label: string) => label.trim().toLowerCase().includes('variance');

const isActualsSubRowLabel = (label: string) => label.trim().toLowerCase() === 'actuals';

const getActualsVsBudgetTone = (
  actualValue: number | string,
  budgetValue: number | string,
) => {
  if (!String(actualValue ?? '').trim() || !String(budgetValue ?? '').trim()) {
    return 'neutral';
  }

  const actual = parseMatrixCell(String(actualValue ?? '')).numericValue;
  const budget = parseMatrixCell(String(budgetValue ?? '')).numericValue;

  if (actual === null || budget === null) {
    return 'neutral';
  }

  if (actual > budget) {
    return 'positive';
  }

  if (actual < budget) {
    return 'negative';
  }

  return 'neutral';
};

const getActualsCellColorClass = (
  actualValue: number | string,
  budgetValue: number | string,
  invertVarianceColors = false,
  disableVarianceColors = false,
) => {
  if (disableVarianceColors) {
    return 'text-black';
  }

  const tone = getActualsVsBudgetTone(actualValue, budgetValue);
  if (tone === 'positive') {
    return invertVarianceColors ? 'text-red-800' : 'text-green-800';
  }
  if (tone === 'negative') {
    return invertVarianceColors ? 'text-green-800' : 'text-red-800';
  }

  return 'text-black';
};

const getActualsCellBgColorClass = (
  actualValue: number | string,
  budgetValue: number | string,
  invertVarianceColors = false,
  disableVarianceColors = false,
) => {
  if (disableVarianceColors) {
    return '';
  }

  const tone = getActualsVsBudgetTone(actualValue, budgetValue);
  if (tone === 'positive') {
    return invertVarianceColors ? 'bg-red-50' : 'bg-green-50';
  }
  if (tone === 'negative') {
    return invertVarianceColors ? 'bg-green-50' : 'bg-red-50';
  }

  return '';
};

const isVarianceMatrixCellForSubRow = (
  parentRow: Array<number | string>,
  subRowLabel: string,
  columnIndex: number,
  isVarianceColumn: boolean,
) => isVarianceColumn
  || isVarianceRowLabel(String(parentRow[0] ?? ''))
  || (columnIndex > 0 && isVarianceSubRowLabel(subRowLabel));

const getSubRowCellColorClasses = (
  parentRow: Array<number | string>,
  subRowLabel: string,
  columnIndex: number,
  value: number | string,
  isVarianceColumn: boolean,
  invertVarianceColors = false,
  disableVarianceColors = false,
) => {
  if (columnIndex > 0 && isActualsSubRowLabel(subRowLabel)) {
    return {
      textClass: getActualsCellColorClass(value, parentRow[columnIndex], invertVarianceColors, disableVarianceColors),
      bgClass: getActualsCellBgColorClass(value, parentRow[columnIndex], invertVarianceColors, disableVarianceColors),
      isVarianceColumn: true,
    };
  }

  const isVariance = isVarianceMatrixCellForSubRow(parentRow, subRowLabel, columnIndex, isVarianceColumn);
  return {
    textClass: getCellValueColorClass(value, isVariance, invertVarianceColors, disableVarianceColors),
    bgClass: getCellBgColorClass(value, isVariance, invertVarianceColors, disableVarianceColors),
    isVarianceColumn: isVariance,
  };
};

const isZeroValue = (value: number | string) => {
  const parsed = parseMatrixCell(String(value ?? ''));
  return parsed.numericValue === 0 && !parsed.isNegative && !parsed.hasExplicitPositive;
};

const isEmptyCellValue = (value: number | string) => !String(value ?? '').trim();

type GroupRowMeta = {
  rowSpan: number;
  isContinuation: boolean;
  groupIndex: number;
  isTotalRow: boolean;
};

const getGroupBackgroundClass = (groupIndex: number) =>
  groupIndex % 2 === 1 ? 'bg-[#f7f5f5]' : 'bg-white';

const buildGroupRowMeta = (
  rows: Array<Array<number | string>>,
  totalRowSet: Set<number>,
): GroupRowMeta[] => {
  let groupIndex = -1;

  return rows.map((row, rowIndex) => {
    if (totalRowSet.has(rowIndex)) {
      groupIndex += 1;
      return { rowSpan: 1, isContinuation: false, groupIndex, isTotalRow: true };
    }

    if (!isEmptyCellValue(row[0])) {
      groupIndex += 1;
      let rowSpan = 1;
      for (let nextIndex = rowIndex + 1; nextIndex < rows.length; nextIndex += 1) {
        if (totalRowSet.has(nextIndex)) {
          break;
        }
        if (isEmptyCellValue(rows[nextIndex][0])) {
          rowSpan += 1;
        } else {
          break;
        }
      }
      return { rowSpan, isContinuation: false, groupIndex, isTotalRow: false };
    }

    return { rowSpan: 0, isContinuation: true, groupIndex, isTotalRow: false };
  });
};

const isYearTotalColumnLabel = (label: string) => /year\s*total/i.test(label.trim());

const isBoldMatrixColumnLabel = (label: string) => {
  const normalized = label.trim().toLowerCase();
  return isYearTotalColumnLabel(label)
    || normalized === 'total';
};

const getMatrixCellFontClass = (
  columnIndex: number,
  boldColumnSet: Set<number>,
  options?: { isTotalRow?: boolean },
) => {
  if (options?.isTotalRow || boldColumnSet.has(columnIndex)) {
    return 'font-bold';
  }

  return 'font-medium';
};

const MATRIX_SUMMARY_BG_CLASS = 'bg-[#f7f5f5]';

const getStripedRowBackgroundClass = (rowIndex: number, stripedRows: boolean) =>
  !stripedRows ? 'bg-white' : rowIndex % 2 === 1 ? MATRIX_SUMMARY_BG_CLASS : 'bg-white';

const getMatrixDataCellBackgroundClass = (
  columnIndex: number,
  options: {
    isTotalRow: boolean;
    highlightColumnSet: Set<number>;
    stripedRows: boolean;
    varianceBgClass: string;
  },
) => {
  const useUniformSummaryStyle = !options.stripedRows && options.highlightColumnSet.size > 0;

  if (options.varianceBgClass && !useUniformSummaryStyle) {
    return options.varianceBgClass;
  }

  if (options.isTotalRow || options.highlightColumnSet.has(columnIndex)) {
    return MATRIX_SUMMARY_BG_CLASS;
  }

  // Row-level striping handles alternating backgrounds; avoid per-cell white overlays.
  if (options.stripedRows) {
    return '';
  }

  return 'bg-white';
};

const isVarianceHeaderLabel = (label: string) => {
  const normalized = label.trim().toLowerCase();
  const isBudgetVsActual =
    normalized.includes('budget') && (normalized.includes('v actual') || normalized.includes('vs actual'));
  return (
    normalized.includes('var')
    || normalized.includes('vs')
    || normalized.includes('variance')
    || normalized.includes('delta')
    || normalized.includes('yoy')
    || normalized.includes('wow')
    || isBudgetVsActual
  );
};

const isVarianceRowLabel = (label: string) => {
  const normalized = label.trim().toLowerCase();
  return normalized.includes('variance')
    || normalized === 'wow'
    || normalized.includes(' vs ');
};

const getGroupModeRowLabel = (row: Array<number | string>) => String(row[1] ?? row[0] ?? '').trim();

const isVarianceMatrixCell = (
  row: Array<number | string>,
  columnIndex: number,
  isVarianceColumn: boolean,
  groupMode = false,
) => {
  const labelColumnCount = groupMode ? 2 : 1;
  const label = groupMode ? getGroupModeRowLabel(row) : String(row[0] ?? '').trim();

  return isVarianceColumn || (columnIndex >= labelColumnCount && isVarianceRowLabel(label));
};

const getVarianceValueTone = (value: number | string): 'positive' | 'negative' | 'neutral' => {
  if (isEmptyCellValue(value)) {
    return 'neutral';
  }

  const normalizedValue = String(value ?? '').trimStart();

  if (normalizedValue.startsWith('-')) {
    return 'negative';
  }

  if (normalizedValue.startsWith('+') || isZeroValue(value)) {
    return 'positive';
  }

  const parsed = parseMatrixCell(value);
  if (parsed.numericValue === null) {
    return 'neutral';
  }

  if (parsed.numericValue < 0 || parsed.isNegative) {
    return 'negative';
  }

  if (parsed.numericValue > 0) {
    return 'positive';
  }

  return 'neutral';
};

const PERCENT_SUB_COLUMN_WIDTH = 'minmax(42px, 0.7fr)';
const WIDE_PERCENT_SUB_COLUMN_WIDTH = 'minmax(58px, 0.9fr)';
const DOLLAR_COLUMN_WIDTH = 'minmax(64px, 1fr)';
const WIDE_DOLLAR_COLUMN_WIDTH = 'minmax(80px, 1.2fr)';
const WIDE_WEEKLY_COLUMN_WIDTH = 'minmax(92px, 1.28fr)';
const TEXT_COLUMN_WIDTH = 'minmax(44px, 1.35fr)';
const NUMERIC_COLUMN_WIDTH = 'minmax(36px, 0.55fr)';

const getPercentColumnWidth = (wideColumns = false) =>
  wideColumns ? WIDE_PERCENT_SUB_COLUMN_WIDTH : PERCENT_SUB_COLUMN_WIDTH;

type MatrixColumnWidthTuning = {
  weekly?: number;
  variance?: number;
};

const scaleMinmaxTemplate = (template: string, factor: number) => {
  if (factor === 1) {
    return template;
  }

  return template.replace(/(\d+(?:\.\d+)?)(px|fr)/g, (_, raw, unit) => {
    const scaled = unit === 'px'
      ? Math.round(Number(raw) * factor)
      : Number((Number(raw) * factor).toFixed(3));
    return `${scaled}${unit}`;
  });
};

const tuneColumnWidth = (
  template: string,
  kind: 'weekly' | 'variance',
  tuning?: MatrixColumnWidthTuning,
) => {
  const factor = kind === 'weekly' ? tuning?.weekly ?? 1 : tuning?.variance ?? 1;
  return scaleMinmaxTemplate(template, factor);
};

const isNumericMatrixColumn = (
  columnIndex: number,
  data: Array<Array<number | string>>,
) => {
  const values = data
    .map((row) => String(row[columnIndex] ?? '').trim())
    .filter((value) => value.length > 0);

  if (!values.length) {
    return false;
  }

  return values.every((value) => parseMatrixCell(value).numericValue !== null);
};

const getAutoScaledColumnWidth = (
  columnIndex: number,
  labels: string[],
  data: Array<Array<number | string>>,
  wideColumns = false,
) => {
  const label = labels[columnIndex] ?? '';
  if (isPercentHeaderLabel(label)) {
    return getPercentColumnWidth(wideColumns);
  }

  return isNumericMatrixColumn(columnIndex, data) ? NUMERIC_COLUMN_WIDTH : TEXT_COLUMN_WIDTH;
};
const BOOKED_UNITS_COLUMN_FR = 0.7;
const BOOKED_UNITS_VAR_PERCENT_FR = BOOKED_UNITS_COLUMN_FR * 1.2;

const getPairedSubColumnWidth = (isDollarSubColumn: boolean, dollarWidth: string, wideColumns = false) =>
  isDollarSubColumn ? dollarWidth : getPercentColumnWidth(wideColumns);

const getRegularFirstColumnGroupedWidth = (
  groupLabel: string,
  isCompactGroup: boolean,
  subLabelIndex: number,
  matrixTitle?: string,
  leafColumnIndex?: number,
) => {
  const normalizedGroupLabel = groupLabel.trim().toLowerCase();
  if (!isCompactGroup && normalizedGroupLabel.includes('ytd budget')) {
    return 'minmax(58px, 1.2fr)';
  }

  const normalizedMatrixTitle = matrixTitle?.trim().toLowerCase();
  if (normalizedMatrixTitle === 'booked units' && leafColumnIndex !== undefined) {
    const isVariancePercentColumn = leafColumnIndex === 3;
    const fr = isVariancePercentColumn ? BOOKED_UNITS_VAR_PERCENT_FR : BOOKED_UNITS_COLUMN_FR;
    const minPx = isVariancePercentColumn ? 50 : 44;
    return `minmax(${minPx}px, ${fr}fr)`;
  }

  const normalized = normalizedGroupLabel;

  if (!isCompactGroup) {
    if (normalized === 'cw budget') {
      return 'minmax(80px, 1.18fr)';
    }
    if (normalized === 'mtd actual' || normalized === 'ytd actual') {
      return 'minmax(84px, 1.16fr)';
    }
    return 'minmax(68px, 1fr)';
  }

  const isDollarSubColumn = subLabelIndex === 0;
  if (normalized.includes('yoy var') || (normalized.includes('yoy') && !normalized.includes('budget') && !normalized.includes('mix') && !normalized.includes('cm%'))) {
    return getPairedSubColumnWidth(isDollarSubColumn, 'minmax(74px, 1.16fr)');
  }
  if (
    normalized.includes('cw budget')
    || normalized.includes('mtd var')
    || normalized.includes('ytd var')
    || normalized.includes('vs budget')
    || normalized.includes('variance')
  ) {
    return getPairedSubColumnWidth(isDollarSubColumn, 'minmax(62px, 1.12fr)');
  }

  return getPairedSubColumnWidth(isDollarSubColumn, 'minmax(62px, 1.12fr)');
};

const buildFlatGridTemplate = (
  labels: string[],
  columnCount: number,
  {
    regularFirstColumn,
    firstColumnWidth,
    showColorBlocks,
    colorBlockColumnIndex,
    columnWidths,
    columnWidthWeights,
    data,
    scaleColumns,
    wideColumns,
  }: {
    regularFirstColumn: boolean;
    firstColumnWidth?: number;
    showColorBlocks: boolean;
    colorBlockColumnIndex: number;
    columnWidths?: Array<number | null>;
    columnWidthWeights?: Array<number | null>;
    data?: Array<Array<number | string>>;
    scaleColumns?: boolean;
    wideColumns?: boolean;
  },
) => {
  const parts: string[] = [];
  const leadingWidth = firstColumnWidth || DEFAULT_MATRIX_FIRST_COLUMN_WIDTH;

  for (let index = 0; index < columnCount; index += 1) {
    const explicitWidth = columnWidths?.[index];
    if (typeof explicitWidth === 'number' && Number.isFinite(explicitWidth)) {
      parts.push(`${explicitWidth}px`);
      if (showColorBlocks && !regularFirstColumn && index === colorBlockColumnIndex) {
        parts.push('42px');
      }
      continue;
    }

    if (scaleColumns && data?.length) {
      parts.push(getAutoScaledColumnWidth(index, labels, data, wideColumns));
      if (showColorBlocks && !regularFirstColumn && index === colorBlockColumnIndex) {
        parts.push('42px');
      }
      continue;
    }

    if (!regularFirstColumn && index === 0) {
      parts.push(`${leadingWidth}px`);
      if (showColorBlocks && index === colorBlockColumnIndex) {
        parts.push('42px');
      }
      continue;
    }

    const columnWeight = columnWidthWeights?.[index];
    if (typeof columnWeight === 'number' && Number.isFinite(columnWeight) && columnWeight > 0) {
      const label = labels[index] ?? '';
      const minPx = isPercentHeaderLabel(label) ? 42 : (wideColumns ? 80 : 64);
      parts.push(`minmax(${minPx}px, ${columnWeight}fr)`);
      if (showColorBlocks && !regularFirstColumn && index === colorBlockColumnIndex) {
        parts.push('42px');
      }
      continue;
    }

    const label = labels[index] ?? '';
    parts.push(isPercentHeaderLabel(label) ? getPercentColumnWidth(wideColumns) : DOLLAR_COLUMN_WIDTH);

    if (showColorBlocks && !regularFirstColumn && index === colorBlockColumnIndex) {
      parts.push('42px');
    }
  }

  if (showColorBlocks && regularFirstColumn) {
    parts.push('42px');
  }

  return parts.join(' ');
};

const isMtdYtdVarianceLayout = (labels: string[]) => {
  if (labels.length !== 4) {
    return false;
  }

  const normalizedLabels = labels.map((label) => label.trim().toLowerCase());
  return normalizedLabels[0].includes('mtd')
    && normalizedLabels[0].includes('actual')
    && normalizedLabels[1].includes('ytd')
    && normalizedLabels[1].includes('actual')
    && normalizedLabels[2].includes('mtd')
    && normalizedLabels[2].includes('%')
    && normalizedLabels[2].includes('var')
    && normalizedLabels[3].includes('ytd')
    && normalizedLabels[3].includes('%')
    && normalizedLabels[3].includes('var');
};

const toDisplayValue = (value: number | string, isVarianceColumn = false): string => {
  const raw = String(value ?? '');
  if (!raw.trim()) {
    return '';
  }
  const parsed = parseMatrixCell(raw);

  if (parsed.numericValue !== 0 || parsed.hasExplicitPositive || parsed.isNegative) {
    return raw;
  }

  if (!isVarianceColumn) {
    return raw;
  }

  if (parsed.isPercent) {
    const decimals = getDecimalPlaces(raw);
    return `+${(0).toFixed(decimals)}%`;
  }

  if (parsed.isCurrency) {
    const suffix = parsed.hasKSuffix ? 'k' : '';
    return `+$0${suffix}`;
  }

  return '+0';
};

const getCellValueColorClass = (
  value: number | string,
  isVarianceColumn = false,
  invertVarianceColors = false,
  disableVarianceColors = false,
) => {
  if (!isVarianceColumn || disableVarianceColors) {
    return 'text-black';
  }

  const tone = getVarianceValueTone(value);
  if (tone === 'positive') {
    return invertVarianceColors ? 'text-red-800' : 'text-green-800';
  }
  if (tone === 'negative') {
    return invertVarianceColors ? 'text-green-800' : 'text-red-800';
  }

  return 'text-black';
};

const getCellBgColorClass = (
  value: number | string,
  isVarianceColumn = false,
  invertVarianceColors = false,
  disableVarianceColors = false,
) => {
  if (!isVarianceColumn || disableVarianceColors) {
    return '';
  }

  const tone = getVarianceValueTone(value);
  if (tone === 'positive') {
    return invertVarianceColors ? 'bg-red-50' : 'bg-green-50';
  }
  if (tone === 'negative') {
    return invertVarianceColors ? 'bg-green-50' : 'bg-red-50';
  }

  return '';
};

function MatrixHeaderLabel({
  label,
  index,
  isLeftAligned,
  wrapColumnHeaders,
  onColumnLabelChange,
}: {
  label: string;
  index: number;
  isLeftAligned: boolean;
  wrapColumnHeaders: boolean;
  onColumnLabelChange?: (columnIndex: number, value: string) => void;
}) {
  const alignmentClass = isLeftAligned ? 'text-left pr-2' : 'text-center';
  const sharedClass = `nodrag w-full bg-transparent border-0 p-0 m-0 text-xs font-semibold text-black focus:outline-none ${alignmentClass}`;

  if (wrapColumnHeaders) {
    return (
      <textarea
        value={label}
        rows={2}
        onChange={(event) => onColumnLabelChange?.(index, event.target.value)}
        onMouseDown={(event) => event.stopPropagation()}
        className={`${sharedClass} whitespace-normal break-words leading-tight resize-none overflow-hidden`}
      />
    );
  }

  return (
    <input
      value={label}
      onChange={(event) => onColumnLabelChange?.(index, event.target.value)}
      onMouseDown={(event) => event.stopPropagation()}
      className={sharedClass}
    />
  );
}

const MatrixVisual = ({
  data = [[120, 85], [200, 150], [95, 110]],
  columnLabels,
  groupedColumnLabels,
  firstColumnWidth,
  showColorBlocks = false,
  regularFirstColumn = false,
  groupMode = false,
  totalRows,
  highlightColumns,
  stripedRows = true,
  colorBlockColumnIndex,
  leftAlignedColumns,
  rowSubRows = [],
  subRowColors,
  subRowColorBlocks = false,
  rowColors,
  matrixTitle,
  columnWidths,
  columnWidthWeights,
  columnWidthTuning,
  scaleColumns = false,
  wideColumns = false,
  wrapColumnHeaders = false,
  invertVarianceColors = false,
  disableVarianceColors = false,
  showSubColumnHeaders = false,
  scrollable = false,
  subRowData,
  onCellChange,
  onColumnLabelChange,
}: {
  data?: Array<Array<number | string>>;
  columnLabels?: string[];
  groupedColumnLabels?: GroupedColumnLabel[];
  firstColumnWidth?: number;
  showColorBlocks?: boolean;
  regularFirstColumn?: boolean;
  groupMode?: boolean;
  totalRows?: number[];
  highlightColumns?: number[];
  stripedRows?: boolean;
  colorBlockColumnIndex?: number;
  leftAlignedColumns?: number[];
  rowSubRows?: Array<Array<MatrixSubRow>>;
  subRowColors?: string[];
  subRowColorBlocks?: boolean;
  rowColors?: string[];
  matrixTitle?: string;
  columnWidths?: Array<number | null>;
  columnWidthWeights?: Array<number | null>;
  columnWidthTuning?: MatrixColumnWidthTuning;
  scaleColumns?: boolean;
  wideColumns?: boolean;
  wrapColumnHeaders?: boolean;
  invertVarianceColors?: boolean;
  disableVarianceColors?: boolean;
  showSubColumnHeaders?: boolean;
  scrollable?: boolean;
  subRowData?: Array<Array<Array<number | string>>>;
  onCellChange?: (rowIndex: number, columnIndex: number, value: string) => void;
  onColumnLabelChange?: (columnIndex: number, value: string) => void;
}) => {
  const safeData = data.length ? data : [['', '']], columnCount = Math.max(1, safeData[0]?.length || 1);
  const matrixContainerClassName = getMatrixContainerClassName(scrollable);
  const varianceTextClass = (value: number | string, isVarianceColumn = false) =>
    getCellValueColorClass(value, isVarianceColumn, invertVarianceColors, disableVarianceColors);
  const varianceBgClass = (value: number | string, isVarianceColumn = false) =>
    getCellBgColorClass(value, isVarianceColumn, invertVarianceColors, disableVarianceColors);
  const headerLabels = columnLabels?.length === columnCount ? columnLabels : getDefaultMatrixColumns(columnCount);
  const boldColumnSet = new Set(
    headerLabels
      .map((label, index) => ({ label, index }))
      .filter(({ label }) => isBoldMatrixColumnLabel(label))
      .map(({ index }) => index),
  );
  const resolvedLeftAlignedColumns = (
    Array.isArray(leftAlignedColumns) ? leftAlignedColumns : [0]
  )
    .map((index) => Math.max(0, Math.min(columnCount - 1, Math.floor(Number(index) || 0))));
  const leftAlignedColumnSet = new Set(resolvedLeftAlignedColumns);
  const resolvedColorBlockColumnIndex = Math.max(
    0,
    Math.min(columnCount - 1, Math.floor(Number(colorBlockColumnIndex ?? 0) || 0)),
  );

  // ── Grouped-column rendering ──────────────────────────────────────────────
  if (groupedColumnLabels && groupedColumnLabels.length > 0) {
    const totalRowSet = new Set((totalRows ?? []).map((index) => Math.floor(Number(index) || 0)));
    const leadingPx = firstColumnWidth || DEFAULT_MATRIX_FIRST_COLUMN_WIDTH;
    const hasColorBlocksColumn = showColorBlocks && !regularFirstColumn;
    const colorColumnWidth = 42;
    const dataColumnIsCompact: boolean[] = [];
    const dataColumnIsRightGrouped: boolean[] = [];
    const dataColumnIsVariance: boolean[] = [];
    const leafTemplateParts: string[] = [];
    let dataColumnCursor = 0;

    groupedColumnLabels.forEach((group) => {
      const subLabels = group.subLabels?.length ? group.subLabels : [group.label];
      const isCompactGroup = subLabels.length > 1;
      const normalizedLabel = group.label.trim().toLowerCase();
      const isWiderGrillLine = normalizedLabel === 'grill line';
      const isFixedGrillName = normalizedLabel === 'grill name';
      const isSlimPricingColumn = normalizedLabel === 'asp' || normalizedLabel === 'msrp';
      const isOrdersColumn = normalizedLabel === 'orders' || normalizedLabel === 'order count';
      const isWiderUnitBudgetColumn = normalizedLabel === 'units sold' || normalizedLabel === 'budget sold';
      const isWeeklyGroup = /^wk\s*\d+$/.test(normalizedLabel);
      const isVarianceGroup = isVarianceHeaderLabel(group.label);

      subLabels.forEach((_, subLabelIndex) => {
        const explicitWidth = columnWidths?.[dataColumnCursor];
        const hasExplicitWidth = typeof explicitWidth === 'number' && Number.isFinite(explicitWidth);

        if (hasExplicitWidth) {
          leafTemplateParts.push(`${explicitWidth}px`);
        } else if (regularFirstColumn) {
          leafTemplateParts.push(
            getRegularFirstColumnGroupedWidth(
              group.label,
              isCompactGroup,
              subLabelIndex,
              matrixTitle,
              dataColumnCursor,
            ),
          );
        } else if (dataColumnCursor === 0) {
          leafTemplateParts.push(`${leadingPx}px`);
        } else if ((isVarianceGroup || isWeeklyGroup) && isCompactGroup) {
          const dollarWidth = tuneColumnWidth(
            wideColumns ? 'minmax(84px, 1.24fr)' : 'minmax(76px, 1.18fr)',
            'variance',
            columnWidthTuning,
          );
          leafTemplateParts.push(
            subLabelIndex === 0
              ? dollarWidth
              : tuneColumnWidth(getPercentColumnWidth(wideColumns), 'variance', columnWidthTuning),
          );
        } else if (isFixedGrillName && !isCompactGroup) {
          leafTemplateParts.push('120px');
        } else if (isSlimPricingColumn && !isCompactGroup) {
          leafTemplateParts.push('minmax(52px, 0.5fr)');
        } else if (isWiderGrillLine && !isCompactGroup) {
          leafTemplateParts.push('minmax(18px, 1.3fr)');
        } else if (isOrdersColumn && !isCompactGroup) {
          leafTemplateParts.push('minmax(52px, 0.55fr)');
        } else if (isWiderUnitBudgetColumn && !isCompactGroup) {
          leafTemplateParts.push('minmax(68px, 0.8fr)');
        } else if (isCompactGroup) {
          const subLabel = subLabels[subLabelIndex]?.trim().toLowerCase() ?? '';
          const hasPercentSibling = subLabels.some((label) => {
            const normalized = label.trim().toLowerCase();
            return normalized === '%' || isPercentHeaderLabel(label);
          });
          if (subLabel === '%' || isPercentHeaderLabel(subLabels[subLabelIndex] ?? '')) {
            const percentWidth = getPercentColumnWidth(wideColumns);
            leafTemplateParts.push(
              isVarianceGroup
                ? tuneColumnWidth(percentWidth, 'variance', columnWidthTuning)
                : percentWidth,
            );
          } else if (!hasPercentSibling) {
            // Equal-width sub-columns (e.g. Order Count / Dollar Amount)
            leafTemplateParts.push(wideColumns ? 'minmax(84px, 1fr)' : 'minmax(72px, 1fr)');
          } else {
            const baseDollarWidth = wideColumns ? 'minmax(76px, 1.18fr)' : 'minmax(62px, 1.1fr)';
            if (isVarianceGroup) {
              leafTemplateParts.push(
                subLabelIndex === 0
                  ? tuneColumnWidth(baseDollarWidth, 'variance', columnWidthTuning)
                  : tuneColumnWidth(getPercentColumnWidth(wideColumns), 'variance', columnWidthTuning),
              );
            } else {
              leafTemplateParts.push(getPairedSubColumnWidth(
                subLabelIndex === 0,
                baseDollarWidth,
                wideColumns,
              ));
            }
          }
        } else if (isWeeklyGroup) {
          leafTemplateParts.push(
            tuneColumnWidth(
              wideColumns ? WIDE_WEEKLY_COLUMN_WIDTH : 'minmax(64px, 1.1fr)',
              'weekly',
              columnWidthTuning,
            ),
          );
        } else {
          leafTemplateParts.push(
            isPercentHeaderLabel(group.label)
              ? getPercentColumnWidth(wideColumns)
              : (wideColumns ? WIDE_DOLLAR_COLUMN_WIDTH : 'minmax(64px, 1.1fr)'),
          );
        }
        dataColumnIsCompact.push(isCompactGroup);
        dataColumnIsRightGrouped.push(isCompactGroup && subLabelIndex === subLabels.length - 1);
        dataColumnIsVariance.push(isVarianceGroup);
        if (hasColorBlocksColumn && dataColumnCursor === resolvedColorBlockColumnIndex) {
          leafTemplateParts.push(`${colorColumnWidth}px`);
        }
        dataColumnCursor += 1;
      });
    });

    const leafTemplate = regularFirstColumn
      ? leafTemplateParts.length === columnCount
        ? leafTemplateParts.join(' ')
        : `repeat(${columnCount}, minmax(64px, 1fr))`
      : leafTemplateParts.join(' ');
    const hasAnySubRows = rowSubRows.some((subRows) => subRows?.length > 0);
    const shouldShowSubColumnHeaders = showSubColumnHeaders
      && groupedColumnLabels.some((group) => (group.subLabels?.length ?? 0) > 1);

    return (
      <div className={matrixContainerClassName}>
      <div className="w-full px-2 py-2 bg-white">
        {/* Grouped parent headers */}
        <div className={scrollable ? 'sticky top-0 z-10 bg-white' : 'bg-white'}>
        <div
          className={`text-xs font-semibold text-black grid font-header ${shouldShowSubColumnHeaders ? 'pb-0.5' : 'border-b border-medium-gray pb-1 mb-2'}`}
          style={{ gridTemplateColumns: leafTemplate }}
        >
          {groupedColumnLabels.map((group, gi) => {
            const span = group.subLabels?.length || 1;
            const groupStartColumn = groupedColumnLabels
              .slice(0, gi)
              .reduce((sum, currentGroup) => sum + (currentGroup.subLabels?.length || 1), 0);
            const shouldLeftAlignHeader = !regularFirstColumn && span === 1 && leftAlignedColumnSet.has(groupStartColumn);
            const groupEndColumn = groupStartColumn + span - 1;
            const hasHeaderDividerAfterGroup = groupEndColumn < columnCount - 1
              || (hasColorBlocksColumn && groupEndColumn === resolvedColorBlockColumnIndex);
            const hasDividerAfterColorBlock = hasColorBlocksColumn && resolvedColorBlockColumnIndex < columnCount - 1;
            return (
              <Fragment key={`group-${gi}`}>
                <div
                  className={`${shouldLeftAlignHeader ? 'px-1 text-left' : 'px-1 text-center'} ${hasHeaderDividerAfterGroup ? 'border-r border-black/10' : ''}`}
                  style={{ gridColumn: `span ${span}` }}
                >
                  <input
                    value={group.label}
                    readOnly
                    className={`nodrag w-full bg-transparent border-0 p-0 m-0 text-xs font-semibold text-black focus:outline-none pointer-events-none ${shouldLeftAlignHeader ? 'text-left pr-2' : 'text-center'}`}
                  />
                </div>
                {hasColorBlocksColumn && groupEndColumn === resolvedColorBlockColumnIndex && (
                  <div className={`px-0.5 ${hasDividerAfterColorBlock ? 'border-r border-black/10' : ''}`} />
                )}
              </Fragment>
            );
          })}
        </div>
        {shouldShowSubColumnHeaders && (
          <div
            className="text-[10px] font-semibold text-black/70 border-b border-medium-gray pb-1 mb-2 grid font-header"
            style={{ gridTemplateColumns: leafTemplate }}
          >
            {groupedColumnLabels.flatMap((group, gi) => {
              const subLabels = group.subLabels?.length ? group.subLabels : [''];
              const groupStartColumn = groupedColumnLabels
                .slice(0, gi)
                .reduce((sum, currentGroup) => sum + (currentGroup.subLabels?.length || 1), 0);
              const hasMultiSubLabels = (group.subLabels?.length ?? 0) > 1;
              return subLabels.map((subLabel, subLabelIndex) => {
                const columnIndex = groupStartColumn + subLabelIndex;
                const isLeftAligned = !regularFirstColumn && leftAlignedColumnSet.has(columnIndex);
                const hasRightBorder = columnIndex < columnCount - 1
                  || (hasColorBlocksColumn && columnIndex === resolvedColorBlockColumnIndex);
                const hasDividerAfterColorBlock = hasColorBlocksColumn && resolvedColorBlockColumnIndex < columnCount - 1;
                return (
                  <Fragment key={`sub-header-${gi}-${subLabelIndex}`}>
                    <div
                      className={`${isLeftAligned ? 'px-1 text-left' : 'px-0.5 text-center'} ${hasRightBorder ? 'border-r border-black/10' : ''}`}
                    >
                      {hasMultiSubLabels ? (
                        <span className={`block leading-tight whitespace-normal break-words ${isLeftAligned ? 'text-left' : 'text-center'}`}>
                          {subLabel}
                        </span>
                      ) : null}
                    </div>
                    {hasColorBlocksColumn && columnIndex === resolvedColorBlockColumnIndex && (
                      <div className={`px-0.5 ${hasDividerAfterColorBlock ? 'border-r border-black/10' : ''}`} />
                    )}
                  </Fragment>
                );
              });
            })}
          </div>
        )}
        </div>
        {/* Data rows */}
        {safeData.map((row, i) => {
          const isTotalRow = totalRowSet.has(i);
          return (
          <Fragment key={i}>
            <div
              className={`grid text-xs py-1 border-b border-medium-gray font-body ${isTotalRow ? MATRIX_SUMMARY_BG_CLASS : getStripedRowBackgroundClass(i, stripedRows)}`}
              style={{ gridTemplateColumns: leafTemplate }}
            >
              {row.map((val, j) => (
                <Fragment key={`row-${i}-cell-${j}`}>
                  {(() => {
                    const isLeftAligned = !regularFirstColumn && leftAlignedColumnSet.has(j);
                    const hasRightBorder = j < row.length - 1 || (hasColorBlocksColumn && j === resolvedColorBlockColumnIndex);
                    const isVarianceColumn = isVarianceMatrixCell(row, j, dataColumnIsVariance[j] || false);
                    const useGroupedShading = stripedRows && !hasAnySubRows && !isVarianceColumn && dataColumnIsRightGrouped[j];
                    const defaultCellBackground = isTotalRow
                      ? MATRIX_SUMMARY_BG_CLASS
                      : varianceBgClass(val, isVarianceColumn)
                      || (stripedRows
                        ? useGroupedShading
                          ? i % 2 === 1
                            ? 'bg-black/10'
                            : 'bg-black/5'
                          : ''
                        : 'bg-white');
                    return (
                  <div
                    className={`px-1 ${isLeftAligned ? 'text-left' : 'text-center'} ${defaultCellBackground} ${hasRightBorder ? 'border-r border-black/10' : ''}`}
                  >
                    <input
                      value={toDisplayValue(val, isVarianceColumn)}
                      onChange={(e) => onCellChange?.(i, j, e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`nodrag w-full bg-transparent border-0 p-0 m-0 ${getMatrixCellFontClass(j, boldColumnSet, { isTotalRow })} ${varianceTextClass(val, isVarianceColumn)} focus:outline-none ${isLeftAligned ? 'text-left pr-2' : 'text-center'}`}
                    />
                  </div>
                    );
                  })()}
                  {j === resolvedColorBlockColumnIndex && hasColorBlocksColumn && (
                    <div className="flex items-center justify-center px-1 border-r border-black/10">
                      {!isTotalRow && (
                        <span
                          className="inline-block h-3.5 w-3.5"
                          style={{ backgroundColor: rowColors?.[i] || CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length] }}
                          title={`Row ${i + 1} color`}
                        />
                      )}
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
            {resolveSubRowValues(i, row, rowSubRows[i] || [], headerLabels, subRowData).map((subRowValues, subRowIndex) => (
              <div
                key={`row-${i}-subrow-${subRowIndex}`}
                className="grid text-xs py-[1px] border-b border-medium-gray font-body bg-[#f7f5f5]"
                style={{ gridTemplateColumns: leafTemplate }}
              >
                {subRowValues.map((val, j) => (
                  <Fragment key={`row-${i}-subrow-${subRowIndex}-cell-${j}`}>
                    {(() => {
                      const isLeftAligned = !regularFirstColumn && leftAlignedColumnSet.has(j);
                      const hasRightBorder = j < subRowValues.length - 1 || (hasColorBlocksColumn && j === resolvedColorBlockColumnIndex);
                      const subRowLabel = rowSubRows[i][subRowIndex].label;
                      const subRowColorClasses = getSubRowCellColorClasses(
                        row,
                        subRowLabel,
                        j,
                        val,
                        dataColumnIsVariance[j] || false,
                        invertVarianceColors,
                        disableVarianceColors,
                      );
                      return (
                    <div
                      className={`px-1 ${isLeftAligned ? 'text-left pl-4 text-black' : `text-center ${subRowColorClasses.textClass}`} ${subRowColorClasses.bgClass || (stripedRows ? '' : MATRIX_SUMMARY_BG_CLASS)} ${hasRightBorder ? 'border-r border-black/10' : ''}`}
                    >
                      <span className={getMatrixCellFontClass(j, boldColumnSet)}>
                        {isLeftAligned
                          ? regularFirstColumn
                            ? toDisplayValue(val, subRowColorClasses.isVarianceColumn)
                            : subRowLabel
                          : toDisplayValue(val, subRowColorClasses.isVarianceColumn)}
                      </span>
                    </div>
                      );
                    })()}
                    {j === resolvedColorBlockColumnIndex && hasColorBlocksColumn && (
                      <div className="flex items-center justify-center px-1 border-r border-black/10">
                        {subRowColorBlocks ? (
                          <span
                            className="inline-block h-3.5 w-3.5"
                            style={{ backgroundColor: subRowColors?.[subRowIndex] || CHART_COLOR_PALETTE[subRowIndex % CHART_COLOR_PALETTE.length] }}
                            title={`${rowSubRows[i][subRowIndex].label} color`}
                          />
                        ) : null}
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            ))}
          </Fragment>
          );
        })}
      </div>
      </div>
    );
  }
  // ── End grouped-column rendering ─────────────────────────────────────────
  const useMtdYtdVarianceTemplate = regularFirstColumn && isMtdYtdVarianceLayout(headerLabels);
  const mtdYtdVarianceTemplate = `minmax(78px, 1fr) minmax(108px, 1.35fr) ${PERCENT_SUB_COLUMN_WIDTH} ${PERCENT_SUB_COLUMN_WIDTH}`;
  const gridTemplateColumns = regularFirstColumn && useMtdYtdVarianceTemplate
    ? mtdYtdVarianceTemplate
    : buildFlatGridTemplate(headerLabels, columnCount, {
      regularFirstColumn,
      firstColumnWidth,
      showColorBlocks,
      colorBlockColumnIndex: resolvedColorBlockColumnIndex,
      columnWidths,
      columnWidthWeights,
      data: safeData,
      scaleColumns,
      wideColumns,
    });
  const hasAnySubRows = rowSubRows.some((subRows) => subRows?.length > 0);
  const dataColumnIsVariance = headerLabels.map((label) => isVarianceHeaderLabel(label));
  const useGroupMode = groupMode && !hasAnySubRows;
  const totalRowSet = new Set((totalRows ?? []).map((index) => Math.floor(Number(index) || 0)));
  const highlightColumnSet = new Set(
    (highlightColumns ?? []).map((index) => Math.max(0, Math.min(columnCount - 1, Math.floor(Number(index) || 0)))),
  );
  const groupRowMeta = useGroupMode ? buildGroupRowMeta(safeData, totalRowSet) : [];

  if (useGroupMode) {
    const useUniformSummaryStyle = !stripedRows && highlightColumnSet.size > 0;

    const getGroupSectionBackground = (groupIndex: number) => (
      useUniformSummaryStyle && groupIndex === 1 ? MATRIX_SUMMARY_BG_CLASS : 'bg-white'
    );

    const getUniformGroupCellBackground = (
      groupIndex: number,
      columnIndex: number,
      row: Array<number | string>,
      varianceBgClass: string,
    ) => {
      const isVarianceDataRow = isVarianceRowLabel(getGroupModeRowLabel(row));

      if (isVarianceDataRow && varianceBgClass && !highlightColumnSet.has(columnIndex)) {
        return varianceBgClass;
      }

      if (highlightColumnSet.has(columnIndex) || groupIndex === 1) {
        return MATRIX_SUMMARY_BG_CLASS;
      }

      return 'bg-white';
    };

    return (
      <div className={matrixContainerClassName}>
      <div className="w-full px-2 py-2 bg-white">
        <div
          className={`${scrollable ? 'sticky top-0 z-10' : ''} bg-white grid text-xs font-semibold text-black border-b border-medium-gray pb-1 mb-0 font-header`}
          style={{ gridTemplateColumns }}
        >
          {headerLabels.map((label, index) => (
            <div
              key={`header-cell-${index}`}
              className={`px-1 ${wrapColumnHeaders ? 'py-0.5' : ''} ${leftAlignedColumnSet.has(index) && !regularFirstColumn ? 'text-left' : 'text-center'} ${highlightColumnSet.has(index) ? MATRIX_SUMMARY_BG_CLASS : ''} ${index < headerLabels.length - 1 ? 'border-r border-black/10' : ''}`}
            >
              <MatrixHeaderLabel
                label={label}
                index={index}
                isLeftAligned={leftAlignedColumnSet.has(index) && !regularFirstColumn}
                wrapColumnHeaders={wrapColumnHeaders}
                onColumnLabelChange={onColumnLabelChange}
              />
            </div>
          ))}
        </div>
        <div
          className="grid text-xs font-body"
          style={{
            gridTemplateColumns,
            gridTemplateRows: `repeat(${safeData.length}, auto)`,
          }}
        >
          {safeData.map((row, rowIndex) => (
            row.map((val, columnIndex) => {
              const groupMeta = groupRowMeta[rowIndex];
              if (columnIndex === 0 && groupMeta.isContinuation) {
                return null;
              }

              const gridRow = rowIndex + 1;
              const gridColumn = columnIndex + 1;
              const isVarianceColumn = isVarianceMatrixCell(row, columnIndex, dataColumnIsVariance[columnIndex] || false, true);
              const isLeftAligned = leftAlignedColumnSet.has(columnIndex) && !regularFirstColumn;
              const hasRightBorder = columnIndex < row.length - 1;
              const rowBackground = useUniformSummaryStyle
                ? getGroupSectionBackground(groupMeta.groupIndex)
                : getGroupBackgroundClass(groupMeta.groupIndex);
              const cellVarianceBg = varianceBgClass(val, isVarianceColumn);
              const cellBackground = useUniformSummaryStyle
                ? getUniformGroupCellBackground(groupMeta.groupIndex, columnIndex, row, cellVarianceBg)
                : (cellVarianceBg || rowBackground);
              const cellFontClass = getMatrixCellFontClass(columnIndex, boldColumnSet, { isTotalRow: groupMeta.isTotalRow });

              if (columnIndex === 0 && groupMeta.isTotalRow) {
                return (
                  <div
                    key={`total-cell-${rowIndex}`}
                    style={{ gridRow, gridColumn }}
                    className={`px-1 py-1 ${rowBackground} border-r border-black/10 border-b border-medium-gray`}
                  />
                );
              }

              if (columnIndex === 0) {
                return (
                  <div
                    key={`group-cell-${rowIndex}`}
                    style={{ gridRow: `${gridRow} / span ${groupMeta.rowSpan}`, gridColumn }}
                    className={`flex items-center px-1 text-left ${rowBackground} border-r border-black/10 border-b border-medium-gray`}
                  >
                    <input
                      value={toDisplayValue(val, isVarianceColumn)}
                      onChange={(e) => onCellChange?.(rowIndex, columnIndex, e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`nodrag w-full bg-transparent border-0 p-0 m-0 font-medium ${varianceTextClass(val, isVarianceColumn)} focus:outline-none text-left pr-2`}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={`cell-${rowIndex}-${columnIndex}`}
                  style={{ gridRow, gridColumn }}
                  className={`px-1 py-1 ${isLeftAligned ? 'text-left' : 'text-center'} ${cellBackground} ${hasRightBorder ? 'border-r border-black/10' : ''} border-b border-medium-gray`}
                >
                  <input
                    value={toDisplayValue(val, isVarianceColumn)}
                    onChange={(e) => onCellChange?.(rowIndex, columnIndex, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`nodrag w-full bg-transparent border-0 p-0 m-0 ${cellFontClass} ${varianceTextClass(val, isVarianceColumn)} focus:outline-none ${isLeftAligned ? 'text-left pr-2' : 'text-center'}`}
                  />
                </div>
              );
            })
          ))}
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className={matrixContainerClassName}>
    <div className="w-full px-2 py-2 bg-white">
      <div className={`${scrollable ? 'sticky top-0 z-10' : ''} bg-white text-xs font-semibold text-black border-b border-medium-gray pb-1 mb-2 grid font-header ${wrapColumnHeaders ? 'items-start' : ''}`} style={{ gridTemplateColumns }}>
        {headerLabels.map((label, index) => (
          <div key={`header-cell-${index}`} className="contents">
            {index === resolvedColorBlockColumnIndex + 1 && showColorBlocks && !regularFirstColumn && (
              <div className="px-1" />
            )}
            <div className={`px-1 ${wrapColumnHeaders ? 'py-0.5' : ''} ${leftAlignedColumnSet.has(index) && !regularFirstColumn ? 'text-left' : 'text-center'} ${highlightColumnSet.has(index) ? MATRIX_SUMMARY_BG_CLASS : ''} ${index < headerLabels.length - 1 || (showColorBlocks && !regularFirstColumn && index === resolvedColorBlockColumnIndex) ? 'border-r border-black/10' : ''}`}>
              <MatrixHeaderLabel
                label={label}
                index={index}
                isLeftAligned={leftAlignedColumnSet.has(index) && !regularFirstColumn}
                wrapColumnHeaders={wrapColumnHeaders}
                onColumnLabelChange={onColumnLabelChange}
              />
            </div>
          </div>
        ))}
        {showColorBlocks && regularFirstColumn && (
          <div className="px-1 text-center uppercase tracking-wide text-[10px] text-gray-500">Color</div>
        )}
        {showColorBlocks && columnCount === 1 && (
          <div className="px-1 text-center uppercase tracking-wide text-[10px] text-gray-500">Color</div>
        )}
      </div>
      {safeData.map((row, i) => {
        const isTotalRow = totalRowSet.has(i);

        return (
        <Fragment key={i}>
          <div className={`grid text-xs py-1 border-b border-medium-gray font-body ${getStripedRowBackgroundClass(i, stripedRows)}`} style={{ gridTemplateColumns }}>
            {row.map((val, j) => {
              const isVarianceCell = isVarianceMatrixCell(row, j, dataColumnIsVariance[j] || false);
              const cellBackgroundClass = getMatrixDataCellBackgroundClass(j, {
                isTotalRow,
                highlightColumnSet,
                stripedRows,
                varianceBgClass: varianceBgClass(val, isVarianceCell),
              });

              return (
              <div key={`row-${i}-cell-${j}`} className="contents">
                <div className={`px-1 ${leftAlignedColumnSet.has(j) && !regularFirstColumn ? 'text-left' : 'text-center'} ${cellBackgroundClass} ${j < row.length - 1 || (showColorBlocks && !regularFirstColumn && j === resolvedColorBlockColumnIndex) ? 'border-r border-black/10' : ''}`}>
                  <input
                    value={toDisplayValue(val, isVarianceCell)}
                    onChange={(e) => onCellChange?.(i, j, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`nodrag w-full bg-transparent border-0 p-0 m-0 ${getMatrixCellFontClass(j, boldColumnSet, { isTotalRow })} ${varianceTextClass(val, isVarianceCell)} focus:outline-none ${leftAlignedColumnSet.has(j) && !regularFirstColumn ? 'text-left pr-2' : 'text-center'}`}
                  />
                </div>
                {j === resolvedColorBlockColumnIndex && showColorBlocks && !regularFirstColumn && (
                  <div className="flex items-center justify-center px-1">
                    {!isTotalRow && (
                      <span
                        className="inline-block h-3.5 w-3.5"
                        style={{ backgroundColor: rowColors?.[i] || CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length] }}
                        title={`Row ${i + 1} color`}
                      />
                    )}
                  </div>
                )}
              </div>
              );
            })}
            {showColorBlocks && regularFirstColumn && (
              <div className="flex items-center justify-center px-1">
                {!isTotalRow && (
                  <span
                    className="inline-block h-3.5 w-3.5"
                    style={{ backgroundColor: rowColors?.[i] || CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length] }}
                    title={`Row ${i + 1} color`}
                  />
                )}
              </div>
            )}
          </div>
          {resolveSubRowValues(i, row, rowSubRows[i] || [], headerLabels, subRowData).map((subRowValues, subRowIndex) => (
            <div
              key={`row-${i}-subrow-${subRowIndex}`}
              className="grid text-xs py-[1px] border-b border-medium-gray font-body bg-[#f7f5f5]"
              style={{ gridTemplateColumns }}
            >
              {subRowValues.map((val, j) => {
                const subRowLabel = rowSubRows[i][subRowIndex].label;
                const subRowColorClasses = getSubRowCellColorClasses(
                  row,
                  subRowLabel,
                  j,
                  val,
                  dataColumnIsVariance[j] || false,
                  invertVarianceColors,
                  disableVarianceColors,
                );

                return (
                <div key={`row-${i}-subrow-${subRowIndex}-cell-${j}`} className="contents">
                  <div className={`px-1 ${leftAlignedColumnSet.has(j) && !regularFirstColumn ? 'text-left pl-4 text-black' : `text-center ${subRowColorClasses.textClass}`} ${subRowColorClasses.bgClass} ${j < subRowValues.length - 1 || (showColorBlocks && !regularFirstColumn && j === resolvedColorBlockColumnIndex) ? 'border-r border-black/10' : ''}`}>
                    <span className={getMatrixCellFontClass(j, boldColumnSet)}>
                      {leftAlignedColumnSet.has(j) && !regularFirstColumn
                        ? regularFirstColumn
                          ? toDisplayValue(val, subRowColorClasses.isVarianceColumn)
                          : rowSubRows[i][subRowIndex].label
                        : toDisplayValue(val, subRowColorClasses.isVarianceColumn)}
                    </span>
                  </div>
                  {j === resolvedColorBlockColumnIndex && showColorBlocks && !regularFirstColumn && (
                    <div className="flex items-center justify-center px-1">
                      {subRowColorBlocks ? (
                        <span
                          className="inline-block h-3.5 w-3.5"
                          style={{ backgroundColor: subRowColors?.[subRowIndex] || CHART_COLOR_PALETTE[subRowIndex % CHART_COLOR_PALETTE.length] }}
                          title={`${rowSubRows[i][subRowIndex].label} color`}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          ))}
        </Fragment>
        );
      })}
    </div>
    </div>
  );
};

export default MatrixVisual;
