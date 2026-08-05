import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WireframeCanvas from './components/WireframeCanvas';
import Toolbar from './components/Toolbar';
import DashboardMenu from './components/DashboardMenu';
import ReportingPeriodFilter, { getDefaultReportingPeriod, ReportingPeriodValue } from './components/ReportingPeriodFilter';
import SideQuestHeader from './components/SideQuestHeader';
import projectLogo from './assets/project-logo.png';
import './App.css';

const DEFAULT_APP_TITLE = 'Executive Summary';
const CUSTOMER_SERVICE_SIDE_QUEST_DASHBOARD = 'Customer Service Side Quest';
const TARGET_WEEK_ENDING_SUBHEADER = 'Wk 19 ending 5/9/2026';
const WEEK_ENDING_SUBHEADER_REGEX = /(wk|week)\s*\d+\s*ending\s*\d{1,2}\/\d{1,2}\/\d{4}/i;

type DashboardDefaultView = {
  zoom: number;
  x: number;
  y: number;
  miniHeader: boolean;
};

const EXECUTIVE_SUMMARY_DEFAULT_VIEWS: Record<0, DashboardDefaultView> = {
  0: { zoom: 0.56, x: 56, y: 143, miniHeader: false },
};

const RETAIL_SUMMARY_DEFAULT_VIEWS: Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DashboardDefaultView> = {
  0: { zoom: 0.59, x: 219, y: -97, miniHeader: true },
  1: { zoom: 0.75, x: 70, y: 119, miniHeader: true },
  2: { zoom: 0.5, x: 238, y: 27, miniHeader: true },
  3: { zoom: 0.5, x: 238, y: 27, miniHeader: true },
  4: { zoom: 0.5, x: 238, y: 27, miniHeader: true },
  5: { zoom: 0.75, x: 70, y: 119, miniHeader: true },
  6: { zoom: 0.58, x: 205, y: 33, miniHeader: true },
};

const FINANCIAL_SUMMARY_DEFAULT_VIEWS: Record<0 | 1 | 2 | 3, DashboardDefaultView> = {
  0: { zoom: 0.58, x: 290, y: 113, miniHeader: true },
  1: { zoom: 0.565, x: 171, y: 171, miniHeader: true },
  2: { zoom: 0.54, x: 191, y: -158, miniHeader: true },
  3: { zoom: 0.54, x: 300, y: 102, miniHeader: true },
};

const CUSTOMER_SERVICE_SIDE_QUEST_DEFAULT_VIEWS: Record<0 | 1 | 2 | 3 | 4, DashboardDefaultView> = {
  0: { zoom: 0.63, x: 67, y: -12, miniHeader: false },
  1: { zoom: 0.78, x: 2, y: 32, miniHeader: false },
  2: { zoom: 0.78, x: 2, y: 32, miniHeader: false },
  3: { zoom: 0.78, x: 2, y: 32, miniHeader: false },
  4: { zoom: 0.78, x: 2, y: 32, miniHeader: false },
};

const getMiniHeaderSubheadingKey = (dashboardLabel: string, page: number) => {
  if (dashboardLabel === 'Financial Summary' || dashboardLabel === 'Retail Summary') {
    return `${dashboardLabel}:${page}`;
  }

  return `${dashboardLabel}:0`;
};

