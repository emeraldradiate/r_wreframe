import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'src', 'data');

const WEEKLY_COL_COUNT = 6;
const PERIOD_COL_COUNT = 9;
const YOY_COL_COUNT = 7;
const ORIGINAL_WIDTH = 1560;
const ORIGINAL_HEIGHT = 700;
const ORIGINAL_X = -60;
const ORIGINAL_Y = -40;

const PAGE3_WIDTHS = [440, 640, 480];

function findNode(nodes, id) {
  return nodes.find((node) => node.id === id);
}

function mergeRows(weeklyRow, periodRow, yoyRow) {
  return [
    weeklyRow[0],
    ...weeklyRow.slice(1, WEEKLY_COL_COUNT),
    ...periodRow.slice(1, PERIOD_COL_COUNT),
    ...yoyRow.slice(1, YOY_COL_COUNT),
  ];
}

function mergeGroupedColumns(weeklyGroups, periodGroups, yoyGroups) {
  return [
    ...weeklyGroups,
    ...periodGroups.slice(1),
    ...yoyGroups.slice(1),
  ];
}

function mergeColumnLabels(weeklyLabels, periodLabels, yoyLabels) {
  return [
    weeklyLabels[0],
    ...weeklyLabels.slice(1, WEEKLY_COL_COUNT),
    ...periodLabels.slice(1, PERIOD_COL_COUNT),
    ...yoyLabels.slice(1, YOY_COL_COUNT),
  ];
}

function restoreOriginalLabel(label) {
  return label
    .replace(/ — Weekly$/, '')
    .replace(/ — MTD \/ CM%$/, '')
    .replace(/ — YoY$/, '');
}

function mergeSplitMatrices(dashboard, baseId) {
  const weekly = findNode(dashboard.nodes, baseId);
  const period = findNode(dashboard.nodes, `${baseId}b`);
  const yoy = findNode(dashboard.nodes, `${baseId}c`);

  if (!weekly || !period || !yoy) {
    throw new Error(`Missing split matrices for base id ${baseId}`);
  }

  const mergedNode = {
    id: baseId,
    type: weekly.type,
    position: { x: ORIGINAL_X, y: ORIGINAL_Y },
    data: {
      label: restoreOriginalLabel(weekly.data.label),
      componentType: 'matrix',
      matrixRegularFirstColumn: weekly.data.matrixRegularFirstColumn,
      matrixFirstColumnWidth: weekly.data.matrixFirstColumnWidth,
      matrixLeftAlignedColumns: weekly.data.matrixLeftAlignedColumns,
      matrixGroupedColumns: mergeGroupedColumns(
        weekly.data.matrixGroupedColumns,
        period.data.matrixGroupedColumns,
        yoy.data.matrixGroupedColumns,
      ),
      columnLabels: mergeColumnLabels(
        weekly.data.columnLabels,
        period.data.columnLabels,
        yoy.data.columnLabels,
      ),
      matrixData: weekly.data.matrixData.map((row, rowIndex) =>
        mergeRows(row, period.data.matrixData[rowIndex], yoy.data.matrixData[rowIndex]),
      ),
      ...(weekly.data.matrixSubRows ? { matrixSubRows: weekly.data.matrixSubRows } : {}),
    },
    style: {
      ...weekly.style,
      width: ORIGINAL_WIDTH,
      height: ORIGINAL_HEIGHT,
    },
    resizing: weekly.resizing,
    draggable: weekly.draggable,
    selectable: weekly.selectable,
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    positionAbsolute: { x: ORIGINAL_X, y: ORIGINAL_Y },
    selected: weekly.selected,
    dragging: weekly.dragging,
  };

  const firstIndex = dashboard.nodes.findIndex((node) => node.id === baseId);
  dashboard.nodes = dashboard.nodes.filter((node) => ![`${baseId}b`, `${baseId}c`].includes(node.id));
  dashboard.nodes[firstIndex] = mergedNode;
  return dashboard;
}

function updatePage3Layout(dashboard) {
  const weekly = findNode(dashboard.nodes, '1');
  const period = findNode(dashboard.nodes, '1b');
  const yoy = findNode(dashboard.nodes, '1c');

  if (!weekly || !period || !yoy) {
    throw new Error('Page 3 split matrices not found');
  }

  weekly.data.label = 'Enterprise Shipped Sales by Partner';
  period.data.label = '';
  yoy.data.label = '';

  const layouts = [
    { node: weekly, width: PAGE3_WIDTHS[0], x: ORIGINAL_X },
    { node: period, width: PAGE3_WIDTHS[1], x: ORIGINAL_X + PAGE3_WIDTHS[0] },
    { node: yoy, width: PAGE3_WIDTHS[2], x: ORIGINAL_X + PAGE3_WIDTHS[0] + PAGE3_WIDTHS[1] },
  ];

  for (const { node, width, x } of layouts) {
    node.position = { x, y: ORIGINAL_Y };
    node.positionAbsolute = { x, y: ORIGINAL_Y };
    node.width = width;
    node.height = ORIGINAL_HEIGHT;
    node.style = { ...node.style, width, height: ORIGINAL_HEIGHT };
  }
}

const restorePages = [
  { file: 'retailSummaryDashboardPage4.json', baseId: '2' },
  { file: 'retailSummaryDashboardPage7.json', baseId: '1' },
];

for (const { file, baseId } of restorePages) {
  const filePath = path.join(dataDir, file);
  const dashboard = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  mergeSplitMatrices(dashboard, baseId);
  fs.writeFileSync(filePath, `${JSON.stringify(dashboard, null, 2)}\n`);
  console.log(`Restored ${file} matrix ${baseId}`);
}

const page3Path = path.join(dataDir, 'retailSummaryDashboardPage3.json');
const page3 = JSON.parse(fs.readFileSync(page3Path, 'utf8'));
updatePage3Layout(page3);
fs.writeFileSync(page3Path, `${JSON.stringify(page3, null, 2)}\n`);
console.log('Updated page 3 split layout and labels');
