import { useState } from 'react';
import WireframeCanvas from './components/WireframeCanvas';
import Toolbar from './components/Toolbar';
import DashboardMenu from './components/DashboardMenu';
import ReportingPeriodFilter, { getDefaultReportingPeriod, ReportingPeriodValue } from './components/ReportingPeriodFilter';
import executiveSummaryDashboard from './data/executiveSummaryDashboard.json';
import executiveSummaryDashboardPage2 from './data/executiveSummaryDashboardPage2.json';
import financialSummaryDashboard from './data/financialSummaryDashboard.json';
import './App.css';

const DEFAULT_APP_TITLE = 'Executive Summary';
const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

function App() {
  const [gridVisible, setGridVisible] = useState(true);
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE);
  const [reportingPeriod, setReportingPeriod] = useState<ReportingPeriodValue>(() => getDefaultReportingPeriod());
  const [activeDashboard, setActiveDashboard] = useState('Executive Summary');
  const [executiveSummaryPage, setExecutiveSummaryPage] = useState<0 | 1>(0);
  const [dashboardLoadRequestId, setDashboardLoadRequestId] = useState(0);

  const executiveSummaryDashboards = [
    executiveSummaryDashboard,
    executiveSummaryDashboardPage2,
  ] as const;

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
              <header className="bg-black text-light px-6 py-4 shadow-lg relative min-h-[92px] md:min-h-[96px] flex items-start">
                {/* Use a base-aware logo path so GitHub Pages resolves project assets correctly. */}
                <div className="relative z-10 flex-shrink-0 mr-4 mt-1" style={{ width: 150, height: 50, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={logoSrc}
                    alt="Logo"
                    className="object-contain"
                    style={{ width: '100%', height: '100%', maxWidth: 150, maxHeight: 50, minWidth: 40, minHeight: 40, background: 'none', border: 'none' }}
                    onError={e => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><rect width=\'100%\' height=\'100%\' fill=\'%23eee\'/><text x=\'50%\' y=\'50%\' font-size=\'18\' text-anchor=\'middle\' fill=\'%23606060\' dy=\'.3em\'>Logo</text></svg>'; }}
                  />
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-6 md:top-7 flex justify-center px-6">
                  <input
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    className="pointer-events-auto w-full max-w-xl bg-transparent border-0 p-0 m-0 text-2xl font-bold font-header text-light text-center focus:outline-none"
                  />
                </div>

                <div className="relative z-10 w-full mt-2 md:mt-0 md:w-[300px] md:absolute md:right-6 md:top-2">
                  <ReportingPeriodFilter value={reportingPeriod} onChange={setReportingPeriod} />
                </div>
              </header>

              <main className="flex-1 overflow-hidden">
                <WireframeCanvas
                  gridVisible={gridVisible}
                  appTitle={appTitle}
                  externalDashboardLoad={
                    activeDashboard === 'Executive Summary'
                      ? {
                          requestId: dashboardLoadRequestId,
                          payload: executiveSummaryDashboards[executiveSummaryPage],
                        }
                      : activeDashboard === 'Financial Summary'
                      ? {
                          requestId: dashboardLoadRequestId,
                          payload: financialSummaryDashboard,
                        }
                      : null
                  }
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
          src={logoSrc}
          alt=""
          aria-hidden="true"
          className="h-48 w-48 object-contain"
        />
      </div>
    </div>
  );
}

export default App;
