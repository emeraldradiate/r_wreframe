import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import projectLogo from '../assets/project-logo.png';

interface SideQuestHeaderProps {
  appTitle: string;
  onTitleChange: (title: string) => void;
  filterVariant?: 'contact' | 'orders' | 'tickets' | 'customers' | 'agents';
}

const RELATIVE_DATE_OPTIONS = [
  'All Dates',
  'Current Week',
  'Current Month',
  'Current Year',
  'Custom Date',
  'Last 30 Days',
  'Last 60 Days',
  'Last 90 Days',
];

const MODALITY_OPTIONS = ['Phone', 'Chat', 'Email', 'WiFi Thread', 'Other'];
const REASON_OPTIONS = ['Sales', 'Troubleshooting', 'Inquiry', 'Return', 'Other'];
const AGENT_OPTIONS = ['Alex Rivera', 'Jordan Kim', 'Sam Patel', 'Taylor Brooks'];

const RETAIL_OPTIONS = ['Yes', 'No', 'Both'];

const CUSTOMER_TYPE_OPTIONS = ['Retail', 'DTC'];
const PARTNER_OPTIONS = [
  'Ace Hardware - Wholesale',
  'Atwoods',
  'Emery Jensen',
  'Independents',
  'Lv Distributes',
  "Murdoch's",
];
const STORE_TIER_OPTIONS = ['All', 'Authorized', 'Diamond'];
const CHAIN_OPTIONS = [
  '66 Ace Hardware',
  'A Few Cool Hardware Stores',
  'Ace Of Commerce',
  'Ace Retail Group',
  'Agrishop',
  'Appliance',
];
const GROUP_OPTIONS = ['Farm', 'Ace', 'Independents', 'Sporting'];
const CONTAINS_OPTIONS = ['Make-Right', 'Complimentary'];
const PRODUCT_CATEGORY_OPTIONS = ['Grills', 'Accessories', 'Rubs & Sauces', 'Pellets', 'Other'];

