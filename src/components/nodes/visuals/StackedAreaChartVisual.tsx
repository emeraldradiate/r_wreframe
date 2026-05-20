import { useElementSize, resolveChartBounds, normalizeSeriesLength, getDefaultXAxisLabels, CHART_COLOR_PALETTE } from '../nodeUtils';

interface StackedAreaChartVisualProps {
  seriesData?: number[][];
  seriesLabels?: string[];
  seriesColors?: string[];
  axisLabels?: { x?: string; y?: string };
  xLabels?: string[];
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
}: StackedAreaChartVisualProps) => {
  const margin = { top: 12, right: 30, bottom: 12, left: 30 };
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
  const maxValue = Math.max(...cumulativeData.flat(), 1), yScale = plotHeight / maxValue;
  const dataLabelFontSize = 9;
  const layers = plottedSeries.map((series, seriesIndex) => {
    const pathPoints: string[] = [];
    for (let i = 0; i < numPoints; i++) pathPoints.push((i === 0 ? 'M' : 'L') + `${margin.left + i * xStep},${chartBottom - cumulativeData[i][seriesIndex + 1] * yScale}`);
    for (let i = numPoints - 1; i >= 0; i--) pathPoints.push(`L${margin.left + i * xStep},${chartBottom - cumulativeData[i][seriesIndex] * yScale}`);
    pathPoints.push('Z');
    const dotPoints = Array.from({ length: numPoints }, (_, i) => ({
      x: margin.left + i * xStep,
      y: chartBottom - cumulativeData[i][seriesIndex + 1] * yScale,
      value: series.values[i],
    }));
    return { color: series.color, label: series.label, path: pathPoints.join(' '), dotPoints };
  });

  // Compute label y positions with minimum vertical spacing per x column
  const minLabelSpacing = dataLabelFontSize + 3;
  const adjustedLabelY: number[][] = layers.map((layer) =>
    layer.dotPoints.map((pt) => Math.min(pt.y + dataLabelFontSize + 3, chartBottom - 2))
  );
  for (let i = 0; i < numPoints; i++) {
    // Collect [seriesIndex, rawY] sorted top-to-bottom
    const entries = layers.map((_, si) => ({ si, y: adjustedLabelY[si][i] }))
      .sort((a, b) => a.y - b.y);
    // Push labels down if too close to the one above
    for (let k = 1; k < entries.length; k++) {
      const gap = entries[k].y - entries[k - 1].y;
      if (gap < minLabelSpacing) entries[k].y = entries[k - 1].y + minLabelSpacing;
    }
    // Push labels up from bottom if they spilled past chartBottom
    for (let k = entries.length - 1; k >= 0; k--) {
      if (entries[k].y > chartBottom - 2) entries[k].y = chartBottom - 2;
      if (k > 0 && entries[k].y - entries[k - 1].y < minLabelSpacing)
        entries[k - 1].y = entries[k].y - minLabelSpacing;
    }
    for (const { si, y } of entries) adjustedLabelY[si][i] = y;
  }

  return (
    <div ref={elementRef} className="flex flex-col h-full w-full px-1 py-1 overflow-hidden">
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <svg width={width} height={height} className="w-full h-full overflow-visible">
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={chartBottom} stroke="#C7C7C7" strokeWidth="1" />
          <line x1={margin.left} y1={chartBottom} x2={width - margin.right} y2={chartBottom} stroke="#C7C7C7" strokeWidth="1" />
          {layers.map((layer, index) => (
            <path key={index} d={layer.path} fill={layer.color} fillOpacity="0.85" />
          ))}
          {layers.map((layer, seriesIndex) =>
            layer.dotPoints.map((pt, i) => (
              <text
                key={`label-${seriesIndex}-${i}`}
                x={pt.x}
                y={adjustedLabelY[seriesIndex][i]}
                textAnchor="middle"
                className="fill-dark font-body"
                style={{ fontSize: `${dataLabelFontSize}px` }}
              >
                {pt.value}
              </text>
            ))
          )}
          {categoryLabels.map((label, index) => (
            <text
              key={`stacked-x-label-${index}`}
              x={margin.left + index * xStep}
              y={chartBottom + 12}
              textAnchor="middle"
              className="fill-medium-gray font-body"
              style={{ fontSize: '9px' }}
            >
              {label}
            </text>
          ))}
          <text
            x={12}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${height / 2})`}
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
