const CardVisual = ({
  value = '42500',
  wowPct,
  ytdPriorYear = '39,800',
  variancePct = '6.8%',
  theme = 'light',
  onValueChange,
  onYtdPriorYearChange,
  onVariancePctChange,
}: {
  value?: string;
  wowPct?: string;
  ytdPriorYear?: string;
  variancePct?: string;
  theme?: 'light' | 'gray';
  onValueChange?: (value: string) => void;
  onYtdPriorYearChange?: (value: string) => void;
  onVariancePctChange?: (value: string) => void;
}) => {
  const varianceInput = String(variancePct || '').replace(/[^0-9.-]/g, '');
  const isGrayTheme = theme === 'gray';
  const wowInput = String(wowPct || '').replace(/[^0-9.-]/g, ''), wowNumber = Number(wowInput), varianceNumber = Number(varianceInput);
  const subtitleNumber = Number.isFinite(wowNumber) ? wowNumber : varianceNumber;
  const wowDeltaText = Number.isFinite(subtitleNumber) ? `${subtitleNumber >= 0 ? '+' : '-'} ${Math.abs(subtitleNumber).toFixed(2)}% WoW` : '';
  const wowDeltaClassName = isGrayTheme
    ? subtitleNumber < 0
      ? 'text-red-200'
      : 'text-emerald-200'
    : Number.isFinite(subtitleNumber)
    ? subtitleNumber > 0
      ? 'text-emerald-600'
      : subtitleNumber < 0
      ? 'text-red-600'
      : 'text-gray-600'
    : 'text-gray-600';

  return (
    <div className={`flex flex-col h-full w-full px-3 py-2 ${isGrayTheme ? 'bg-[#666666] text-white' : 'bg-white'}`}>
      <div className="flex-1 w-full flex flex-col items-center justify-start pt-1 pb-1.5">
        <div className={`w-full text-center text-4xl font-bold font-header leading-tight flex items-center justify-center ${isGrayTheme ? 'text-white' : 'text-black'}`}>
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className={`nodrag w-full max-w-[12rem] bg-transparent border-0 p-0 m-0 text-4xl font-bold text-center focus:outline-none ${isGrayTheme ? 'text-white' : 'text-black'}`}
          />
        </div>
        {wowDeltaText && (
          <div className={`mt-1 text-center text-[10px] font-medium font-body ${wowDeltaClassName}`}>
            {wowDeltaText}
          </div>
        )}
      </div>
      <div className={`w-full pt-2 text-xs font-body ${isGrayTheme ? 'text-white/85 border-t border-white/35' : 'border-t text-medium-gray border-gray-200'}`}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className={`text-[10px] uppercase tracking-wide ${isGrayTheme ? 'text-white/80' : 'text-medium-gray'}`}>YTD PY</div>
            <input
              value={ytdPriorYear}
              onChange={(e) => onYtdPriorYearChange?.(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              className={`nodrag min-w-0 w-20 bg-transparent border-0 p-0 m-0 text-right font-semibold focus:outline-none ${isGrayTheme ? 'text-white' : 'text-black'}`}
            />
          </div>
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className={`text-[10px] uppercase tracking-wide ${isGrayTheme ? 'text-white/80' : 'text-medium-gray'}`}>% Var</div>
            <div className="flex items-center gap-1 min-w-0">
              <input
                type="text"
                value={varianceInput}
                onChange={(e) => onVariancePctChange?.(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className={`nodrag w-12 bg-transparent border-0 p-0 m-0 text-right font-semibold focus:outline-none ${isGrayTheme ? 'text-white' : 'text-black'}`}
              />
              <span className={`text-[10px] leading-none ${isGrayTheme ? 'text-white/80' : 'text-medium-gray'}`}>%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardVisual;
