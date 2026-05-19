interface PieChartVisualProps {
  data?: number[];
  labels?: string[];
}

const pieColors = ['#EA0029', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'];

const isDarkColor = (hexColor: string) => {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5;
};

const wrapLabel = (text: string, maxLineLength = 14) => {
  const words = text.split(' ').filter(Boolean);
  if (!words.length) return [''];

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const nextWord = words[i];
    const candidate = `${currentLine} ${nextWord}`;
    if (candidate.length <= maxLineLength) {
      currentLine = candidate;
      continue;
    }
    lines.push(currentLine);
    currentLine = nextWord;
  }

  lines.push(currentLine);
  return lines.slice(0, 3);
};

const PieChartVisual = ({ data = [45, 30, 25], labels = [] }: PieChartVisualProps) => {
  const sanitized = data.map((value) => Math.max(1, Math.round(value)));
  const total = sanitized.reduce((a, b) => a + b, 0);
  const computedLabels = sanitized.map((_, i) => labels[i]?.trim() || `Slice ${i + 1}`);
  let currentAngle = 0;
  const slices = sanitized.map((value, i) => {
    const angle = (value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const x1 = 80 + 46 * Math.cos((Math.PI * startAngle) / 180);
    const y1 = 72 + 46 * Math.sin((Math.PI * startAngle) / 180);
    const x2 = 80 + 46 * Math.cos((Math.PI * currentAngle) / 180);
    const y2 = 72 + 46 * Math.sin((Math.PI * currentAngle) / 180);

    const midAngle = startAngle + angle / 2;
    const percentX = 80 + 28 * Math.cos((Math.PI * midAngle) / 180);
    const percentY = 72 + 28 * Math.sin((Math.PI * midAngle) / 180);
    const outerLabelX = 80 + 62 * Math.cos((Math.PI * midAngle) / 180);
    const outerLabelY = 72 + 62 * Math.sin((Math.PI * midAngle) / 180);
    const textAnchor: 'start' | 'end' = outerLabelX >= 80 ? 'start' : 'end';
    const pct = Math.round((value / total) * 100);
    const labelLines = wrapLabel(computedLabels[i]);
    const sliceColor = pieColors[i % pieColors.length];
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
      outerLabelX,
      outerLabelY,
      textAnchor,
      pct,
      labelLines,
      sliceColor,
      pctColor,
    };
  });

  return (
    <div className="flex items-center justify-center h-full w-full px-2 py-1">
      <svg width="100%" height="100%" viewBox="0 0 160 140" preserveAspectRatio="xMidYMid meet">
        {slices.map((slice) => (
          <path
            key={`slice-${slice.index}`}
            d={`M 80 72 L ${slice.x1} ${slice.y1} A 46 46 0 ${slice.angle > 180 ? 1 : 0} 1 ${slice.x2} ${slice.y2} Z`}
            fill={slice.sliceColor}
          />
        ))}
        {slices.map((slice) => (
          <text
            key={`label-${slice.index}`}
            x={slice.outerLabelX}
            y={slice.outerLabelY}
            textAnchor={slice.textAnchor}
            className="fill-[#4F4F4F] font-body"
            fontSize="7"
          >
            {slice.labelLines.map((line, lineIndex) => (
              <tspan key={`${slice.index}-line-${lineIndex}`} x={slice.outerLabelX} dy={lineIndex === 0 ? 0 : 8}>
                {line}
              </tspan>
            ))}
          </text>
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
