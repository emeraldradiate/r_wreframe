import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export type FieldChooserItem = {
  label: string;
  checked?: boolean;
};

const DEFAULT_FIELDS: FieldChooserItem[] = [
  { label: 'Select all', checked: false },
  { label: 'Sales Date', checked: true },
  { label: 'Ship Date', checked: true },
  { label: 'Shipping Method', checked: true },
  { label: 'Sales Channel', checked: true },
  { label: 'Shipping Location', checked: true },
  { label: 'Shipping State', checked: false },
  { label: 'Transaction Status', checked: true },
  { label: 'Sales Order', checked: true },
  { label: 'Sales Order Internal ID', checked: false },
  { label: 'Customer Name', checked: false },
  { label: 'Item Display Name', checked: true },
  { label: 'Item Code', checked: false },
  { label: 'Qty', checked: true },
  { label: 'Terms', checked: false },
  { label: 'Age Pending Notes', checked: false },
  { label: 'Age Pending Owner', checked: false },
  { label: 'Order Notes', checked: false },
  { label: 'Created By', checked: false },
  { label: 'P/O Number', checked: false },
  { label: 'Reason for Hold', checked: false },
  { label: 'Partner Name', checked: false },
  { label: 'Net Amount', checked: true },
  { label: 'Credit Number', checked: false },
];

function FieldChooserVisual({
  fields = DEFAULT_FIELDS,
}: {
  title?: string;
  fields?: FieldChooserItem[];
}) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<FieldChooserItem[]>(
    fields.length ? fields.map((field) => ({ ...field })) : DEFAULT_FIELDS.map((field) => ({ ...field })),
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.label.toLowerCase().includes(query));
  }, [items, search]);

  const toggleItem = (label: string) => {
    if (label === 'Select all') {
      setItems((current) => {
        const selectAll = current.find((item) => item.label === 'Select all');
        const nextChecked = !selectAll?.checked;
        return current.map((item) => ({ ...item, checked: nextChecked }));
      });
      return;
    }

    setItems((current) => {
      const next = current.map((item) => (
        item.label === label ? { ...item, checked: !item.checked } : item
      ));
      const dataFields = next.filter((item) => item.label !== 'Select all');
      const allChecked = dataFields.every((item) => item.checked);
      return next.map((item) => (
        item.label === 'Select all' ? { ...item, checked: allChecked } : item
      ));
    });
  };

  return (
    <div className="w-full h-full bg-white flex flex-col font-body overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Search"
            className="nodrag w-full h-8 border border-gray-300 bg-white pl-7 pr-2 text-xs text-black placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <ul className="space-y-1.5">
          {filteredItems.map((item) => (
            <li key={item.label}>
              <label
                className="nodrag flex items-center gap-2 cursor-pointer select-none text-xs text-black"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={Boolean(item.checked)}
                  onChange={() => toggleItem(item.label)}
                  className="nodrag h-3.5 w-3.5 accent-black border-gray-400"
                />
                <span className="leading-tight">{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FieldChooserVisual;
