import { stopLeftMousePropagation } from '../nodeUtils';

const parseSignedNumber = (value?: string) => {
  const input = String(value || '').replace(/[^0-9.-]/g, '');
  const number = Number(input);
  return Number.isFinite(number) ? number : null;
};

const getSignedClassName = (number: number | null, invert = false, plain = false) => {
  if (number === null || plain) return 'text-black';
  if (number === 0) return 'text-gray-600';
  if (invert) {
    return number > 0 ? 'text-red-600' : 'text-emerald-600';
  }
  if (number > 0) return 'text-emerald-600';
  if (number < 0) return 'text-red-600';
  return 'text-gray-600';
};

const getSignPrefix = (number: number | null) => {
  if (number === null || number === 0) return '';
  return number > 0 ? '+' : '-';
};

const stripLeadingSign = (value: string) => value.replace(/^\s*[+-]\s*/, '');

const getDollarMagnitude = (value: string, number: number | null) => {
  const text = String(value || '');
  if (!text) return '';
  if (number !== null) return stripLeadingSign(text);
  return text;
};

const getPercentMagnitude = (value: string, number: number | null) => {
  const numeric = String(value || '').replace(/[^0-9.-]/g, '');
  if (number !== null) return String(Math.abs(number));
  return numeric.replace(/^[+-]/, '');
};

const applyDollarSign = (magnitude: string, number: number | null) => {
  const trimmed = magnitude.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('-')) return trimmed;
  if (number !== null && number < 0) return `-${stripLeadingSign(trimmed)}`;
  return /^[+-]/.test(trimmed) ? trimmed : `+${trimmed}`;
};

const applyPercentSign = (magnitude: string, number: number | null) => {
  const cleaned = magnitude.replace(/[^0-9.-]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('-')) return cleaned;
  if (number !== null && number < 0) return `-${cleaned}`;
  return cleaned;
};

const varianceInputWidth = (text: string, min = 1) => `${Math.max(text.length, min)}ch`;

const varianceInputClassName =
  'nodrag inline m-0 min-w-0 border-0 bg-transparent p-0 text-[11px] leading-none align-baseline focus:outline-none text-current [field-sizing:content]';

const CARD_HERO_FONT_CLASSES = {
  default: 'text-4xl',
  compact: 'text-2xl',
} as const;

const getCardHeroFontClass = (size?: 'default' | 'compact') =>
  CARD_HERO_FONT_CLASSES[size === 'compact' ? 'compact' : 'default'];

const getCardHeroMaxWidthClass = (size?: 'default' | 'compact') =>
  size === 'compact' ? 'max-w-[10rem]' : 'max-w-[12rem]';

const getCardHeroOverlapClass = (size?: 'default' | 'compact') =>
  size === 'compact' ? 'relative z-10 -mt-2' : '';

const getCardHeroSectionClass = (size?: 'default' | 'compact') =>
  size === 'compact' ? 'pt-3' : '';

const PeriodKpiActualRow = ({
  label,
  value,
  onValueChange,
  tightTop = false,
}: {
  label?: string;
  value: string;
  onValueChange?: (value: string) => void;
  tightTop?: boolean;
}) => (
  <div className={`${tightTop ? 'mt-0' : 'mt-1'} flex justify-center items-baseline whitespace-nowrap text-[12px] leading-none font-medium font-body text-medium-gray`}>
    {label && <span>{label}:&nbsp;</span>}
    <input
      type="text"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      onMouseDown={stopLeftMousePropagation}
      style={{ width: `${Math.max(value.length, 4)}ch` }}
      className="nodrag m-0 border-0 bg-transparent p-0 text-center text-[12px] leading-none font-medium text-medium-gray focus:outline-none"
    />
  </div>
);

