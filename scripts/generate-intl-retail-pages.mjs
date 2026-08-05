import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../src/data');

const fmtDollar = (n) => {
  const abs = Math.abs(n);
  const str = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (n < 0 ? '-$' : '$') + str;
};

const sum = (...vals) => vals.reduce((a, b) => a + b, 0);

// Store data from Excel (intl_storesandsales.xlsx)
const lakeviewStores = 34;
const northwindsStores = 1;
const totalStores = lakeviewStores + northwindsStores;
const prevWeekStores = 34;
const newStores = 1;
const lostStores = 1;

// Weekly shipped — Wk 19 anchored to Excel ($6,012.38 combined); earlier weeks fictionalized
const lakeviewWeekly = {
  earlyYear: 304, // ~93% of $329.80 (Wk 5)
  wk15: 245,
  wk16: 312,
  wk17: 388,
  wk18: 465,
  wk19: 5592, // ~93% of $6,012.38
  wk20: 58, // ~93% of $70.67
};

const northwindsWeekly = {
  earlyYear: 26,
  wk15: 18,
  wk16: 28,
  wk17: 42,
  wk18: 65,
  wk19: 421, // ~7% of $6,012.38
  wk20: 9,
};

const lakeviewMtd = sum(lakeviewWeekly.wk18, lakeviewWeekly.wk19, lakeviewWeekly.wk20);
const northwindsMtd = sum(northwindsWeekly.wk18, northwindsWeekly.wk19, northwindsWeekly.wk20);

const lakeviewYtd = sum(
  lakeviewWeekly.earlyYear,
  lakeviewWeekly.wk15,
  lakeviewWeekly.wk16,
  lakeviewWeekly.wk17,
  lakeviewWeekly.wk18,
  lakeviewWeekly.wk19,
  lakeviewWeekly.wk20,
);
const northwindsYtd = sum(
  northwindsWeekly.earlyYear,
  northwindsWeekly.wk15,
  northwindsWeekly.wk16,
  northwindsWeekly.wk17,
  northwindsWeekly.wk18,
  northwindsWeekly.wk19,
  northwindsWeekly.wk20,
);

const lakeviewRevPct = ((lakeviewWeekly.wk19 / (lakeviewWeekly.wk19 + northwindsWeekly.wk19)) * 100).toFixed(1);
const northwindsRevPct = ((northwindsWeekly.wk19 / (lakeviewWeekly.wk19 + northwindsWeekly.wk19)) * 100).toFixed(1);

const lakeviewOrdersWeekly = {
  wk15: 1,
  wk16: 1,
  wk17: 2,
  wk18: 2,
  wk19: 4,
  wk20: 1,
};
const northwindsOrdersWeekly = {
  wk15: 1,
  wk16: 1,
  wk17: 1,
  wk18: 1,
  wk19: 2,
  wk20: 1,
};

const page2 = JSON.parse(fs.readFileSync(path.join(dataDir, 'retailSummaryDashboardPage2.json'), 'utf8'));
const intlPage2 = JSON.parse(JSON.stringify(page2));
intlPage2.savedAt = new Date().toISOString();

for (const node of intlPage2.nodes) {
  const d = node.data;
  if (d.label === 'Total Stores') {
    d.value = totalStores.toLocaleString();
    d.ytdPriorYear = prevWeekStores.toLocaleString();
    d.budgetVariance = {
      dollarValue: `+${newStores}`,
      percentage: `+${((newStores / prevWeekStores) * 100).toFixed(1)}%`,
    };
    d.priorVariance = {
      dollarValue: `-${lostStores}`,
      percentage: `-${((lostStores / prevWeekStores) * 100).toFixed(1)}%`,
    };
  }
  if (d.label === 'All Dealers Store Concentration Map') {
    d.label = 'International Dealers Store Concentration Map';
    d.mapImageSrc = 'map2.png';
  }
  if (d.label === 'Partner Store Count') {
    d.columnLabels = ['Group', 'Partner', 'Total'];
    delete d.matrixColumnWidths;
    d.matrixTotalRows = [3];
    d.matrixData = [
      ['Canada', 'Lakeview', lakeviewStores.toLocaleString()],
      ['', 'Northwinds', northwindsStores.toLocaleString()],
      ['', 'Retailer Total', totalStores.toLocaleString()],
    ];
  }
  if (d.label === 'Monthly Events & Training') {
    d.matrixData = [
      ['Events', '1', '1', '2', '2', '3', '2', '2', '2', '', '', '', '', '15'],
      ['Training', '1', '1', '1', '1', '1', '1', '1', '1', '', '', '', '', '8'],
    ];
    d.matrixSubRowData = [
      [
        ['', '2', '2', '3', '3', '4', '3', '3', '3', '3', '3', '2', '2', '33'],
        ['', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '', '', '', '', '-8'],
      ],
      [
        ['', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '24'],
        ['', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '', '', '', '', '-8'],
      ],
    ];
  }
  if (d.label === 'Store Growth') {
    d.matrixData = [
      ['Cumulative', 'Actual', '28', '29', '30', '31', '32', '33', '34', '35', '', '', '', '', '35'],
      ['', 'Budget', '28', '29', '30', '31', '32', '33', '34', '35', '35', '36', '36', '37', '37'],
      ['', 'Variance', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '', '', '', '', '+1'],
      ['Growth', 'Actual', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '', '', '', '', '+8'],
      ['', 'Budget', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '+1', '+9'],
    ];
  }
  if (d.label === 'Completed Events') {
    d.value = '15';
    d.ytdPriorYear = '23';
    d.budgetVariance = { dollarValue: '-8', percentage: '-34.8%' };
  }
  if (d.label === 'Completed Training') {
    d.value = '8';
    d.ytdPriorYear = '16';
    d.budgetVariance = { dollarValue: '-8', percentage: '-50.0%' };
  }
}

