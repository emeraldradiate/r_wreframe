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

const getDefaultPieLabels = (length: number) => Array.from({ length: Math.max(length, 1) }, (_, index) => `Slice ${index + 1}`);
const normalizePieLabels = (labels: string[] | undefined, length: number) => {
  const fallback = getDefaultPieLabels(length);
  return Array.from({ length }, (_, index) => labels?.[index]?.trim() || fallback[index]);
};
const getSafePieValues = (values: number[] | undefined) => {
  const fallback = [45, 30, 25];
  const source = values?.length ? values : fallback;
  return source.map((value) => {
    const rounded = Math.round(Number(value));
    return Number.isFinite(rounded) && rounded > 0 ? rounded : 1;
  });
};
const randomPieValuePool = [12, 18, 24, 31, 37, 44, 52, 63, 71, 85];
const defaultStackedSeriesData = [
  [45, 48, 46, 50, 52, 55],
  [20, 21, 22, 23, 24, 25],
  [18, 19, 18, 20, 21, 22],
  [12, 13, 14, 14, 15, 16],
  [8, 9, 10, 11, 12, 13],
];
const defaultStackedSeriesLabels = ['Website', 'Call Center', 'Stores', 'Amazon', 'Direct'];
const defaultStackedSeriesColors = ['#EA0029', '#F97316', '#F59E0B', '#10B981', '#06B6D4'];

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
  return Array.from({ length }, (_, index) => labels?.[index]?.trim() || fallback[index]);
};

