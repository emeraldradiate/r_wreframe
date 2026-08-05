import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'src', 'data');

const files = [
  'retailSummaryDashboardPage3.json',
];

const WEEKLY_INDICES = [0, 1, 2, 3, 4, 5];
const PERIOD_INDICES = [0, 6, 7, 8, 9, 10, 11, 12, 13];
const YOY_INDICES = [0, 14, 15, 16, 17, 18, 19];

const SPLITS = [
  {
    suffix: '',
    titleSuffix: ' — Weekly',
    indices: WEEKLY_INDICES,
    layout: { x: -60, width: 720 },
  },
  {
    suffix: 'b',
    titleSuffix: ' — MTD / CM%',
    indices: PERIOD_INDICES,
    layout: { x: 680, width: 1120 },
  },
  {
    suffix: 'c',
    titleSuffix: ' — YoY',
    indices: YOY_INDICES,
    layout: { x: 1820, width: 820 },
  },
];

function sliceByIndices(values, indices) {
  return indices.map((index) => values[index]);
}

function sliceGroupedColumns(groups, keepIndices) {
  const keep = new Set(keepIndices);
  const result = [];
  let flat = 0;

  for (const group of groups) {
    const span = group.subLabels?.length || 1;

    if (span === 1) {
      if (keep.has(flat)) {
        result.push({ ...group });
      }
      flat += 1;
      continue;
    }

    const keptSubLabels = group.subLabels.filter((_, subIndex) => keep.has(flat + subIndex));
    if (keptSubLabels.length === span) {
      result.push({ ...group });
    } else if (keptSubLabels.length > 0) {
      result.push({ label: group.label, subLabels: keptSubLabels });
    }
    flat += span;
  }

  return result;
}

function cloneNodeShell(node) {
  return {
    type: node.type,
    resizing: node.resizing,
    draggable: node.draggable,
    selectable: node.selectable,
    selected: node.selected,
    dragging: node.dragging,
  };
}

function buildSplitNode(sourceNode, split, baseId) {
  const { data, style, position, positionAbsolute, height, width } = sourceNode;
  const matrixData = data.matrixData.map((row) => split.indices.map((index) => row[index]));
  const columnLabels = sliceByIndices(data.columnLabels, split.indices);
  const matrixGroupedColumns = sliceGroupedColumns(data.matrixGroupedColumns, split.indices);
  const matrixSubRows = data.matrixSubRows ? JSON.parse(JSON.stringify(data.matrixSubRows)) : undefined;

  return {
    ...cloneNodeShell(sourceNode),
    id: `${baseId}${split.suffix}`,
    position: { x: split.layout.x, y: position.y },
    data: {
      label: `${data.label}${split.titleSuffix}`,
      componentType: 'matrix',
      matrixRegularFirstColumn: data.matrixRegularFirstColumn,
      matrixFirstColumnWidth: data.matrixFirstColumnWidth,
      matrixLeftAlignedColumns: [0],
      matrixWideColumns: true,
      matrixGroupedColumns,
      columnLabels,
      matrixData,
      ...(matrixSubRows ? { matrixSubRows } : {}),
    },
    style: {
      ...style,
      width: split.layout.width,
      height: style.height,
    },
    width: split.layout.width,
    height: height ?? style.height,
    positionAbsolute: {
      x: split.layout.x,
      y: positionAbsolute?.y ?? position.y,
    },
  };
}

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const dashboard = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const sourceIndex = dashboard.nodes.findIndex(
    (node) =>
      node.type === 'powerbi'
      && node.data?.componentType === 'matrix'
      && /shipped/i.test(node.data.label || '')
      && node.position?.y === -40,
  );

  if (sourceIndex === -1) {
    console.warn(`No top shipped matrix found in ${file}`);
    continue;
  }

  const sourceNode = dashboard.nodes[sourceIndex];
  const baseId = sourceNode.id;
  const splitNodes = SPLITS.map((split) => buildSplitNode(sourceNode, split, baseId));

  dashboard.nodes.splice(sourceIndex, 1, ...splitNodes);
  fs.writeFileSync(filePath, `${JSON.stringify(dashboard, null, 2)}\n`);
  console.log(`Split ${file} matrix ${baseId} into ${splitNodes.map((node) => node.id).join(', ')}`);
}