const getDefaultMiniHeaderSubheading = (dashboardLabel: string, page: number) => {
  if (dashboardLabel === 'Financial Summary' && page === 0) {
    return 'Pg. 2 Bookings';
  }

  if (dashboardLabel === 'Financial Summary' && page === 1) {
    return 'Pg. 3 Contribution Margin (Bookings)';
  }

  if (dashboardLabel === 'Financial Summary' && page === 2) {
    return 'Pg. 4 Grill Mix';
  }

  if (dashboardLabel === 'Financial Summary' && page === 3) {
    return 'Pg. 2 Bookings v2';
  }

  if (dashboardLabel === 'Executive Summary') {
    return 'Executive Summary';
  }

  if (dashboardLabel === 'Retail Summary' && page === 0) {
    return 'Pg. 5, Overview';
  }

  if (dashboardLabel === 'Retail Summary' && page === 1) {
    return 'Pg. 6, Domestic Stores';
  }

  if (dashboardLabel === 'Retail Summary' && page === 2) {
    return 'Pg. 7, Domestic Sales';
  }

  if (dashboardLabel === 'Retail Summary' && page === 3) {
    return 'Pg. 8, Diamond Sales';
  }

  if (dashboardLabel === 'Retail Summary' && page === 4) {
    return 'ACE Details';
  }

  if (dashboardLabel === 'Retail Summary' && page === 5) {
    return 'Pg. 10, International Stores';
  }

  if (dashboardLabel === 'Retail Summary' && page === 6) {
    return 'Pg. 11, International Sales';
  }

  return '';
};

const normalizeMiniHeaderSubheading = (value: string) => {
  if (!value) {
    return value;
  }

  return WEEK_ENDING_SUBHEADER_REGEX.test(value)
    ? TARGET_WEEK_ENDING_SUBHEADER
    : value;
};

const getWeekEndingSaturdayFromIsoWeek = (year: number, week: number) => {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeekOne = new Date(jan4);
  mondayWeekOne.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const saturday = new Date(mondayWeekOne);
  saturday.setUTCDate(mondayWeekOne.getUTCDate() + ((week - 1) * 7) + 5);
  return saturday;
};

const formatWeekEndingSaturdaySummary = ({ reportingYear, reportingWeek }: ReportingPeriodValue) => {
  const saturdayDate = getWeekEndingSaturdayFromIsoWeek(reportingYear, reportingWeek);
  const month = `${saturdayDate.getUTCMonth() + 1}`;
  const day = `${saturdayDate.getUTCDate()}`;
  const year = saturdayDate.getUTCFullYear();

  if (reportingYear === 2026 && reportingWeek === 19) {
    return TARGET_WEEK_ENDING_SUBHEADER;
  }

  return `Wk ${reportingWeek} ending ${month}/${day}/${year}`;
};

const getMiniHeaderSubheadingFromPayload = (payload: unknown) => {
  const parsed = payload as { miniHeaderSubheading?: unknown } | null;
  return typeof parsed?.miniHeaderSubheading === 'string' ? parsed.miniHeaderSubheading : null;
};

