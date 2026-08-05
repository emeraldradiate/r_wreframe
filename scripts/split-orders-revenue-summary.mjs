import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'src', 'data', 'retailSummaryDashboard.json');
const dashboard = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const WR = 0.578;
const DR = 0.41;

const parseNum = (value) => {
  if (typeof value !== 'string') return value;
  if (value.startsWith('+$') || value.startsWith('-$')) {
    return Number(value.replace(/[$,+]/g, '')) * (value.startsWith('-') ? -1 : 1);
  }
  if (value.endsWith('%')) {
    return Number(value.replace(/[+%]/g, ''));
  }
  return Number(value.replace(/[$,]/g, ''));
};

const fmtCurrency = (n) => {
  const sign = n < 0 ? '-$' : '$';
  return `${sign}${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
};

const fmtAov = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const fmtPct = (n) => `${n.toFixed(1)}%`;
const fmtYoYPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const totalOrders = ['3,542', '3,322', '2,453', '2,752', '2,805', '17,121', '64,130', '+7,180', '+63.5%', '+24,608', '+62.9%'];
const totalRevenue = ['$1,615,844', '$1,515,677', '$1,118,793', '$1,255,540', '$1,279,829', '$6,617,528', '$28,564,583', '+$2,981,523', '+82.1%', '+$12,899,185', '+82.4%'];
const totalFreebies = ['$8,545', '$7,638', '$6,443', '$6,499', '$7,158', '$46,002', '$202,559', '+$18,100', '+80.0%', '+$30,100', '+80.0%'];
const totalWd = ['$13,500', '$11,760', '$14,460', '$12,800', '$13,830', '$66,200', '$319,421', '-$4,800', '-6.8%', '+$48,000', '+75.2%'];
const warehouseOrders = ['2,180', '2,045', '1,510', '1,694', '1,726', '11,544', '40,059', '+3,248', '+63.5%', '+11,217', '+62.9%'];
const warehouseRevenue = ['$934,190', '$876,279', '$646,823', '$725,883', '$739,925', '$3,825,882', '$16,514,436', '+$1,250,534', '+82.1%', '+$5,406,580', '+82.4%'];
const dropshipOrders = ['1,362', '1,277', '943', '1,058', '1,079', '5,577', '24,071', '+3,819', '+63.5%', '+13,194', '+62.9%'];
const dropshipRevenue = ['$662,057', '$621,016', '$458,401', '$514,431', '$524,382', '$2,711,390', '$11,703,726', '+$1,730,989', '+82.1%', '+$7,492,605', '+82.4%'];

const splitCurrency = (values, ratio) => values.map((value, index) => {
  const amount = parseNum(value);
  if (index >= 7) {
    return fmtCurrency(amount * ratio);
  }
  return fmtCurrency(amount * ratio);
});

const buildAovRow = (orders, revenue) => {
  const weekly = [];
  for (let i = 0; i < 5; i += 1) {
    weekly.push(fmtAov(parseNum(revenue[i]) / parseNum(orders[i])));
  }

  const mtdOrders = parseNum(orders[5]);
  const mtdRevenue = parseNum(revenue[5]);
  const ytdOrders = parseNum(orders[6]);
  const ytdRevenue = parseNum(revenue[6]);
  const mtdAov = mtdRevenue / mtdOrders;
  const ytdAov = ytdRevenue / ytdOrders;

  const pyMtdOrders = mtdOrders - parseNum(orders[7]);
  const pyMtdRevenue = mtdRevenue - parseNum(revenue[7]);
  const pyMtdAov = pyMtdRevenue / pyMtdOrders;
  const mtdAovDelta = mtdAov - pyMtdAov;
  const mtdAovPct = (mtdAovDelta / pyMtdAov) * 100;

  const pyYtdOrders = ytdOrders - parseNum(orders[9]);
  const pyYtdRevenue = ytdRevenue - parseNum(revenue[9]);
  const pyYtdAov = pyYtdRevenue / pyYtdOrders;
  const ytdAovDelta = ytdAov - pyYtdAov;
  const ytdAovPct = (ytdAovDelta / pyYtdAov) * 100;

  return [
    ...weekly,
    fmtAov(mtdAov),
    fmtAov(ytdAov),
    mtdAovDelta >= 0 ? `+$${Math.round(mtdAovDelta)}` : `-$${Math.abs(Math.round(mtdAovDelta))}`,
    fmtYoYPct(mtdAovPct),
    ytdAovDelta >= 0 ? `+$${Math.round(ytdAovDelta)}` : `-$${Math.abs(Math.round(ytdAovDelta))}`,
    fmtYoYPct(ytdAovPct),
  ];
};

const buildPercentRow = (weekly, mtd, ytd, mtdYoY, ytdYoY) => [
  ...weekly.map(fmtPct),
  fmtPct(mtd),
  fmtPct(ytd),
  fmtYoYPct(mtdYoY),
  fmtYoYPct(mtdYoY * 2.4),
  fmtYoYPct(ytdYoY),
  fmtYoYPct(ytdYoY * 2.1),
];

const buildMatrixData = (orders, revenue, freebies, wd, gmConfig, grillsConfig) => [
  ['# Orders', ...orders],
  ['$ Revenue', ...revenue],
  ['AOV', ...buildAovRow(orders, revenue)],
  ['Gross Margin %', ...buildPercentRow(...gmConfig)],
  ['Grills %', ...buildPercentRow(...grillsConfig)],
  ['$ Free Product', ...freebies],
  ['W+D $', ...wd],
];

const matrixConfigs = [
  {
    id: '7',
    label: 'Total Orders & Revenue Summary',
    x: -120,
    matrixData: buildMatrixData(
      totalOrders,
      totalRevenue,
      totalFreebies,
      totalWd,
      [[48.2, 48.0, 48.3, 48.1, 48.2], 48.1, 48.3, 1.2, 0.8],
      [[83.6, 83.4, 83.8, 83.5, 83.6], 83.6, 83.6, 1.2, 0.9],
    ),
  },
  {
    id: '13',
    label: 'Warehouse Orders & Revenue Summary',
    x: 310,
    matrixData: buildMatrixData(
      warehouseOrders,
      warehouseRevenue,
      splitCurrency(totalFreebies, WR),
      splitCurrency(totalWd, WR),
      [[47.6, 47.4, 47.7, 47.5, 47.6], 47.5, 47.7, 1.0, 0.7],
      [[85.4, 85.2, 85.6, 85.3, 85.4], 85.4, 85.3, 1.4, 1.1],
    ),
  },
  {
    id: '14',
    label: 'Dropship Orders & Revenue Summary',
    x: 740,
    matrixData: buildMatrixData(
      dropshipOrders,
      dropshipRevenue,
      splitCurrency(totalFreebies, DR),
      splitCurrency(totalWd, DR),
      [[49.1, 48.9, 49.2, 49.0, 49.1], 49.0, 49.2, 1.5, 1.1],
      [[81.2, 81.0, 81.4, 81.1, 81.2], 81.2, 81.1, 0.8, 0.6],
    ),
  },
];

const sharedMatrixData = {
  componentType: 'matrix',
  matrixFirstColumnWidth: 108,
  matrixGroupedColumns: [
    { label: '' },
    { label: 'Wk 15' },
    { label: 'Wk 16' },
    { label: 'Wk 17' },
    { label: 'Wk 18' },
    { label: 'Wk 19' },
    { label: 'MTD' },
    { label: 'YTD' },
    { label: 'YoY MTD', subLabels: ['$', '%'] },
    { label: 'YoY YTD', subLabels: ['$', '%'] },
  ],
  columnLabels: ['', 'Wk 15', 'Wk 16', 'Wk 17', 'Wk 18', 'Wk 19', 'MTD', 'YTD', '$', '%', '$', '%'],
  matrixStripedRows: false,
};

const MATRIX_Y = 760;
const MATRIX_WIDTH = 420;
const MATRIX_HEIGHT = 360;

const matrixNodes = matrixConfigs.map((config) => ({
  id: config.id,
  type: 'powerbi',
  position: { x: config.x, y: MATRIX_Y },
  data: {
    label: config.label,
    ...sharedMatrixData,
    matrixData: config.matrixData,
  },
  style: { width: MATRIX_WIDTH, height: MATRIX_HEIGHT },
  resizing: false,
  draggable: true,
  selectable: true,
  width: MATRIX_WIDTH,
  height: MATRIX_HEIGHT,
  positionAbsolute: { x: config.x, y: MATRIX_Y },
  selected: false,
  dragging: false,
}));

const nodeIndex = dashboard.nodes.findIndex((node) => node.id === '7');
dashboard.nodes.splice(nodeIndex, 1, ...matrixNodes);

const shippedNode = dashboard.nodes.find((node) => node.id === '10');
if (shippedNode) {
  const shippedY = 1140;
  shippedNode.position.y = shippedY;
  shippedNode.positionAbsolute.y = shippedY;
}

fs.writeFileSync(filePath, `${JSON.stringify(dashboard, null, 2)}\n`);
console.log('Updated retailSummaryDashboard.json with split Orders & Revenue matrices.');