const PeriodKpiComparisonRow = ({
  label,
  dollarValue,
  percentValue,
  onDollarChange,
  onPercentChange,
  invertVarianceColors = false,
  disableVarianceColors = false,
}: {
  label: string;
  dollarValue?: string;
  percentValue?: string;
  onDollarChange?: (value: string) => void;
  onPercentChange?: (value: string) => void;
  invertVarianceColors?: boolean;
  disableVarianceColors?: boolean;
}) => {
  const dollarNumber = parseSignedNumber(dollarValue);
  const percentNumber = parseSignedNumber(percentValue);
  const valueClassName = getSignedClassName(dollarNumber, invertVarianceColors, disableVarianceColors);
  const percentClassName = getSignedClassName(percentNumber, invertVarianceColors, disableVarianceColors);
  const dollarMagnitude = getDollarMagnitude(String(dollarValue || ''), dollarNumber);
  const percentMagnitude = getPercentMagnitude(String(percentValue || ''), percentNumber);
  const dollarSignPrefix = getSignPrefix(dollarNumber);
  const percentSignPrefix = getSignPrefix(percentNumber);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-baseline gap-x-1">
      <div className="min-w-0 truncate text-left text-[10px] uppercase tracking-wide text-black">{label}</div>
      <div className={`justify-self-center whitespace-nowrap text-center text-[11px] leading-none tabular-nums ${valueClassName}`}>
        {dollarSignPrefix}<input
          value={dollarMagnitude}
          onChange={(e) => onDollarChange?.(applyDollarSign(e.target.value, dollarNumber))}
          onMouseDown={stopLeftMousePropagation}
          style={{ width: varianceInputWidth(dollarMagnitude, 4) }}
          className={`${varianceInputClassName} text-left`}
        />
      </div>
      <div className={`justify-self-end whitespace-nowrap text-right text-[11px] leading-none tabular-nums ${percentClassName}`}>
        {percentValue ? (
          <>
            {percentSignPrefix}<input
              value={percentMagnitude}
              onChange={(e) => onPercentChange?.(applyPercentSign(e.target.value, percentNumber))}
              onMouseDown={stopLeftMousePropagation}
              style={{ width: varianceInputWidth(percentMagnitude, 1) }}
              className={`${varianceInputClassName} text-right`}
            />%
          </>
        ) : null}
      </div>
    </div>
  );
};

