import {
  useElementSize,
  resolveChartBounds,
  expectedRealityLabels,
  expectedRealityExpectedData,
  expectedRealityRealityData,
} from '../nodeUtils';

const ExpectedVsRealityChartVisual = ({
  axisLabels,
}: {
  axisLabels?: { x?: string; y?: string };
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

  const expectedValues = expectedRealityExpectedData;
  const realityValues = expectedRealityRealityData;
  const labels = expectedRealityLabels;
  const allValues = [...expectedValues, ...realityValues];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valuePadding = Math.max(4, Math.ceil((maxValue - minValue) * 0.12));
  const yMin = minValue - valuePadding;
  const yMax = maxValue + valuePadding;
  const safeRange = Math.max(1, yMax - yMin);
  const pointSpacing = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;

  const getPoint = (index: number, value: number) => ({
    x: margin.left + index * pointSpacing,
    y: margin.top + plotHeight - ((value - yMin) / safeRange) * plotHeight,
  });



  // Use a flat budget/expected line (first expected value)
  const flatExpectedValue = expectedValues.length > 0 ? expectedValues[0] : 0;
  // If you want a sloped budget line, use:
  // const expectedPoints = expectedValues.map((value, index) => getPoint(index, value));
  // For flat line:
  const expectedPoints = labels.map((_, index) => getPoint(index, flatExpectedValue));
  const realityPoints = realityValues.map((value, index) => getPoint(index, value));

  // Build separate area paths for above (green) and below (red) the expected line
  const buildAreaPaths = () => {
    if (expectedPoints.length !== realityPoints.length || expectedPoints.length === 0) {
      return { above: '', below: '' };
    }

    const abovePoints: Array<{ x: number; y: number }> = [];
    const belowPoints: Array<{ x: number; y: number }> = [];

    // Forward pass: trace along reality line, collecting points
    for (let i = 0; i < realityPoints.length; i += 1) {
      const isAbove = realityValues[i] >= flatExpectedValue;

      if (isAbove) {
        abovePoints.push(realityPoints[i]);
      } else {
        belowPoints.push(realityPoints[i]);
      }

      // Handle crossing between this point and the next
      if (i < realityPoints.length - 1) {
        const nextIsAbove = realityValues[i + 1] >= flatExpectedValue;
        if (isAbove !== nextIsAbove) {
          // Crossing occurs between i and i+1
          const t =
            (flatExpectedValue - realityValues[i]) /
            (realityValues[i + 1] - realityValues[i]);
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
      const isAbove = realityValues[i] >= flatExpectedValue;

      if (isAbove) {
        abovePoints.push(expectedPoints[i]);
      } else {
        belowPoints.push(expectedPoints[i]);
      }

      // Handle crossing between this point and the previous
      if (i > 0) {
        const prevIsAbove = realityValues[i - 1] >= flatExpectedValue;
        if (isAbove !== prevIsAbove) {
          // Crossing occurs between i-1 and i
          const t =
            (flatExpectedValue - realityValues[i - 1]) /
            (realityValues[i] - realityValues[i - 1]);
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
            stroke="#6B7280"
            strokeWidth="2.2"
          />

          {/* Budget (expected) line is intentionally not rendered (completely clear) */}

          {realityPoints.map((point, index) => {
            const diff = realityValues[index] - flatExpectedValue;
            const label = diff < 0 ? `(${Math.abs(diff)})` : `${diff}`;
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

          {labels.map((label, index) => (
            <text
              key={`label-${index}`}
              x={margin.left + index * pointSpacing}
              y={height - margin.bottom + 12}
              textAnchor="middle"
              className="fill-medium-gray font-body"
              style={{ fontSize: `${axisLabelFontSize}px` }}
            >
              {label}
            </text>
          ))}

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
        </svg>
      </div>
    </div>
  );
};

export default ExpectedVsRealityChartVisual;