const CUSTOMER_STATUS_OPTIONS = ['Active', 'Inactive'];
const LOYALTY_TIER_OPTIONS = ['Bronze', 'Silver', 'Gold', 'Platinum'];
const ACTIVITY_DATE_OPTIONS = ['Most Recent Call', 'Most Recent Order'];
const CONTACT_REASON_OPTIONS = ['Sales', 'Troubleshooting', 'Inquiry', 'Return', 'Warranty', 'Other'];
const TICKET_STATUS_OPTIONS = ['Open', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'];
const TICKET_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const PREFERRED_MODALITY_OPTIONS = ['Phone', 'Chat', 'Email', 'WiFi Thread', 'Other'];
const STATE_OPTIONS = [
  'AL', 'AZ', 'CA', 'CO', 'FL', 'GA', 'IL', 'IN', 'KS', 'MA', 'MN', 'MO', 'NC', 'NV', 'OR', 'SC', 'TN', 'TX', 'UT', 'WA',
];

const SCHEDULE_WEEK_OPTIONS = ['This Week', 'Next Week'];
const TEAM_OPTIONS = ['Phone Support', 'Chat Support', 'Email Support', 'Tier 2', 'Supervisors'];
const OFFICE_LOCATION_OPTIONS = ['Augusta - HQ', 'Lehi', 'Remote'];
const AGENT_STATUS_OPTIONS = ['Active', 'On Leave', 'Offline', 'Training'];
const SHIFT_OPTIONS = ['Morning', 'Afternoon', 'Evening'];
const SUPERVISOR_OPTIONS = ['Morgan Lee', 'Chris Dunn', 'Pat O\'Brien'];

type OpenFilterId =
  | 'inThe'
  | 'modality'
  | 'reason'
  | 'agent'
  | 'retail'
  | 'customerType'
  | 'partner'
  | 'storeTier'
  | 'chain'
  | 'group'
  | 'contains'
  | 'productCategory'
  | 'customerStatus'
  | 'state'
  | 'loyaltyTier'
  | 'activityDate'
  | 'contactReason'
  | 'preferredModality'
  | 'ticketStatus'
  | 'ticketPriority'
  | 'scheduleWeek'
  | 'team'
  | 'officeLocation'
  | 'agentStatus'
  | 'shift'
  | 'supervisor'
  | null;

function getCheckboxDisplayValue(selected: string[], allOptions: string[]) {
  if (selected.length === 0) {
    return 'None';
  }

  if (selected.length === allOptions.length) {
    return 'All';
  }

  return selected.join(', ');
}

function FilterTextInput({
  label,
  value,
  onChange,
  placeholder,
  widthClass = 'w-[148px]',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  widthClass?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${widthClass}`}>
      <span className="text-[10px] font-semibold leading-tight text-white font-body">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-4 w-full rounded border border-gray-300 bg-white px-1.5 text-[10px] leading-none text-dark font-body placeholder:text-gray-400 focus:outline-none"
      />
    </div>
  );
}

function FilterTrigger({
  label,
  value,
  isOpen,
  onToggle,
  widthClass = 'w-[148px]',
}: {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  widthClass?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${widthClass}`}>
      <span className="text-[10px] font-semibold leading-tight text-white font-body">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className="flex h-4 w-full items-center justify-between rounded border border-gray-300 bg-white px-1.5 text-left text-[10px] leading-none text-dark font-body"
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          size={10}
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
  onSelect?: (option: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-1.5 p-2">
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <li key={option}>
            <button
              type="button"
              onClick={() => onSelect?.(option)}
              className={`w-full rounded-full border px-3 py-1.5 text-left text-[11px] font-body transition-colors ${
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
  selectAllChecked = true,
  checkedOptions,
  onChange,
}: {
  options: string[];
  selectAllChecked?: boolean;
  checkedOptions?: string[];
  onChange?: (nextChecked: string[]) => void;
}) {
  const checkedSet = new Set(checkedOptions ?? (selectAllChecked ? options : []));
  const allChecked = options.length > 0 && options.every((option) => checkedSet.has(option));

  const setChecked = (next: string[]) => {
    onChange?.(next);
  };

  return (
    <ul className="max-h-[200px] overflow-y-auto py-1">
      <li className="border-b border-gray-200 px-3 py-1.5">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-dark font-body">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={() => {
              if (!onChange) {
                return;
              }
              setChecked(allChecked ? [] : [...options]);
            }}
            className="h-3.5 w-3.5 rounded border-gray-300 accent-[#0EA5E9]"
          />
          <span>Select All</span>
        </label>
      </li>
      {options.map((option) => (
        <li key={option} className="px-3 py-1.5">
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-dark font-body">
            <input
              type="checkbox"
              checked={checkedSet.has(option)}
              onChange={() => {
                if (!onChange) {
                  return;
                }
                if (checkedSet.has(option)) {
                  setChecked(options.filter((item) => checkedSet.has(item) && item !== option));
                } else {
                  setChecked([...options.filter((item) => checkedSet.has(item)), option]);
                }
              }}
              className="h-3.5 w-3.5 rounded border-gray-300 accent-[#0EA5E9]"
            />
            <span>{option}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function FilterDropdown({
  label,
  displayValue,
  isOpen,
  onToggle,
  widthClass,
  panelWidthClass = 'w-[200px]',
  children,
}: {
  label: string;
  displayValue: string;
  isOpen: boolean;
  onToggle: () => void;
  widthClass?: string;
  panelWidthClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative ${widthClass ?? 'w-[148px]'}`}>
      <FilterTrigger
        label={label}
        value={displayValue}
        isOpen={isOpen}
        onToggle={onToggle}
        widthClass="w-full"
      />
      {isOpen ? (
        <div
          className={`absolute left-0 top-[calc(100%+4px)] z-50 ${panelWidthClass} rounded border border-gray-200 bg-white shadow-lg`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function SideQuestHeader({
  appTitle,
  onTitleChange,
  filterVariant = 'contact',
}: SideQuestHeaderProps) {
  const [openFilter, setOpenFilter] = useState<OpenFilterId>(null);
  const [selectedCustomerTypes, setSelectedCustomerTypes] = useState<string[]>([...CUSTOMER_TYPE_OPTIONS]);
  const [selectedCustomerStatuses, setSelectedCustomerStatuses] = useState<string[]>([...CUSTOMER_STATUS_OPTIONS]);
  const [selectedStates, setSelectedStates] = useState<string[]>([...STATE_OPTIONS]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([...AGENT_OPTIONS]);
  const [selectedPreferredModalities, setSelectedPreferredModalities] = useState<string[]>([...PREFERRED_MODALITY_OPTIONS]);
  const [selectedContactReasons, setSelectedContactReasons] = useState<string[]>([...CONTACT_REASON_OPTIONS]);
  const [selectedTicketStatuses, setSelectedTicketStatuses] = useState<string[]>([...TICKET_STATUS_OPTIONS]);
  const [selectedTicketPriorities, setSelectedTicketPriorities] = useState<string[]>([...TICKET_PRIORITY_OPTIONS]);
  const [selectedLoyaltyTiers, setSelectedLoyaltyTiers] = useState<string[]>([...LOYALTY_TIER_OPTIONS]);
  const [activityDateScope, setActivityDateScope] = useState('Most Recent Call');
  const [scheduleWeek, setScheduleWeek] = useState('This Week');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([...TEAM_OPTIONS]);
  const [selectedOfficeLocations, setSelectedOfficeLocations] = useState<string[]>([...OFFICE_LOCATION_OPTIONS]);
  const [selectedAgentStatuses, setSelectedAgentStatuses] = useState<string[]>([...AGENT_STATUS_OPTIONS]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([...SHIFT_OPTIONS]);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([...SUPERVISOR_OPTIONS]);
  const [phoneNumberSearch, setPhoneNumberSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');

  const toggleFilter = (id: OpenFilterId) => {
    setOpenFilter((current) => (current === id ? null : id));
  };

  const customerTypeDisplay = getCheckboxDisplayValue(selectedCustomerTypes, CUSTOMER_TYPE_OPTIONS);
  const customerStatusDisplay = getCheckboxDisplayValue(selectedCustomerStatuses, CUSTOMER_STATUS_OPTIONS);
  const stateDisplay = getCheckboxDisplayValue(selectedStates, STATE_OPTIONS);
  const agentDisplay = getCheckboxDisplayValue(selectedAgents, AGENT_OPTIONS);
  const preferredModalityDisplay = getCheckboxDisplayValue(selectedPreferredModalities, PREFERRED_MODALITY_OPTIONS);
  const contactReasonDisplay = getCheckboxDisplayValue(selectedContactReasons, CONTACT_REASON_OPTIONS);
  const ticketStatusDisplay = getCheckboxDisplayValue(selectedTicketStatuses, TICKET_STATUS_OPTIONS);
  const ticketPriorityDisplay = getCheckboxDisplayValue(selectedTicketPriorities, TICKET_PRIORITY_OPTIONS);
  const loyaltyTierDisplay = getCheckboxDisplayValue(selectedLoyaltyTiers, LOYALTY_TIER_OPTIONS);
  const teamDisplay = getCheckboxDisplayValue(selectedTeams, TEAM_OPTIONS);
  const officeLocationDisplay = getCheckboxDisplayValue(selectedOfficeLocations, OFFICE_LOCATION_OPTIONS);
  const agentStatusDisplay = getCheckboxDisplayValue(selectedAgentStatuses, AGENT_STATUS_OPTIONS);
  const shiftDisplay = getCheckboxDisplayValue(selectedShifts, SHIFT_OPTIONS);
  const supervisorDisplay = getCheckboxDisplayValue(selectedSupervisors, SUPERVISOR_OPTIONS);

  const showRetailSecondRow = filterVariant === 'orders' && selectedCustomerTypes.includes('Retail');

  return (
    <header className="relative z-20 flex shrink-0 flex-col bg-black px-6 py-3 text-light shadow-lg overflow-visible">
      <div className="absolute left-6 top-2.5 z-10 flex h-[42px] w-[130px] translate-y-2 items-center justify-center">
        <img
          src={projectLogo}
          alt="Logo"
          className="max-h-[42px] min-h-[40px] min-w-[40px] max-w-[130px] object-contain"
          onError={(event) => {
            event.currentTarget.src =
              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='%23eee'/><text x='50%' y='50%' font-size='18' text-anchor='middle' fill='%23606060' dy='.3em'>Logo</text></svg>";
          }}
        />
      </div>

      <div className="flex w-full justify-center px-6 translate-y-2">
        <input
          value={appTitle}
          onChange={(event) => onTitleChange(event.target.value)}
          className="m-0 w-full max-w-xl border-0 bg-transparent p-0 text-center text-2xl font-bold leading-tight font-header text-light focus:outline-none"
        />
      </div>

      <div className="relative z-20 mt-4 flex w-full flex-wrap items-end justify-center gap-x-4 gap-y-2 px-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold leading-tight text-white font-body">Date</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                readOnly
                value="3/10/2026"
                className="h-4 w-[108px] rounded border border-gray-300 bg-white px-1.5 pr-6 text-[10px] leading-none text-dark font-body focus:outline-none"
              />
              <Calendar size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value="5/9/2026"
                className="h-4 w-[108px] rounded border border-gray-300 bg-white px-1.5 pr-6 text-[10px] leading-none text-dark font-body focus:outline-none"
              />
              <Calendar size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>

        <FilterDropdown
          label="In the"
          displayValue="Last 60 Days"
          isOpen={openFilter === 'inThe'}
          onToggle={() => toggleFilter('inThe')}
          widthClass="w-[148px]"
          panelWidthClass="w-[180px]"
        >
          <BubbleListPanel options={RELATIVE_DATE_OPTIONS} selected="Last 60 Days" />
        </FilterDropdown>

        {filterVariant === 'orders' ? (
          <>
            <FilterDropdown
              label="Contains"
              displayValue="None"
              isOpen={openFilter === 'contains'}
              onToggle={() => toggleFilter('contains')}
              widthClass="w-[132px]"
              panelWidthClass="w-[180px]"
            >
              <CheckboxListPanel
                options={CONTAINS_OPTIONS}
                selectAllChecked={false}
                checkedOptions={[]}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Product Category"
              displayValue="All"
              isOpen={openFilter === 'productCategory'}
              onToggle={() => toggleFilter('productCategory')}
              widthClass="w-[148px]"
              panelWidthClass="w-[200px]"
            >
              <CheckboxListPanel options={PRODUCT_CATEGORY_OPTIONS} selectAllChecked />
            </FilterDropdown>
          </>
        ) : filterVariant === 'tickets' ? (
          <>
            <FilterDropdown
              label="Modality"
              displayValue="All"
              isOpen={openFilter === 'modality'}
              onToggle={() => toggleFilter('modality')}
              widthClass="w-[140px]"
            >
              <CheckboxListPanel options={MODALITY_OPTIONS} selectAllChecked />
            </FilterDropdown>

            <FilterDropdown
              label="Reason"
              displayValue="All"
              isOpen={openFilter === 'reason'}
              onToggle={() => toggleFilter('reason')}
              widthClass="w-[140px]"
              panelWidthClass="w-[210px]"
            >
              <CheckboxListPanel options={CONTACT_REASON_OPTIONS} selectAllChecked />
            </FilterDropdown>

            <FilterDropdown
              label="Status"
              displayValue={ticketStatusDisplay}
              isOpen={openFilter === 'ticketStatus'}
              onToggle={() => toggleFilter('ticketStatus')}
              widthClass="w-[132px]"
              panelWidthClass="w-[190px]"
            >
              <CheckboxListPanel
                options={TICKET_STATUS_OPTIONS}
                checkedOptions={selectedTicketStatuses}
                onChange={setSelectedTicketStatuses}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Priority"
              displayValue={ticketPriorityDisplay}
              isOpen={openFilter === 'ticketPriority'}
              onToggle={() => toggleFilter('ticketPriority')}
              widthClass="w-[120px]"
              panelWidthClass="w-[160px]"
            >
              <CheckboxListPanel
                options={TICKET_PRIORITY_OPTIONS}
                checkedOptions={selectedTicketPriorities}
                onChange={setSelectedTicketPriorities}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Assigned Agent"
              displayValue={agentDisplay}
              isOpen={openFilter === 'agent'}
              onToggle={() => toggleFilter('agent')}
              widthClass="w-[132px]"
              panelWidthClass="w-[190px]"
            >
              <CheckboxListPanel
                options={AGENT_OPTIONS}
                checkedOptions={selectedAgents}
                onChange={setSelectedAgents}
              />
            </FilterDropdown>

            <FilterTextInput
              label="Phone Number"
              value={phoneNumberSearch}
              onChange={setPhoneNumberSearch}
              placeholder="Search by phone..."
              widthClass="w-[180px]"
            />

            <FilterTextInput
              label="Email"
              value={emailSearch}
              onChange={setEmailSearch}
              placeholder="Search by email..."
              widthClass="w-[200px]"
            />
          </>
        ) : filterVariant === 'customers' ? (
          <>
            <FilterDropdown
              label="Activity Date"
              displayValue={activityDateScope}
              isOpen={openFilter === 'activityDate'}
              onToggle={() => toggleFilter('activityDate')}
              widthClass="w-[148px]"
              panelWidthClass="w-[190px]"
            >
              <BubbleListPanel
                options={ACTIVITY_DATE_OPTIONS}
                selected={activityDateScope}
                onSelect={setActivityDateScope}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Customer Type"
              displayValue={customerTypeDisplay}
              isOpen={openFilter === 'customerType'}
              onToggle={() => toggleFilter('customerType')}
              widthClass="w-[132px]"
              panelWidthClass="w-[160px]"
            >
              <CheckboxListPanel
                options={CUSTOMER_TYPE_OPTIONS}
                checkedOptions={selectedCustomerTypes}
                onChange={setSelectedCustomerTypes}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Customer Status"
              displayValue={customerStatusDisplay}
              isOpen={openFilter === 'customerStatus'}
              onToggle={() => toggleFilter('customerStatus')}
              widthClass="w-[132px]"
              panelWidthClass="w-[160px]"
            >
              <CheckboxListPanel
                options={CUSTOMER_STATUS_OPTIONS}
                checkedOptions={selectedCustomerStatuses}
                onChange={setSelectedCustomerStatuses}
              />
            </FilterDropdown>

            <FilterDropdown
              label="State"
              displayValue={stateDisplay}
              isOpen={openFilter === 'state'}
              onToggle={() => toggleFilter('state')}
              widthClass="w-[120px]"
              panelWidthClass="w-[160px]"
            >
              <CheckboxListPanel
                options={STATE_OPTIONS}
                checkedOptions={selectedStates}
                onChange={setSelectedStates}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Assigned Agent"
              displayValue={agentDisplay}
              isOpen={openFilter === 'agent'}
              onToggle={() => toggleFilter('agent')}
              widthClass="w-[132px]"
              panelWidthClass="w-[190px]"
            >
              <CheckboxListPanel
                options={AGENT_OPTIONS}
                checkedOptions={selectedAgents}
                onChange={setSelectedAgents}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Preferred Modality"
              displayValue={preferredModalityDisplay}
              isOpen={openFilter === 'preferredModality'}
              onToggle={() => toggleFilter('preferredModality')}
              widthClass="w-[148px]"
              panelWidthClass="w-[180px]"
            >
              <CheckboxListPanel
                options={PREFERRED_MODALITY_OPTIONS}
                checkedOptions={selectedPreferredModalities}
                onChange={setSelectedPreferredModalities}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Last Contact Reason"
              displayValue={contactReasonDisplay}
              isOpen={openFilter === 'contactReason'}
              onToggle={() => toggleFilter('contactReason')}
              widthClass="w-[148px]"
              panelWidthClass="w-[210px]"
            >
              <CheckboxListPanel
                options={CONTACT_REASON_OPTIONS}
                checkedOptions={selectedContactReasons}
                onChange={setSelectedContactReasons}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Loyalty Tier"
              displayValue={loyaltyTierDisplay}
              isOpen={openFilter === 'loyaltyTier'}
              onToggle={() => toggleFilter('loyaltyTier')}
              widthClass="w-[132px]"
              panelWidthClass="w-[170px]"
            >
              <CheckboxListPanel
                options={LOYALTY_TIER_OPTIONS}
                checkedOptions={selectedLoyaltyTiers}
                onChange={setSelectedLoyaltyTiers}
              />
            </FilterDropdown>

            <FilterTextInput
              label="Phone Number"
              value={phoneNumberSearch}
              onChange={setPhoneNumberSearch}
              placeholder="Search by phone..."
              widthClass="w-[180px]"
            />

            <FilterTextInput
              label="Email"
              value={emailSearch}
              onChange={setEmailSearch}
              placeholder="Search by email..."
              widthClass="w-[200px]"
            />
          </>
        ) : filterVariant === 'agents' ? (
          <>
            <FilterDropdown
              label="Schedule Week"
              displayValue={scheduleWeek}
              isOpen={openFilter === 'scheduleWeek'}
              onToggle={() => toggleFilter('scheduleWeek')}
              widthClass="w-[132px]"
              panelWidthClass="w-[160px]"
            >
              <BubbleListPanel
                options={SCHEDULE_WEEK_OPTIONS}
                selected={scheduleWeek}
                onSelect={setScheduleWeek}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Team"
              displayValue={teamDisplay}
              isOpen={openFilter === 'team'}
              onToggle={() => toggleFilter('team')}
              widthClass="w-[132px]"
              panelWidthClass="w-[180px]"
            >
              <CheckboxListPanel
                options={TEAM_OPTIONS}
                checkedOptions={selectedTeams}
                onChange={setSelectedTeams}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Office Location"
              displayValue={officeLocationDisplay}
              isOpen={openFilter === 'officeLocation'}
              onToggle={() => toggleFilter('officeLocation')}
              widthClass="w-[148px]"
              panelWidthClass="w-[180px]"
            >
              <CheckboxListPanel
                options={OFFICE_LOCATION_OPTIONS}
                checkedOptions={selectedOfficeLocations}
                onChange={setSelectedOfficeLocations}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Agent Status"
              displayValue={agentStatusDisplay}
              isOpen={openFilter === 'agentStatus'}
              onToggle={() => toggleFilter('agentStatus')}
              widthClass="w-[132px]"
              panelWidthClass="w-[170px]"
            >
              <CheckboxListPanel
                options={AGENT_STATUS_OPTIONS}
                checkedOptions={selectedAgentStatuses}
                onChange={setSelectedAgentStatuses}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Shift"
              displayValue={shiftDisplay}
              isOpen={openFilter === 'shift'}
              onToggle={() => toggleFilter('shift')}
              widthClass="w-[120px]"
              panelWidthClass="w-[160px]"
            >
              <CheckboxListPanel
                options={SHIFT_OPTIONS}
                checkedOptions={selectedShifts}
                onChange={setSelectedShifts}
              />
            </FilterDropdown>

            <FilterDropdown
              label="Supervisor"
              displayValue={supervisorDisplay}
              isOpen={openFilter === 'supervisor'}
              onToggle={() => toggleFilter('supervisor')}
              widthClass="w-[132px]"
              panelWidthClass="w-[180px]"
            >
              <CheckboxListPanel
                options={SUPERVISOR_OPTIONS}
                checkedOptions={selectedSupervisors}
                onChange={setSelectedSupervisors}
              />
            </FilterDropdown>

            <FilterDropdown
              label="State"
              displayValue={stateDisplay}
              isOpen={openFilter === 'state'}
              onToggle={() => toggleFilter('state')}
              widthClass="w-[120px]"
              panelWidthClass="w-[160px]"
            >
              <CheckboxListPanel
                options={STATE_OPTIONS}
                checkedOptions={selectedStates}
                onChange={setSelectedStates}
              />
            </FilterDropdown>

            <FilterTextInput
              label="Phone Number"
              value={phoneNumberSearch}
              onChange={setPhoneNumberSearch}
              placeholder="Search by phone..."
              widthClass="w-[180px]"
            />

            <FilterTextInput
              label="Email"
              value={emailSearch}
              onChange={setEmailSearch}
              placeholder="Search by email..."
              widthClass="w-[200px]"
            />
          </>
        ) : (
          <>
            <FilterDropdown
              label="Modality"
              displayValue="All"
              isOpen={openFilter === 'modality'}
              onToggle={() => toggleFilter('modality')}
              widthClass="w-[140px]"
            >
              <CheckboxListPanel options={MODALITY_OPTIONS} selectAllChecked />
            </FilterDropdown>

            <FilterDropdown
              label="Reason"
              displayValue="All"
              isOpen={openFilter === 'reason'}
              onToggle={() => toggleFilter('reason')}
              widthClass="w-[140px]"
              panelWidthClass="w-[210px]"
            >
              <CheckboxListPanel options={REASON_OPTIONS} selectAllChecked />
            </FilterDropdown>

            <FilterDropdown
              label="Agent"
              displayValue="All"
              isOpen={openFilter === 'agent'}
              onToggle={() => toggleFilter('agent')}
              widthClass="w-[152px]"
              panelWidthClass="w-[190px]"
            >
              <CheckboxListPanel options={AGENT_OPTIONS} selectAllChecked />
            </FilterDropdown>

            <FilterDropdown
              label="Retail?"
              displayValue="Both"
              isOpen={openFilter === 'retail'}
              onToggle={() => toggleFilter('retail')}
              widthClass="w-[120px]"
              panelWidthClass="w-[140px]"
            >
              <BubbleListPanel options={RETAIL_OPTIONS} selected="Both" />
            </FilterDropdown>
          </>
        )}
      </div>

      {showRetailSecondRow ? (
        <div className="relative z-10 mt-2 flex w-full flex-wrap items-end justify-center gap-x-4 gap-y-2 border-t border-white/20 px-2 pt-2">
          <FilterDropdown
            label="Retail Customer Group"
            displayValue="All"
            isOpen={openFilter === 'group'}
            onToggle={() => toggleFilter('group')}
            widthClass="w-[168px]"
            panelWidthClass="w-[180px]"
          >
            <CheckboxListPanel options={GROUP_OPTIONS} selectAllChecked />
          </FilterDropdown>

          <FilterDropdown
            label="Partner"
            displayValue="All"
            isOpen={openFilter === 'partner'}
            onToggle={() => toggleFilter('partner')}
            widthClass="w-[148px]"
            panelWidthClass="w-[220px]"
          >
            <CheckboxListPanel options={PARTNER_OPTIONS} selectAllChecked />
          </FilterDropdown>

          <FilterDropdown
            label="Store Tier"
            displayValue="All"
            isOpen={openFilter === 'storeTier'}
            onToggle={() => toggleFilter('storeTier')}
            widthClass="w-[120px]"
            panelWidthClass="w-[150px]"
          >
            <BubbleListPanel options={STORE_TIER_OPTIONS} selected="All" />
          </FilterDropdown>

          <FilterDropdown
            label="Chain"
            displayValue="All"
            isOpen={openFilter === 'chain'}
            onToggle={() => toggleFilter('chain')}
            widthClass="w-[148px]"
            panelWidthClass="w-[230px]"
          >
            <CheckboxListPanel options={CHAIN_OPTIONS} selectAllChecked />
          </FilterDropdown>
        </div>
      ) : null}
    </header>
  );
}

export default SideQuestHeader;
