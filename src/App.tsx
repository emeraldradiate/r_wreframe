import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WireframeCanvas from './components/WireframeCanvas';
import Toolbar from './components/Toolbar';
import DashboardMenu from './components/DashboardMenu';
import ReportingPeriodFilter, { getDefaultReportingPeriod, ReportingPeriodValue } from './components/ReportingPeriodFilter';
import executiveSummaryDashboard from './data/executiveSummaryDashboard.json';
import executiveSummaryDashboardPage2 from './data/executiveSummaryDashboardPage2.json';
import financialSummaryDashboard from './data/financialSummaryDashboard.json';
import projectLogo from './assets/project-logo.png';
import './App.css';

const DEFAULT_APP_TITLE = 'Executive Summary';

function App() {
  const [gridVisible, setGridVisible] = useState(true);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(true);
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE);
  const [reportingPeriod, setReportingPeriod] = useState<ReportingPeriodValue>(() => getDefaultReportingPeriod());
  const [activeDashboard, setActiveDashboard] = useState('Executive Summary');
  const [executiveSummaryPage, setExecutiveSummaryPage] = useState<0 | 1>(0);
  const [dashboardLoadRequestId, setDashboardLoadRequestId] = useState(0);

  const externalDashboardLoad = useMemo(() => {
    if (activeDashboard === 'Executive Summary') {
      return {
        requestId: dashboardLoadRequestId,
        payload: executiveSummaryPage === 0 ? executiveSummaryDashboard : executiveSummaryDashboardPage2,
      };
    }

    if (activeDashboard === 'Financial Summary') {
      return {
        requestId: dashboardLoadRequestId,
        payload: financialSummaryDashboard,
      };
    }

    return null;
  }, [activeDashboard, dashboardLoadRequestId, executiveSummaryPage]);

  const handleDashboardSelect = (dashboardLabel: string) => {
    setActiveDashboard(dashboardLabel);

    if (dashboardLabel === 'Executive Summary' || dashboardLabel === 'Financial Summary') {
      setDashboardLoadRequestId((current) => current + 1);
    }
  };

  const handleExecutiveSummaryPageChange = (page: number) => {
    const normalizedPage = page === 1 ? 1 : 0;

    setExecutiveSummaryPage(normalizedPage);
    setActiveDashboard('Executive Summary');
    setDashboardLoadRequestId((current) => current + 1);
  };

  return (
    <div className="h-screen w-screen bg-[#f3f4f6] overflow-hidden">
      <div className="h-full flex flex-row items-stretch justify-center gap-0 px-0 py-0">
        {/* Left Sidebar (Toolbar) */}
        <div className="h-full flex items-stretch flex-shrink-0">
          <div
            className="h-full overflow-hidden transition-all duration-300"
            style={{ width: toolbarOpen ? 256 : 0 }}
          >
            <div className="h-full w-64">
              <Toolbar
                gridVisible={gridVisible}
                onGridVisibleChange={setGridVisible}
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
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 min-h-0 overflow-hidden">
          <div
            className="relative bg-white border border-gray-300 overflow-hidden flex flex-col"
            data-capture-target="letter-canvas"
            style={{ aspectRatio: '11 / 8.5', width: 'min(100vw, calc(100vh * 11 / 8.5))', height: 'min(100vh, calc(100vw * 8.5 / 11))', maxWidth: '1447px', maxHeight: 'calc(100vw * 8.5 / 11)' }}
          >
            <div className="h-full flex flex-col overflow-hidden">
              <header className="bg-black text-light px-6 py-3 shadow-lg relative min-h-[90px] flex flex-col items-center justify-start">
                {/* Use bundled asset URL to avoid cross-site cache collisions on Pages. */}
                <div className="absolute left-6 top-2.5 z-10" style={{ width: 130, height: 42, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={projectLogo}
                    alt="Logo"
                    className="object-contain"
                    style={{ width: '100%', height: '100%', maxWidth: 130, maxHeight: 42, minWidth: 40, minHeight: 40, background: 'none', border: 'none' }}
                    onError={e => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><rect width=\'100%\' height=\'100%\' fill=\'%23eee\'/><text x=\'50%\' y=\'50%\' font-size=\'18\' text-anchor=\'middle\' fill=\'%23606060\' dy=\'.3em\'>Logo</text></svg>'; }}
                  />
                </div>

                <div className="w-full flex justify-center px-6">
                  <input
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    className="w-full max-w-xl bg-transparent border-0 p-0 m-0 text-2xl leading-tight font-bold font-header text-light text-center focus:outline-none"
                  />
                </div>

                <div className="relative z-10 mt-1.5 w-full max-w-[460px]">
                  <ReportingPeriodFilter value={reportingPeriod} onChange={setReportingPeriod} />
                </div>
              </header>

              <main className="flex-1 overflow-hidden">
                <WireframeCanvas
                  gridVisible={gridVisible}
                  appTitle={appTitle}
                  externalDashboardLoad={externalDashboardLoad}
                  onHeaderChange={({ title }) => {
                    setAppTitle(title || DEFAULT_APP_TITLE);
                  }}
                />
              </main>

              <div className="pointer-events-none absolute bottom-3 right-3 z-20 opacity-50">
                <img
                  src={projectLogo}
                  alt=""
                  aria-hidden="true"
                  className="h-36 w-36 object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (DashboardMenu) */}
        <div className="h-full flex items-stretch flex-shrink-0">
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
                executiveSummaryPage={executiveSummaryPage}
                onExecutiveSummaryPageChange={handleExecutiveSummaryPageChange}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
