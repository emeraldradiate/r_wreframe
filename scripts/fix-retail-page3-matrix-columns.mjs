import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'src', 'data', 'retailSummaryDashboardPage3.json');
const dashboard = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function stripGroupColumn(node) {
  node.data.matrixRegularFirstColumn = true;
  delete node.data.matrixLeftAlignedColumns;
  delete node.data.matrixFirstColumnWidth;

  if (node.data.columnLabels?.[0] === 'Group' || node.data.columnLabels?.[0] === '') {
    node.data.columnLabels = node.data.columnLabels.slice(1);
  }

  if (node.data.matrixGroupedColumns?.[0]?.label === 'Group') {
    node.data.matrixGroupedColumns = node.data.matrixGroupedColumns.slice(1);
  }

  node.data.matrixData = node.data.matrixData.map((row) => row.slice(1));

  if (node.data.matrixSubRowData) {
    node.data.matrixSubRowData = node.data.matrixSubRowData.map((rowGroups) =>
      rowGroups.map((subRows) => subRows.map((subRow) => subRow.slice(1))),
    );
  }
}

function useBlankGroupHeader(node) {
  if (node.data.matrixGroupedColumns?.[0]) {
    node.data.matrixGroupedColumns[0].label = '';
  }
  if (node.data.columnLabels?.length) {
    node.data.columnLabels[0] = '';
  }
}

const weekly = dashboard.nodes.find((node) => node.id === '1');
const period = dashboard.nodes.find((node) => node.id === '1b');
const yoy = dashboard.nodes.find((node) => node.id === '1c');

if (!weekly || !period || !yoy) {
  throw new Error('Expected split matrices 1, 1b, and 1c on page 3');
}

useBlankGroupHeader(weekly);
stripGroupColumn(period);
stripGroupColumn(yoy);

fs.writeFileSync(filePath, `${JSON.stringify(dashboard, null, 2)}\n`);
console.log('Updated page 3 split matrices to match financial continuation layout');
