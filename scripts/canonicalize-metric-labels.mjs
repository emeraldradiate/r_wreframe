import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src/data');
const files = fs.readdirSync(dir).filter(
  (f) =>
    (f.includes('Dashboard') || f === 'defaultSalesDashboard.json') &&
    !f.includes('sidequest') &&
    !f.endsWith('.ts'),
);

const replacements = [
  ['MTD Budget v Actual', 'MTD vs Budget'],
  ['YTD Budget v Actual', 'YTD vs Budget'],
  ['MTD YoY Variance', 'MTD YoY'],
  ['YTD YoY Variance', 'YTD YoY'],
  ['MTD Variance', 'MTD vs Budget'],
  ['YTD Variance', 'YTD vs Budget'],
  ['YTD vs PY', 'YTD YoY'],
  ['YoY CM% MTD', 'MTD CM% YoY'],
  ['YoY CM% YTD', 'YTD CM% YoY'],
  ['YoY MTD', 'MTD YoY'],
  ['YoY YTD', 'YTD YoY'],
  ['% Mix CW', 'CW % Mix'],
  ['% Mix MTD', 'MTD % Mix'],
  ['% Mix YTD', 'YTD % Mix'],
  ['CM% CW', 'CW CM%'],
  ['CM% MTD', 'MTD CM%'],
  ['CM% YTD', 'YTD CM%'],
  ['CW vs 4Wk ($)', 'CW vs 4Wk Avg ($)'],
  ['CW vs 4Wk (%)', 'CW vs 4Wk Avg (%)'],
  ['CW vs 4Wk Avg', 'CW vs 4Wk Avg'], // no-op guard for idempotency
  ['CW vs 4Wk', 'CW vs 4Wk Avg'],
  ['WoW Variance', 'CW WoW'],
  ['PY YTD', 'YTD YoY'],
  ['"cardBudgetLabel": "Variance"', '"cardBudgetLabel": "YTD vs Budget"'],
];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }

  content = content.replace(/"4Wk"/g, '"4Wk Avg"');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${file}`);
  }
}
