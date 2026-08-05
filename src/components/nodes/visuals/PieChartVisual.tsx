import { CHART_COLOR_PALETTE } from '../nodeUtils';

interface PieChartVisualProps {
  data?: number[];
  labels?: string[];
  colors?: string[];
  scalePercent?: number;
  showCalloutLabels?: boolean;
  valueFormat?: 'currencyK';
  showLegend?: boolean;
  offsetX?: number;
  offsetY?: number;
}

const clampPieOffset = (value: number | undefined) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(-100, Math.round(parsed)));
};

const CENTER = 100;
const PIE_RADIUS = 58;
const INSIDE_LABEL_RADIUS = 38;
const OUTSIDE_LINE_RADIUS = 70;
const OUTSIDE_TEXT_X_RIGHT = 194;
const OUTSIDE_TEXT_X_LEFT = 6;
const OUTSIDE_MIN_Y = 12;
const OUTSIDE_MAX_Y = 188;
const OUTSIDE_LABEL_SPACING = 13;
const CALLOUT_MIN_PERCENT = 5;

const isDarkColor = (hexColor: string) => {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const distributeCalloutY = (ys: number[]) => {
  if (!ys.length) return [];

  const sorted = [...ys].sort((a, b) => a - b);
  if (sorted.length === 1) {
    return [clamp(sorted[0], OUTSIDE_MIN_Y, OUTSIDE_MAX_Y)];
  }

  const span = OUTSIDE_MAX_Y - OUTSIDE_MIN_Y;
  const spacing = Math.min(OUTSIDE_LABEL_SPACING, span / (sorted.length - 1));
  const naturalCenter = sorted.reduce((sum, y) => sum + y, 0) / sorted.length;
  const totalHeight = spacing * (sorted.length - 1);
  const start = clamp(naturalCenter - totalHeight / 2, OUTSIDE_MIN_Y, OUTSIDE_MAX_Y - totalHeight);

  return sorted.map((_, i) => start + i * spacing);
};

const clampPieScalePercent = (value: number) => Math.min(200, Math.max(100, Math.round(value)));
const formatPiePercentLabel = (value: number) => {
  if (value === 0) return '0%';
  if (value < 5) return `${value.toFixed(1)}%`;
  return `${Math.round(value)}%`;
};

const formatPieCurrencyK = (value: number) => `$${(value / 1000).toFixed(1)}k`;

const getDefaultPieLabel = (index: number) => `Slice ${index + 1}`;

const PieChartVisual = ({
  data = [45, 30, 25],
  labels,
  colors,
  scalePercent = 100,
  showCalloutLabels = false,
  valueFormat,
  showLegend = false,
  offsetX = 0,
  offsetY = 0,
}: PieChartVisualProps) => {
  const scaleFactor = clampPieScalePercent(scalePercent) / 100;
  const pieOffsetX = clampPieOffset(offsetX);
  const pieOffsetY = clampPieOffset(offsetY);
  const sanitized = data.map((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });
  const total = sanitized.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let currentAngle = 0;
  const slices = sanitized.map((value, i) => {
    const angle = (value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const x1 = CENTER + PIE_RADIUS * Math.cos((Math.PI * startAngle) / 180);
    const y1 = CENTER + PIE_RADIUS * Math.sin((Math.PI * startAngle) / 180);
    const x2 = CENTER + PIE_RADIUS * Math.cos((Math.PI * currentAngle) / 180);
    const y2 = CENTER + PIE_RADIUS * Math.sin((Math.PI * currentAngle) / 180);

    const midAngle = startAngle + angle / 2;
    const rad = (Math.PI * midAngle) / 180;
    const percentX = CENTER + INSIDE_LABEL_RADIUS * Math.cos(rad);
    const percentY = CENTER + INSIDE_LABEL_RADIUS * Math.sin(rad);
    const calloutStartX = CENTER + PIE_RADIUS * Math.cos(rad);
    const calloutStartY = CENTER + PIE_RADIUS * Math.sin(rad);
    const calloutElbowX = CENTER + OUTSIDE_LINE_RADIUS * Math.cos(rad);
    const calloutElbowY = CENTER + OUTSIDE_LINE_RADIUS * Math.sin(rad);
    const calloutSide: 'left' | 'right' = Math.cos(rad) >= 0 ? 'right' : 'left';
    const calloutTextX = calloutSide === 'right' ? OUTSIDE_TEXT_X_RIGHT : OUTSIDE_TEXT_X_LEFT;
    const rawPct = (value / total) * 100;
    const pct = Math.round(rawPct);
    const pctLabel = formatPiePercentLabel(rawPct);
    const valueLabel = valueFormat === 'currencyK' ? formatPieCurrencyK(value) : undefined;
    const sliceColor = colors?.[i] || CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length];
    const pctColor = isDarkColor(sliceColor) ? '#FFFFFF' : '#2F2F2F';
    const isTinySlice = rawPct < CALLOUT_MIN_PERCENT;
    const sliceLabel = labels?.[i]?.trim() || getDefaultPieLabel(i);

    return {
      index: i,
      sliceLabel,
      angle,
      x1,
      y1,
      x2,
      y2,
      percentX,
      percentY,
      calloutStartX,
      calloutStartY,
      calloutElbowX,
      calloutElbowY,
      calloutSide,
      calloutTextX,
      pct,
      pctLabel,
      valueLabel,
      sliceColor,
      pctColor,
      isTinySlice,
    };
  });

  const rightTiny = slices
    .filter((slice) => slice.isTinySlice && slice.calloutSide === 'right')
    .sort((a, b) => a.calloutElbowY - b.calloutElbowY);
  const leftTiny = slices
    .filter((slice) => slice.isTinySlice && slice.calloutSide === 'left')
    .sort((a, b) => a.calloutElbowY - b.calloutElbowY);

  const rightY = distributeCalloutY(rightTiny.map((slice) => slice.calloutElbowY));
  const leftY = distributeCalloutY(leftTiny.map((slice) => slice.calloutElbowY));

  const tinyLabelY = new Map<number, number>();
  rightTiny.forEach((slice, idx) => tinyLabelY.set(slice.index, rightY[idx]));
  leftTiny.forEach((slice, idx) => tinyLabelY.set(slice.index, leftY[idx]));

  return (
    <div className="relative z-10 flex h-full w-full items-center justify-center">
      {showLegend && (
        <div className="absolute right-2 top-1 z-20 flex flex-col items-end gap-1">
          {slices.map((slice) => (
            <div key={`legend-${slice.index}`} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
                style={{ backgroundColor: slice.sliceColor }}
                aria-hidden="true"
              />
              <span className="font-body text-[9px] leading-none text-black">{slice.sliceLabel}</span>
            </div>
          ))}
        </div>
      )}
      <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
        <g transform={`translate(${pieOffsetX} ${pieOffsetY}) translate(${CENTER} ${CENTER}) scale(${scaleFactor}) translate(${-CENTER} ${-CENTER})`}>
        {slices.map((slice) => (
          <path
            key={`slice-${slice.index}`}
            d={`M ${CENTER} ${CENTER} L ${slice.x1} ${slice.y1} A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${slice.angle > 180 ? 1 : 0} 1 ${slice.x2} ${slice.y2} Z`}
            fill={slice.sliceColor}
          />
        ))}
        {slices.map((slice) => {
          if (slice.isTinySlice) {
            const labelY = tinyLabelY.get(slice.index) ?? slice.calloutElbowY;
            const isRight = slice.calloutSide === 'right';

            return (
              <g key={`callout-${slice.index}`}>
                {!showCalloutLabels && (
                  <line
                    x1={slice.calloutStartX}
                    y1={slice.calloutStartY}
                    x2={slice.calloutTextX}
                    y2={labelY}
                    stroke={slice.sliceColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                )}
                {showCalloutLabels && (
                  <text
                    x={slice.calloutElbowX + (isRight ? 2 : -2)}
                    y={labelY}
                    textAnchor={isRight ? 'start' : 'end'}
                    dominantBaseline="middle"
                    fill={slice.sliceColor}
                    className="font-body"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {slice.sliceLabel}
                  </text>
                )}
                <text
                  x={slice.calloutTextX + (isRight ? 3 : -3)}
                  y={labelY}
                  textAnchor={isRight ? 'start' : 'end'}
                  dominantBaseline="middle"
                  fill="#000000"
                  className="font-body"
                  fontSize="10"
                  fontWeight="700"
                >
                  {slice.valueLabel ? (
                    <>
                      <tspan x={slice.calloutTextX + (isRight ? 3 : -3)} dy="0">{slice.pctLabel}</tspan>
                      <tspan x={slice.calloutTextX + (isRight ? 3 : -3)} dy="11" fontSize="8" fontWeight="600">{slice.valueLabel}</tspan>
                    </>
                  ) : (
                    slice.pctLabel
                  )}
                </text>
              </g>
            );
          }

          return (
            <text
              key={`pct-${slice.index}`}
              x={slice.percentX}
              y={slice.percentY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={slice.pctColor}
              className="font-body"
              fontSize="10"
              fontWeight="700"
            >
              {slice.valueLabel ? (
                <>
                  <tspan x={slice.percentX} dy="-0.35em">{slice.pctLabel}</tspan>
                  <tspan x={slice.percentX} dy="1.15em" fontSize="8" fontWeight="600">{slice.valueLabel}</tspan>
                </>
              ) : (
                slice.pctLabel
              )}
            </text>
          );
        })}
        </g>
      </svg>
    </div>
  );
};

export default PieChartVisual;
