import { Handle, Position, NodeResizer, useNodeId, useReactFlow } from 'reactflow';
import { useEffect, useState } from 'react';
import {
  PowerBINodeProps,
  DEFAULT_MATRIX_FIRST_COLUMN_WIDTH,
  defaultBarData,
  defaultLineData,
  defaultThirdAxisData,
  getDefaultMatrixColumns,
  getDefaultXAxisLabels,
  normalizeSeriesLength,
  CHART_COLOR_PALETTE,
  stopLeftMousePropagation,
} from './nodeUtils';
import BarChartVisual from './visuals/BarChartVisual';
import PieChartVisual from './visuals/PieChartVisual';
import GaugeVisual from './visuals/GaugeVisual';
import CardVisual from './visuals/CardVisual';
import LineChartVisual from './visuals/LineChartVisual';
import StackedAreaChartVisual from './visuals/StackedAreaChartVisual';
import ExpectedVsRealityChartVisual from './visuals/ExpectedVsRealityChartVisual';
import MatrixVisual from './visuals/MatrixVisual';
import MapVisual from './visuals/MapVisual';
import SlicerVisual from './visuals/SlicerVisual';
import FieldChooserVisual from './visuals/FieldChooserVisual';

const getDefaultPieLabels = (length: number) => Array.from({ length: Math.max(length, 1) }, (_, index) => `Slice ${index + 1}`);
const clampPieScalePercent = (value: number) => Math.min(200, Math.max(100, Math.round(value)));
const normalizePieLabels = (labels: string[] | undefined, length: number) => {
  const fallback = getDefaultPieLabels(length);
  return Array.from({ length }, (_, index) => labels?.[index]?.trim() || fallback[index]);
};
const normalizeDollarVariance = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('-')) return trimmed;
  return /^[+-]/.test(trimmed) ? trimmed : `+${trimmed}`;
};

const normalizePercentVariance = (value: string) => value.replace(/[^0-9.-]/g, '');

const getSafePieValues = (values: number[] | undefined) => {
  const fallback = [45, 30, 25];
  const source = values?.length ? values : fallback;
  return source.map((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });
};
const defaultStackedSeriesData = [
  [45, 48, 46, 50, 52, 55],
  [20, 21, 22, 23, 24, 25],
  [18, 19, 18, 20, 21, 22],
  [12, 13, 14, 14, 15, 16],
  [8, 9, 10, 11, 12, 13],
];
const defaultStackedSeriesLabels = ['Website', 'Call Center', 'Stores', 'Amazon', 'Direct'];
const defaultStackedSeriesColors = CHART_COLOR_PALETTE.slice(0, 5);

const getSafeStackedSeriesData = (seriesData: number[][] | undefined) => {
  const source = seriesData?.length ? seriesData : defaultStackedSeriesData;
  const safeSeries = source.map((series) => series.map((value) => {
    const rounded = Math.round(Number(value));
    return Number.isFinite(rounded) && rounded >= 0 ? rounded : 0;
  }));
  const longestSeriesLength = Math.max(...safeSeries.map((series) => series.length), 2);
  return safeSeries.map((series) => normalizeSeriesLength(series, longestSeriesLength, 0));
};

const normalizeStackedXAxisLabels = (labels: string[] | undefined, length: number) => {
  const fallback = getDefaultXAxisLabels(length);
  return Array.from({ length }, (_, index) => {
    if (labels && index < labels.length) return labels[index]?.trim() ?? '';
    return fallback[index];
  });
};
const getSafeStackedYAxisLabelOffset = (value: number | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
};
const clampPieOffset = (value: number | undefined) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(-100, Math.round(parsed)));
};