function PowerBINode({ data, selected }: PowerBINodeProps) {
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
  const [gaugeValue, setGaugeValue] = useState<number>(Number(data.value) || 0);
  const [cardValueText, setCardValueText] = useState<string>(String(data.value ?? '42,500'));
  const [cardWowPct, setCardWowPct] = useState<string>(data.wowPct || '0.16');
  const [cardYtdPriorYear, setCardYtdPriorYear] = useState<string>(data.ytdPriorYear || '39,800');
  const [cardVariancePct, setCardVariancePct] = useState<string>(data.variancePct || '6.8%');
  const [cardTheme, setCardTheme] = useState<'light' | 'gray' | undefined>(data.cardTheme === 'gray' ? 'gray' : 'light');
  const [barData, setBarData] = useState<number[]>(data.chartData || defaultBarData);
  const [thirdAxisEnabled, setThirdAxisEnabled] = useState(Boolean(data.thirdAxisEnabled));
  const [thirdAxisData, setThirdAxisData] = useState<number[]>(normalizeSeriesLength(data.thirdAxisData || defaultThirdAxisData, (data.chartData || defaultBarData).length, 0));
  const [lineData, setLineData] = useState<number[]>(data.chartData || defaultLineData);
  const [pieValues, setPieValues] = useState<number[]>(getSafePieValues(data.chartData));
  const [pieLabels, setPieLabels] = useState<string[]>(normalizePieLabels(data.pieLabels, getSafePieValues(data.chartData).length));
  const [stackedSeriesData, setStackedSeriesData] = useState<number[][]>(getSafeStackedSeriesData(data.seriesData));
  const [stackedXAxisLabels, setStackedXAxisLabels] = useState<string[]>(
    normalizeStackedXAxisLabels(data.xAxisLabels, getSafeStackedSeriesData(data.seriesData)[0]?.length || 2)
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
    setBarData(data.chartData || defaultBarData);
    setLineData(data.chartData || defaultLineData);

    const nextPieValues = getSafePieValues(data.chartData);
    setPieValues(nextPieValues);
    setPieLabels(normalizePieLabels(data.pieLabels, nextPieValues.length));
  }, [data.chartData, data.componentType, data.pieLabels]);
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
    if (data.componentType === 'card') { setCardValueText(String(data.value ?? '42,500')); return; }
    setGaugeValue(Number(data.value) || 0);
  }, [data.value, data.componentType]);
  useEffect(() => { setCardWowPct(data.wowPct || '0.16'); setCardYtdPriorYear(data.ytdPriorYear || '39,800'); setCardVariancePct(data.variancePct || '6.8%'); }, [data.wowPct, data.ytdPriorYear, data.variancePct]);
  useEffect(() => { setCardTheme(data.cardTheme === 'gray' ? 'gray' : 'light'); }, [data.cardTheme]);
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

  const commitHeaderEdits = () => { data.label = title.trim() || 'Untitled'; };
  const updateTitle = (value: string) => { setTitle(value); data.label = value; };
  const updateCardKpis = (field: 'ytdPriorYear' | 'variancePct', value: string) => {
    if (field === 'ytdPriorYear') setCardYtdPriorYear(value);
    if (field === 'variancePct') { const normalized = value.replace(/[^0-9.-]/g, ''); setCardVariancePct(normalized); data[field] = normalized; return; }
    data[field] = value;
  };
  const updateAxisTitle = (axis: 'x' | 'y' | 'third', value: string) => setAxisTitles((current) => { const next = { ...current, [axis]: value }; updateNodeData({ axisLabels: next }); return next; });
  const updateGaugeValue = (value: number) => { setGaugeValue(value); data.value = value; };
  const updateCardValue = (value: string) => { setCardValueText(value); data.value = value; };
  const setCardThemeVariant = (theme: 'light' | 'gray') => { setCardTheme(theme); data.cardTheme = theme; };
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

  const updatePieValue = (index: number, value: string) => {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const nextValues = pieValues.map((point, pointIndex) => pointIndex === index ? parsed : point);
    setPieValues(nextValues);
    updateNodeData({ chartData: nextValues, pieLabels });
  };
  const updatePieLabel = (index: number, value: string) => {
    const nextLabels = pieLabels.map((label, labelIndex) => labelIndex === index ? value : label);
    setPieLabels(nextLabels);
    updateNodeData({ chartData: pieValues, pieLabels: nextLabels });
  };
  const addPiePoint = () => {
    const nextValue = randomPieValuePool[Math.floor(Math.random() * randomPieValuePool.length)];
    const nextValues = [...pieValues, nextValue];
    const nextLabels = [...pieLabels, `Slice ${pieValues.length + 1}`];
    setPieValues(nextValues);
    setPieLabels(nextLabels);
    updateNodeData({ chartData: nextValues, pieLabels: nextLabels });
  };
  const removePiePoint = (index: number) => {
    if (pieValues.length <= 1) return;
    const nextValues = pieValues.filter((_, pointIndex) => pointIndex !== index);
    const nextLabels = pieLabels.filter((_, labelIndex) => labelIndex !== index);
    setPieValues(nextValues);
    setPieLabels(nextLabels);
    updateNodeData({ chartData: nextValues, pieLabels: nextLabels });
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
          />
        );
      case 'line':
        return (
          <LineChartVisual
            data={lineData}
            axisLabels={axisTitles}
            xLabels={xAxisLabels}
            hideAxesAndBackground={lineCleanView}
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
          />
        );
      case 'expectedReality':
        return <ExpectedVsRealityChartVisual axisLabels={axisTitles} />;
      case 'pie':
        return <PieChartVisual data={pieValues} labels={pieLabels} />;
      case 'gauge':
        return <GaugeVisual value={gaugeValue} onValueChange={updateGaugeValue} />;
      case 'card':
        return (
          <CardVisual
            value={cardValueText}
            wowPct={cardWowPct}
            ytdPriorYear={cardYtdPriorYear}
            variancePct={cardVariancePct}
            theme={cardTheme}
            onValueChange={updateCardValue}
            onYtdPriorYearChange={(value) => updateCardKpis('ytdPriorYear', value)}
            onVariancePctChange={(value) => updateCardKpis('variancePct', value)}
          />
        );
      case 'matrix':
        return (
          <MatrixVisual
            data={data.matrixData}
            columnLabels={tableColumnLabels}
            firstColumnWidth={matrixFirstColumnWidth}
            onCellChange={updateMatrixCell}
            onColumnLabelChange={updateMatrixColumnLabel}
          />
        );
      case 'map':
        return <MapVisual label={data.label} />;
      default:
        return <div className="text-medium-gray text-sm font-body">Visual</div>;
    }
  };

  const isCardNode = data.componentType === 'card';
  const isCardGrayTheme = isCardNode && cardTheme === 'gray';
  const headerThemeClass = isCardGrayTheme
    ? 'bg-[#666666] text-light'
    : 'bg-white text-dark';

  return (
    <div 
      className="powerbi-visual" 
      onClickCapture={handleNodeClickCapture}
      style={{ 
        width: '100%', 
        height: '100%',
        opacity: isPreview ? 0.6 : 1,
        pointerEvents: isPreview ? 'none' : 'auto',
      }}
    >
      <NodeResizer 
        minWidth={160} 
        minHeight={120} 
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
      
      <div className={`node-drag-handle relative h-full flex flex-col bg-light transition-shadow overflow-hidden font-body ${
        isPreview ? 'border-2 border-primary border-dashed' : ''
      }`}>
        {!hideHeader && (
          <div className={`node-drag-handle px-3 py-3.5 min-h-[56px] flex justify-between items-start cursor-move select-none ${headerThemeClass}`}>
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
                onMouseDown={(e) => e.stopPropagation()}
                className={`nodrag w-full border-0 p-0.5 m-0 font-bold text-lg font-header focus:outline-none ${
                  isCardGrayTheme
                    ? 'bg-transparent text-light placeholder:text-light/70'
                    : 'bg-white/90 text-black placeholder:text-gray-600'
                }`}
              />
            </div>
            {selected && !isPreview && (
              <div className="flex gap-1 items-center">
                {hasEditablePanel && (
                  <button
                    type="button"
                    onClick={() => setIsEditMode((current) => !current)}
                    className={`px-2 py-0.5 text-[10px] border ${isCardGrayTheme ? 'border-gray-400 text-gray-800 hover:bg-gray-100' : 'border-gray-300 text-gray-700 hover:text-dark hover:border-gray-400'}`}
                  >
                    {isEditMode ? 'Done' : 'Edit'}
                  </button>
                )}
                {data.componentType === 'card' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCardThemeVariant('light')}
                      className={`h-3.5 w-3.5 rounded-full border ${cardTheme === 'light' ? 'bg-white border-gray-500 ring-1 ring-primary' : 'bg-white border-gray-300'}`}
                      aria-label="Light card theme"
                    />
                    <button
                      onClick={() => setCardThemeVariant('gray')}
                      className={`h-3.5 w-3.5 rounded-full border ${cardTheme === 'gray' ? 'bg-gray-200 border-gray-400 ring-1 ring-primary' : 'bg-gray-300 border-gray-400'}`}
                      aria-label="Gray card theme"
                    />
                  </div>
                )}
                {data.componentType === 'line' && (
                  <button
                    type="button"
                    onClick={toggleLineCleanView}
                    className={`px-2 py-0.5 text-[10px] border ${isCardGrayTheme ? 'border-gray-400 text-gray-800 hover:bg-gray-100' : 'border-gray-300 text-gray-700 hover:text-dark hover:border-gray-400'}`}
                    title="Toggle line chart axis titles and graph background"
                  >
                    {lineCleanView ? 'Axes/BG: Hidden' : 'Axes/BG: Shown'}
                  </button>
                )}
                <button
                  onClick={() => setHeaderVisibility(true)}
                  className={`text-xs leading-none px-1 ${isCardGrayTheme ? 'text-gray-800 hover:text-gray-900' : 'text-gray-600 hover:text-dark'}`}
                  title="Hide header"
                >
                  ×
                </button>
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onWheel={(e) => {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }}
                  className="nodrag w-20 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                  title="Set first column width"
                />
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
                <button
                  type="button"
                  onClick={addPiePoint}
                  className="px-2 py-1 text-[10px] font-medium border border-gray-200 text-medium-gray hover:text-dark hover:border-gray-300"
                >
                  + Point
                </button>
                {pieValues.length > 1 && (
                  <span className="text-[10px] text-gray-500">Remove with each row.</span>
                )}
                <div className="w-full flex flex-col gap-1">
                  {pieValues.map((value, index) => (
                    <div key={`pie-row-${index}`} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={pieLabels[index] || ''}
                        onChange={(e) => updatePieLabel(index, e.target.value)}
                        onKeyDownCapture={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="rf-nodrag rf-nopan flex-1 min-w-[120px] px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                        placeholder={`Slice ${index + 1} label`}
                      />
                      <input
                        type="number"
                        min={1}
                        value={value}
                        onChange={(e) => updatePieValue(index, e.target.value)}
                        onKeyDownCapture={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="rf-nodrag rf-nopan w-20 px-2 py-1 text-xs border border-gray-200 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removePiePoint(index)}
                        disabled={pieValues.length <= 1}
                        className="px-2 py-1 text-[10px] font-medium border border-gray-200 text-medium-gray hover:text-dark hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className={`flex-1 flex items-center justify-center overflow-hidden ${isCardNode ? '' : 'bg-white'}`}>
          {renderChart()}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export default PowerBINode;
