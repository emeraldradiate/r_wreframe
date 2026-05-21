import { useElementSize, resolveChartBounds, normalizeSeriesLength, getDefaultXAxisLabels, CHART_COLOR_PALETTE } from '../nodeUtils';

interface StackedAreaChartVisualProps {
  seriesData?: number[][];
  seriesLabels?: string[];
  seriesColors?: string[];
  axisLabels?: { x?: string; y?: string };
  xLabels?: string[];
  stackedYAxisLabelOffset?: number;
}

const defaultStackedSeriesData = [
  [45, 48, 46, 50, 52, 55],
  [20, 21, 22, 23, 24, 25],
  [18, 19, 18, 20, 21, 22],
  [12, 13, 14, 14, 15, 16],
  [8, 9, 10, 11, 12, 13],
];

const defaultStackedSeriesLabels = ['Website', 'Call Center', 'Stores', 'Amazon', 'Direct'];
const defaultStackedSeriesColors = CHART_COLOR_PALETTE.slice(0, 5);

const StackedAreaChartVisual = ({
  seriesData = defaultStackedSeriesData,
  seriesLabels = defaultStackedSeriesLabels,
  seriesColors = defaultStackedSeriesColors,
  axisLabels,
  xLabels,
  stackedYAxisLabelOffset = 0,
}: StackedAreaChartVisualProps) => {
  const margin = { top: 12, right: 30, bottom: 36, left: 30 };
  const fallback = { width: 260, height: 190 };
  const { elementRef, size } = useElementSize<HTMLDivElement>();
  const { width, height, plotWidth, plotHeight } = resolveChartBounds({ size, fallback, margin });
  const axisTitleFontSize = 12;
  const chartBottom = height - margin.bottom;

  const safeSeriesData = (seriesData.length ? seriesData : defaultStackedSeriesData)
    .map((series) => series.map((value) => {
      const parsed = Math.round(Number(value));
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }));
  const longestSeriesLength = Math.max(...safeSeriesData.map((series) => series.length), 2);
  const normalizedSeriesData = safeSeriesData.map((series) => normalizeSeriesLength(series, longestSeriesLength, 0));
  const plottedSeries = normalizedSeriesData.map((values, index) => ({
    values,
    label: seriesLabels[index]?.trim() || defaultStackedSeriesLabels[index] || `Series ${index + 1}`,
    color: seriesColors[index] || defaultStackedSeriesColors[index % defaultStackedSeriesColors.length],
  }));

  const numPoints = plottedSeries[0].values.length;
  const xStep = numPoints > 1 ? plotWidth / (numPoints - 1) : 0;
  const rawLabels = (xLabels?.length ? xLabels : getDefaultXAxisLabels(numPoints)).map((label) => label?.trim() || '');
  const categoryLabels = Array.from({ length: numPoints }, (_, index) => rawLabels[index] || `${index + 1}`);

  const cumulativeData: number[][] = [];
  for (let i = 0; i < numPoints; i++) {
    let cumulative = 0;
    const column: number[] = [0];
    for (const series of plottedSeries) { cumulative += series.values[i]; column.push(cumulative); }
    cumulativeData.push(column);
  }
  const totalSeriesIndex = plottedSeries.length;
  const forecastTotals: number[] = [];
  const priorYearTotals: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    const progress = numPoints > 1 ? i / (numPoints - 1) : 0;
    const baseTotal = cumulativeData[i][totalSeriesIndex];
    const forecastAdjustment = 1 + (progress - 0.5) * 0.2 + Math.sin(progress * Math.PI * 1.8) * 0.09;
    const priorYearAdjustment = 0.86 + (progress - 0.5) * 0.08 - Math.sin(progress * Math.PI * 1.2) * 0.04;
    forecastTotals.push(Math.max(0, baseTotal * forecastAdjustment));
    priorYearTotals.push(Math.max(0, baseTotal * priorYearAdjustment));
  }
  const maxValue = Math.max(...cumulativeData.flat(), ...forecastTotals, ...priorYearTotals, 1), yScale = plotHeight / maxValue;
  const layers = plottedSeries.map((series, seriesIndex) => {
    const pathPoints: string[] = [];
    for (let i = 0; i < numPoints; i++) pathPoints.push((i === 0 ? 'M' : 'L') + `${margin.left + i * xStep},${chartBottom - cumulativeData[i][seriesIndex + 1] * yScale}`);
    for (let i = numPoints - 1; i >= 0; i--) pathPoints.push(`L${margin.left + i * xStep},${chartBottom - cumulativeData[i][seriesIndex] * yScale}`);
    pathPoints.push('Z');
    return { color: series.color, label: series.label, path: pathPoints.join(' ') };
  });
  const forecastPathPoints: string[] = [];
  const priorYearPathPoints: string[] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = margin.left + i * xStep;
    const forecastY = chartBottom - forecastTotals[i] * yScale;
    const priorYearY = chartBottom - priorYearTotals[i] * yScale;
    forecastPathPoints.push(`${i === 0 ? 'M' : 'L'}${x},${forecastY}`);
    priorYearPathPoints.push(`${i === 0 ? 'M' : 'L'}${x},${priorYearY}`);
  }
  const forecastPath = forecastPathPoints.join(' ');
  const priorYearPath = priorYearPathPoints.join(' ');

  return (
    <div ref={elementRef} className="flex flex-col h-full w-full px-1 py-1 overflow-hidden">
      <div className="h-4 flex items-center justify-end gap-3 px-2">
        <div className="flex items-center gap-1">
          <svg width="16" height="4" aria-hidden="true">
            <line x1="0" y1="2" x2="16" y2="2" stroke="#111111" strokeWidth="2" />
          </svg>
          <span className="text-[8px] leading-none text-dark font-body">Budget</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="16" height="4" aria-hidden="true">
            <line x1="0" y1="2" x2="16" y2="2" stroke="#111111" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          <span className="text-[8px] leading-none text-dark font-body">PY</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <svg width={width} height={height} className="w-full h-full overflow-visible">
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={chartBottom} stroke="#C7C7C7" strokeWidth="1" />
          <line x1={margin.left} y1={chartBottom} x2={width - margin.right} y2={chartBottom} stroke="#C7C7C7" strokeWidth="1" />
          {layers.map((layer, index) => (
            <path key={index} d={layer.path} fill={layer.color} fillOpacity="0.85" />
          ))}
          <path d={forecastPath} fill="none" stroke="#111111" strokeWidth="2.25" />
          <path d={priorYearPath} fill="none" stroke="#111111" strokeWidth="2" strokeDasharray="4 3" />
          {categoryLabels.map((label, index) => (
            <text
              key={`stacked-x-label-${index}`}
              x={margin.left + index * xStep}
              y={height - margin.bottom + 12}
              textAnchor="middle"
              className="fill-medium-gray font-body"
              style={{ fontSize: '9px' }}
            >
              {label}
            </text>
          ))}
          <text
            x={12}
            y={height / 2 + stackedYAxisLabelOffset}
            textAnchor="middle"
            transform={`rotate(-90 12 ${height / 2 + stackedYAxisLabelOffset})`}
            className="fill-medium-gray font-semibold font-body"
            style={{ fontSize: `${axisTitleFontSize}px` }}
          >
            {axisLabels?.y || 'Revenue'}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default StackedAreaChartVisual;
