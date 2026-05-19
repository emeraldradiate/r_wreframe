import { getDefaultMatrixColumns, DEFAULT_MATRIX_FIRST_COLUMN_WIDTH } from '../nodeUtils';

const MatrixVisual = ({
  data = [[120, 85], [200, 150], [95, 110]],
  columnLabels,
  firstColumnWidth,
  onCellChange,
  onColumnLabelChange,
}: {
  data?: Array<Array<number | string>>;
  columnLabels?: string[];
  firstColumnWidth?: number;
  onCellChange?: (rowIndex: number, columnIndex: number, value: string) => void;
  onColumnLabelChange?: (columnIndex: number, value: string) => void;
}) => {
  const safeData = data.length ? data : [['', '']], columnCount = Math.max(1, safeData[0]?.length || 1);
  const headerLabels = columnLabels?.length === columnCount ? columnLabels : getDefaultMatrixColumns(columnCount);
  const leadingColumnWidth = firstColumnWidth || DEFAULT_MATRIX_FIRST_COLUMN_WIDTH, trailingColumnCount = Math.max(columnCount - 1, 0);
  const gridTemplateColumns = trailingColumnCount ? `${leadingColumnWidth}px repeat(${trailingColumnCount}, minmax(64px, 1fr))` : `${leadingColumnWidth}px`;

  return (
    <div className="w-full h-full px-2 py-2 bg-white">
      <div className="text-xs font-semibold text-medium-gray border-b border-medium-gray pb-1 mb-2 grid font-header" style={{ gridTemplateColumns }}>
        {headerLabels.map((label, index) => (
          <div key={index} className={`px-1 ${index === 0 ? 'text-left' : 'text-center'}`}>
            <input
              value={label}
              onChange={(e) => onColumnLabelChange?.(index, e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              className={`nodrag w-full bg-transparent border-0 p-0 m-0 text-xs font-semibold text-medium-gray focus:outline-none ${index === 0 ? 'text-left pr-2' : 'text-center'}`}
            />
          </div>
        ))}
      </div>
      {safeData.map((row, i) => (
        <div key={i} className={`grid text-xs py-1 border-b border-medium-gray font-body ${i % 2 === 1 ? 'bg-[#D1D5DB]' : ''}`} style={{ gridTemplateColumns }}>
          {row.map((val, j) => (
            <div key={j} className={`px-1 ${j === 0 ? 'text-left' : 'text-center'}`}>
              <input
                value={String(val ?? '')}
                onChange={(e) => onCellChange?.(i, j, e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className={`nodrag w-full bg-transparent border-0 p-0 m-0 font-medium text-black focus:outline-none ${j === 0 ? 'text-left pr-2' : 'text-center'}`}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MatrixVisual;
