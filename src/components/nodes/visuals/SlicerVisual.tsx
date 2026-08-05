import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type SlicerFilter =
  | { type: 'dateRange'; label: string; startValue?: string; endValue?: string }
  | {
      type: 'dropdown';
      label: string;
      value?: string;
      options?: string[];
      panel?: 'bubble' | 'checklist';
      selected?: string[];
    };

const DEFAULT_FILTERS: SlicerFilter[] = [
  { type: 'dateRange', label: 'Date Range', startValue: '07/01/2026', endValue: '07/10/2026' },
  {
    type: 'dropdown',
    label: 'In the',
    value: 'Last 7 days',
    panel: 'bubble',
    options: ['Last 3 days', 'Last 7 days', 'Last 30 days', 'Last 60 days', 'Last 90 days'],
  },
  {
    type: 'dropdown',
    label: 'Customer Type',
    value: 'All',
    panel: 'checklist',
    options: ['Retail', 'DTC'],
  },
  {
    type: 'dropdown',
    label: 'Partner',
    value: 'All',
    panel: 'checklist',
    options: [
      'Ace Hardware - Wholesale',
      'Atwoods',
      'Emery Jensen',
      'Independents',
      'Lv Distributes',
      "Murdoch's",
    ],
  },
  {
    type: 'dropdown',
    label: 'Store Tier',
    value: 'All',
    panel: 'bubble',
    options: ['All', 'Authorized', 'Diamond'],
  },
  {
    type: 'dropdown',
    label: 'Chain',
    value: 'All',
    panel: 'checklist',
    options: [
      '66 Ace Hardware',
      'A Few Cool Hardware Stores',
      'Ace Of Commerce',
      'Ace Retail Group',
      'Agrishop',
      'Appliance',
    ],
  },
  {
    type: 'dropdown',
    label: 'Group',
    value: 'All',
    panel: 'checklist',
    options: ['Farm', 'Ace', 'Independents', 'Sporting'],
  },
  {
    type: 'dropdown',
    label: 'Contains',
    value: 'None',
    panel: 'checklist',
    options: ['Make-Right', 'Complimentary'],
    selected: [],
  },
  {
    type: 'dropdown',
    label: 'Product Category',
    value: 'All',
    panel: 'checklist',
    options: ['Grills', 'Accessories', 'Rubs & Sauces', 'Pellets', 'Other'],
  },
];

function FilterTrigger({
  label,
  value,
  isOpen,
  onToggle,
}: {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="text-[11px] font-semibold text-black font-body">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="rf-nodrag rf-nopan flex h-8 w-full items-center justify-between border border-gray-300 bg-white px-2 text-left text-[11px] text-dark font-body"
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}

function BubbleListPanel({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-1.5 p-2">
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <li key={option}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(option);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`rf-nodrag rf-nopan w-full rounded-full border px-3 py-1.5 text-left text-[11px] font-body transition-colors ${
                isSelected
                  ? 'border-[#0EA5E9] bg-[#0EA5E9] text-white'
                  : 'border-gray-300 bg-white text-dark hover:bg-gray-50'
              }`}
            >
              {option}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CheckboxListPanel({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const allSelected = options.length > 0 && options.every((option) => selected.includes(option));

  const toggleAll = () => {
    onChange(allSelected ? [] : [...options]);
  };

  const toggleOption = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((value) => value !== option)
        : [...selected, option],
    );
  };

  return (
    <ul className="max-h-[200px] overflow-y-auto py-1">
      <li className="border-b border-gray-200 px-3 py-1.5">
        <label
          className="rf-nodrag rf-nopan flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-dark font-body"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="rf-nodrag rf-nopan h-3.5 w-3.5 border-gray-300 accent-[#0EA5E9]"
          />
          <span>Select All</span>
        </label>
      </li>
      {options.map((option) => (
        <li key={option} className="px-3 py-1.5">
          <label
            className="rf-nodrag rf-nopan flex cursor-pointer items-center gap-2 text-[11px] text-dark font-body"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
              className="rf-nodrag rf-nopan h-3.5 w-3.5 border-gray-300 accent-[#0EA5E9]"
            />
            <span>{option}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function getChecklistDisplayValue(selected: string[], options: string[]) {
  if (selected.length === 0) return 'None';
  if (selected.length === options.length) return 'All';
  if (selected.length === 1) return selected[0];
  return `${selected.length} selected`;
}

function DropdownFilter({
  filter,
  isOpen,
  onToggle,
}: {
  filter: Extract<SlicerFilter, { type: 'dropdown' }>;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const options = filter.options?.length ? filter.options : [filter.value || 'All'];
  const panel = filter.panel || 'checklist';
  const [bubbleValue, setBubbleValue] = useState(filter.value || options[0]);
  const [checked, setChecked] = useState<string[]>(
    filter.selected
      ?? (filter.value === 'All' || !filter.value ? [...options] : [filter.value]),
  );

  const displayValue = panel === 'bubble'
    ? bubbleValue
    : getChecklistDisplayValue(checked, options);

  return (
    <div className="relative w-[148px] shrink-0">
      <FilterTrigger
        label={filter.label}
        value={displayValue}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      {isOpen ? (
        <div
          className="rf-nodrag rf-nopan absolute left-0 top-[calc(100%+4px)] z-50 w-[200px] border border-gray-200 bg-white shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {panel === 'bubble' ? (
            <BubbleListPanel
              options={options}
              selected={bubbleValue}
              onSelect={(option) => {
                setBubbleValue(option);
                onToggle();
              }}
            />
          ) : (
            <CheckboxListPanel
              options={options}
              selected={checked}
              onChange={setChecked}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function SlicerVisual({
  filters = DEFAULT_FILTERS,
  layout = 'filterBar',
}: {
  filters?: SlicerFilter[];
  layout?: 'filterBar' | 'default';
}) {
  const resolvedFilters = filters.length ? filters : DEFAULT_FILTERS;
  const [openFilterIndex, setOpenFilterIndex] = useState<number | null>(null);

  const toggleFilter = (index: number) => {
    setOpenFilterIndex((current) => (current === index ? null : index));
  };

  if (layout === 'filterBar') {
    return (
      <div className="rf-nodrag rf-nopan w-full h-full bg-white px-3 py-2 flex items-end gap-3 overflow-visible font-body">
        {resolvedFilters.map((filter, index) => {
          if (filter.type === 'dateRange') {
            return (
              <div key={`filter-${index}`} className="flex flex-col gap-1 shrink-0">
                <span className="text-[11px] font-semibold text-black font-body">{filter.label}</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={filter.startValue ?? ''}
                      placeholder="Start"
                      onMouseDown={(e) => e.stopPropagation()}
                      className="rf-nodrag rf-nopan h-8 w-[108px] border border-gray-300 bg-white px-2 pr-7 text-[11px] text-dark font-body placeholder:text-gray-400 focus:outline-none"
                    />
                    <Calendar size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={filter.endValue ?? ''}
                      placeholder="End"
                      onMouseDown={(e) => e.stopPropagation()}
                      className="rf-nodrag rf-nopan h-8 w-[108px] border border-gray-300 bg-white px-2 pr-7 text-[11px] text-dark font-body placeholder:text-gray-400 focus:outline-none"
                    />
                    <Calendar size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <DropdownFilter
              key={`filter-${index}`}
              filter={filter}
              isOpen={openFilterIndex === index}
              onToggle={() => toggleFilter(index)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white p-3 font-body">
      <div className="text-xs text-medium-gray">Slicer</div>
    </div>
  );
}

export default SlicerVisual;
