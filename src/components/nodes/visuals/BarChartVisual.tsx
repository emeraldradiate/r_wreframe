import { useElementSize, resolveChartBounds, normalizeSeriesLength, getDefaultXAxisLabels, defaultBarData } from '../nodeUtils';

const buildAxisDomain = (values: number[], minPaddingRatio = 0.24, minPadding = 4) => {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values, 1);
  const spread = Math.max(1, maxValue - minValue);
  const domainPadding = Math.max(minPadding, spread * minPaddingRatio);
  const domainMin = Math.max(0, minValue - domainPadding);
  const domainMax = maxValue + domainPadding;

  return {
    domainMin,
    domainMax,
    range: Math.max(1, domainMax - domainMin),
  };
};

const formatAxisTick = (value: number, format?: 'currencyK') => {
  if (format === 'currencyK') {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
    return `$${formatted}k`;
  }

  if (Number.isInteger(value)) {
    return `${value}`;
  }

  return value.toFixed(1);
};

const estimateTextWidth = (text: string, fontSize: number) => text.length * fontSize * 0.58;

const formatBarDataLabel = (value: number, format?: 'currencyK') => {
  if (format === 'currencyK') {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
    return `$${formatted}k`;
  }

  return String(value);
};

const BarChartVisual = ({
  data = defaultBarData,
  axisLabels,
  xLabels,
  thirdAxisEnabled,
  thirdAxisData,
  dataLabelFormat,
  xAxisLabelRotation = 0,
}: {
  data?: number[];
  axisLabels?: { x?: string; y?: string; third?: string };
  xLabels?: string[];
  thirdAxisEnabled?: boolean;
  thirdAxisData?: number[];
  dataLabelFormat?: 'currencyK';
  xAxisLabelRotation?: number;
}) => {
  const { elementRef, size } = useElementSize<HTMLDivElement>();
  const hasThirdAxis = Boolean(thirdAxisEnabled && thirdAxisData?.length);
  const normalizedThirdAxisData = hasThirdAxis
    ? normalizeSeriesLength(
      thirdAxisData || [],
      data.length,
      thirdAxisData?.length ? thirdAxisData[thirdAxisData.length - 1] : 0,
    )
    : [];

  const barDomain = buildAxisDomain(data);
  const thirdDomain = hasThirdAxis
    ? buildAxisDomain(normalizedThirdAxisData, 0.2, 0.5)
    : null;

  const dataLabelFontSize = 9;
  const axisLabelFontSize = 10;
  const axisTitleFontSize = 12;
  const tickGap = 4;
  const titleInset = 14;
  const bottomTitleInset = 8;
  const categoryLabelOffsetFromAxis = 14;
  const labelToTitleGap = 6;
  const rotatedTitleFootprint = axisTitleFontSize + 6;
  const xAxisTitleBlock = bottomTitleInset + axisTitleFontSize + 2;
  const barTickValues = [barDomain.domainMin, barDomain.domainMin + barDomain.range / 2, barDomain.domainMax];
  const thirdTickValues = thirdDomain
    ? [thirdDomain.domainMin, thirdDomain.domainMin + thirdDomain.range / 2, thirdDomain.domainMax]
    : [];
  const maxLeftTickLabelWidth = Math.max(
    ...barTickValues.map((tick) => estimateTextWidth(formatAxisTick(tick, dataLabelFormat), axisLabelFontSize)),
    0,
  );
  const maxRightTickLabelWidth = hasThirdAxis
    ? Math.max(
      ...thirdTickValues.map((tick) => estimateTextWidth(formatAxisTick(tick), axisLabelFontSize)),
      0,
    )
    : 0;
  const categoryLabels = (xLabels?.length ? xLabels : getDefaultXAxisLabels(data.length)).slice(0, data.length);
  const slantedLabelHang = xAxisLabelRotation ? axisLabelFontSize + 4 : axisLabelFontSize + 8;
  const categoryLabelBand = xAxisLabelRotation
    ? categoryLabelOffsetFromAxis + slantedLabelHang
    : slantedLabelHang;
  const margin = {
    top: dataLabelFormat ? 20 : 12,
    left: Math.ceil(Math.max(36, maxLeftTickLabelWidth + tickGap + rotatedTitleFootprint + titleInset)),
    right: hasThirdAxis
      ? Math.ceil(Math.max(36, maxRightTickLabelWidth + tickGap + rotatedTitleFootprint + titleInset))
      : 30,
    bottom: xAxisLabelRotation
      ? xAxisTitleBlock + labelToTitleGap + categoryLabelBand
      : 44,
  };
  const { width, height, plotWidth, plotHeight } = resolveChartBounds({
    size,
    fallback: { width: 260, height: 180 },
    margin,
  });
  const valueToY = (value: number) => (
    margin.top + plotHeight - ((value - barDomain.domainMin) / barDomain.range) * plotHeight
  );
  const thirdValueToY = (value: number) => {
    if (!thirdDomain) {
      return valueToY(value);
    }

    return margin.top + plotHeight - ((value - thirdDomain.domainMin) / thirdDomain.range) * plotHeight;
  };
  const barSlot = plotWidth / Math.max(data.length, 1);
  const baselineY = valueToY(barDomain.domainMin);
  const referenceValue = hasThirdAxis
    && normalizedThirdAxisData.length > 0
    && normalizedThirdAxisData.every((value) => Math.abs(value - normalizedThirdAxisData[0]) < 0.01)
    ? normalizedThirdAxisData[0]
    : null;
  const isReferenceLine = referenceValue !== null;

  return (
    <div ref={elementRef} className="flex items-center justify-center h-full w-full px-2 py-1 overflow-hidden">
      <svg width={width} height={height} className="w-full h-full overflow-visible">
        {barTickValues.map((tick) => (
          <line
            key={`grid-${tick}`}
            x1={margin.left}
            y1={valueToY(tick)}
            x2={width - margin.right}
            y2={valueToY(tick)}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        ))}

        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#C7C7C7" strokeWidth="1" />
        <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#C7C7C7" strokeWidth="1" />
        {hasThirdAxis && (
          <line x1={width - margin.right} y1={margin.top} x2={width - margin.right} y2={height - margin.bottom} stroke="#111111" strokeWidth="1" />
        )}

        {barTickValues.map((tick) => (
          <text
            key={`left-tick-${tick}`}
            x={margin.left - tickGap}
            y={valueToY(tick) + 3}
            textAnchor="end"
            className="fill-medium-gray font-body"
            style={{ fontSize: `${axisLabelFontSize}px` }}
          >
            {formatAxisTick(tick, dataLabelFormat)}
          </text>
        ))}

        {hasThirdAxis && isReferenceLine && referenceValue !== null && (
          <text
            x={width - margin.right + tickGap}
            y={valueToY(referenceValue) + 3}
            textAnchor="start"
            className="fill-medium-gray font-body"
            style={{ fontSize: `${axisLabelFontSize}px` }}
          >
            {formatAxisTick(referenceValue, dataLabelFormat)}
          </text>
        )}

        {hasThirdAxis && !isReferenceLine && thirdTickValues.map((tick) => (
          <text
            key={`right-tick-${tick}`}
            x={width - margin.right + tickGap}
            y={thirdValueToY(tick) + 3}
            textAnchor="start"
            className="fill-black font-body"
            style={{ fontSize: `${axisLabelFontSize}px` }}
          >
            {formatAxisTick(tick)}
          </text>
        ))}

        {data.map((value, i) => {
          const barWidth = barSlot * 0.55;
          const x = margin.left + i * barSlot + (barSlot - barWidth) / 2;
          const y = valueToY(value);
          const barHeight = Math.max(1, baselineY - y);

          return (
            <rect
              key={`bar-${i}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="#D1D5DB"
              rx="1"
            />
          );
        })}

        {hasThirdAxis && isReferenceLine && referenceValue !== null && (
          <line
            x1={margin.left}
            y1={valueToY(referenceValue)}
            x2={width - margin.right}
            y2={valueToY(referenceValue)}
            stroke="#9CA3AF"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        )}

        {data.map((value, i) => {
          const barWidth = barSlot * 0.55;
          const x = margin.left + i * barSlot + (barSlot - barWidth) / 2;
          const y = valueToY(value);
          const labelX = x + barWidth / 2;

          return (
            <text
              key={`bar-label-${i}`}
              x={labelX}
              y={Math.max(y - 4, margin.top + 8)}
              textAnchor="middle"
              className="fill-dark font-body"
              style={{ fontSize: `${dataLabelFontSize}px` }}
            >
              {formatBarDataLabel(value, dataLabelFormat)}
            </text>
          );
        })}

        {categoryLabels.map((label, index) => {
          const labelX = margin.left + index * barSlot + barSlot / 2;
          const labelY = height - margin.bottom + (xAxisLabelRotation ? categoryLabelOffsetFromAxis : 12);

          return (
            <text
              key={`x-label-${index}`}
              x={labelX}
              y={labelY}
              textAnchor={xAxisLabelRotation ? 'end' : 'middle'}
              transform={xAxisLabelRotation ? `rotate(${xAxisLabelRotation} ${labelX} ${labelY})` : undefined}
              className="fill-black font-body"
              style={{ fontSize: `${axisLabelFontSize}px` }}
            >
              {label}
            </text>
          );
        })}

        {hasThirdAxis && !isReferenceLine && (
          <polyline
            points={normalizedThirdAxisData
              .map((value, i) => {
                const x = margin.left + i * barSlot + barSlot / 2;
                const y = thirdValueToY(value);
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
          y={height - bottomTitleInset}
          textAnchor="middle"
          className="fill-black font-semibold font-body"
          style={{ fontSize: `${axisTitleFontSize}px` }}
        >
          {axisLabels?.x ?? ''}
        </text>
        <text
          x={titleInset}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${titleInset} ${height / 2})`}
          className="fill-black font-semibold font-body"
          style={{ fontSize: `${axisTitleFontSize}px` }}
        >
          {axisLabels?.y || 'Y Axis'}
        </text>
        {hasThirdAxis && (
          <text
            x={width - titleInset}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(90 ${width - titleInset} ${height / 2})`}
            className="fill-black font-semibold font-body"
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
