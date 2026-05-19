import React from 'react';
import { BarChart3, Table, PieChart, Gauge, SlidersHorizontal, Layout, LineChart, Grid3x3, Map } from 'lucide-react';

interface ToolbarProps {
  gridVisible: boolean;
  onGridVisibleChange: (visible: boolean) => void;
  isOpen: boolean;
}

function Toolbar({ gridVisible, onGridVisibleChange, isOpen }: ToolbarProps) {
  const components = [
    { icon: Table, label: 'Table', type: 'table' },
    { icon: BarChart3, label: 'Bar Chart', type: 'bar' },
    { icon: LineChart, label: 'Line Chart', type: 'line' },
    { icon: LineChart, label: 'Stacked Area', type: 'stackedArea' },
    { icon: LineChart, label: 'Expected vs Reality', type: 'expectedReality' },
    { icon: PieChart, label: 'Pie Chart', type: 'pie' },
    { icon: Gauge, label: 'Gauge', type: 'gauge' },
    { icon: SlidersHorizontal, label: 'Slicer', type: 'slicer' },
    { icon: Layout, label: 'Card', type: 'card' },
    { icon: Grid3x3, label: 'Matrix', type: 'matrix' },
    { icon: Map, label: 'Map', type: 'map' },
  ];

  const handleDragStart = (event: React.DragEvent, componentType: string, label: string) => {
    // Store drag data globally so WireframeCanvas can read it during dragover
    (window as any).currentDragData = { componentType, label };
    
    // Set dataTransfer for drop compatibility
    event.dataTransfer.setData('text/plain', JSON.stringify({ componentType, label }));
    event.dataTransfer.effectAllowed = 'move';
    
    // Hide the default drag ghost image
    const dragGhost = document.createElement('div');
    dragGhost.style.opacity = '0';
    dragGhost.style.position = 'absolute';
    dragGhost.style.top = '-1000px';
    document.body.appendChild(dragGhost);
    event.dataTransfer.setDragImage(dragGhost, 0, 0);
    
    // Clean up after drag
    setTimeout(() => {
      document.body.removeChild(dragGhost);
    }, 0);
  };

  return (
    <div className={`relative shrink-0 h-full ${isOpen ? 'w-64' : 'w-0'}`}>
      <aside
        className={`h-full w-64 bg-white border-r border-gray-200 overflow-y-auto ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="p-4 pb-16">
          <h2 className="text-lg font-semibold mb-4 text-dark text-left font-header">Power BI Components</h2>

          <div className="space-y-2">
            {components.map((component) => {
              const Icon = component.icon;
              return (
                <div
                  key={component.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, component.type, component.label)}
                  className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-[#EA0029] hover:text-white rounded-lg cursor-move transition-all border border-[#606060] hover:border-[#EA0029]"
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium font-body">{component.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-body text-dark">
              <input
                type="checkbox"
                checked={!gridVisible}
                onChange={(e) => onGridVisibleChange(!e.target.checked)}
                className="h-4 w-4 accent-[#EA0029]"
              />
              <span>Hide grid</span>
            </label>
          </div>
        </div>
      </aside>

    </div>
  );
}

export default Toolbar;