intlPage2.nodes = intlPage2.nodes.filter(
  (n) => !['New Diamond Stores', 'New Authorized Stores'].includes(n.data.label),
);

for (const node of intlPage2.nodes) {
  if (node.data.label === 'Completed Events') {
    node.position.y = 360;
    node.positionAbsolute.y = 360;
  }
  if (node.data.label === 'Completed Training') {
    node.position.y = 560;
    node.positionAbsolute.y = 560;
  }
}

intlPage2.nodes.push({
  id: '4',
  type: 'powerbi',
  position: { x: -60, y: 160 },
  data: {
    label: 'New Stores',
    componentType: 'card',
    value: String(newStores),
    wowPct: { percentage: '+100%', dollarValue: `+${newStores}` },
    cardPrimaryDeltaDollarOnly: true,
    cardShowSecondaryDelta: false,
    cardBudgetLabel: 'MTD',
    cardPriorLabel: 'YTD',
    budgetVariance: { dollarValue: `+${newStores}`, percentage: '+100%' },
    priorVariance: { dollarValue: `+${newStores}`, percentage: '+100%' },
    cardTheme: 'light',
  },
  style: { width: 260, height: 180 },
  resizing: false,
  draggable: true,
  selectable: true,
  width: 260,
  height: 180,
  positionAbsolute: { x: -60, y: 160 },
  selected: false,
  dragging: false,
});

const page3 = JSON.parse(fs.readFileSync(path.join(dataDir, 'retailSummaryDashboardPage3.json'), 'utf8'));
const intlPage3 = JSON.parse(JSON.stringify(page3));
intlPage3.savedAt = new Date().toISOString();

const makeShippedRow = (
  name,
  weekly,
  mtd,
  ytd,
  revPct,
  cmCw,
  cmMtd,
  cmYtd,
  yoyMtdD,
  yoyMtdP,
  yoyYtdD,
  yoyYtdP,
  yoyCmMtd,
  yoyCmYtd,
) => [
  name,
  fmtDollar(weekly.wk15),
  fmtDollar(weekly.wk16),
  fmtDollar(weekly.wk17),
  fmtDollar(weekly.wk18),
  fmtDollar(weekly.wk19),
  fmtDollar(mtd),
  fmtDollar(ytd),
  `${revPct}%`,
  `${revPct}%`,
  `${revPct}%`,
  `${cmCw}%`,
  `${cmMtd}%`,
  cmYtd,
  yoyMtdD,
  yoyMtdP,
  yoyYtdD,
  yoyYtdP,
  yoyCmMtd,
  yoyCmYtd,
];

const lvShipped = makeShippedRow(
  'Lakeview',
  lakeviewWeekly,
  lakeviewMtd,
  lakeviewYtd,
  lakeviewRevPct,
  44.2,
  44.0,
  '44.1%',
  '+412',
  '+12.4%',
  '+628',
  '+11.9%',
  '+0.8%',
  '+0.6%',
);
const nwShipped = makeShippedRow(
  'Northwinds',
  northwindsWeekly,
  northwindsMtd,
  northwindsYtd,
  northwindsRevPct,
  42.8,
  42.5,
  '42.6%',
  '+198',
  '+68.2%',
  '+312',
  '+85.4%',
  '+2.1%',
  '+1.8%',
);

