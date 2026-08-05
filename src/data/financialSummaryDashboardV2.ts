import financialSummaryDashboard from './financialSummaryDashboard.json';
import { CHART_COLOR_PALETTE } from '../components/nodes/nodeUtils';

type MatrixSubRow = {
  label: string;
  share: number;
};

type DashboardNode = {
  id: string;
  position: { x: number; y: number };
  positionAbsolute: { x: number; y: number };
  style: { width: number; height: number };
  width: number;
  height: number;
  data: {
    label: string;
    componentType: string;
    matrixData?: string[][];
    matrixSubRows?: MatrixSubRow[][];
    matrixSubRowColors?: string[];
    seriesLabels?: string[];
    seriesColors?: string[];
    seriesData?: number[][];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type Dashboard = {
  nodes: DashboardNode[];
  miniHeaderSubheading?: string;
  [key: string]: unknown;
};

const SPLIT_MATRIX_HEIGHT = 180;
const INTERNATIONAL_Y = 1000;
const STANDARD_THREE_SERIES_COLORS = CHART_COLOR_PALETTE.slice(0, 3);

const splitRetailIntoRetailAndInternational = (
  source: DashboardNode,
  internationalId: string,
  options?: { retailLabel?: string; internationalLabel?: string; renameFirstColumn?: boolean },
) => {
  if (
    !source.data.matrixData?.[0]
    || !source.data.matrixData[1]
    || !source.data.matrixSubRows?.[0]
    || !source.data.matrixSubRows[1]
  ) {
    return null;
  }

  const internationalMatrix = JSON.parse(JSON.stringify(source)) as DashboardNode;
  const retailRow = [...source.data.matrixData[0]];
  const internationalRow = [...source.data.matrixData[1]];
  const retailSubRows = source.data.matrixSubRows[0];
  const internationalSubRows = source.data.matrixSubRows[1];

  if (options?.renameFirstColumn) {
    retailRow[0] = 'Retail';
    internationalRow[0] = 'International';
  }

  source.data.label = options?.retailLabel ?? source.data.label;
  source.data.matrixData = [retailRow];
  source.data.matrixSubRows = [retailSubRows];
  source.style.height = SPLIT_MATRIX_HEIGHT;
  source.height = SPLIT_MATRIX_HEIGHT;

  internationalMatrix.id = internationalId;
  internationalMatrix.position.y = INTERNATIONAL_Y;
  internationalMatrix.positionAbsolute.y = INTERNATIONAL_Y;
  internationalMatrix.data.label = options?.internationalLabel ?? source.data.label;
  internationalMatrix.data.matrixData = [internationalRow];
  internationalMatrix.data.matrixSubRows = [internationalSubRows];
  internationalMatrix.style.height = SPLIT_MATRIX_HEIGHT;
  internationalMatrix.height = SPLIT_MATRIX_HEIGHT;

  return internationalMatrix;
};

const dashboard = JSON.parse(JSON.stringify(financialSummaryDashboard)) as Dashboard;
const enterpriseMatrix = dashboard.nodes.find((node) => node.id === '1');
const retailWeeklyMatrix = dashboard.nodes.find((node) => node.id === '3');
const retailMtdMatrix = dashboard.nodes.find((node) => node.id === '8');
const retailYtdMatrix = dashboard.nodes.find((node) => node.id === '15');
const enterpriseStackedArea = dashboard.nodes.find((node) => node.id === '16');

const enterpriseChannelSubRows: MatrixSubRow[] = [
  { label: 'DTC', share: 0.39 },
  { label: 'Retail', share: 0.42 },
  { label: 'International', share: 0.19 },
];

[enterpriseMatrix, dashboard.nodes.find((node) => node.id === '7'), dashboard.nodes.find((node) => node.id === '13')]
  .forEach((node) => {
    if (!node?.data.matrixSubRows?.[0]) {
      return;
    }

    node.data.matrixSubRows[0] = enterpriseChannelSubRows.map((row) => ({ ...row }));
    if (node.id === '1') {
      node.data.matrixSubRowColors = [...STANDARD_THREE_SERIES_COLORS];
    }
  });

if (
  enterpriseStackedArea?.data.seriesLabels
  && enterpriseStackedArea.data.seriesColors
  && enterpriseStackedArea.data.seriesData?.[1]
) {
  const combinedRetailSeries = enterpriseStackedArea.data.seriesData[1];
  const retailSeries = combinedRetailSeries.map((value) => Math.round(value * 0.69));
  const internationalSeries = combinedRetailSeries.map((value, index) => value - retailSeries[index]);

  enterpriseStackedArea.data.seriesLabels = ['DTC', 'Retail', 'International'];
  enterpriseStackedArea.data.seriesColors = [...STANDARD_THREE_SERIES_COLORS];
  enterpriseStackedArea.data.stackedBudgetLineColor = '#000000';
  enterpriseStackedArea.data.stackedPyLineColor = '#000000';
  enterpriseStackedArea.data.seriesData = [
    enterpriseStackedArea.data.seriesData[0],
    retailSeries,
    internationalSeries,
  ];
}

if (retailWeeklyMatrix) {
  const internationalWeekly = splitRetailIntoRetailAndInternational(retailWeeklyMatrix, '17', {
    retailLabel: 'Retail Bookings',
    internationalLabel: 'International Bookings',
    renameFirstColumn: true,
  });
  if (internationalWeekly) {
    dashboard.nodes.push(internationalWeekly);
  }
}

if (retailMtdMatrix) {
  const internationalMtd = splitRetailIntoRetailAndInternational(retailMtdMatrix, '18', {
    retailLabel: '',
    internationalLabel: '',
  });
  if (internationalMtd) {
    dashboard.nodes.push(internationalMtd);
  }
}

if (retailYtdMatrix) {
  const internationalYtd = splitRetailIntoRetailAndInternational(retailYtdMatrix, '19', {
    retailLabel: '',
    internationalLabel: '',
  });
  if (internationalYtd) {
    dashboard.nodes.push(internationalYtd);
  }
}

dashboard.nodes.forEach((node) => {
  if (node.data.componentType !== 'matrix') {
    return;
  }

  if (['1', '7', '13'].includes(node.id)) {
    node.style.height += 20;
    node.height += 20;
  } else {
    node.position.y += 20;
    node.positionAbsolute.y += 20;
  }

  if (['3', '8', '15', '17', '18', '19'].includes(node.id)) {
    node.style.height += 40;
    node.height += 40;
  }

  if (['17', '18', '19'].includes(node.id)) {
    node.position.y += 40;
    node.positionAbsolute.y += 40;
    node.style.height += 20;
    node.height += 20;
  }

  if (node.id !== '1') {
    node.data.matrixShowColorBlocks = false;
    node.data.matrixSubRowColorBlocks = false;
  }
});

dashboard.miniHeaderSubheading = 'Pg. 2 Bookings v2';

export default dashboard;