const getIsoWeeksInYear = (year: number) => {
  const reference = new Date(Date.UTC(year, 11, 28));
  const day = reference.getUTCDay() || 7;
  reference.setUTCDate(reference.getUTCDate() + 4 - day);
  const isoYear = reference.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  return Math.ceil((((reference.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getRecentWeekLabels = (reportingYear: number, reportingWeek: number, count = 5) => {
  const labels: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    let yearCursor = reportingYear;
    let weekCursor = reportingWeek;
    let remaining = offset;

    while (remaining > 0) {
      weekCursor -= 1;
      if (weekCursor < 1) {
        yearCursor -= 1;
        weekCursor = getIsoWeeksInYear(yearCursor);
      }
      remaining -= 1;
    }

    labels.push(`Wk ${weekCursor}`);
  }

  return labels;
};

const buildFinancialSummaryPayload = (basePayload: unknown, reportingPeriod: ReportingPeriodValue) => {
  const clonedPayload = JSON.parse(JSON.stringify(basePayload)) as {
    nodes?: Array<{
      data?: {
        componentType?: string;
        columnLabels?: string[];
        matrixLayout?: 'weekly' | 'budget';
        matrixData?: Array<Array<number | string>>;
      };
    }>;
  };
  const weekLabels = getRecentWeekLabels(reportingPeriod.reportingYear, reportingPeriod.reportingWeek, 5);
  const weeklyColumnLabels = [
    'Channel',
    ...weekLabels,
  ];
  const budgetColumnLabels = [
    'CW Budget',
    'Budget vs Actual $',
    'Budget vs Actual %',
  ];

  if (Array.isArray(clonedPayload.nodes)) {
    clonedPayload.nodes = clonedPayload.nodes.map((node) => {
      if (node?.data?.componentType !== 'matrix') {
        return node;
      }

      const matrixLayout = node.data.matrixLayout || null;
      const rowWidth = node.data.matrixData?.[0]?.length || node.data.columnLabels?.length || 0;
      const hasMatchingColumnLabels = Array.isArray(node.data.columnLabels) && node.data.columnLabels.length === rowWidth;
      const columnLabels = hasMatchingColumnLabels
        ? node.data.columnLabels
        : matrixLayout === 'budget'
          ? budgetColumnLabels.slice(0, rowWidth || budgetColumnLabels.length)
          : matrixLayout === 'weekly'
            ? rowWidth === weeklyColumnLabels.length
              ? weeklyColumnLabels
              : rowWidth === weeklyColumnLabels.length - 1
                ? weeklyColumnLabels.slice(1)
                : node.data.columnLabels
            : node.data.columnLabels;

      return {
        ...node,
        data: {
          ...node.data,
          columnLabels,
        },
      };
    });
  }

  return clonedPayload;
};

function App() {
  const [gridVisible, setGridVisible] = useState(true);
  const [miniHeader, setMiniHeader] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(true);
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE);
  const [reportingPeriod, setReportingPeriod] = useState<ReportingPeriodValue>(() => getDefaultReportingPeriod());
  const [activeDashboard, setActiveDashboard] = useState('Executive Summary');
  const [financialSummaryPage, setFinancialSummaryPage] = useState<0 | 1 | 2 | 3>(0);
  const [retailSummaryPage, setRetailSummaryPage] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  const [sideQuestPage, setSideQuestPage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [miniHeaderSubheadings, setMiniHeaderSubheadings] = useState<Record<string, string>>(() => ({
    'Financial Summary:0': 'Pg. 2 Bookings',
    'Financial Summary:1': 'Pg. 3 Contribution Margin',
    'Financial Summary:2': 'Pg. 4 Grill Mix',
    'Financial Summary:3': 'Pg. 2 Bookings v2',
    'Executive Summary:0': 'Executive Summary',
    'Retail Summary:0': 'Pg. 5 Overview',
    'Retail Summary:1': 'Pg. 6 Domestic Stores',
    'Retail Summary:2': 'Pg. 7 Domestic Sales',
    'Retail Summary:3': 'Pg. 8 Diamond Sales',
    'Retail Summary:4': 'ACE Details',
    'Retail Summary:5': 'Pg. 10 International Stores',
    'Retail Summary:6': 'Pg. 11 International Sales',
  }));
  const [dashboardLoadRequestId, setDashboardLoadRequestId] = useState(1);
  const [zoomResetRequestId, setZoomResetRequestId] = useState(0);
  const [externalDashboardLoad, setExternalDashboardLoad] = useState<{
    requestId: number;
    payload: unknown;
    defaultZoom?: number;
    defaultViewport?: {
      x: number;
      y: number;
    };
  } | null>(null);

  useEffect(() => {
    setMiniHeaderSubheadings((current) => {
      const normalized = Object.entries(current).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = normalizeMiniHeaderSubheading(value);
        return acc;
      }, {});

      const hasChanges = Object.keys(current).some((key) => current[key] !== normalized[key]);
      return hasChanges ? normalized : current;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardPayload = async () => {
      if (dashboardLoadRequestId <= 0) {
        return;
      }

      if (activeDashboard === 'Executive Summary') {
        const module = await import('./data/executiveSummaryDashboard.json');
        const executiveSummaryDefaultView = EXECUTIVE_SUMMARY_DEFAULT_VIEWS[0];
        const nextSubheading = getMiniHeaderSubheadingFromPayload(module.default);

        if (!cancelled) {
          if (nextSubheading !== null) {
            const subheadingKey = getMiniHeaderSubheadingKey('Executive Summary', 0);
            setMiniHeaderSubheadings((current) => ({
              ...current,
              [subheadingKey]: normalizeMiniHeaderSubheading(nextSubheading),
            }));
          }

          setExternalDashboardLoad({
            requestId: dashboardLoadRequestId,
            payload: module.default,
            defaultZoom: executiveSummaryDefaultView.zoom,
            defaultViewport: {
              x: executiveSummaryDefaultView.x,
              y: executiveSummaryDefaultView.y,
            },
          });
        }

        return;
      }

      if (activeDashboard === 'Financial Summary') {
        const module = financialSummaryPage === 0
          ? await import('./data/financialSummaryDashboard.json')
          : financialSummaryPage === 1
            ? await import('./data/financialSummaryDashboardPage2.json')
            : financialSummaryPage === 2
              ? await import('./data/financialSummaryDashboardPage3.json')
              : await import('./data/financialSummaryDashboardV2');
        const financialSummaryDefaultView = FINANCIAL_SUMMARY_DEFAULT_VIEWS[financialSummaryPage];
        const nextSubheading = getMiniHeaderSubheadingFromPayload(module.default);

        if (!cancelled) {
          if (nextSubheading !== null) {
            const subheadingKey = getMiniHeaderSubheadingKey('Financial Summary', financialSummaryPage);
            setMiniHeaderSubheadings((current) => ({
              ...current,
              [subheadingKey]: normalizeMiniHeaderSubheading(nextSubheading),
            }));
          }

          setExternalDashboardLoad({
            requestId: dashboardLoadRequestId,
            payload: buildFinancialSummaryPayload(module.default, reportingPeriod),
            defaultZoom: financialSummaryDefaultView.zoom,
            defaultViewport: {
              x: financialSummaryDefaultView.x,
              y: financialSummaryDefaultView.y,
            },
          });
        }

        return;
      }

      if (activeDashboard === 'Retail Summary') {
        const module = retailSummaryPage === 0
          ? await import('./data/retailSummaryDashboard.json')
          : retailSummaryPage === 1
            ? await import('./data/retailSummaryDashboardPage2.json')
            : retailSummaryPage === 2
              ? await import('./data/retailSummaryDashboardPage3.json')
              : retailSummaryPage === 3
                ? await import('./data/retailSummaryDashboardPage4.json')
                : retailSummaryPage === 4
                  ? await import('./data/retailSummaryDashboardPage5.json')
                  : retailSummaryPage === 5
                    ? await import('./data/retailSummaryDashboardPage6.json')
                    : await import('./data/retailSummaryDashboardPage7.json');
        const retailSummaryDefaultView = RETAIL_SUMMARY_DEFAULT_VIEWS[retailSummaryPage];
        const nextSubheading = getMiniHeaderSubheadingFromPayload(module.default);

        if (!cancelled) {
          if (nextSubheading !== null) {
            const subheadingKey = getMiniHeaderSubheadingKey('Retail Summary', retailSummaryPage);
            setMiniHeaderSubheadings((current) => ({
              ...current,
              [subheadingKey]: normalizeMiniHeaderSubheading(nextSubheading),
            }));
          }

          setExternalDashboardLoad({
            requestId: dashboardLoadRequestId,
            payload: module.default,
            defaultZoom: retailSummaryDefaultView.zoom,
            defaultViewport: {
              x: retailSummaryDefaultView.x,
              y: retailSummaryDefaultView.y,
            },
          });
        }

        return;
      }

      if (activeDashboard === CUSTOMER_SERVICE_SIDE_QUEST_DASHBOARD) {
        const module = sideQuestPage === 0
          ? await import('./data/sidequestPage1.json')
          : sideQuestPage === 1
            ? await import('./data/sidequestPage2.json')
            : sideQuestPage === 2
              ? await import('./data/sidequestPage3.json')
              : sideQuestPage === 3
                ? await import('./data/sidequestPage4.json')
                : await import('./data/sidequestPage5.json');
        const sideQuestDefaultView = CUSTOMER_SERVICE_SIDE_QUEST_DEFAULT_VIEWS[sideQuestPage];

        if (!cancelled) {
          setExternalDashboardLoad({
            requestId: dashboardLoadRequestId,
            payload: module.default,
            defaultZoom: sideQuestDefaultView.zoom,
            defaultViewport: {
              x: sideQuestDefaultView.x,
              y: sideQuestDefaultView.y,
            },
          });
        }

        return;
      }

      if (!cancelled) {
        setExternalDashboardLoad(null);
      }
    };

    loadDashboardPayload().catch((error) => {
      console.error('Failed to load dashboard payload', error);
    });

    return () => {
      cancelled = true;
    };
  }, [activeDashboard, retailSummaryPage, dashboardLoadRequestId, financialSummaryPage, sideQuestPage, reportingPeriod]);

  const handleDashboardSelect = (dashboardLabel: string) => {
    setActiveDashboard(dashboardLabel);

    if (dashboardLabel === 'Executive Summary') {
      setMiniHeader(EXECUTIVE_SUMMARY_DEFAULT_VIEWS[0].miniHeader);
    }

    if (dashboardLabel === 'Financial Summary') {
      setMiniHeader(FINANCIAL_SUMMARY_DEFAULT_VIEWS[financialSummaryPage].miniHeader);
    }

    if (dashboardLabel === 'Retail Summary') {
      setMiniHeader(RETAIL_SUMMARY_DEFAULT_VIEWS[retailSummaryPage].miniHeader);
    }

    if (dashboardLabel === CUSTOMER_SERVICE_SIDE_QUEST_DASHBOARD) {
      setMiniHeader(CUSTOMER_SERVICE_SIDE_QUEST_DEFAULT_VIEWS[sideQuestPage].miniHeader);
    }

    if (
      dashboardLabel === 'Executive Summary'
      || dashboardLabel === 'Financial Summary'
      || dashboardLabel === 'Retail Summary'
      || dashboardLabel === CUSTOMER_SERVICE_SIDE_QUEST_DASHBOARD
    ) {
      setDashboardLoadRequestId((current) => current + 1);
    }
  };

  const handleFinancialSummaryPageChange = (page: number) => {
    const normalizedPage = page === 3 ? 3 : page === 2 ? 2 : page === 1 ? 1 : 0;

    setMiniHeader(FINANCIAL_SUMMARY_DEFAULT_VIEWS[normalizedPage].miniHeader);
    setFinancialSummaryPage(normalizedPage);
    setActiveDashboard('Financial Summary');
    setDashboardLoadRequestId((current) => current + 1);
  };

  const handleRetailSummaryPageChange = (page: number) => {
    const normalizedPage = page === 6 ? 6 : page === 5 ? 5 : page === 4 ? 4 : page === 3 ? 3 : page === 2 ? 2 : page === 1 ? 1 : 0;

    setMiniHeader(RETAIL_SUMMARY_DEFAULT_VIEWS[normalizedPage].miniHeader);
    setRetailSummaryPage(normalizedPage);
    setActiveDashboard('Retail Summary');
    setDashboardLoadRequestId((current) => current + 1);
  };

  const handleSideQuestPageChange = (page: number) => {
    const normalizedPage = page === 4 ? 4 : page === 3 ? 3 : page === 2 ? 2 : page === 1 ? 1 : 0;

    setMiniHeader(CUSTOMER_SERVICE_SIDE_QUEST_DEFAULT_VIEWS[normalizedPage].miniHeader);
    setSideQuestPage(normalizedPage);
    setActiveDashboard(CUSTOMER_SERVICE_SIDE_QUEST_DASHBOARD);
    setDashboardLoadRequestId((current) => current + 1);
  };

  const activeDashboardPage = activeDashboard === 'Financial Summary'
    ? financialSummaryPage
    : activeDashboard === 'Retail Summary'
      ? retailSummaryPage
      : activeDashboard === CUSTOMER_SERVICE_SIDE_QUEST_DASHBOARD
        ? sideQuestPage
        : 0;
  const miniHeaderSubheadingKey = getMiniHeaderSubheadingKey(activeDashboard, activeDashboardPage);
  const miniHeaderSubheading = miniHeaderSubheadings[miniHeaderSubheadingKey]
    ?? getDefaultMiniHeaderSubheading(activeDashboard, activeDashboardPage);
  const isSideQuestDashboard = activeDashboard === CUSTOMER_SERVICE_SIDE_QUEST_DASHBOARD;

  return (
    <div className="app-root h-screen w-screen bg-[#f7f5f5] overflow-hidden">
      <div className="app-shell h-full flex flex-row items-stretch justify-center gap-0 px-0 py-0">
        {/* Left Sidebar (Toolbar) */}
        <div className="app-sidebar app-sidebar-left h-full flex items-stretch flex-shrink-0">
          <div
            className="h-full overflow-hidden transition-all duration-300"
            style={{ width: toolbarOpen ? 256 : 0 }}
          >
            <div className="h-full w-64">
              <Toolbar
                gridVisible={gridVisible}
                onGridVisibleChange={setGridVisible}
                miniHeader={miniHeader}
                onMiniHeaderChange={setMiniHeader}
                onResetZoom={() => setZoomResetRequestId((current) => current + 1)}
                showMiniHeaderToggle={!isSideQuestDashboard}
                isOpen={true}
              />
            </div>
          </div>
          <div className="relative w-0 h-full">
            <button
              onClick={() => setToolbarOpen(!toolbarOpen)}
              className="absolute top-1/2 -translate-y-1/2 left-0 z-50 bg-white border border-gray-200 rounded-r-md w-5 h-10 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
              title={toolbarOpen ? 'Collapse components panel' : 'Expand components panel'}
            >
              {toolbarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>

        {/* Center Canvas with fixed aspect ratio */}
        <div
          className={`print-canvas-shell flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${
            isSideQuestDashboard ? 'items-stretch justify-stretch' : 'items-center justify-center'
          }`}
        >
          <div
            className={`print-canvas-target relative bg-white border border-gray-300 overflow-hidden flex flex-col ${
              !isSideQuestDashboard && miniHeader ? 'mini-header-mode' : ''
            } ${isSideQuestDashboard ? 'side-quest-canvas' : ''}`}
            data-capture-target="letter-canvas"
            style={
              isSideQuestDashboard
                ? { width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none' }
                : {
                    aspectRatio: '11 / 8.5',
                    width: 'min(100vw, calc(100vh * 11 / 8.5))',
                    height: 'min(100vh, calc(100vw * 8.5 / 11))',
                    maxWidth: '1447px',
                    maxHeight: 'calc(100vw * 8.5 / 11)',
                  }
            }
          >
            <div className="h-full flex flex-col overflow-hidden">
              {isSideQuestDashboard ? (
                <SideQuestHeader
                  appTitle={appTitle}
                  onTitleChange={setAppTitle}
                  filterVariant={
                    sideQuestPage === 1
                      ? 'orders'
                      : sideQuestPage === 2
                        ? 'tickets'
                        : sideQuestPage === 3
                          ? 'customers'
                          : sideQuestPage === 4
                            ? 'agents'
                            : 'contact'
                  }
                />
              ) : (
              <header className={miniHeader ? 'absolute top-7 left-7 z-20 w-[200px] max-w-[calc(100%-3.5rem)] bg-transparent text-dark flex flex-col items-start justify-start pointer-events-auto' : 'bg-black text-light px-6 py-3 shadow-lg relative min-h-[90px] flex flex-col items-center justify-start'}>
                {miniHeader ? (
                  <>
                    <div className="w-full flex justify-start px-0">
                      <input
                        value={appTitle}
                        onChange={(e) => setAppTitle(e.target.value)}
                        className="w-full bg-transparent border-0 p-0 m-0 text-l leading-none font-bold font-header text-black text-left focus:outline-none"
                      />
                    </div>
                    <div className="-mt-2 w-full">
                      <input
                        value={miniHeaderSubheading}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setMiniHeaderSubheadings((current) => ({
                            ...current,
                            [miniHeaderSubheadingKey]: nextValue,
                          }));
                        }}
                        className="w-full bg-transparent border-0 p-0 m-0 text-[10px] leading-tight font-medium font-body text-black text-left focus:outline-none"
                      />
                      <div className="text-left text-[10px] leading-tight font-medium font-body text-black whitespace-nowrap">
                        {formatWeekEndingSaturdaySummary(reportingPeriod)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Use bundled asset URL to avoid cross-site cache collisions on Pages. */}
                    <div className="absolute left-6 top-2.5 z-10 translate-y-2" style={{ width: 130, height: 42, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={projectLogo}
                        alt="Logo"
                        className="object-contain"
                        style={{ width: '100%', height: '100%', maxWidth: 130, maxHeight: 42, minWidth: 40, minHeight: 40, background: 'none', border: 'none' }}
                        onError={e => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><rect width=\'100%\' height=\'100%\' fill=\'%23eee\'/><text x=\'50%\' y=\'50%\' font-size=\'18\' text-anchor=\'middle\' fill=\'%23606060\' dy=\'.3em\'>Logo</text></svg>'; }}
                      />
                    </div>

                    <div className="w-full flex justify-center px-6 translate-y-2">
                      <input
                        value={appTitle}
                        onChange={(e) => setAppTitle(e.target.value)}
                        className="w-full max-w-xl bg-transparent border-0 p-0 m-0 text-2xl leading-tight font-bold font-header text-light text-center focus:outline-none"
                      />
                    </div>

                    <div className="relative z-10 mt-1.5 w-full max-w-[460px]">
                      <ReportingPeriodFilter value={reportingPeriod} onChange={setReportingPeriod} />
                    </div>
                  </>
                )}
              </header>
              )}

              <main className="flex-1 overflow-hidden">
                <WireframeCanvas
                  gridVisible={gridVisible}
                  appTitle={appTitle}
                  matrixScrollable={isSideQuestDashboard}
                  zoomResetRequestId={zoomResetRequestId}
                  externalDashboardLoad={externalDashboardLoad}
                  onHeaderChange={({ title }) => {
                    setAppTitle(title || DEFAULT_APP_TITLE);
                  }}
                />
              </main>

              {!isSideQuestDashboard && (
              <>
                <div className="print-watermark pointer-events-none absolute bottom-0 left-1.5 z-10">
                  <img
                    src={`${import.meta.env.BASE_URL}logo.svg`}
                    alt=""
                    aria-hidden="true"
                    className="h-24 w-48 object-contain"
                    style={{ opacity: 0.1 }}
                  />
                </div>
                <div className="print-watermark pointer-events-none absolute bottom-5 right-5 z-10">
                  <img
                    src={`${import.meta.env.BASE_URL}reapr.svg`}
                    alt=""
                    aria-hidden="true"
                    className="h-24 w-24 object-contain"
                    style={{ opacity: 0.1 }}
                  />
                </div>
              </>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar (DashboardMenu) */}
        <div className="app-sidebar app-sidebar-right h-full flex items-stretch flex-shrink-0">
          <div className="relative w-0 h-full">
            <button
              onClick={() => setDashboardMenuOpen(!dashboardMenuOpen)}
              className="absolute top-1/2 -translate-y-1/2 right-0 z-50 bg-white border border-gray-200 rounded-l-md w-5 h-10 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
              title={dashboardMenuOpen ? 'Collapse dashboards panel' : 'Expand dashboards panel'}
            >
              {dashboardMenuOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
          <div
            className="h-full overflow-hidden transition-all duration-300"
            style={{ width: dashboardMenuOpen ? 256 : 0 }}
          >
            <div className="h-full w-64">
              <DashboardMenu
                isOpen={true}
                side="right"
                activeDashboard={activeDashboard}
                onDashboardSelect={handleDashboardSelect}
                financialSummaryPage={financialSummaryPage}
                onFinancialSummaryPageChange={handleFinancialSummaryPageChange}
                retailSummaryPage={retailSummaryPage}
                onRetailSummaryPageChange={handleRetailSummaryPageChange}
                sideQuestPage={sideQuestPage}
                onSideQuestPageChange={handleSideQuestPageChange}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
