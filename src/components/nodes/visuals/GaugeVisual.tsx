const GaugeVisual = ({
  value = 72,
  onValueChange,
}: {
  value?: number;
  onValueChange?: (value: number) => void;
}) => {
  const angle = (value / 100) * 180 - 90;
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <svg width="120" height="80" viewBox="0 0 120 80">
        <path
          d="M 20 60 A 40 40 0 0 1 100 60"
          fill="none"
          stroke="#E0E0E0"
          strokeWidth="8"
        />
        <path
          d="M 20 60 A 40 40 0 0 1 100 60"
          fill="none"
          stroke="#EA0029"
          strokeWidth="8"
          strokeDasharray={`${(value / 100) * 126} 126`}
        />
        <line
          x1="60"
          y1="60"
          x2={60 + 35 * Math.cos((angle * Math.PI) / 180)}
          y2={60 + 35 * Math.sin((angle * Math.PI) / 180)}
          stroke="#000"
          strokeWidth="2"
        />
        <circle cx="60" cy="60" r="4" fill="#000" />
      </svg>
      <div className="flex items-center gap-1 text-primary font-header">
        <input
          type="number"
          value={value}
          onChange={(e) => onValueChange?.(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          onMouseDown={(e) => e.stopPropagation()}
          className="nodrag w-16 text-2xl font-bold text-primary text-center bg-transparent border-0 p-0 m-0 focus:outline-none"
        />
        <span className="text-2xl font-bold">%</span>
      </div>
    </div>
  );
};

export default GaugeVisual;
