const CardVisual = ({
  value = '42500',
  wowPct,
  wowDollarValue,
  variancePct = '6.8%',
  varianceFlatValue,
  varianceDollarValue,
  theme = 'light',
  onValueChange,
  onVariancePctChange,
  onVarianceFlatValueChange,
}: {
  value?: string;
  wowPct?: string;
  wowDollarValue?: string;
  ytdPriorYear?: string;
  variancePct?: string;
  varianceFlatValue?: string;
  varianceDollarValue?: string;
  theme?: 'light' | 'gray';
  onValueChange?: (value: string) => void;
  onYtdPriorYearChange?: (value: string) => void;
  onVariancePctChange?: (value: string) => void;
  onVarianceFlatValueChange?: (value: string) => void;
}) => {
  const varianceInput = String(variancePct || '').replace(/[^0-9.-]/g, '');
  const isGrayTheme = theme === 'gray';
  const wowInput = String(wowPct || '').replace(/[^0-9.-]/g, ''), wowNumber = Number(wowInput), varianceNumber = Number(varianceInput);
  const subtitleNumber = Number.isFinite(wowNumber) ? wowNumber : varianceNumber;
  const wowDeltaText = Number.isFinite(subtitleNumber) ? `${subtitleNumber >= 0 ? '+' : '-'} ${Math.abs(subtitleNumber).toFixed(2)}% WoW (${wowDollarValue || ''})` : '';
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
  const budgetDeltaText = Number.isFinite(varianceNumber) ? `${varianceNumber >= 0 ? '+' : '-'} ${Math.abs(varianceNumber).toFixed(2)}% Budget (${varianceDollarValue || ''})` : '';
  const budgetDeltaClassName = isGrayTheme
    ? varianceNumber < 0
      ? 'text-red-200'
      : 'text-emerald-200'
    : varianceNumber > 0
    ? 'text-emerald-600'
    : varianceNumber < 0
    ? 'text-red-600'
    : 'text-gray-600';
  const varianceValueClassName = Number.isFinite(varianceNumber)
    ? isGrayTheme
      ? varianceNumber < 0
        ? 'text-red-200'
        : varianceNumber > 0
        ? 'text-emerald-200'
        : 'text-white'
      : varianceNumber < 0
      ? 'text-red-600'
      : varianceNumber > 0
      ? 'text-emerald-600'
      : 'text-black'
    : isGrayTheme
    ? 'text-white'
    : 'text-black';

  return (
    <div className={`flex h-full min-h-0 w-full flex-col gap-1 px-3 pt-[max(0.15rem,min(0.45rem,4%))] pb-[max(0.35rem,min(0.75rem,6%))] ${isGrayTheme ? 'bg-[#666666] text-white' : 'bg-white'}`}>
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center py-[max(0.1rem,min(0.35rem,2.75%))]">
        <div className={`flex w-full items-center justify-center text-center text-4xl font-bold font-header leading-none ${isGrayTheme ? 'text-white' : 'text-black'}`}>
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className={`nodrag m-0 w-full max-w-[12rem] bg-transparent border-0 p-0 text-center text-4xl font-bold leading-none focus:outline-none ${isGrayTheme ? 'text-white' : 'text-black'}`}
          />
        </div>
        {wowDeltaText && (
          <div className={`mt-[max(0.1rem,min(0.35rem,3%))] text-center text-[10px] leading-none font-medium font-body ${wowDeltaClassName}`}>
            {wowDeltaText}
          </div>
        )}
        {budgetDeltaText && (
          <div className={`mt-[max(0.05rem,min(0.25rem,2%))] text-center text-[10px] leading-none font-medium font-body ${budgetDeltaClassName}`}>
            {budgetDeltaText}
          </div>
        )}
      </div>
      <div className={`w-full pt-[max(0.2rem,min(0.45rem,3.5%))] text-xs font-body ${isGrayTheme ? 'text-white/85' : 'text-medium-gray'}`}>
        <div className="flex flex-col gap-[max(0.15rem,min(0.35rem,2.5%))]">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className={`text-[10px] uppercase tracking-wide ${isGrayTheme ? 'text-white/80' : 'text-medium-gray'}`}>PY YTD $ VAR</div>
            <div className={`flex min-w-0 items-center gap-0.5 ${varianceValueClassName}`}>
              <input
                size={Math.max(String(varianceFlatValue || varianceDollarValue || '').length, 1)}
                value={varianceFlatValue || varianceDollarValue || ''}
                onChange={(e) => onVarianceFlatValueChange?.(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="nodrag m-0 min-w-0 max-w-[7.5rem] bg-transparent border-0 p-0 text-right leading-none focus:outline-none text-current"
              />
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className={`text-[10px] uppercase tracking-wide ${isGrayTheme ? 'text-white/80' : 'text-medium-gray'}`}>PY YTD % VAR</div>
            <div className={`flex min-w-0 items-center gap-0.5 ${varianceValueClassName}`}>
              <input
                type="text"
                size={Math.max(varianceInput.length, 1)}
                value={varianceInput}
                onChange={(e) => onVariancePctChange?.(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="nodrag m-0 min-w-0 max-w-[3.25rem] bg-transparent border-0 p-0 text-right leading-none focus:outline-none text-current"
              />
              <span className="text-[10px] leading-none text-current">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardVisual;
