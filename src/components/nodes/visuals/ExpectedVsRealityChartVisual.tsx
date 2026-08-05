import {
  useElementSize,
  resolveChartBounds,
  expectedRealityLabels,
  expectedRealityExpectedData,
  expectedRealityRealityData,
} from '../nodeUtils';

const ExpectedVsRealityChartVisual = ({
  axisLabels,
  pointLabelFormat,
  labels: labelsProp,
  displayLabelIndices,
  expectedValues: expectedValuesProp,
  realityValues: realityValuesProp,
  showBudgetLine = true,
}: {
  axisLabels?: { x?: string; y?: string };
  pointLabelFormat?: 'difference' | 'currencyK';
  labels?: string[];
  displayLabelIndices?: number[];
  expectedValues?: number[];
  realityValues?: number[];
  showBudgetLine?: boolean;
}) => {
  const { elementRef, size } = useElementSize<HTMLDivElement>();
  const margin = { top: 8, right: 24, bottom: 38, left: 34 };
  const { width, height, plotWidth, plotHeight } = resolveChartBounds({
    size,
    fallback: { width: 280, height: 190 },
    margin,
  });
  const dataLabelFontSize = 9;
  const axisLabelFontSize = 10;
  const axisTitleFontSize = 12;

  const expectedValues = expectedValuesProp?.length ? expectedValuesProp : expectedRealityExpectedData;
  const realityValues = realityValuesProp?.length ? realityValuesProp : expectedRealityRealityData;
  const labels = labelsProp?.length ? labelsProp : expectedRealityLabels;
  const pointCount = Math.max(expectedValues.length, realityValues.length, labels.length);
  const axisLabelIndices = displayLabelIndices?.length
    ? displayLabelIndices
    : Array.from({ length: pointCount }, (_, index) => index);
  const axisLabelsByIndex = new Map(axisLabelIndices.map((index, labelIndex) => [index, labels[labelIndex] || `${labelIndex + 1}`]));
  const normalizedExpected = Array.from({ length: pointCount }, (_, index) => {
    const parsed = Number(expectedValues[index]);
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const normalizedReality = Array.from({ length: pointCount }, (_, index) => {
    const parsed = Number(realityValues[index]);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    const prior = index > 0 ? Number(realityValues[index - 1]) : 0;
    return Number.isFinite(prior) ? prior : 0;
  });
  const allValues = [...normalizedExpected, ...normalizedReality];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valuePadding = Math.max(4, Math.ceil((maxValue - minValue) * 0.12));
  const yMin = minValue - valuePadding;
  const yMax = maxValue + valuePadding;
  const safeRange = Math.max(1, yMax - yMin);
  const pointSpacing = pointCount > 1 ? plotWidth / (pointCount - 1) : 0;

  const getPoint = (index: number, value: number) => ({
    x: margin.left + index * pointSpacing,
    y: margin.top + plotHeight - ((value - yMin) / safeRange) * plotHeight,
  });



  // Use a flat budget/expected line (first expected value)
  const flatExpectedValue = normalizedExpected.length > 0 ? normalizedExpected[0] : 0;
  const expectedPoints = Array.from({ length: pointCount }, (_, index) => getPoint(index, flatExpectedValue));
  const realityPoints = normalizedReality.map((value, index) => getPoint(index, value));

  // Build separate area paths for above (green) and below (red) the expected line
  const buildAreaPaths = () => {
    if (expectedPoints.length !== realityPoints.length || expectedPoints.length === 0) {
      return { above: '', below: '' };
    }

    const abovePoints: Array<{ x: number; y: number }> = [];
    const belowPoints: Array<{ x: number; y: number }> = [];

    // Forward pass: trace along reality line, collecting points
    for (let i = 0; i < realityPoints.length; i += 1) {
      const isAbove = normalizedReality[i] >= flatExpectedValue;

      if (isAbove) {
        abovePoints.push(realityPoints[i]);
      } else {
        belowPoints.push(realityPoints[i]);
      }

      // Handle crossing between this point and the next
      if (i < realityPoints.length - 1) {
        const nextIsAbove = normalizedReality[i + 1] >= flatExpectedValue;
        if (isAbove !== nextIsAbove) {
          const t =
            (flatExpectedValue - normalizedReality[i]) /
            (normalizedReality[i + 1] - normalizedReality[i]);
          const crossX = realityPoints[i].x + t * (realityPoints[i + 1].x - realityPoints[i].x);
          const crossY = realityPoints[i].y + t * (realityPoints[i + 1].y - realityPoints[i].y);
          if (isAbove) {
            abovePoints.push({ x: crossX, y: crossY });
          } else {
            belowPoints.push({ x: crossX, y: crossY });
          }
        }
      }
    }

    // Backward pass: trace along expected line in reverse, closing the polygons
    for (let i = expectedPoints.length - 1; i >= 0; i -= 1) {
      const isAbove = normalizedReality[i] >= flatExpectedValue;

      if (isAbove) {
        abovePoints.push(expectedPoints[i]);
      } else {
        belowPoints.push(expectedPoints[i]);
      }

      // Handle crossing between this point and the previous
      if (i > 0) {
        const prevIsAbove = normalizedReality[i - 1] >= flatExpectedValue;
        if (isAbove !== prevIsAbove) {
          const t =
            (flatExpectedValue - normalizedReality[i - 1]) /
            (normalizedReality[i] - normalizedReality[i - 1]);
          const crossX =
            realityPoints[i - 1].x + t * (realityPoints[i].x - realityPoints[i - 1].x);
          const crossY =
            realityPoints[i - 1].y + t * (realityPoints[i].y - realityPoints[i - 1].y);
          if (isAbove) {
            abovePoints.push({ x: crossX, y: crossY });
          } else {
            belowPoints.push({ x: crossX, y: crossY });
          }
        }
      }
    }

    // Build SVG path strings
    const pointsToPath = (points: Array<{ x: number; y: number }>) => {
      if (points.length === 0) return '';
      const pathStr = points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
      return `${pathStr} Z`;
    };

    return { above: pointsToPath(abovePoints), below: pointsToPath(belowPoints) };
  };

  const { above: aboveAreaPath, below: belowAreaPath } = buildAreaPaths();

  return (
    <div ref={elementRef} className="flex flex-col h-full w-full px-1 py-1 overflow-hidden">
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <svg width={width} height={height} className="w-full h-full overflow-visible">
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotHeight} stroke="#C7C7C7" strokeWidth="1" />
          <line x1={margin.left} y1={margin.top + plotHeight} x2={width - margin.right} y2={margin.top + plotHeight} stroke="#C7C7C7" strokeWidth="1" />

          {/* Green area above expected line, red area below */}
          {aboveAreaPath && <path d={aboveAreaPath} fill="rgba(16, 185, 129, 0.24)" />}
          {belowAreaPath && <path d={belowAreaPath} fill="rgba(220, 38, 38, 0.22)" />}

          {/* Reality (actual) line */}
          <polyline
            points={realityPoints.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke="#000000"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {showBudgetLine && (
            <polyline
              points={expectedPoints.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke="transparent"
              strokeWidth="2"
            />
          )}

          {realityPoints.map((point, index) => {
            if (!axisLabelsByIndex.has(index)) {
              return null;
            }
            const diff = normalizedReality[index] - flatExpectedValue;
            const label = pointLabelFormat === 'currencyK'
              ? (diff < 0 ? `($${Math.abs(diff)}k)` : `$${diff}k`)
              : (diff < 0 ? `(${Math.abs(diff)})` : `${diff}`);
            const isBelow = diff < 0;
            return (
              <text
                key={`data-label-${index}`}
                x={point.x}
                y={Math.max(point.y - 6, margin.top + 8)}
                textAnchor="middle"
                className={`font-body ${isBelow ? 'fill-red-500' : 'fill-emerald-600'}`}
                style={{ fontSize: `${dataLabelFontSize}px` }}
              >
                {label}
              </text>
            );
          })}

          {axisLabelIndices.map((index) => (
            <text
              key={`label-${index}`}
              x={margin.left + index * pointSpacing}
              y={height - margin.bottom + 12}
              textAnchor="middle"
              className="fill-black font-body"
              style={{ fontSize: `${axisLabelFontSize}px` }}
            >
              {axisLabelsByIndex.get(index) || ''}
            </text>
          ))}

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
            x={12}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${height / 2})`}
            className="fill-black font-semibold font-body"
            style={{ fontSize: `${axisTitleFontSize}px` }}
          >
            {axisLabels?.y || 'Y Axis'}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default ExpectedVsRealityChartVisual;
