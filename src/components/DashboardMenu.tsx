import {
  Briefcase,
  Building2,
  DollarSign,
  FlaskConical,
  Headphones,
  Mail,
  Megaphone,
  Settings2,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
} from 'lucide-react';

interface DashboardMenuProps {
  isOpen: boolean;
  side?: 'left' | 'right';
  activeDashboard?: string;
  onDashboardSelect?: (dashboardLabel: string) => void;
  executiveSummaryPage?: number;
  onExecutiveSummaryPageChange?: (page: number) => void;
}

function DashboardMenu({
  isOpen,
  side = 'left',
  activeDashboard,
  onDashboardSelect,
  executiveSummaryPage = 0,
  onExecutiveSummaryPageChange,
}: DashboardMenuProps) {

  const dashboards = [
    { label: 'Executive Summary', icon: Briefcase },
    { label: 'Financial Summary', icon: DollarSign },
    { label: 'B2B Summary', icon: Building2 },
    { label: 'DTC Summary (eCommerce)', icon: ShoppingCart },
    { label: 'DTC Summary (ADS)', icon: Megaphone },
    { label: 'Operational Summary', icon: Settings2 },
    { label: 'Product Summary (NPI)', icon: FlaskConical },
    { label: 'Product Summary (Quality)', icon: ShieldCheck },
    { label: 'Customer Service Summary', icon: Headphones },
    { label: 'Marketing Summary (CRM)', icon: Mail },
    { label: 'Marketing Summary (Social Media)', icon: Share2 },
    { label: 'Marketing Summary (Mobile App)', icon: Smartphone },
  ];

  const isRightSide = side === 'right';

  return (
    <div className={`relative shrink-0 h-full ${isOpen ? 'w-64' : 'w-0'}`}>
      <aside
        className={`h-full ${isRightSide ? 'border-l' : 'border-r'} w-64 bg-white border-gray-200 overflow-y-auto ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="p-4 pb-14">
          <h2 className="text-lg font-semibold mb-4 text-dark text-left font-header">Dashboards</h2>

          <div className="space-y-2">
            {dashboards.map((dashboard) => {
              const Icon = dashboard.icon;
              const isExecutiveSummary = dashboard.label === 'Executive Summary';

              if (isExecutiveSummary) {
                return (
                  <div key={dashboard.label} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDashboardSelect?.(dashboard.label)}
                      className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-all border text-left ${
                        activeDashboard === dashboard.label
                          ? 'bg-[#EA0029] text-white border-[#EA0029]'
                          : 'bg-white border-[#606060] hover:bg-[#EA0029] hover:text-white hover:border-[#EA0029]'
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="text-xs font-medium font-body">{dashboard.label}</span>
                    </button>
                    <div className="flex items-center gap-1 pr-1">
                      {[0, 1].map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDashboardSelect?.('Executive Summary');
                            onExecutiveSummaryPageChange?.(page);
                          }}
                          className={`h-3 w-3 rounded-full border border-black transition-all ${
                            executiveSummaryPage === page ? 'bg-[#EA0029]' : 'bg-black'
                          }`}
                          title={`Show Executive Summary page ${page + 1}`}
                          aria-label={`Show Executive Summary page ${page + 1}`}
                        >
                          <span className="sr-only">Executive Summary page {page + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
              <button
                key={dashboard.label}
                type="button"
                onClick={() => onDashboardSelect?.(dashboard.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all border text-left ${
                  activeDashboard === dashboard.label
                    ? 'bg-[#EA0029] text-white border-[#EA0029]'
                    : 'bg-white border-[#606060] hover:bg-[#EA0029] hover:text-white hover:border-[#EA0029]'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="text-xs font-medium font-body">{dashboard.label}</span>
              </button>
              );
            })}
          </div>
        </div>
      </aside>

    </div>
  );
}

export default DashboardMenu;