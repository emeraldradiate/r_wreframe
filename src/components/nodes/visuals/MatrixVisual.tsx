import { getDefaultMatrixColumns, DEFAULT_MATRIX_FIRST_COLUMN_WIDTH, CHART_COLOR_PALETTE } from '../nodeUtils';

const getCellValueColorClass = (value: number | string) => {
  const normalizedValue = String(value ?? '').trimStart();

  if (normalizedValue.startsWith('+')) {
    return 'text-green-600';
  }

  if (normalizedValue.startsWith('-')) {
    return 'text-red-600';
  }

  return 'text-black';
};

const MatrixVisual = ({
  data = [[120, 85], [200, 150], [95, 110]],
  columnLabels,
  firstColumnWidth,
  showColorBlocks = false,
  regularFirstColumn = false,
  onCellChange,
  onColumnLabelChange,
}: {
  data?: Array<Array<number | string>>;
  columnLabels?: string[];
  firstColumnWidth?: number;
  showColorBlocks?: boolean;
  regularFirstColumn?: boolean;
  onCellChange?: (rowIndex: number, columnIndex: number, value: string) => void;
  onColumnLabelChange?: (columnIndex: number, value: string) => void;
}) => {
  const safeData = data.length ? data : [['', '']], columnCount = Math.max(1, safeData[0]?.length || 1);
  const headerLabels = columnLabels?.length === columnCount ? columnLabels : getDefaultMatrixColumns(columnCount);
  const leadingColumnWidth = firstColumnWidth || DEFAULT_MATRIX_FIRST_COLUMN_WIDTH, trailingColumnCount = Math.max(columnCount - 1, 0);
  const colorColumnWidth = showColorBlocks ? 42 : 0;
  const regularTemplate = `repeat(${columnCount}, minmax(64px, 1fr))`;
  const trailingColumnsTemplate = trailingColumnCount ? ` repeat(${trailingColumnCount}, minmax(64px, 1fr))` : '';
  const defaultTemplate = `${leadingColumnWidth}px${trailingColumnsTemplate}`;
  const baseTemplate = regularFirstColumn ? regularTemplate : defaultTemplate;
  const gridTemplateColumns = showColorBlocks
    ? regularFirstColumn
      ? `${baseTemplate} ${colorColumnWidth}px`
      : `${leadingColumnWidth}px ${colorColumnWidth}px${trailingColumnsTemplate}`
    : baseTemplate;

  return (
    <div className="w-full h-full px-2 py-2 bg-white">
      <div className="text-xs font-semibold text-medium-gray border-b border-medium-gray pb-1 mb-2 grid font-header" style={{ gridTemplateColumns }}>
        {headerLabels.map((label, index) => (
          <div key={`header-cell-${index}`} className="contents">
            {index === 1 && showColorBlocks && !regularFirstColumn && (
              <div className="px-1" />
            )}
            <div className={`px-1 ${index === 0 && !regularFirstColumn ? 'text-left' : 'text-center'}`}>
              <input
                value={label}
                onChange={(e) => onColumnLabelChange?.(index, e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className={`nodrag w-full bg-transparent border-0 p-0 m-0 text-xs font-semibold text-medium-gray focus:outline-none ${index === 0 && !regularFirstColumn ? 'text-left pr-2' : 'text-center'}`}
              />
            </div>
          </div>
        ))}
        {showColorBlocks && regularFirstColumn && (
          <div className="px-1 text-center uppercase tracking-wide text-[10px] text-gray-500">Color</div>
        )}
        {showColorBlocks && columnCount === 1 && (
          <div className="px-1 text-center uppercase tracking-wide text-[10px] text-gray-500">Color</div>
        )}
      </div>
      {safeData.map((row, i) => (
        <div key={i} className={`grid text-xs py-1 border-b border-medium-gray font-body ${i % 2 === 1 ? 'bg-[#e6e9ed]' : ''}`} style={{ gridTemplateColumns }}>
          {row.map((val, j) => (
            <div key={`row-${i}-cell-${j}`} className="contents">
              <div className={`px-1 ${j === 0 && !regularFirstColumn ? 'text-left' : 'text-center'}`}>
                <input
                  value={String(val ?? '')}
                  onChange={(e) => onCellChange?.(i, j, e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`nodrag w-full bg-transparent border-0 p-0 m-0 font-medium ${getCellValueColorClass(val)} focus:outline-none ${j === 0 && !regularFirstColumn ? 'text-left pr-2' : 'text-center'}`}
                />
              </div>
              {j === 0 && showColorBlocks && !regularFirstColumn && (
                <div className="flex items-center justify-center px-1">
                  <span
                    className="inline-block h-3.5 w-3.5"
                    style={{ backgroundColor: CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length] }}
                    title={`Row ${i + 1} color`}
                  />
                </div>
              )}
            </div>
          ))}
          {showColorBlocks && regularFirstColumn && (
            <div className="flex items-center justify-center px-1">
              <span
                className="inline-block h-3.5 w-3.5"
                style={{ backgroundColor: CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length] }}
                title={`Row ${i + 1} color`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MatrixVisual;
