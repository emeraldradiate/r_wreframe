import { useElementSize, resolveChartBounds, normalizeSeriesLength, getDefaultXAxisLabels, defaultBarData } from '../nodeUtils';

const BarChartVisual = ({
  data = defaultBarData,
  axisLabels,
  xLabels,
  thirdAxisEnabled,
  thirdAxisData,
}: {
  data?: number[];
  axisLabels?: { x?: string; y?: string; third?: string };
  xLabels?: string[];
  thirdAxisEnabled?: boolean;
  thirdAxisData?: number[];
}) => {
  const { elementRef, size } = useElementSize<HTMLDivElement>();
  const hasThirdAxis = Boolean(thirdAxisEnabled && thirdAxisData?.length);
  const max = Math.max(...data, 1);
  const safeThirdAxisData = hasThirdAxis ? normalizeSeriesLength(thirdAxisData || [], data.length, max) : [];
  const combinedSeries = hasThirdAxis ? [...data, ...safeThirdAxisData] : data;
  const minValue = Math.min(...combinedSeries);
  const maxValue = Math.max(...combinedSeries);
  const spread = Math.max(1, maxValue - minValue);
  const domainPadding = Math.max(4, Math.ceil(spread * 0.24));
  const domainMin = Math.max(0, minValue - domainPadding);
  const domainMax = maxValue + domainPadding;
  const safeRange = Math.max(1, domainMax - domainMin);
  const margin = { top: 12, right: hasThirdAxis ? 44 : 30, bottom: 40, left: 32 };
  const { width, height, plotWidth, plotHeight } = resolveChartBounds({
    size,
    fallback: { width: 260, height: 180 },
    margin,
  });
  const valueToY = (value: number) => margin.top + plotHeight - ((value - domainMin) / safeRange) * plotHeight;
  const barSlot = plotWidth / Math.max(data.length, 1);
  const tickValues = [domainMin, domainMin + safeRange / 2, domainMax];
  const categoryLabels = (xLabels?.length ? xLabels : getDefaultXAxisLabels(data.length)).slice(0, data.length);
  const dataLabelFontSize = 9, axisLabelFontSize = 10, axisTitleFontSize = 12;
  const baselineY = valueToY(domainMin);

  return (
    <div ref={elementRef} className="flex items-center justify-center h-full w-full px-1 py-1 overflow-hidden">
      <svg width={width} height={height} className="w-full h-full overflow-visible">
        {tickValues.map((tick) => (
          <line key={tick} x1={margin.left} y1={valueToY(tick)} x2={width - margin.right} y2={valueToY(tick)} stroke="#E5E7EB" strokeWidth="1" />
        ))}

        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#C7C7C7" strokeWidth="1" />
        <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#C7C7C7" strokeWidth="1" />
        {hasThirdAxis && (
          <line x1={width - margin.right} y1={margin.top} x2={width - margin.right} y2={height - margin.bottom} stroke="#111111" strokeWidth="1" />
        )}

        {data.map((value, i) => {
          const barWidth = barSlot * 0.55;
          const x = margin.left + i * barSlot + (barSlot - barWidth) / 2;
          const y = valueToY(value);
          const barHeight = Math.max(1, baselineY - y);
          const labelX = x + barWidth / 2;
          const isLastPoint = i === data.length - 1;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#D1D5DB"
                rx="1"
              />
              {isLastPoint && (
                <text
                  x={labelX}
                  y={Math.max(y - 4, margin.top + 8)}
                  textAnchor="middle"
                  className="fill-dark font-body"
                  style={{ fontSize: `${dataLabelFontSize}px` }}
                >
                  {value}
                </text>
              )}
            </g>
          );
        })}

        {categoryLabels.map((label, index) => (
          <text key={`x-label-${index}`} x={margin.left + index * barSlot + barSlot / 2} y={height - margin.bottom + 12} textAnchor="middle" className="fill-medium-gray font-body" style={{ fontSize: `${axisLabelFontSize}px` }}>
            {label}
          </text>
        ))}

        {hasThirdAxis && (
          <polyline
            points={safeThirdAxisData
              .map((value, i) => {
                const x = margin.left + i * barSlot + barSlot / 2;
                const y = valueToY(value);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#111111"
            strokeWidth="2"
          />
        )}

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
        {hasThirdAxis && (
          <text
            x={width - 12}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(90 ${width - 12} ${height / 2})`}
            className="fill-[#111111] font-semibold font-body"
            style={{ fontSize: `${axisTitleFontSize}px` }}
          >
            {axisLabels?.third || 'Third Axis'}
          </text>
        )}
      </svg>
    </div>
  );
};

export default BarChartVisual;
