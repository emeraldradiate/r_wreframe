import { useElementSize, resolveChartBounds, defaultLineData, getDefaultXAxisLabels, CHART_COLOR_PALETTE, normalizeSeriesLength } from '../nodeUtils';

const LineChartVisual = ({
  data = defaultLineData,
  seriesData,
  seriesLabels,
  seriesColors,
  seriesDashed,
  axisLabels,
  xLabels,
  hideAxesAndBackground,
  dataLabelFormat,
}: {
  data?: number[];
  seriesData?: number[][];
  seriesLabels?: string[];
  seriesColors?: string[];
  seriesDashed?: boolean[];
  axisLabels?: { x?: string; y?: string };
  xLabels?: string[];
  hideAxesAndBackground?: boolean;
  dataLabelFormat?: 'currencyK';
}) => {
  const { elementRef, size } = useElementSize<HTMLDivElement>();
  const hasMultipleSeries = Boolean(seriesData?.length);
  const safeSeriesData = hasMultipleSeries
    ? (seriesData || []).map((series) => series.map((value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }))
    : [data];
  const numPoints = Math.max(...safeSeriesData.map((series) => series.length), 2);
  const normalizedSeries = safeSeriesData.map((series, index) => ({
    values: normalizeSeriesLength(series, numPoints, series.length ? series[series.length - 1] : 0),
    label: seriesLabels?.[index] || `Series ${index + 1}`,
    color: seriesColors?.[index] || CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length] || '#EA0029',
    dashed: Boolean(seriesDashed?.[index]),
  }));
  const showLegend = hasMultipleSeries && Boolean(seriesLabels?.length);
  const allValues = normalizedSeries.flatMap((series) => series.values);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const dataRange = dataMax - dataMin;
  const axisPadding = dataRange === 0 ? Math.max(Math.abs(dataMin) * 0.1, 1) : dataRange * 0.1;
  const min = dataMin - axisPadding;
  const max = dataMax + axisPadding;
  const range = max - min;
  const margin = hideAxesAndBackground
    ? { top: 16, right: 20, bottom: 28, left: 20 }
    : { top: 3, right: 20, bottom: 36, left: 42 };
  const { width, height, plotWidth, plotHeight } = resolveChartBounds({
    size,
    fallback: { width: 260, height: 180 },
    margin,
  });
  const pointSpacing = numPoints > 1 ? plotWidth / (numPoints - 1) : 0, tickValues = [min, min + range / 2, max];
  const dataLabelFontSize = 9, axisLabelFontSize = 10, axisTitleFontSize = 12;
  const categoryLabels = (xLabels?.length ? xLabels : getDefaultXAxisLabels(numPoints)).slice(0, numPoints);

  const getYForValue = (value: number) => range === 0 ? margin.top + plotHeight / 2 : margin.top + plotHeight - ((value - min) / range) * plotHeight;

  const formatDataLabel = (value: number) => {
    if (dataLabelFormat === 'currencyK') {
      const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
      return `$${formatted}k`;
    }

    return String(value);
  };

  const pointsBySeries = normalizedSeries.map((series) => series.values.map((value, i) => ({
    x: margin.left + i * pointSpacing,
    y: getYForValue(value),
    value,
  })));

  return (
    <div className="flex flex-col items-center h-full w-full px-1 py-1 overflow-hidden">
      {showLegend && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 pt-1 text-[10px] leading-none text-dark font-body">
          {normalizedSeries.map((series, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-1">
              <svg width="18" height="8" className="overflow-visible">
                <line
                  x1="0"
                  y1="4"
                  x2="18"
                  y2="4"
                  stroke={series.color}
                  strokeWidth="2"
                  strokeDasharray={series.dashed ? '3 2' : undefined}
                />
              </svg>
              <span>{series.label}</span>
            </div>
          ))}
        </div>
      )}
      <div ref={elementRef} className="min-h-0 w-full flex-1">
        <svg width={width} height={height} className="block h-full w-full">
        {!hideAxesAndBackground && tickValues.map((tick) => (
          <line key={tick} x1={margin.left} y1={getYForValue(tick)} x2={width - margin.right} y2={getYForValue(tick)} stroke="#E5E7EB" strokeWidth="1" />
        ))}

        {!hideAxesAndBackground && (
          <>
            <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#C7C7C7" strokeWidth="1" />
            <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#C7C7C7" strokeWidth="1" />
          </>
        )}

        {pointsBySeries.map((seriesPoints, seriesIndex) => (
          <polyline
            key={`line-series-${seriesIndex}`}
            points={seriesPoints.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke={normalizedSeries[seriesIndex].color}
            strokeWidth={hasMultipleSeries ? '1.75' : '2'}
            strokeDasharray={normalizedSeries[seriesIndex].dashed ? '4 3' : undefined}
          />
        ))}

        {!hasMultipleSeries && pointsBySeries[0].map((point, i) => {
          if (!categoryLabels[i]?.trim()) return null;

          return (
          <g key={i}>
            <text
              x={point.x}
              y={Math.max(point.y - 6, margin.top + 8)}
              textAnchor="middle"
              className="fill-dark font-body"
              style={{ fontSize: `${dataLabelFontSize}px` }}
            >
              {formatDataLabel(point.value)}
            </text>
          </g>
          );
        })}

        {categoryLabels.map((label, index) => (
          <text key={`x-label-${index}`} x={margin.left + index * pointSpacing} y={height - margin.bottom + 12} textAnchor="middle" className="fill-black font-body" style={{ fontSize: `${axisLabelFontSize}px` }}>
            {label}
          </text>
        ))}

        {!hideAxesAndBackground && (
          <>
            <text
              x={width / 2}
              y={height - 2}
              textAnchor="middle"
              className="fill-black font-semibold font-body"
              style={{ fontSize: `${axisTitleFontSize}px` }}
            >
              {axisLabels?.x || 'X Axis'}
            </text>
            <text
              x={16}
              y={height / 2}
              textAnchor="middle"
              transform={`rotate(-90 16 ${height / 2})`}
              className="fill-black font-semibold font-body"
              style={{ fontSize: `${axisTitleFontSize}px` }}
            >
              {axisLabels?.y || 'Y Axis'}
            </text>
          </>
        )}
        </svg>
      </div>
    </div>
  );
};

export default LineChartVisual;