const productSubRows = [
  {
    label: 'Grills',
    share: 0.53,
    revenueMix: { cw: 52, mtd: 53, ytd: 54 },
    cmPercent: { cw: 46, mtd: 46.2, ytd: 46.4 },
    yoyRevenueMix: { mtd: 1.0, ytd: 1.2 },
    yoyCmPercent: { mtd: 0.4, ytd: 0.3 },
  },
  {
    label: 'Accessories',
    share: 0.2,
    revenueMix: { cw: 20, mtd: 19, ytd: 18 },
    cmPercent: { cw: 60, mtd: 59.8, ytd: 59.5 },
    yoyRevenueMix: { mtd: -0.5, ytd: -0.8 },
    yoyCmPercent: { mtd: 1.2, ytd: 1.0 },
  },
  {
    label: 'Pellets',
    share: 0.1,
    revenueMix: { cw: 10, mtd: 10, ytd: 9 },
    cmPercent: { cw: 36, mtd: 36.2, ytd: 36.5 },
    yoyRevenueMix: { mtd: 0.2, ytd: 0.1 },
    yoyCmPercent: { mtd: -0.2, ytd: -0.1 },
  },
  {
    label: 'Rubs & Sauces',
    share: 0.08,
    revenueMix: { cw: 8, mtd: 9, ytd: 10 },
    cmPercent: { cw: 54, mtd: 53.8, ytd: 53.5 },
    yoyRevenueMix: { mtd: 0.3, ytd: 0.4 },
    yoyCmPercent: { mtd: 0.6, ytd: 0.5 },
  },
  {
    label: 'Other',
    share: 0.09,
    revenueMix: { cw: 10, mtd: 9, ytd: 9 },
    cmPercent: { cw: 32, mtd: 32.2, ytd: 32.4 },
    yoyRevenueMix: { mtd: -0.2, ytd: -0.1 },
    yoyCmPercent: { mtd: -0.3, ytd: -0.2 },
  },
];

const orderSubRows = [
  { label: '# Orders', share: 0.2 },
  { label: '$ Revenue', share: 0.35 },
  { label: '$ Freebies', share: 0.1 },
  { label: 'W/D $s', share: 0.15 },
  { label: 'Shipping Cost $s', share: 0.2 },
];

const makeOrdersRow = (name, weekly, mtd, ytd, yoyMtdD, yoyMtdP, yoyYtdD, yoyYtdP) => [
  name,
  fmtDollar(weekly.wk15),
  fmtDollar(weekly.wk16),
  fmtDollar(weekly.wk17),
  fmtDollar(weekly.wk18),
  fmtDollar(weekly.wk19),
  fmtDollar(mtd),
  fmtDollar(ytd),
  yoyMtdD,
  yoyMtdP,
  yoyYtdD,
  yoyYtdP,
];

const lvOrders = makeOrdersRow('Lakeview', lakeviewWeekly, lakeviewMtd, lakeviewYtd, '+412', '+12.4%', '+628', '+11.9%');
const nwOrders = makeOrdersRow('Northwinds', northwindsWeekly, northwindsMtd, northwindsYtd, '+198', '+68.2%', '+312', '+85.4%');

const scaleFreebies = (rev) => Math.max(12, Math.round(rev * 0.005));
const scaleWd = (rev) => Math.max(18, Math.round(rev * 0.008));
const scaleShipping = (rev) => Math.max(42, Math.round(rev * 0.045));

