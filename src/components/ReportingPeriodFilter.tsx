import { useMemo, useState } from 'react';

export type SelectionMode = 'yearWeek' | 'reportDate';

export interface ReportingPeriodValue {
  reportingYear: number;
  reportingWeek: number;
  reportDate: string;
  selectionMode: SelectionMode;
}

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

const getWeekEndingSundayFromIsoWeek = (year: number, week: number) => {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeekOne = new Date(jan4);
  mondayWeekOne.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const sunday = new Date(mondayWeekOne);
  sunday.setUTCDate(mondayWeekOne.getUTCDate() + (week - 1) * 7 + 6);
  return sunday;
};

const getNearestWeekEndingSunday = (date: Date) => {
  const reference = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = reference.getUTCDay();
  const daysToPreviousSunday = day;
  const daysToNextSunday = (7 - day) % 7;
  const offset = daysToNextSunday < daysToPreviousSunday ? daysToNextSunday : -daysToPreviousSunday;
  reference.setUTCDate(reference.getUTCDate() + offset);
  return reference;
};

export const getDefaultReportingPeriod = (): ReportingPeriodValue => {
  const weekEndingDate = getNearestWeekEndingSunday(new Date());
  const weekInfo = getIsoWeekInfo(weekEndingDate);

  return {
    reportingYear: weekInfo.year,
    reportingWeek: weekInfo.week,
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
  const [selectedDate, setSelectedDate] = useState<string>(defaultValue.reportDate);

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => Array.from({ length: 8 }, (_, index) => currentYear - 3 + index), [currentYear]);
  const weeksInSelectedYear = getIsoWeeksInYear(Number(selectedYear || currentYear));
  const weekOptions = useMemo(() => Array.from({ length: weeksInSelectedYear }, (_, index) => index + 1), [weeksInSelectedYear]);

  const publishChange = (
    reportingYear: number,
    reportingWeek: number,
    reportDate: string,
    selectionMode: SelectionMode
  ) => {
    onChange?.({ reportingYear, reportingWeek, reportDate, selectionMode });
  };

  const syncFromYearAndWeek = (yearValue: number | '', weekValue: number | '', mode: SelectionMode) => {
    if (yearValue === '' || weekValue === '') {
      return;
    }

    const weekEndingDate = getWeekEndingSundayFromIsoWeek(yearValue, weekValue);
    const formattedDate = toIsoDateInput(weekEndingDate);
    setSelectedDate(formattedDate);
    publishChange(yearValue, weekValue, formattedDate, mode);
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextYear = event.target.value ? Number(event.target.value) : '';
    setSelectedYear(nextYear);
    syncFromYearAndWeek(nextYear, selectedWeek, 'yearWeek');
  };

  const handleWeekChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWeek = event.target.value ? Number(event.target.value) : '';
    setSelectedWeek(nextWeek);
    syncFromYearAndWeek(selectedYear, nextWeek, 'yearWeek');
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseIsoDateInput(event.target.value);
    if (!parsed) {
      return;
    }

    const nearestWeekEnding = getNearestWeekEndingSunday(parsed);
    const weekInfo = getIsoWeekInfo(nearestWeekEnding);
    const normalizedDate = toIsoDateInput(nearestWeekEnding);

    setSelectedDate(normalizedDate);
    setSelectedYear(weekInfo.year);
    setSelectedWeek(weekInfo.week);
    publishChange(weekInfo.year, weekInfo.week, normalizedDate, 'reportDate');
  };

  return (
    <section className="bg-transparent px-1.5 py-1 text-light w-full">
      <div className="text-center text-[9px] uppercase tracking-wide text-white/90 font-semibold font-body">
        Reporting Period
      </div>

      <div className="mt-0.5 grid grid-cols-[1fr_1fr_auto_1.2fr] gap-1.5 items-end text-light">
        <label className="text-[9px] font-semibold text-white font-body">
          Year
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="mt-0.5 h-6 w-full border border-gray-300 rounded px-1 text-[10px] leading-tight text-dark bg-white focus:outline-none"
          >
            <option value="">Select</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="text-[9px] font-semibold text-white font-body">
          Week
          <select
            value={selectedWeek}
            onChange={handleWeekChange}
            className="mt-0.5 h-6 w-full border border-gray-300 rounded px-1 text-[10px] leading-tight text-dark bg-white focus:outline-none"
          >
            <option value="">Select</option>
            {weekOptions.map((week) => (
              <option key={week} value={week}>
                {week}
              </option>
            ))}
          </select>
        </label>

        <div className="text-[9px] text-white/85 font-body pb-1 uppercase">or</div>

        <label className="text-[9px] font-semibold text-white font-body">
          Date
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="mt-0.5 h-6 w-full border border-gray-300 rounded px-1 text-[10px] leading-tight text-dark bg-white focus:outline-none"
          />
        </label>
      </div>
    </section>
  );
}

export default ReportingPeriodFilter;