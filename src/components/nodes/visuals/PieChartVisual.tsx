import { CHART_COLOR_PALETTE } from '../nodeUtils';

interface PieChartVisualProps {
  data?: number[];
  labels?: string[];
}

const isDarkColor = (hexColor: string) => {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5;
};

const PieChartVisual = ({ data = [45, 30, 25] }: PieChartVisualProps) => {
  const sanitized = data.map((value) => Math.max(1, Math.round(value)));
  const total = sanitized.reduce((a, b) => a + b, 0);
  let currentAngle = 0;
  const slices = sanitized.map((value, i) => {
    const angle = (value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const x1 = 100 + 65 * Math.cos((Math.PI * startAngle) / 180);
    const y1 = 100 + 65 * Math.sin((Math.PI * startAngle) / 180);
    const x2 = 100 + 65 * Math.cos((Math.PI * currentAngle) / 180);
    const y2 = 100 + 65 * Math.sin((Math.PI * currentAngle) / 180);

    const midAngle = startAngle + angle / 2;
    const percentX = 100 + 38 * Math.cos((Math.PI * midAngle) / 180);
    const percentY = 100 + 38 * Math.sin((Math.PI * midAngle) / 180);
    const pct = Math.round((value / total) * 100);
    const sliceColor = CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length];
    const pctColor = isDarkColor(sliceColor) ? '#FFFFFF' : '#2F2F2F';

    return {
      index: i,
      angle,
      x1,
      y1,
      x2,
      y2,
      percentX,
      percentY,
      pct,
      sliceColor,
      pctColor,
    };
  });

  return (
    <div className="flex items-center justify-center h-full w-full relative z-10">
      <svg width="100%" height="100%" viewBox="30 30 150 150" preserveAspectRatio="xMidYMid meet">
        {slices.map((slice) => (
          <path
            key={`slice-${slice.index}`}
            d={`M 100 100 L ${slice.x1} ${slice.y1} A 65 65 0 ${slice.angle > 180 ? 1 : 0} 1 ${slice.x2} ${slice.y2} Z`}
            fill={slice.sliceColor}
          />
        ))}
        {slices.map((slice) => (
          <text
            key={`pct-${slice.index}`}
            x={slice.percentX}
            y={slice.percentY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={slice.pctColor}
            className="font-body"
            fontSize="9"
            fontWeight="700"
          >
            {slice.pct}%
          </text>
        ))}
      </svg>
    </div>
  );
};

export default PieChartVisual;