const makeOrderSubData = (weekly, ordersWeekly, mtd, ytd, yoyMtdD, yoyMtdP, yoyYtdD, yoyYtdP) => {
  const orderMtd = sum(ordersWeekly.wk18, ordersWeekly.wk19, ordersWeekly.wk20);
  const orderYtd = sum(
    ordersWeekly.wk15,
    ordersWeekly.wk16,
    ordersWeekly.wk17,
    ordersWeekly.wk18,
    ordersWeekly.wk19,
    ordersWeekly.wk20,
    2,
  );

  const weekKeys = ['wk15', 'wk16', 'wk17', 'wk18', 'wk19'];
  const revKeys = weekKeys.map((k) => weekly[k]);

  return [
    [
      '',
      String(ordersWeekly.wk15),
      String(ordersWeekly.wk16),
      String(ordersWeekly.wk17),
      String(ordersWeekly.wk18),
      String(ordersWeekly.wk19),
      String(orderMtd),
      String(orderYtd),
      yoyMtdD,
      yoyMtdP,
      yoyYtdD,
      yoyYtdP,
    ],
    [
      '',
      ...revKeys.map((r) => fmtDollar(r)),
      fmtDollar(mtd),
      fmtDollar(ytd),
      yoyMtdD,
      yoyMtdP,
      yoyYtdD,
      yoyYtdP,
    ],
    [
      '',
      ...revKeys.map((r) => fmtDollar(scaleFreebies(r))),
      fmtDollar(scaleFreebies(mtd)),
      fmtDollar(scaleFreebies(ytd)),
      '+8',
      '+16.7%',
      '+24',
      '+20.3%',
    ],
    [
      '',
      ...revKeys.map((r) => fmtDollar(scaleWd(r))),
      fmtDollar(scaleWd(mtd)),
      fmtDollar(scaleWd(ytd)),
      '+12',
      '+16.7%',
      '+36',
      '+19.8%',
    ],
    [
      '',
      ...revKeys.map((r) => fmtDollar(scaleShipping(r))),
      fmtDollar(scaleShipping(mtd)),
      fmtDollar(scaleShipping(ytd)),
      '+72',
      '+16.7%',
      '+212',
      '+19.7%',
    ],
  ];
};

intlPage3.nodes = intlPage3.nodes.filter(
  (n) => !['Ace AOV', 'Nationwide AOV', 'Farm AOV', 'Sporting AOV', 'Independents AOV'].includes(n.data.label),
);

for (const node of intlPage3.nodes) {
  const d = node.data;
  if (d.label === 'Enterprise Shipped $ by Partner') {
    d.label = 'International Shipped $ by Partner';
    d.matrixData = [lvShipped, nwShipped];
    d.matrixSubRows = [productSubRows, productSubRows];
  }
  if (d.label === 'Enterprise Orders & Revenue by Partner') {
    d.label = 'International Orders & Revenue by Partner';
    d.matrixData = [lvOrders, nwOrders];
    d.matrixSubRows = [orderSubRows, orderSubRows];
    d.matrixSubRowData = [
      makeOrderSubData(lakeviewWeekly, lakeviewOrdersWeekly, lakeviewMtd, lakeviewYtd, '+412', '+12.4%', '+628', '+11.9%'),
      makeOrderSubData(northwindsWeekly, northwindsOrdersWeekly, northwindsMtd, northwindsYtd, '+198', '+68.2%', '+312', '+85.4%'),
    ];
  }
}

const aovCards = [
  { id: '5', label: 'Lakeview AOV', y: 760, value: '$10,532.18', ytd: '$10,498.42', delta: '+33.76' },
  { id: '6', label: 'Northwinds AOV', y: 880, value: '$8,214.55', ytd: '$7,892.30', delta: '+322.25' },
];

for (const aov of aovCards) {
  intlPage3.nodes.push({
    id: aov.id,
    type: 'powerbi',
    position: { x: -320, y: aov.y },
    data: {
      label: aov.label,
      componentType: 'card',
      cardLayout: 'periodKpi',
      cardHeroFontSize: 'compact',
      value: aov.value,
      ytdPriorYear: aov.ytd,
      cardPriorActualLabel: 'YTD AOV',
      cardBudgetLabel: 'CW vs YTD',
      budgetVariance: { dollarValue: `+${aov.delta}`, percentage: '' },
      cardTheme: 'light',
    },
    style: { width: 260, height: 120 },
    resizing: false,
    draggable: true,
    selectable: true,
    width: 260,
    height: 120,
    positionAbsolute: { x: -320, y: aov.y },
    selected: false,
    dragging: false,
  });
}

fs.writeFileSync(path.join(dataDir, 'retailSummaryDashboardPage6.json'), JSON.stringify(intlPage2, null, 2));
fs.writeFileSync(path.join(dataDir, 'retailSummaryDashboardPage7.json'), JSON.stringify(intlPage3, null, 2));

console.log('Generated international Retail pages');
console.log(`Stores: Lakeview ${lakeviewStores}, Northwinds ${northwindsStores}, Total ${totalStores}`);
console.log(`Shipped Wk 19: Lakeview ${fmtDollar(lakeviewWeekly.wk19)}, Northwinds ${fmtDollar(northwindsWeekly.wk19)}`);
console.log(`YTD: Lakeview ${fmtDollar(lakeviewYtd)}, Northwinds ${fmtDollar(northwindsYtd)}`);