const CardVisual = ({
  value = '42500',
  cardLayout,
  wowPct,
  wowDollarValue,
  ytdPriorYear,
  priorActualLabel,
  secondaryPriorValue,
  secondaryPriorActualLabel,
  budgetLabel = 'Budget',
  priorLabel = 'YTD YoY',
  budgetVarianceDollar,
  budgetVariancePct,
  priorVarianceDollar,
  priorVariancePct,
  variancePct = '6.8%',
  varianceFlatValue,
  varianceDollarValue,
  primaryDeltaLabel = 'WoW',
  primaryDeltaDollarOnly = false,
  secondaryDeltaLabel = 'Budget',
  bottomDollarLabel = 'YTD YoY $ VAR',
  bottomPercentLabel = 'YTD YoY % VAR',
  showSecondaryDelta = true,
  onValueChange,
  onYtdPriorYearChange,
  onSecondaryPriorValueChange,
  onBudgetVarianceDollarChange,
  onBudgetVariancePctChange,
  onPriorVarianceDollarChange,
  onPriorVariancePctChange,
  onVariancePctChange,
  onVarianceFlatValueChange,
  cardOrdersPassed,
  onOrdersPassedChange,
  cardHeroFontSize,
  invertVarianceColors = false,
  disableVarianceColors = false,
}: {
  value?: string;
  cardLayout?: 'periodKpi' | 'revenueOrdersKpi' | 'ordersPassedKpi';
  cardHeroFontSize?: 'default' | 'compact';
  wowPct?: string;
  wowDollarValue?: string;
  ytdPriorYear?: string;
  priorActualLabel?: string;
  secondaryPriorValue?: string;
  secondaryPriorActualLabel?: string;
  budgetLabel?: string;
  priorLabel?: string;
  budgetVarianceDollar?: string;
  budgetVariancePct?: string;
  priorVarianceDollar?: string;
  priorVariancePct?: string;
  variancePct?: string;
  varianceFlatValue?: string;
  varianceDollarValue?: string;
  primaryDeltaLabel?: string;
  primaryDeltaDollarOnly?: boolean;
  secondaryDeltaLabel?: string;
  bottomDollarLabel?: string;
  bottomPercentLabel?: string;
  showSecondaryDelta?: boolean;
  onValueChange?: (value: string) => void;
  onYtdPriorYearChange?: (value: string) => void;
  onSecondaryPriorValueChange?: (value: string) => void;
  onBudgetVarianceDollarChange?: (value: string) => void;
  onBudgetVariancePctChange?: (value: string) => void;
  onPriorVarianceDollarChange?: (value: string) => void;
  onPriorVariancePctChange?: (value: string) => void;
  onVariancePctChange?: (value: string) => void;
  onVarianceFlatValueChange?: (value: string) => void;
  cardOrdersPassed?: {
    totalOrders: string;
    rscOrders: string;
    dropshipOrders: string;
    totalValue: string;
    rscLabel?: string;
    dropshipLabel?: string;
    totalValueLabel?: string;
  };
  onOrdersPassedChange?: (field: 'totalOrders' | 'rscOrders' | 'dropshipOrders' | 'totalValue', value: string) => void;
  invertVarianceColors?: boolean;
  disableVarianceColors?: boolean;
}) => {
  const heroFontClass = getCardHeroFontClass(cardHeroFontSize);
  const heroMaxWidthClass = getCardHeroMaxWidthClass(cardHeroFontSize);
  const heroOverlapClass = getCardHeroOverlapClass(cardHeroFontSize);
  const heroSectionClass = getCardHeroSectionClass(cardHeroFontSize);
  const isCompactHero = cardHeroFontSize === 'compact';

  if (cardLayout === 'ordersPassedKpi') {
    const metrics = cardOrdersPassed || {
      totalOrders: '',
      rscOrders: '',
      dropshipOrders: '',
      totalValue: '',
    };
    const rscLabel = metrics.rscLabel || 'Warehouse Passed';
    const dropshipLabel = metrics.dropshipLabel || 'Dropship Passed';
    const totalValueLabel = metrics.totalValueLabel || 'Total $';

    return (
      <div className="flex h-full min-h-0 w-full flex-col gap-1 bg-white px-3 pt-0 pb-[max(0.35rem,min(0.75rem,6%))]">
        <div className={`flex min-h-0 w-full flex-1 flex-col items-center justify-center pt-0 pb-[max(0.1rem,min(0.35rem,2.75%))] ${heroSectionClass}`}>
          <div className={`flex w-full items-center justify-center text-center ${heroFontClass} font-bold font-header leading-none text-black ${heroOverlapClass}`}>
            <input
              type="text"
              value={metrics.totalOrders}
              onChange={(e) => onOrdersPassedChange?.('totalOrders', e.target.value)}
              onMouseDown={stopLeftMousePropagation}
              className={`nodrag m-0 w-full ${heroMaxWidthClass} border-0 bg-transparent p-0 text-center ${heroFontClass} font-bold leading-none text-black focus:outline-none`}
            />
          </div>
          <PeriodKpiActualRow
            label={rscLabel}
            value={metrics.rscOrders}
            tightTop={isCompactHero}
            onValueChange={(nextValue) => onOrdersPassedChange?.('rscOrders', nextValue)}
          />
          <PeriodKpiActualRow
            label={dropshipLabel}
            value={metrics.dropshipOrders}
            onValueChange={(nextValue) => onOrdersPassedChange?.('dropshipOrders', nextValue)}
          />
          <PeriodKpiActualRow
            label={totalValueLabel}
            value={metrics.totalValue}
            onValueChange={(nextValue) => onOrdersPassedChange?.('totalValue', nextValue)}
          />
        </div>
      </div>
    );
  }

  if (cardLayout === 'periodKpi' || cardLayout === 'revenueOrdersKpi') {
    return (
      <div className={`flex h-full min-h-0 w-full flex-col bg-white px-3 ${isCompactHero ? 'gap-0 pt-0 pb-0' : 'gap-1 pt-0 pb-[max(0.35rem,min(0.75rem,6%))]'}`}>
        <div className={`flex min-h-0 w-full flex-1 flex-col items-center ${isCompactHero ? 'justify-start pb-0' : `justify-center pb-[max(0.1rem,min(0.35rem,2.75%))]`} ${heroSectionClass}`}>
          <div className={`flex w-full items-center justify-center text-center ${heroFontClass} font-bold font-header leading-none text-black ${heroOverlapClass}`}>
            <input
              type="text"
              value={value}
              onChange={(e) => onValueChange?.(e.target.value)}
              onMouseDown={stopLeftMousePropagation}
              className={`nodrag m-0 w-full ${heroMaxWidthClass} border-0 bg-transparent p-0 text-center ${heroFontClass} font-bold leading-none text-black focus:outline-none`}
            />
          </div>
          {ytdPriorYear && (
            <PeriodKpiActualRow
              label={priorActualLabel}
              value={ytdPriorYear}
              tightTop={isCompactHero}
              onValueChange={onYtdPriorYearChange}
            />
          )}
          {cardLayout === 'periodKpi' && secondaryPriorValue && (
            <PeriodKpiActualRow
              label={secondaryPriorActualLabel}
              value={secondaryPriorValue}
              onValueChange={onSecondaryPriorValueChange}
            />
          )}
        </div>
        <div className={`w-full shrink-0 text-xs font-body text-medium-gray ${isCompactHero ? 'pt-0 pb-1' : 'pt-[max(0.2rem,min(0.45rem,3.5%))]'}`}>
          <div className={`flex flex-col ${isCompactHero ? 'gap-0' : 'gap-[max(0.15rem,min(0.35rem,2.5%))]'}`}>
            <PeriodKpiComparisonRow
              label={budgetLabel}
              dollarValue={budgetVarianceDollar}
              percentValue={budgetVariancePct}
              onDollarChange={onBudgetVarianceDollarChange}
              onPercentChange={onBudgetVariancePctChange}
              invertVarianceColors={invertVarianceColors}
              disableVarianceColors={disableVarianceColors}
            />
            {priorVarianceDollar && (
              <PeriodKpiComparisonRow
                label={priorLabel}
                dollarValue={priorVarianceDollar}
                percentValue={priorVariancePct}
                onDollarChange={onPriorVarianceDollarChange}
                onPercentChange={onPriorVariancePctChange}
                invertVarianceColors={invertVarianceColors}
                disableVarianceColors={disableVarianceColors}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const varianceInput = String(variancePct || '').replace(/[^0-9.-]/g, '');
  const wowInput = String(wowPct || '').replace(/[^0-9.-]/g, '');
  const wowNumber = Number(wowInput);
  const varianceNumber = Number(varianceInput);
  const wowDollarNumber = parseSignedNumber(wowDollarValue);
  const subtitleNumber = Number.isFinite(wowNumber) ? wowNumber : varianceNumber;
  const wowDeltaText = primaryDeltaDollarOnly && wowDollarValue
    ? `${getSignPrefix(wowDollarNumber)} ${getDollarMagnitude(String(wowDollarValue), wowDollarNumber)} ${primaryDeltaLabel}`.trim()
    : Number.isFinite(subtitleNumber)
      ? `${subtitleNumber >= 0 ? '+' : '-'} ${Math.abs(subtitleNumber).toFixed(2)}% ${primaryDeltaLabel} (${wowDollarValue || ''})`
      : '';
  const wowDeltaClassName = primaryDeltaDollarOnly && wowDollarValue
    ? getSignedClassName(wowDollarNumber)
    : Number.isFinite(subtitleNumber)
      ? subtitleNumber > 0
        ? 'text-emerald-600'
        : subtitleNumber < 0
          ? 'text-red-600'
          : 'text-gray-600'
      : 'text-gray-600';
  const budgetDeltaText = Number.isFinite(varianceNumber)
    ? `${varianceNumber >= 0 ? '+' : '-'} ${Math.abs(varianceNumber).toFixed(2)}% ${secondaryDeltaLabel} (${varianceDollarValue || ''})`
    : '';
  const budgetDeltaClassName = varianceNumber > 0
    ? 'text-emerald-600'
    : varianceNumber < 0
    ? 'text-red-600'
    : 'text-gray-600';
  const varianceValueClassName = getSignedClassName(Number.isFinite(varianceNumber) ? varianceNumber : null);
  const varianceDollarRaw = varianceFlatValue || varianceDollarValue || '';
  const varianceDollarNumber = parseSignedNumber(varianceDollarRaw);
  const variancePercentNumber = Number.isFinite(varianceNumber) ? varianceNumber : null;
  const varianceDollarMagnitude = getDollarMagnitude(varianceDollarRaw, varianceDollarNumber);
  const variancePercentMagnitude = getPercentMagnitude(varianceInput, variancePercentNumber);
  const varianceDollarSignPrefix = getSignPrefix(varianceDollarNumber);
  const variancePercentSignPrefix = getSignPrefix(variancePercentNumber);
  const hasPeriodKpiBottomRows = Boolean(budgetVarianceDollar || priorVarianceDollar);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-1 bg-white px-3 pt-0 pb-[max(0.35rem,min(0.75rem,6%))]">
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center pt-0 pb-[max(0.1rem,min(0.35rem,2.75%))]">
        <div className={`flex w-full items-center justify-center text-center ${heroFontClass} font-bold font-header leading-none text-black ${heroOverlapClass}`}>
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            onMouseDown={stopLeftMousePropagation}
            className={`nodrag m-0 w-full ${heroMaxWidthClass} border-0 bg-transparent p-0 text-center ${heroFontClass} font-bold leading-none text-black focus:outline-none`}
          />
        </div>
        {wowDeltaText && (
          <div className={`mt-[max(0.05rem,min(0rem,1.75%))] text-center text-[12px] leading-none font-medium font-body ${wowDeltaClassName}`}>
            {wowDeltaText}
          </div>
        )}
        {showSecondaryDelta && budgetDeltaText && (
          <div className={`mt-[max(0.04rem,min(0rem,1.5%))] text-center text-[12px] leading-none font-medium font-body ${budgetDeltaClassName}`}>
            {budgetDeltaText}
          </div>
        )}
      </div>
      {(hasPeriodKpiBottomRows || varianceFlatValue || varianceDollarValue || varianceInput) && (
        <div className="w-full pt-[max(0.2rem,min(0.45rem,3.5%))] text-xs font-body text-medium-gray">
          <div className="flex flex-col gap-[max(0.15rem,min(0.35rem,2.5%))]">
            {hasPeriodKpiBottomRows ? (
              <>
                {budgetVarianceDollar && (
                  <PeriodKpiComparisonRow
                    label={budgetLabel}
                    dollarValue={budgetVarianceDollar}
                    onDollarChange={onBudgetVarianceDollarChange}
                  />
                )}
                {priorVarianceDollar && (
                  <PeriodKpiComparisonRow
                    label={priorLabel}
                    dollarValue={priorVarianceDollar}
                    onDollarChange={onPriorVarianceDollarChange}
                  />
                )}
              </>
            ) : (
              <>
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <div className="shrink-0 text-[10px] uppercase tracking-wide text-black">{bottomDollarLabel}</div>
                  <div className={`shrink-0 whitespace-nowrap text-[11px] leading-none tabular-nums ${getSignedClassName(varianceDollarNumber)}`}>
                    {varianceDollarSignPrefix}<input
                      value={varianceDollarMagnitude}
                      onChange={(e) => onVarianceFlatValueChange?.(applyDollarSign(e.target.value, varianceDollarNumber))}
                      onMouseDown={stopLeftMousePropagation}
                      style={{ width: varianceInputWidth(varianceDollarMagnitude) }}
                      className={`${varianceInputClassName} text-left`}
                    />
                  </div>
                </div>
                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <div className="shrink-0 text-[10px] uppercase tracking-wide text-black">{bottomPercentLabel}</div>
                  <div className={`shrink-0 whitespace-nowrap text-[11px] leading-none tabular-nums ${varianceValueClassName}`}>
                    {variancePercentSignPrefix}<input
                      value={variancePercentMagnitude}
                      onChange={(e) => onVariancePctChange?.(applyPercentSign(e.target.value, variancePercentNumber))}
                      onMouseDown={stopLeftMousePropagation}
                      style={{ width: varianceInputWidth(variancePercentMagnitude, 1) }}
                      className={`${varianceInputClassName} text-right`}
                    />%
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardVisual;