function PowerBINode({ data, selected, matrixScrollable = false }: PowerBINodeProps & { matrixScrollable?: boolean }) {
  const nodeId = useNodeId();
  const { setNodes } = useReactFlow();
  const [title, setTitle] = useState(data.label);
  const [axisTitles, setAxisTitles] = useState(data.axisLabels || { x: 'X Axis', y: 'Y Axis', third: 'Third Axis' });
  const [xAxisLabels, setXAxisLabels] = useState<string[]>(
    data.xAxisLabels || getDefaultXAxisLabels((data.chartData || defaultBarData).length)
  );
  const [tableColumnLabels, setTableColumnLabels] = useState<string[]>(data.columnLabels || []);
  const [matrixFirstColumnWidth, setMatrixFirstColumnWidth] = useState<number>(
    data.matrixFirstColumnWidth || DEFAULT_MATRIX_FIRST_COLUMN_WIDTH,
  );
  const [matrixFirstColumnWidthInput, setMatrixFirstColumnWidthInput] = useState<string>(
    String(data.matrixFirstColumnWidth || DEFAULT_MATRIX_FIRST_COLUMN_WIDTH),
  );
  const [matrixShowColorBlocks, setMatrixShowColorBlocks] = useState<boolean>(Boolean(data.matrixShowColorBlocks));
  const [matrixRegularFirstColumn, setMatrixRegularFirstColumn] = useState<boolean>(Boolean(data.matrixRegularFirstColumn));
  const [matrixGroupMode, setMatrixGroupMode] = useState<boolean>(Boolean(data.matrixGroupMode));
  const [matrixStripedRows, setMatrixStripedRows] = useState<boolean>(data.matrixStripedRows !== false);
  const [gaugeValue, setGaugeValue] = useState<number>(Number(data.value) || 0);
  const [cardValueText, setCardValueText] = useState<string>(String(data.value ?? '42,500'));
  const [cardWowPct, setCardWowPct] = useState<string>(data.wowPct?.percentage || '0.16%');
  const [cardWowDollarValue, setCardWowDollarValue] = useState<string>(data.wowPct?.dollarValue || '');
  const [cardYtdPriorYear, setCardYtdPriorYear] = useState<string>(data.ytdPriorYear || '39,800');
  const [cardSecondaryPriorValue, setCardSecondaryPriorValue] = useState<string>(data.cardSecondaryPriorValue || '');
  const [cardVariancePct, setCardVariancePct] = useState<string>(data.variancePct?.percentage || '6.8%');
  const [cardVarianceDollarValue, setCardVarianceDollarValue] = useState<string>(data.variancePct?.flatValue || data.variancePct?.dollarValue || '');
  const [cardBudgetVarianceDollar, setCardBudgetVarianceDollar] = useState<string>(data.budgetVariance?.dollarValue || '');
  const [cardBudgetVariancePct, setCardBudgetVariancePct] = useState<string>(data.budgetVariance?.percentage || '');
  const [cardPriorVarianceDollar, setCardPriorVarianceDollar] = useState<string>(data.priorVariance?.dollarValue || '');
  const [cardPriorVariancePct, setCardPriorVariancePct] = useState<string>(data.priorVariance?.percentage || '');
  const [barData, setBarData] = useState<number[]>(data.chartData || defaultBarData);
  const [thirdAxisEnabled, setThirdAxisEnabled] = useState(Boolean(data.thirdAxisEnabled));
  const [thirdAxisData, setThirdAxisData] = useState<number[]>(normalizeSeriesLength(data.thirdAxisData || defaultThirdAxisData, (data.chartData || defaultBarData).length, 0));
  const [lineData, setLineData] = useState<number[]>(data.chartData || defaultLineData);
  const [pieValues, setPieValues] = useState<number[]>(getSafePieValues(data.chartData));
  const [pieLabels, setPieLabels] = useState<string[]>(normalizePieLabels(data.pieLabels, getSafePieValues(data.chartData).length));
  const [pieScalePercent, setPieScalePercent] = useState<number>(clampPieScalePercent(Number(data.pieScalePercent) || 100));
  const [pieShowCalloutLabels, setPieShowCalloutLabels] = useState<boolean>(Boolean(data.pieShowCalloutLabels));
  const [pieOffsetX, setPieOffsetX] = useState<number>(clampPieOffset(data.pieOffsetX));
  const [pieOffsetY, setPieOffsetY] = useState<number>(clampPieOffset(data.pieOffsetY));
  const [pieOffsetXInput, setPieOffsetXInput] = useState<string>(String(clampPieOffset(data.pieOffsetX)));
  const [pieOffsetYInput, setPieOffsetYInput] = useState<string>(String(clampPieOffset(data.pieOffsetY)));
  const [stackedSeriesData, setStackedSeriesData] = useState<number[][]>(getSafeStackedSeriesData(data.seriesData));
  const [stackedXAxisLabels, setStackedXAxisLabels] = useState<string[]>(
    normalizeStackedXAxisLabels(data.xAxisLabels, getSafeStackedSeriesData(data.seriesData)[0]?.length || 2)
  );
  const [stackedYAxisLabelOffset, setStackedYAxisLabelOffset] = useState<number>(
    getSafeStackedYAxisLabelOffset(data.stackedYAxisLabelOffset)
  );
  const [stackedYAxisLabelOffsetInput, setStackedYAxisLabelOffsetInput] = useState<string>(
    String(getSafeStackedYAxisLabelOffset(data.stackedYAxisLabelOffset))
  );
  const [axisValueText, setAxisValueText] = useState('');
  const [xAxisValueText, setXAxisValueText] = useState('');
  const [thirdAxisValueText, setThirdAxisValueText] = useState('');
  const [isEditingXAxisValues, setIsEditingXAxisValues] = useState(false);
  const [isEditingAxisValues, setIsEditingAxisValues] = useState(false);
  const [isEditingThirdAxisValues, setIsEditingThirdAxisValues] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hideHeader, setHideHeader] = useState(Boolean(data.hideHeader));
  const [lineCleanView, setLineCleanView] = useState(Boolean(data.lineCleanView));
  const isPreview = data.isPreview || false;

  const hasEditablePanel = data.componentType === 'matrix'
    || data.componentType === 'bar'
    || data.componentType === 'line'
    || data.componentType === 'stackedArea'
    || data.componentType === 'expectedReality'
    || data.componentType === 'pie';
  const stackedLegendBudgetColor = data.stackedBudgetLineColor || '#111111';
  const stackedLegendPyColor = data.stackedPyLineColor || '#111111';

  const updateNodeData = (nextValues: Partial<PowerBINodeProps['data']>) => {
    if (!nodeId) { Object.assign(data, nextValues); return; }
    setNodes((nodes) => nodes.map((node) => node.id !== nodeId ? node : { ...node, data: { ...node.data, ...nextValues } }));
    Object.assign(data, nextValues);
  };

  const handleNodeClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview || !nodeId || event.button !== 0) return;
    const isMultiSelect = event.shiftKey || event.ctrlKey || event.metaKey;
    setNodes((nodes) => nodes.map((node) => node.id === nodeId ? { ...node, selected: true } : isMultiSelect ? node : node.selected ? { ...node, selected: false } : node));
  };

  useEffect(() => { setTitle(data.label); }, [data.label]);
  useEffect(() => {
    const columnCount = Math.max(data.matrixData?.[0]?.length || 0, 1);
    if (data.componentType === 'matrix') {
      const nextMatrixLabels = data.columnLabels?.length === columnCount ? data.columnLabels : getDefaultMatrixColumns(columnCount);
      setTableColumnLabels(nextMatrixLabels); data.columnLabels = nextMatrixLabels;
    } else { setTableColumnLabels(data.columnLabels || []); }
  }, [data.matrixData, data.columnLabels, data.componentType]);
  useEffect(() => {
    if (data.componentType !== 'matrix') return;
    const nextWidth = Number(data.matrixFirstColumnWidth) || DEFAULT_MATRIX_FIRST_COLUMN_WIDTH;
    setMatrixFirstColumnWidth(nextWidth);
    setMatrixFirstColumnWidthInput(String(nextWidth));
  }, [data.matrixFirstColumnWidth, data.componentType]);
  useEffect(() => {
    if (data.componentType !== 'matrix') return;
    setMatrixShowColorBlocks(Boolean(data.matrixShowColorBlocks));
  }, [data.matrixShowColorBlocks, data.componentType]);
  useEffect(() => {
    if (data.componentType !== 'matrix') return;
    setMatrixRegularFirstColumn(Boolean(data.matrixRegularFirstColumn));
  }, [data.matrixRegularFirstColumn, data.componentType]);
  useEffect(() => {
    if (data.componentType !== 'matrix') return;
    setMatrixGroupMode(Boolean(data.matrixGroupMode));
  }, [data.matrixGroupMode, data.componentType]);
  useEffect(() => {
    if (data.componentType !== 'matrix') return;
    setMatrixStripedRows(data.matrixStripedRows !== false);
  }, [data.matrixStripedRows, data.componentType]);
  useEffect(() => {
    setBarData(data.chartData || defaultBarData);
    setLineData(data.chartData || defaultLineData);

    const nextPieValues = getSafePieValues(data.chartData);
    setPieValues(nextPieValues);
    setPieLabels(normalizePieLabels(data.pieLabels, nextPieValues.length));
  }, [data.chartData, data.componentType, data.pieLabels]);
  useEffect(() => {
    setPieScalePercent(clampPieScalePercent(Number(data.pieScalePercent) || 100));
  }, [data.pieScalePercent]);
  useEffect(() => {
    if (data.componentType !== 'pie') return;
    setPieShowCalloutLabels(Boolean(data.pieShowCalloutLabels));
  }, [data.pieShowCalloutLabels, data.componentType]);
  useEffect(() => {
    if (data.componentType !== 'pie') return;
    const nextOffsetX = clampPieOffset(data.pieOffsetX);
    const nextOffsetY = clampPieOffset(data.pieOffsetY);
    setPieOffsetX(nextOffsetX);
    setPieOffsetY(nextOffsetY);
    setPieOffsetXInput(String(nextOffsetX));
    setPieOffsetYInput(String(nextOffsetY));
  }, [data.componentType, data.pieOffsetX, data.pieOffsetY]);
  useEffect(() => {
    const nextChartData = data.chartData || defaultBarData;
    setThirdAxisEnabled(Boolean(data.thirdAxisEnabled));
    setThirdAxisData(normalizeSeriesLength(data.thirdAxisData || defaultThirdAxisData, nextChartData.length, 0));
  }, [data.thirdAxisEnabled, data.thirdAxisData, data.chartData]);
  useEffect(() => {
    if (data.componentType !== 'stackedArea') return;
    const nextSeriesData = getSafeStackedSeriesData(data.seriesData);
    setStackedSeriesData(nextSeriesData);
    setStackedXAxisLabels(normalizeStackedXAxisLabels(data.xAxisLabels, nextSeriesData[0]?.length || 2));
  }, [data.componentType, data.seriesData, data.xAxisLabels]);
  useEffect(() => {
    if (data.componentType !== 'stackedArea') return;
    const nextOffset = getSafeStackedYAxisLabelOffset(data.stackedYAxisLabelOffset);
    setStackedYAxisLabelOffset(nextOffset);
    setStackedYAxisLabelOffsetInput(String(nextOffset));
  }, [data.componentType, data.stackedYAxisLabelOffset]);
  useEffect(() => {
    if (data.componentType === 'card') { setCardValueText(String(data.value ?? '42,500')); return; }
    setGaugeValue(Number(data.value) || 0);
  }, [data.value, data.componentType]);
  useEffect(() => { setCardYtdPriorYear(data.ytdPriorYear || '39,800'); }, [data.ytdPriorYear]);
  useEffect(() => { setCardSecondaryPriorValue(data.cardSecondaryPriorValue || ''); }, [data.cardSecondaryPriorValue]);
  useEffect(() => { setCardWowPct(data.wowPct?.percentage || '0.16%'); setCardWowDollarValue(data.wowPct?.dollarValue || '');
    setCardVariancePct(data.variancePct?.percentage || '6.8%');
    setCardVarianceDollarValue(data.variancePct?.flatValue || data.variancePct?.dollarValue || '');
  }, [data.wowPct, data.variancePct]);
  useEffect(() => {
    setCardBudgetVarianceDollar(data.budgetVariance?.dollarValue || '');
    setCardBudgetVariancePct(data.budgetVariance?.percentage || '');
    setCardPriorVarianceDollar(data.priorVariance?.dollarValue || '');
    setCardPriorVariancePct(data.priorVariance?.percentage || '');
  }, [data.budgetVariance, data.priorVariance]);
  useEffect(() => { setHideHeader(Boolean(data.hideHeader)); }, [data.hideHeader]);
  useEffect(() => { setLineCleanView(Boolean(data.lineCleanView)); }, [data.lineCleanView]);
  useEffect(() => {
    setAxisTitles(data.axisLabels || { x: 'X Axis', y: 'Y Axis', third: 'Third Axis' }); setXAxisLabels(data.xAxisLabels || getDefaultXAxisLabels((data.chartData || defaultBarData).length));
  }, [data.axisLabels, data.xAxisLabels, data.chartData]);
  useEffect(() => {
    const activeData = data.componentType === 'line' ? lineData : barData;
    if (!isEditingAxisValues) setAxisValueText(activeData.join(', '));
    if (!isEditingXAxisValues) setXAxisValueText(xAxisLabels.join(', '));
    if (!isEditingThirdAxisValues) setThirdAxisValueText(thirdAxisData.join(', '));
  }, [data.componentType, barData, lineData, xAxisLabels, thirdAxisData, isEditingAxisValues, isEditingXAxisValues, isEditingThirdAxisValues]);

  const commitHeaderEdits = () => { data.label = title.trim(); };
  const updateTitle = (value: string) => { setTitle(value); data.label = value; };
  const updateCardKpis = (field: 'ytdPriorYear' | 'cardSecondaryPriorValue' | 'variancePct' | 'varianceFlatValue' | 'budgetVarianceDollar' | 'budgetVariancePct' | 'priorVarianceDollar' | 'priorVariancePct', value: string) => {
    if (field === 'ytdPriorYear') {
      setCardYtdPriorYear(value);
      data[field] = value;
    } else if (field === 'cardSecondaryPriorValue') {
      setCardSecondaryPriorValue(value);
      data.cardSecondaryPriorValue = value;
    } else if (field === 'variancePct') {
      const normalized = normalizePercentVariance(value);
      setCardVariancePct(normalized);
      data[field] = { ...data[field], percentage: normalized };
    } else if (field === 'varianceFlatValue') {
      const trimmed = value.trim();
      if (!trimmed) {
        setCardVarianceDollarValue('');
        data.variancePct = { percentage: data.variancePct?.percentage || cardVariancePct || '0', dollarValue: '', flatValue: '' };
        return;
      }
      const normalized = normalizeDollarVariance(trimmed);
      setCardVarianceDollarValue(normalized);
      data.variancePct = {
        percentage: data.variancePct?.percentage || cardVariancePct || '0',
        dollarValue: normalized,
        flatValue: normalized,
      };
    } else if (field === 'budgetVarianceDollar') {
      const normalized = normalizeDollarVariance(value);
      setCardBudgetVarianceDollar(normalized);
      data.budgetVariance = {
        dollarValue: normalized,
        percentage: data.budgetVariance?.percentage || cardBudgetVariancePct || '',
      };
    } else if (field === 'budgetVariancePct') {
      const normalized = normalizePercentVariance(value);
      setCardBudgetVariancePct(normalized);
      data.budgetVariance = {
        dollarValue: data.budgetVariance?.dollarValue || cardBudgetVarianceDollar || '',
        percentage: normalized,
      };
    } else if (field === 'priorVarianceDollar') {
      const normalized = normalizeDollarVariance(value);
      setCardPriorVarianceDollar(normalized);
      data.priorVariance = {
        dollarValue: normalized,
        percentage: data.priorVariance?.percentage || cardPriorVariancePct || '',
      };
    } else if (field === 'priorVariancePct') {
      const normalized = normalizePercentVariance(value);
      setCardPriorVariancePct(normalized);
      data.priorVariance = {
        dollarValue: data.priorVariance?.dollarValue || cardPriorVarianceDollar || '',
        percentage: normalized,
      };
    }
  };
  const updateAxisTitle = (axis: 'x' | 'y' | 'third', value: string) => setAxisTitles((current) => { const next = { ...current, [axis]: value }; updateNodeData({ axisLabels: next }); return next; });
  const updateGaugeValue = (value: number) => { setGaugeValue(value); data.value = value; };
  const updateCardValue = (value: string) => { setCardValueText(value); data.value = value; };
  const setHeaderVisibility = (isHidden: boolean) => { setHideHeader(isHidden); data.hideHeader = isHidden; };
  const toggleLineCleanView = () => { const next = !lineCleanView; setLineCleanView(next); updateNodeData({ lineCleanView: next }); };
  const toggleBarThirdAxis = () => {
    const nextEnabled = !thirdAxisEnabled;
    const nextData = normalizeSeriesLength(thirdAxisData.length ? thirdAxisData : defaultThirdAxisData, barData.length, barData.length ? barData[barData.length - 1] : 0);
    setThirdAxisEnabled(nextEnabled);
    setThirdAxisData(nextData);
    updateNodeData({
      thirdAxisEnabled: nextEnabled,
      thirdAxisData: nextData,
      axisLabels: { ...axisTitles, third: axisTitles.third || 'Third Axis' },
    });
  };

  const updateMatrixCell = (rowIndex: number, columnIndex: number, value: string) => {
    const currentData = data.matrixData || [], next = currentData.map((row) => [...row]);
    if (!next[rowIndex]) return;
    next[rowIndex][columnIndex] = value; data.matrixData = next;
  };
  const updateMatrixColumnLabel = (columnIndex: number, value: string) => setTableColumnLabels((current) => { const next = [...current]; next[columnIndex] = value; data.columnLabels = next; return next; });
  const addMatrixColumn = () => {
    const currentRows = data.matrixData || [], nextRows = currentRows.length ? currentRows.map((row) => [...row, '']) : [['', '']];
    const nextLabels = getDefaultMatrixColumns(nextRows[0]?.length || 1).map((label, index) => tableColumnLabels[index] || label);
    setTableColumnLabels(nextLabels); data.matrixData = nextRows; data.columnLabels = nextLabels;
  };
  const addMatrixRow = () => {
    const currentRows = data.matrixData || [], columnCount = Math.max(currentRows[0]?.length || 0, 2);
    data.matrixData = [...currentRows, Array.from({ length: columnCount }, () => '')];
  };
  const removeMatrixColumn = () => {
    const currentRows = data.matrixData || [], currentColumnCount = currentRows[0]?.length || 0;
    if (currentColumnCount <= 1) return;
    const nextRows = currentRows.map((row) => row.slice(0, currentColumnCount - 1)), nextLabels = tableColumnLabels.slice(0, currentColumnCount - 1);
    setTableColumnLabels(nextLabels); data.matrixData = nextRows; data.columnLabels = nextLabels;
  };
  const removeMatrixRow = () => {
    const currentRows = data.matrixData || [];
    if (currentRows.length <= 1) return;
    data.matrixData = currentRows.slice(0, -1);
  };
  const commitMatrixFirstColumnWidth = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setMatrixFirstColumnWidthInput(String(matrixFirstColumnWidth));
      return;
    }

    const clampedWidth = Math.min(320, Math.max(80, Math.round(parsed)));
    setMatrixFirstColumnWidth(clampedWidth);
    setMatrixFirstColumnWidthInput(String(clampedWidth));
    updateNodeData({ matrixFirstColumnWidth: clampedWidth });
  };
  const toggleMatrixColorBlocks = () => {
    const nextValue = !matrixShowColorBlocks;
    setMatrixShowColorBlocks(nextValue);
    updateNodeData({ matrixShowColorBlocks: nextValue });
  };
  const toggleMatrixRegularFirstColumn = () => {
    const nextValue = !matrixRegularFirstColumn;
    setMatrixRegularFirstColumn(nextValue);
    updateNodeData({ matrixRegularFirstColumn: nextValue });
  };
  const toggleMatrixGroupMode = () => {
    const nextValue = !matrixGroupMode;
    setMatrixGroupMode(nextValue);
    updateNodeData({ matrixGroupMode: nextValue });
  };
  const toggleMatrixStripedRows = () => {
    const nextValue = !matrixStripedRows;
    setMatrixStripedRows(nextValue);
    updateNodeData({ matrixStripedRows: nextValue });
  };

  const updatePieScalePercent = (value: number | string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const nextScale = clampPieScalePercent(parsed);
    setPieScalePercent(nextScale);
    updateNodeData({ pieScalePercent: nextScale });
  };
  const togglePieShowCalloutLabels = () => {
    const nextValue = !pieShowCalloutLabels;
    setPieShowCalloutLabels(nextValue);
    updateNodeData({ pieShowCalloutLabels: nextValue });
  };
  const commitPieOffset = (axis: 'x' | 'y', value: string) => {
    const parsed = Number(value);
    const currentOffsetX = pieOffsetX;
    const currentOffsetY = pieOffsetY;

    if (!Number.isFinite(parsed)) {
      setPieOffsetXInput(String(currentOffsetX));
      setPieOffsetYInput(String(currentOffsetY));
      return;
    }

    const clampedOffset = clampPieOffset(parsed);
    if (axis === 'x') {
      setPieOffsetX(clampedOffset);
      setPieOffsetXInput(String(clampedOffset));
      updateNodeData({ pieOffsetX: clampedOffset });
      return;
    }

    setPieOffsetY(clampedOffset);
    setPieOffsetYInput(String(clampedOffset));
    updateNodeData({ pieOffsetY: clampedOffset });
  };
  const addStackedAreaPoint = () => {
    const nextSeriesData = stackedSeriesData.map((series) => {
      const nextValue = series.length ? series[series.length - 1] : 0;
      return [...series, nextValue];
    });
    const nextLabels = [...stackedXAxisLabels, `${stackedXAxisLabels.length + 1}`];
    setStackedSeriesData(nextSeriesData);
    setStackedXAxisLabels(nextLabels);
    updateNodeData({
      seriesData: nextSeriesData,
      seriesLabels: data.seriesLabels || defaultStackedSeriesLabels,
      seriesColors: data.seriesColors || defaultStackedSeriesColors,
      xAxisLabels: nextLabels,
      axisLabels: { x: axisTitles.x || 'Time Period', y: axisTitles.y || 'Revenue', third: axisTitles.third },
    });
  };
  const removeStackedAreaPoint = () => {
    const pointCount = stackedSeriesData[0]?.length || 0;
    if (pointCount <= 2) return;
    const nextSeriesData = stackedSeriesData.map((series) => series.slice(0, -1));
    const nextLabels = stackedXAxisLabels.slice(0, -1);
    setStackedSeriesData(nextSeriesData);
    setStackedXAxisLabels(nextLabels);
    updateNodeData({
      seriesData: nextSeriesData,
      seriesLabels: data.seriesLabels || defaultStackedSeriesLabels,
      seriesColors: data.seriesColors || defaultStackedSeriesColors,
      xAxisLabels: nextLabels,
      axisLabels: { x: axisTitles.x || 'Time Period', y: axisTitles.y || 'Revenue', third: axisTitles.third },
    });
  };
  const commitStackedYAxisLabelOffset = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setStackedYAxisLabelOffsetInput(String(stackedYAxisLabelOffset));
      return;
    }

    const clampedOffset = Math.min(240, Math.max(-240, Math.round(parsed)));
    setStackedYAxisLabelOffset(clampedOffset);
    setStackedYAxisLabelOffsetInput(String(clampedOffset));
    updateNodeData({ stackedYAxisLabelOffset: clampedOffset });
  };
  const commitAxisValues = () => {
    const parsed = axisValueText.split(',').map((value) => Number(value.trim())).filter((value) => Number.isFinite(value) && value >= 0).map((value) => Math.round(value));
    if (!parsed.length) return;
    const labels = xAxisLabels.length === parsed.length ? xAxisLabels : getDefaultXAxisLabels(parsed.length);
    setXAxisLabels(labels);
    if (data.componentType === 'line') { setLineData(parsed); updateNodeData({ chartData: parsed, xAxisLabels: labels }); }
    else {
      const nextThirdAxisData = normalizeSeriesLength(thirdAxisData, parsed.length, parsed[parsed.length - 1] || 0);
      setBarData(parsed);
      setThirdAxisData(nextThirdAxisData);
      updateNodeData({ chartData: parsed, xAxisLabels: labels, thirdAxisData: nextThirdAxisData });
    }
  };
  const commitXAxisValues = () => {
    const parsed = xAxisValueText.split(',').map((value) => value.trim()).filter((value) => value.length > 0);
    if (!parsed.length) return;
    const activeData = data.componentType === 'line' ? lineData : barData;
    let nextChartData = activeData;
    if (activeData.length > parsed.length) nextChartData = activeData.slice(0, parsed.length);
    else if (activeData.length < parsed.length) {
      const padValue = activeData.length ? activeData[activeData.length - 1] : 0;
      nextChartData = [...activeData, ...Array.from({ length: parsed.length - activeData.length }, () => padValue)];
    }
    if (data.componentType === 'line') { setLineData(nextChartData); updateNodeData({ xAxisLabels: parsed, chartData: nextChartData }); }
    else {
      const nextThirdAxisData = normalizeSeriesLength(thirdAxisData, nextChartData.length, nextChartData[nextChartData.length - 1] || 0);
      setBarData(nextChartData);
      setThirdAxisData(nextThirdAxisData);
      updateNodeData({ xAxisLabels: parsed, chartData: nextChartData, thirdAxisData: nextThirdAxisData });
    }
    setAxisValueText(nextChartData.join(', ')); setXAxisValueText(parsed.join(', ')); setXAxisLabels(parsed);
  };
  const commitThirdAxisValues = () => {
    const parsed = thirdAxisValueText.split(',').map((value) => Number(value.trim())).filter((value) => Number.isFinite(value) && value >= 0).map((value) => Math.round(value));
    if (!parsed.length) return;
    const normalized = normalizeSeriesLength(parsed, barData.length, barData.length ? barData[barData.length - 1] : 0);
    setThirdAxisData(normalized);
    updateNodeData({ thirdAxisData: normalized, thirdAxisEnabled: true });
  };
  const handleEnterCommit = (event: React.KeyboardEvent<HTMLInputElement>, commit: () => void) => {
    if (event.key !== 'Enter') return;
    event.preventDefault(); commit(); event.currentTarget.blur();
  };

  const renderChart = () => {
    switch (data.componentType) {
      case 'bar':
        return (
          <BarChartVisual
            data={barData}
            axisLabels={axisTitles}
            xLabels={xAxisLabels}
            thirdAxisEnabled={thirdAxisEnabled}
            thirdAxisData={thirdAxisData}
            dataLabelFormat={data.barDataLabelFormat}
            xAxisLabelRotation={data.xAxisLabelRotation}
          />
        );
      case 'line':
        return (
          <LineChartVisual
            data={lineData}
            seriesData={data.seriesData}
            seriesLabels={data.seriesLabels}
            seriesColors={data.seriesColors}
            seriesDashed={data.seriesDashed}
            axisLabels={axisTitles}
            xLabels={xAxisLabels}
            hideAxesAndBackground={lineCleanView}
            dataLabelFormat={data.lineDataLabelFormat}
          />
        );
      case 'stackedArea':
        return (
          <StackedAreaChartVisual
            seriesData={stackedSeriesData}
            seriesLabels={data.seriesLabels || defaultStackedSeriesLabels}
            seriesColors={data.seriesColors || defaultStackedSeriesColors}
            axisLabels={axisTitles}
            xLabels={stackedXAxisLabels}
            budgetLineColor={data.stackedBudgetLineColor}
            pyLineColor={data.stackedPyLineColor}
            stackedYAxisLabelOffset={stackedYAxisLabelOffset}
          />
        );
      case 'expectedReality':
        return (
          <ExpectedVsRealityChartVisual
            axisLabels={axisTitles}
            pointLabelFormat={data.expectedRealityPointLabelFormat}
            labels={data.xAxisLabels}
            displayLabelIndices={data.xAxisDisplayLabelIndices}
            expectedValues={data.expectedRealityData?.expected}
            realityValues={data.expectedRealityData?.reality}
            showBudgetLine={data.expectedRealityShowBudgetLine ?? true}
          />
        );
      case 'pie':
        return (
          <PieChartVisual
            data={pieValues}
            labels={pieLabels}
            colors={data.pieColors}
            scalePercent={pieScalePercent}
            showCalloutLabels={pieShowCalloutLabels}
            showLegend={Boolean(data.pieShowLegend)}
            valueFormat={data.pieValueFormat}
            offsetX={pieOffsetX}
            offsetY={pieOffsetY}
          />
        );
      case 'gauge':
        return <GaugeVisual value={gaugeValue} onValueChange={updateGaugeValue} />;
      case 'card':
        return (
          <CardVisual
            value={cardValueText}
            cardLayout={data.cardLayout}
            cardHeroFontSize={data.cardHeroFontSize}
            wowPct={cardWowPct}
            wowDollarValue={cardWowDollarValue}
            ytdPriorYear={cardYtdPriorYear}
            priorActualLabel={data.cardPriorActualLabel}
            secondaryPriorValue={cardSecondaryPriorValue}
            secondaryPriorActualLabel={data.cardSecondaryPriorActualLabel}
            budgetLabel={data.cardBudgetLabel || 'Budget'}
            priorLabel={data.cardPriorLabel || 'YTD YoY'}
            budgetVarianceDollar={cardBudgetVarianceDollar}
            budgetVariancePct={cardBudgetVariancePct}
            priorVarianceDollar={cardPriorVarianceDollar}
            priorVariancePct={cardPriorVariancePct}
            variancePct={cardVariancePct}
            varianceFlatValue={cardVarianceDollarValue}
            varianceDollarValue={cardVarianceDollarValue}
            primaryDeltaLabel={data.cardPrimaryDeltaLabel || 'WoW'}
            primaryDeltaDollarOnly={data.cardPrimaryDeltaDollarOnly}
            secondaryDeltaLabel={data.cardSecondaryDeltaLabel || 'Budget'}
            bottomDollarLabel={data.cardBottomDollarLabel || 'YTD YoY $ VAR'}
            bottomPercentLabel={data.cardBottomPercentLabel || 'YTD YoY % VAR'}
            showSecondaryDelta={data.cardShowSecondaryDelta ?? true}
            onValueChange={updateCardValue}
            onYtdPriorYearChange={(value) => updateCardKpis('ytdPriorYear', value)}
            onSecondaryPriorValueChange={(value) => updateCardKpis('cardSecondaryPriorValue', value)}
            onBudgetVarianceDollarChange={(value) => updateCardKpis('budgetVarianceDollar', value)}
            onBudgetVariancePctChange={(value) => updateCardKpis('budgetVariancePct', value)}
            onPriorVarianceDollarChange={(value) => updateCardKpis('priorVarianceDollar', value)}
            onPriorVariancePctChange={(value) => updateCardKpis('priorVariancePct', value)}
            onVariancePctChange={(value) => updateCardKpis('variancePct', value)}
            onVarianceFlatValueChange={(value) => updateCardKpis('varianceFlatValue', value)}
            cardOrdersPassed={data.cardOrdersPassed}
            onOrdersPassedChange={(field, value) => {
              const current = data.cardOrdersPassed || {
                totalOrders: '',
                rscOrders: '',
                dropshipOrders: '',
                totalValue: '',
              };
              updateNodeData({
                cardOrdersPassed: {
                  ...current,
                  [field]: value,
                },
              });
            }}
            invertVarianceColors={Boolean(data.cardInvertVarianceColors)}
            disableVarianceColors={Boolean(data.cardDisableVarianceColors)}
          />
        );
      case 'matrix':
        return (
          <MatrixVisual
            scrollable={matrixScrollable}
            data={data.matrixData}
            columnLabels={tableColumnLabels}
            groupedColumnLabels={data.matrixGroupedColumns}
            firstColumnWidth={matrixFirstColumnWidth}
            showColorBlocks={matrixShowColorBlocks}
            regularFirstColumn={matrixRegularFirstColumn}
            groupMode={matrixGroupMode}
            totalRows={data.matrixTotalRows}
            highlightColumns={data.matrixHighlightColumns}
            stripedRows={matrixStripedRows}
            colorBlockColumnIndex={data.matrixColorBlockColumnIndex}
            leftAlignedColumns={data.matrixLeftAlignedColumns}
            columnWidths={data.matrixColumnWidths}
            columnWidthWeights={data.matrixColumnWidthWeights}
            columnWidthTuning={data.matrixColumnWidthTuning}
            wideColumns={data.matrixWideColumns}
            wrapColumnHeaders={Boolean(data.matrixWrapColumnHeaders)}
            scaleColumns={data.matrixScaleColumns}
            invertVarianceColors={Boolean(data.matrixInvertVarianceColors)}
            disableVarianceColors={Boolean(data.matrixDisableVarianceColors)}
            showSubColumnHeaders={Boolean(data.matrixShowSubColumnHeaders)}
            subRowData={data.matrixSubRowData}
            rowSubRows={data.matrixSubRows}
            subRowColors={data.matrixSubRowColors}
            subRowColorBlocks={data.matrixSubRowColorBlocks}
            rowColors={data.matrixRowColors}
            matrixTitle={title}
            onCellChange={updateMatrixCell}
            onColumnLabelChange={updateMatrixColumnLabel}
          />
        );
      case 'map':
        return <MapVisual label={data.label} imageSrc={data.mapImageSrc} />;
      case 'slicer':
        return (
          <SlicerVisual
            layout={data.slicerLayout || 'filterBar'}
            filters={data.slicerFilters}
          />
        );
      case 'fieldChooser':
        return (
          <FieldChooserVisual
            title={data.label || 'Choose your field'}
            fields={data.fieldChooserFields}
          />
        );
      default:
        return <div className="text-medium-gray text-sm font-body">Visual</div>;
    }
  };

  const isCardNode = data.componentType === 'card';
  const isMatrixNode = data.componentType === 'matrix';
  const isSlicerNode = data.componentType === 'slicer';
  const isFieldChooserNode = data.componentType === 'fieldChooser';
  const isCompactCardHero = isCardNode && data.cardHeroFontSize === 'compact';
  const headerThemeClass = 'bg-white text-dark';
  const nodeMinHeight = isCardNode
    ? hideHeader
      ? 88
      : 112
    : isSlicerNode
      ? 72
      : isFieldChooserNode
        ? 200
        : 120;
  const nodeMinWidth = isMatrixNode ? undefined : isSlicerNode ? 320 : 160;
  const nodeResizeMinHeight = isMatrixNode ? undefined : nodeMinHeight;
  const nodeOverflowClass = isSlicerNode ? 'overflow-visible' : 'overflow-hidden';
  const headerLayoutClass = isCardNode
    ? isCompactCardHero
      ? 'px-3 py-1 min-h-[36px]'
      : 'px-3 py-2 min-h-[44px]'
    : 'px-3 py-3.5 min-h-[56px]';

  return (
    <div 
      className={`powerbi-visual${isSlicerNode ? ' powerbi-slicer' : ''}`} 
      onClickCapture={handleNodeClickCapture}
      style={{ 
        width: '100%', 
        height: '100%',
        opacity: isPreview ? 0.6 : 1,
        pointerEvents: isPreview ? 'none' : 'auto',
      }}
    >
      <NodeResizer 
        minWidth={nodeMinWidth} 
        minHeight={nodeResizeMinHeight} 
        isVisible={selected && !isPreview}
        color="#EA0029"
        handleStyle={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#EA0029',
        }}
      />
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className={`node-drag-handle relative h-full flex flex-col bg-light transition-shadow ${nodeOverflowClass} font-body ${
        isPreview ? 'border-2 border-primary border-dashed' : ''
      }`}>
        {!hideHeader && (
          <div className={`node-drag-handle ${headerLayoutClass} flex justify-between items-start cursor-move select-none ${headerThemeClass} ${isCompactCardHero ? 'relative z-0 shrink-0' : ''}`}>
            <div className="min-w-0 flex-1 pr-2">
              <input
                value={title}
                onChange={(e) => updateTitle(e.target.value)}
                onBlur={commitHeaderEdits}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitHeaderEdits();
                    e.currentTarget.blur();
                  }
                }}
                onMouseDown={stopLeftMousePropagation}
                className={`nodrag w-full border-0 p-0.5 m-0 font-bold font-header focus:outline-none bg-white/90 text-black placeholder:text-gray-600 ${isCompactCardHero ? 'text-sm leading-tight' : 'text-lg'}`}
              />
            </div>
            {selected && !isPreview && (
              <div className="flex gap-1 items-center">
                {hasEditablePanel && (
                  <button
                    type="button"
                    onClick={() => setIsEditMode((current) => !current)}
                    className="px-2 py-0.5 text-[10px] border border-gray-300 text-gray-700 hover:text-dark hover:border-gray-400"
                  >
                    {isEditMode ? 'Done' : 'Edit'}
                  </button>
                )}
                {data.componentType === 'line' && (
                  <button
                    type="button"
                    onClick={toggleLineCleanView}
                    className="px-2 py-0.5 text-[10px] border border-gray-300 text-gray-700 hover:text-dark hover:border-gray-400"
                    title="Toggle line chart axis titles and graph background"
                  >
                    {lineCleanView ? 'Axes/BG: Hidden' : 'Axes/BG: Shown'}
                  </button>
                )}
                <button
                  onClick={() => setHeaderVisibility(true)}
                  className="text-xs leading-none px-1 text-gray-600 hover:text-dark"
                  title="Hide header"
                >
                  ×
                </button>
              </div>
            )}
            {data.componentType === 'stackedArea' && (
              <div className="ml-auto self-end mb-1 flex items-center gap-2 text-[12px] leading-none text-dark">
                <div className="flex items-center gap-1">
                  <svg width="16" height="4" aria-hidden="true">
                    <line x1="0" y1="2" x2="16" y2="2" stroke={stackedLegendBudgetColor} strokeWidth="2" />
                  </svg>
                  <span className="font-body">Budget</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg width="16" height="4" aria-hidden="true">
                    <line x1="0" y1="2" x2="16" y2="2" stroke={stackedLegendPyColor} strokeWidth="2" strokeDasharray="4 3" />
                  </svg>
                  <span className="font-body">PY</span>
                </div>
              </div>
            )}
          </div>
        )}

        {hideHeader && selected && !isPreview && (
          <div className="nodrag absolute top-2 right-2 z-20 px-2 py-1 bg-white/90 border border-gray-200 rounded-sm flex justify-end gap-1">
            {data.componentType === 'line' && (
              <button
                type="button"
                onClick={toggleLineCleanView}
                className="text-[10px] px-2 py-0.5 border border-gray-300 text-gray-700 hover:text-dark"
                title="Toggle line chart axis titles and graph background"
              >
                {lineCleanView ? 'Axes/BG: Hidden' : 'Axes/BG: Shown'}
              </button>
            )}
            {hasEditablePanel && (
              <button
                type="button"
                onClick={() => setIsEditMode((current) => !current)}
                className="text-[10px] px-2 py-0.5 border border-gray-300 text-gray-700 hover:text-dark hover:border-gray-400"
              >
                {isEditMode ? 'Done' : 'Edit'}
              </button>
            )}
            <button
              onClick={() => setHeaderVisibility(false)}
              className="text-[10px] px-2 py-0.5 border border-gray-300 text-gray-700 hover:text-dark"
              title="Show header"
            >
              Show Header
            </button>
          </div>
        )}

        {selected && !isPreview && isEditMode && hasEditablePanel && (
          <div className="nodrag px-3 py-2 bg-white flex flex-wrap gap-2 items-center">
            {data.componentType === 'matrix' && (
              <>
                <button
                  type="button"
                  onClick={addMatrixColumn}
                  className="px-2 py-1 text-[10px] font-medium border border-gray-200 text-medium-gray hover:text-dark hover:border-gray-300"
                >
                  + Column
                </button>
                <button
                  type="button"
                  onClick={addMatrixRow}
                  className="px-2 py-1 text-[10px] font-medium border border-gray-200 text-medium-gray hover:text-dark hover:border-gray-300"
                >
                  + Row
                </button>
                <button
                  type="button"
                  onClick={removeMatrixColumn}
                  className="px-2 py-1 text-[10px] font-medium border border-gray-200 text-medium-gray hover:text-dark hover:border-gray-300"
                >
                  - Column
                </button>
                <button
                  type="button"
                  onClick={removeMatrixRow}
                  className="px-2 py-1 text-[10px] font-medium border border-gray-200 text-medium-gray hover:text-dark hover:border-gray-300"
                >
                  - Row
                </button>
                <label className="text-[10px] text-gray-600 font-medium ml-1">
                  First Col (px)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={matrixFirstColumnWidthInput}
                  onChange={(e) => setMatrixFirstColumnWidthInput(e.target.value)}
                  onBlur={(e) => commitMatrixFirstColumnWidth(e.target.value)}
                  onKeyDown={(e) => {
                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'];

                    if (allowedKeys.includes(e.key)) {
                      if (e.key === 'Enter') {
                        handleEnterCommit(e, () => commitMatrixFirstColumnWidth(matrixFirstColumnWidthInput));
                      }
                      return;
                    }

                    if (!/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    if (!/^\d+$/.test(pastedText)) {
                      e.preventDefault();
                    }
                  }}
                  onMouseDown={stopLeftMousePropagation}
                  onWheel={(e) => {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }}
                  disabled={matrixRegularFirstColumn}
                  className="nodrag w-20 px-2 py-1 text-xs border border-gray-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Set first column width"
                />
                <label className="flex items-center gap-1 text-[10px] text-gray-600 font-medium ml-1 select-none">
                  <input
                    type="checkbox"
                    checked={matrixRegularFirstColumn}
                    onChange={toggleMatrixRegularFirstColumn}
                    onMouseDown={stopLeftMousePropagation}
                    className="nodrag h-3.5 w-3.5 border border-gray-300"
                  />
                  Regular first column
                </label>
                <label className="flex items-center gap-1 text-[10px] text-gray-600 font-medium ml-1 select-none">
                  <input
                    type="checkbox"
                    checked={matrixGroupMode}
                    onChange={toggleMatrixGroupMode}
                    onMouseDown={stopLeftMousePropagation}
                    className="nodrag h-3.5 w-3.5 border border-gray-300"
                  />
                  Group mode
                </label>
                <label className="flex items-center gap-1 text-[10px] text-gray-600 font-medium ml-1 select-none">
                  <input
                    type="checkbox"
                    checked={matrixStripedRows}
                    onChange={toggleMatrixStripedRows}
                    onMouseDown={stopLeftMousePropagation}
                    className="nodrag h-3.5 w-3.5 border border-gray-300"
                  />
                  Striped rows
                </label>
                <label className="flex items-center gap-1 text-[10px] text-gray-600 font-medium ml-1 select-none">
                  <input
                    type="checkbox"
                    checked={matrixShowColorBlocks}
                    onChange={toggleMatrixColorBlocks}
                    onMouseDown={stopLeftMousePropagation}
                    className="nodrag h-3.5 w-3.5 border border-gray-300"
                  />
                  Row color blocks
                </label>
              </>
            )}

            {(data.componentType === 'bar' || data.componentType === 'line') && (
              <>
                <input
                  type="text"
                  value={axisTitles.x || ''}
                  onChange={(e) => updateAxisTitle('x', e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  placeholder="X title"
                />
                <input
                  type="text"
                  value={axisTitles.y || ''}
                  onChange={(e) => updateAxisTitle('y', e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  placeholder="Y title"
                />
                <input
                  type="text"
                  value={xAxisValueText}
                  onChange={(e) => setXAxisValueText(e.target.value)}
                  onFocus={() => setIsEditingXAxisValues(true)}
                  onBlur={() => setIsEditingXAxisValues(false)}
                  onKeyDown={(e) => handleEnterCommit(e, commitXAxisValues)}
                  className="flex-1 min-w-[140px] px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  placeholder="X values (comma-separated)"
                />
                <input
                  type="text"
                  value={axisValueText}
                  onChange={(e) => setAxisValueText(e.target.value)}
                  onFocus={() => setIsEditingAxisValues(true)}
                  onBlur={() => setIsEditingAxisValues(false)}
                  onKeyDown={(e) => handleEnterCommit(e, commitAxisValues)}
                  className="flex-1 min-w-[140px] px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  placeholder="Y values (comma-separated)"
                />
                {data.componentType === 'bar' && (
                  <>
                    <button
                      type="button"
                      onClick={toggleBarThirdAxis}
                      className="px-2 py-1 text-[10px] font-medium border border-gray-200 text-medium-gray hover:text-dark hover:border-gray-300"
                    >
                      {thirdAxisEnabled ? '3rd Axis: On' : '3rd Axis: Off'}
                    </button>
                    {thirdAxisEnabled && (
                      <>
                        <input
                          type="text"
                          value={axisTitles.third || ''}
                          onChange={(e) => updateAxisTitle('third', e.target.value)}
                          className="w-28 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                          placeholder="3rd axis title"
                        />
                        <input
                          type="text"
                          value={thirdAxisValueText}
                          onChange={(e) => setThirdAxisValueText(e.target.value)}
                          onFocus={() => setIsEditingThirdAxisValues(true)}
                          onBlur={() => setIsEditingThirdAxisValues(false)}
                          onKeyDown={(e) => handleEnterCommit(e, commitThirdAxisValues)}
                          className="flex-1 min-w-[140px] px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                          placeholder="3rd axis values (comma-separated)"
                        />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {data.componentType === 'stackedArea' && (
              <>
                <input
                  type="text"
                  value={axisTitles.x || ''}
                  onChange={(e) => updateAxisTitle('x', e.target.value)}
                  className="w-28 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  placeholder="X title"
                />
                <input
                  type="text"
                  value={axisTitles.y || ''}
                  onChange={(e) => updateAxisTitle('y', e.target.value)}
                  className="w-28 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  placeholder="Y title"
                />
                <button
                  type="button"
                  onClick={addStackedAreaPoint}
                  className="px-2 py-1 text-[10px] font-medium border border-gray-200 text-medium-gray hover:text-dark hover:border-gray-300"
                >
                  + Point
                </button>
                <button
                  type="button"
                  onClick={removeStackedAreaPoint}
                  disabled={(stackedSeriesData[0]?.length || 0) <= 2}
                  className="px-2 py-1 text-[10px] font-medium border border-gray-200 text-medium-gray hover:text-dark hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  - Point
                </button>
                <span className="text-[10px] text-gray-500">
                  Data points: {stackedSeriesData[0]?.length || 0}
                </span>
                <label className="text-[10px] text-gray-600 font-medium ml-1">
                  Y Label Offset
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="-?[0-9]*"
                  value={stackedYAxisLabelOffsetInput}
                  onChange={(e) => setStackedYAxisLabelOffsetInput(e.target.value)}
                  onBlur={(e) => commitStackedYAxisLabelOffset(e.target.value)}
                  onKeyDown={(e) => {
                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'];

                    if (allowedKeys.includes(e.key)) {
                      if (e.key === 'Enter') {
                        handleEnterCommit(e, () => commitStackedYAxisLabelOffset(stackedYAxisLabelOffsetInput));
                      }
                      return;
                    }

                    if (e.key === '-') {
                      const target = e.currentTarget;
                      const selectionStart = target.selectionStart ?? 0;
                      const hasMinus = target.value.includes('-');
                      if (!hasMinus && selectionStart === 0) {
                        return;
                      }
                    }

                    if (!/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    if (!/^-?\d+$/.test(pastedText)) {
                      e.preventDefault();
                    }
                  }}
                  onMouseDown={stopLeftMousePropagation}
                  onWheel={(e) => {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }}
                  className="nodrag w-20 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  title="Set stacked area Y-axis label vertical offset"
                />
              </>
            )}

            {data.componentType === 'expectedReality' && (
              <>
                <input
                  type="text"
                  value={axisTitles.x || ''}
                  onChange={(e) => updateAxisTitle('x', e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  placeholder="X title"
                />
                <input
                  type="text"
                  value={axisTitles.y || ''}
                  onChange={(e) => updateAxisTitle('y', e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  placeholder="Y title"
                />
              </>
            )}

            {data.componentType === 'pie' && (
              <>
                <label className="flex items-center gap-1 text-[10px] text-gray-600 font-medium ml-1 select-none">
                  <input
                    type="checkbox"
                    checked={pieShowCalloutLabels}
                    onChange={togglePieShowCalloutLabels}
                    onMouseDown={stopLeftMousePropagation}
                    className="nodrag h-3.5 w-3.5 border border-gray-300"
                  />
                  Label callouts
                </label>
                <label className="text-[10px] text-gray-600 font-medium ml-1">
                  Size: {pieScalePercent}%
                </label>
                <input
                  type="range"
                  min={100}
                  max={200}
                  step={5}
                  value={pieScalePercent}
                  onChange={(e) => updatePieScalePercent(e.target.value)}
                  className="rf-nodrag rf-nopan w-28"
                  title="Scale pie chart size"
                />
                <input
                  type="number"
                  min={100}
                  max={200}
                  step={5}
                  value={pieScalePercent}
                  onChange={(e) => updatePieScalePercent(e.target.value)}
                  onKeyDownCapture={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onMouseDown={stopLeftMousePropagation}
                  className="rf-nodrag rf-nopan w-16 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  title="Pie size percent"
                />
                <label className="text-[10px] text-gray-600 font-medium ml-1">
                  X Position
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="-?[0-9]*"
                  value={pieOffsetXInput}
                  onChange={(e) => setPieOffsetXInput(e.target.value)}
                  onBlur={(e) => commitPieOffset('x', e.target.value)}
                  onKeyDown={(e) => {
                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'];

                    if (allowedKeys.includes(e.key)) {
                      if (e.key === 'Enter') {
                        handleEnterCommit(e, () => commitPieOffset('x', pieOffsetXInput));
                      }
                      return;
                    }

                    if (e.key === '-') {
                      const target = e.currentTarget;
                      const selectionStart = target.selectionStart ?? 0;
                      const hasMinus = target.value.includes('-');
                      if (!hasMinus && selectionStart === 0) {
                        return;
                      }
                    }

                    if (!/^[0-9-]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onKeyDownCapture={(e) => e.stopPropagation()}
                  onMouseDown={stopLeftMousePropagation}
                  className="rf-nodrag rf-nopan w-16 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  title="Move pie chart left/right"
                />
                <label className="text-[10px] text-gray-600 font-medium ml-1">
                  Y Position
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="-?[0-9]*"
                  value={pieOffsetYInput}
                  onChange={(e) => setPieOffsetYInput(e.target.value)}
                  onBlur={(e) => commitPieOffset('y', e.target.value)}
                  onKeyDown={(e) => {
                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'];

                    if (allowedKeys.includes(e.key)) {
                      if (e.key === 'Enter') {
                        handleEnterCommit(e, () => commitPieOffset('y', pieOffsetYInput));
                      }
                      return;
                    }

                    if (e.key === '-') {
                      const target = e.currentTarget;
                      const selectionStart = target.selectionStart ?? 0;
                      const hasMinus = target.value.includes('-');
                      if (!hasMinus && selectionStart === 0) {
                        return;
                      }
                    }

                    if (!/^[0-9-]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onKeyDownCapture={(e) => e.stopPropagation()}
                  onMouseDown={stopLeftMousePropagation}
                  className="rf-nodrag rf-nopan w-16 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  title="Move pie chart up/down"
                />
              </>
            )}
          </div>
        )}

        <div className={`flex-1 flex min-h-0 ${isMatrixNode ? 'items-start justify-start' : isSlicerNode ? 'items-stretch justify-stretch' : 'items-center justify-center'} ${isSlicerNode ? 'overflow-visible' : 'overflow-hidden'} ${isCardNode ? '' : 'bg-white'}`}>
          {renderChart()}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export default PowerBINode;
