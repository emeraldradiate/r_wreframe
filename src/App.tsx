import { useMemo, useState } from 'react';
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
      <div className="h-full flex items-stretch justify-center gap-4 px-4 py-4">
        <Toolbar
          gridVisible={gridVisible}
          onGridVisibleChange={setGridVisible}
          isOpen={true}
        />

        <div className="flex-1 h-full min-w-0 flex items-center justify-center overflow-hidden">
          <div
            className="w-full max-w-[980px] h-full max-h-[calc(100vh-2rem)] bg-white shadow-2xl border border-gray-300 overflow-hidden"
            style={{ aspectRatio: '8.5 / 11' }}
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
            </div>
          </div>
        </div>

        <DashboardMenu
          isOpen={true}
          side="right"
          activeDashboard={activeDashboard}
          onDashboardSelect={handleDashboardSelect}
          executiveSummaryPage={executiveSummaryPage}
          onExecutiveSummaryPageChange={handleExecutiveSummaryPageChange}
        />
      </div>

      <div className="pointer-events-none fixed right-4 z-[70] opacity-25" style={{ bottom: '-2.5rem', position: 'fixed' }}>
        <img
          src={projectLogo}
          alt=""
          aria-hidden="true"
          className="h-48 w-48 object-contain"
        />
      </div>
    </div>
  );
}

export default App;
