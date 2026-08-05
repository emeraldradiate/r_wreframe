import { useMemo, useState } from 'react';

export type SelectionMode = 'yearWeek' | 'reportDate';

export interface ReportingPeriodValue {
  reportingYear: number;
  reportingWeek: number;
  reportDate: string;
  selectionMode: SelectionMode;
}

export const formatReportingPeriodSummary = ({ reportingWeek, reportDate }: ReportingPeriodValue) => {
  const parsedDate = parseIsoDateInput(reportDate);

  if (!parsedDate) {
    return `Wk ${reportingWeek}`;
  }

  const month = `${parsedDate.getUTCMonth() + 1}`;
  const day = `${parsedDate.getUTCDate()}`;
  const year = parsedDate.getUTCFullYear();

  return `Wk ${reportingWeek} starting ${month}/${day}/${year}`;
};

const toIsoDateInput = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoDateInput = (value: string) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
};

const getIsoWeekInfo = (date: Date) => {
  const reference = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = reference.getUTCDay() || 7;
  reference.setUTCDate(reference.getUTCDate() + 4 - day);
  const isoYear = reference.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil((((reference.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: isoYear, week };
};

const getIsoWeeksInYear = (year: number) => getIsoWeekInfo(new Date(Date.UTC(year, 11, 28))).week;

const getWeekEndingSaturdayFromIsoWeek = (year: number, week: number) => {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeekOne = new Date(jan4);
  mondayWeekOne.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const saturday = new Date(mondayWeekOne);
  saturday.setUTCDate(mondayWeekOne.getUTCDate() + (week - 1) * 7 + 5);
  return saturday;
};

const formatWeekEndingDisplay = (year: number | '', week: number | '') => {
  if (year === '' || week === '') {
    return '—';
  }

  const weekEndingDate = getWeekEndingSaturdayFromIsoWeek(year, week);
  const month = `${weekEndingDate.getUTCMonth() + 1}`;
  const day = `${weekEndingDate.getUTCDate()}`;
  const displayYear = weekEndingDate.getUTCFullYear();

  return `${month}/${day}/${displayYear}`;
};

export const getDefaultReportingPeriod = (): ReportingPeriodValue => {
  const reportingYear = 2026;
  const reportingWeek = 19;
  const weekEndingDate = getWeekEndingSaturdayFromIsoWeek(reportingYear, reportingWeek);

  return {
    reportingYear,
    reportingWeek,
    reportDate: toIsoDateInput(weekEndingDate),
    selectionMode: 'yearWeek',
  };
};

interface ReportingPeriodFilterProps {
  value?: ReportingPeriodValue;
  onChange?: (nextValue: ReportingPeriodValue) => void;
}

function ReportingPeriodFilter({ value, onChange }: ReportingPeriodFilterProps) {
  const defaultValue = value || getDefaultReportingPeriod();
  const [selectedYear, setSelectedYear] = useState<number | ''>(defaultValue.reportingYear);
  const [selectedWeek, setSelectedWeek] = useState<number | ''>(defaultValue.reportingWeek);

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => Array.from({ length: 8 }, (_, index) => currentYear - 3 + index), [currentYear]);
  const weeksInSelectedYear = getIsoWeeksInYear(Number(selectedYear || currentYear));
  const weekOptions = useMemo(() => Array.from({ length: weeksInSelectedYear }, (_, index) => index + 1), [weeksInSelectedYear]);
  const displayDate = useMemo(
    () => formatWeekEndingDisplay(selectedYear, selectedWeek),
    [selectedYear, selectedWeek],
  );

  const publishChange = (reportingYear: number, reportingWeek: number, reportDate: string) => {
    onChange?.({
      reportingYear,
      reportingWeek,
      reportDate,
      selectionMode: 'yearWeek',
    });
  };

  const syncFromYearAndWeek = (yearValue: number | '', weekValue: number | '') => {
    if (yearValue === '' || weekValue === '') {
      return;
    }

    const weekEndingDate = getWeekEndingSaturdayFromIsoWeek(yearValue, weekValue);
    publishChange(yearValue, weekValue, toIsoDateInput(weekEndingDate));
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextYear = event.target.value ? Number(event.target.value) : '';
    setSelectedYear(nextYear);
    syncFromYearAndWeek(nextYear, selectedWeek);
  };

  const handleWeekChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWeek = event.target.value ? Number(event.target.value) : '';
    setSelectedWeek(nextWeek);
    syncFromYearAndWeek(selectedYear, nextWeek);
  };

  return (
    <section className="bg-transparent px-1.5 py-1 text-light w-full">
      <div className="text-center text-[9px] uppercase tracking-wide text-white/90 font-semibold font-body">
        Reporting Period
      </div>

      <div className="mt-1 flex flex-row items-end justify-center gap-3 text-light">
        <label className="text-[9px] font-semibold text-white font-body min-w-0 flex flex-col items-start">
          Year
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="mt-0.5 h-6 w-full min-w-0 border border-gray-300 rounded px-1 text-[10px] leading-tight text-dark bg-white focus:outline-none"
            style={{ maxWidth: '70px' }}
          >
            <option value="">Select</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="text-[9px] font-semibold text-white font-body min-w-0 flex flex-col items-start">
          Week
          <select
            value={selectedWeek}
            onChange={handleWeekChange}
            className="mt-0.5 h-6 w-full min-w-0 border border-gray-300 rounded px-1 text-[10px] leading-tight text-dark bg-white focus:outline-none"
            style={{ maxWidth: '60px' }}
          >
            <option value="">Select</option>
            {weekOptions.map((week) => (
              <option key={week} value={week}>
                {week}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-1 flex min-w-0 flex-col items-start border-l border-white/30 pl-3 text-[9px] font-semibold text-white font-body">
          Date
          <div
            className="mt-0.5 h-6 flex items-center whitespace-nowrap rounded border border-gray-300 bg-white px-1 text-[10px] leading-tight text-dark font-body"
            style={{ minWidth: '72px' }}
          >
            {displayDate}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReportingPeriodFilter;
