import { useElementSize, resolveChartBounds, defaultLineData, getDefaultXAxisLabels } from '../nodeUtils';

const LineChartVisual = ({
  data = defaultLineData,
  axisLabels,
  xLabels,
  hideAxesAndBackground,
}: {
  data?: number[];
  axisLabels?: { x?: string; y?: string };
  xLabels?: string[];
  hideAxesAndBackground?: boolean;
}) => {
  const { elementRef, size } = useElementSize<HTMLDivElement>();
  const min = Math.min(...data), max = Math.max(...data), range = max - min;
  const margin = hideAxesAndBackground ? { top: 24, right: 24, bottom: 30, left: 24 } : { top: 12, right: 30, bottom: 40, left: 30 };
  const { width, height, plotWidth, plotHeight } = resolveChartBounds({
    size,
    fallback: { width: 260, height: 180 },
    margin,
  });
  const pointSpacing = data.length > 1 ? plotWidth / (data.length - 1) : 0, tickValues = [min, min + range / 2, max];
  const dataLabelFontSize = 9, axisLabelFontSize = 10, axisTitleFontSize = 12;
  const categoryLabels = (xLabels?.length ? xLabels : getDefaultXAxisLabels(data.length)).slice(0, data.length);

  const getYForValue = (value: number) => range === 0 ? margin.top + plotHeight / 2 : margin.top + plotHeight - ((value - min) / range) * plotHeight;

  const points = data.map((value, i) => ({ x: margin.left + i * pointSpacing, y: getYForValue(value), value }));

  return (
    <div ref={elementRef} className="flex items-center justify-center h-full w-full px-1 py-1 overflow-hidden">
      <svg width={width} height={height} className="w-full h-full overflow-visible">
        {!hideAxesAndBackground && tickValues.map((tick) => (
          <line key={tick} x1={margin.left} y1={getYForValue(tick)} x2={width - margin.right} y2={getYForValue(tick)} stroke="#E5E7EB" strokeWidth="1" />
        ))}

        {!hideAxesAndBackground && (
          <>
            <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#C7C7C7" strokeWidth="1" />
            <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#C7C7C7" strokeWidth="1" />
          </>
        )}

        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke="#EA0029"
          strokeWidth="2"
        />

        {points.map((point, i) => (
          <g key={i}>
            <text
              x={point.x}
              y={Math.max(point.y - 6, margin.top + 8)}
              textAnchor="middle"
              className="fill-dark font-body"
              style={{ fontSize: `${dataLabelFontSize}px` }}
            >
              {point.value}
            </text>
          </g>
        ))}

        {categoryLabels.map((label, index) => (
          <text key={`x-label-${index}`} x={margin.left + index * pointSpacing} y={height - margin.bottom + 12} textAnchor="middle" className="fill-medium-gray font-body" style={{ fontSize: `${axisLabelFontSize}px` }}>
            {label}
          </text>
        ))}

        {!hideAxesAndBackground && (
          <>
            <text
              x={width / 2}
              y={height - 2}
              textAnchor="middle"
              className="fill-medium-gray font-semibold font-body"
              style={{ fontSize: `${axisTitleFontSize}px` }}
            >
              {axisLabels?.x || 'X Axis'}
            </text>
            <text
              x={12}
              y={height / 2}
              textAnchor="middle"
              transform={`rotate(-90 12 ${height / 2})`}
              className="fill-medium-gray font-semibold font-body"
              style={{ fontSize: `${axisTitleFontSize}px` }}
            >
              {axisLabels?.y || 'Y Axis'}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

export default LineChartVisual;
