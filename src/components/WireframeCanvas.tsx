import React, { useCallback, useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import ReactFlow, {
  applyNodeChanges,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  NodeChange,
  Node,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import PowerBINode from './nodes/PowerBINode';
import executiveSummaryDashboard from '../data/executiveSummaryDashboard.json';

const nodeTypes = {
  powerbi: PowerBINode,
};

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

const GRID_SIZE = 20;

const cloneJsonValue = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const snapToGridValue = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

const normalizeNodeToGrid = (node: Node): Node => {
  const { dragHandle: _dragHandle, ...nodeWithoutDragHandle } = node as Node & { dragHandle?: string };
  const nextPosition = {
    x: snapToGridValue(node.position.x),
    y: snapToGridValue(node.position.y),
  };
  const nextStyle = node.style ? { ...node.style } : undefined;

  if (typeof nextStyle?.width === 'number') {
    nextStyle.width = snapToGridValue(nextStyle.width);
  }

  if (typeof nextStyle?.height === 'number') {
    nextStyle.height = snapToGridValue(nextStyle.height);
  }

  return {
    ...nodeWithoutDragHandle,
    position: nextPosition,
    draggable: true,
    selectable: true,
    width: typeof node.width === 'number' ? snapToGridValue(node.width) : node.width,
    height: typeof node.height === 'number' ? snapToGridValue(node.height) : node.height,
    style: nextStyle,
  };
};

const normalizeNodesToGrid = (nodes: Node[]) => nodes.map(normalizeNodeToGrid);

const getWireframePayload = (payload: unknown) => {
  const parsed = payload as {
    savedAt?: string;
    nodes?: unknown[];
    edges?: unknown[];
    appTitle?: string;
    headerTitle?: string;
  } | null;

  return {
    savedAt: typeof parsed?.savedAt === 'string' ? parsed.savedAt : null,
    nodes: Array.isArray(parsed?.nodes) ? cloneJsonValue(parsed.nodes as Node[]) : [],
    edges: Array.isArray(parsed?.edges) ? cloneJsonValue(parsed.edges as Edge[]) : [],
    appTitle: typeof parsed?.appTitle === 'string'
      ? parsed.appTitle
      : typeof parsed?.headerTitle === 'string'
        ? parsed.headerTitle
        : null,
  };
};

const toIsoDateInput = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getIsoWeekInfo = (date: Date) => {
  const reference = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = reference.getUTCDay() || 7;
  reference.setUTCDate(reference.getUTCDate() + 4 - day);
  const isoYear = reference.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil((((reference.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: isoYear, week };
};

const getNearestWeekEndingSunday = (date: Date) => {
  const reference = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = reference.getUTCDay();
  const daysToPreviousSunday = day;
  const daysToNextSunday = (7 - day) % 7;
  const offset = daysToNextSunday < daysToPreviousSunday ? daysToNextSunday : -daysToPreviousSunday;
  reference.setUTCDate(reference.getUTCDate() + offset);
  return reference;
};

// Helper function to get default size based on component type
const getDefaultSize = (componentType: string) => {
  switch (componentType) {
    case 'card':
      return { width: 260, height: 200 };
    case 'gauge':
      return { width: 220, height: 220 };
    case 'slicer':
      return { width: 180, height: 200 };
    case 'line':
      return { width: 320, height: 220 };
    case 'expectedReality':
      return { width: 340, height: 240 };
    case 'stackedArea':
      return { width: 420, height: 280 };
    case 'matrix':
      return { width: 280, height: 220 };
    case 'map':
      return { width: 300, height: 250 };
    default:
      return { width: 280, height: 200 };
  }
};

// Helper function to get default data based on component type
const getDefaultData = (componentType: string, label: string) => {
  const baseData = { label, componentType };
  
  switch (componentType) {
    case 'bar':
      return { ...baseData, chartData: [65, 85, 45, 92, 78] };
    case 'line':
      return { ...baseData, chartData: [30, 65, 50, 75, 85, 60, 90] };
    case 'expectedReality':
      return {
        ...baseData,
        axisLabels: { x: 'Month', y: 'Sales ($k)' },
        xAxisLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      };
    case 'stackedArea':
      return {
        ...baseData,
        seriesLabels: ['Website', 'Call Center', 'Company Stores', 'Amazon', 'Guys.com', 'Domestic Retail', 'International Retail'],
        seriesColors: ['#EA0029', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'],
        seriesData: [
          [120, 132, 128, 140, 148, 156],
          [84, 88, 92, 98, 104, 109],
          [72, 75, 78, 81, 85, 88],
          [32, 34, 37, 40, 43, 46],
          [24, 27, 30, 32, 35, 38],
          [68, 71, 74, 78, 81, 85],
          [48, 51, 54, 57, 61, 64]
        ],
        axisLabels: { x: 'Period', y: 'Booked Sales ($k)' },
        xAxisLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      };
    case 'pie':
      return { ...baseData, chartData: [45, 30, 25] };
    case 'table':
      return { ...baseData, matrixData: [[120, 85, 200], [150, 95, 110], [75, 140, 165]] };
    case 'gauge':
      return { ...baseData, value: 72 };
    case 'card':
      return {
        ...baseData,
        value: '42.5k',
        wowPct: { percentage: '0.16', dollarValue: '+$0.1k' },
        ytdPriorYear: '39.8k',
        ytdPriorYearPct: '5.2',
        variancePct: { percentage: '6.8', dollarValue: '+$2.7k', flatValue: '+$2.7k' },
        cardTheme: 'light',
      };
    case 'slicer':
      {
        const weekEndingDate = getNearestWeekEndingSunday(new Date());
        const weekInfo = getIsoWeekInfo(weekEndingDate);
        return {
          ...baseData,
          reportingYear: weekInfo.year,
          reportingWeek: weekInfo.week,
          reportDate: toIsoDateInput(weekEndingDate),
          selectionMode: 'yearWeek',
        };
      }
    case 'matrix':
      return { ...baseData, matrixData: [[120, 85], [200, 150], [95, 110]] };
    case 'map':
      return { ...baseData, mapData: 'World Map' };
    default:
      return baseData;
  }
};

interface WireframeCanvasInnerProps {
  gridVisible: boolean;
  appTitle: string;
  onHeaderChange?: (payload: { title: string }) => void;
  externalDashboardLoad?: {
    requestId: number;
    payload: unknown;
  } | null;
}

function WireframeCanvasInner({
  gridVisible,
  appTitle,
  onHeaderChange,
  externalDashboardLoad,
}: WireframeCanvasInnerProps) {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition, flowToScreenPosition, getZoom } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodeIdCounter = useRef(1); // Start from 1 since we have no initial nodes
  const copiedNodesRef = useRef<any[]>([]);
  const pasteCountRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragPreview, setDragPreview] = useState<{
    position: { x: number; y: number };
    screenPosition: { x: number; y: number };
    size: { width: number; height: number };
    zoom: number;
    data: any;
  } | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const appTitleRef = useRef(appTitle);
  const onHeaderChangeRef = useRef(onHeaderChange);

  useEffect(() => {
    appTitleRef.current = appTitle;
  }, [appTitle]);

  useEffect(() => {
    onHeaderChangeRef.current = onHeaderChange;
  }, [onHeaderChange]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, [setNodes]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, draggedNode: Node) => {
    setNodes((currentNodes) => currentNodes.map((node) => (
      node.id === draggedNode.id ? normalizeNodeToGrid(node) : node
    )));
  }, [setNodes]);

  const syncNodeCounter = useCallback((nextNodes: any[]) => {
    const maxId = nextNodes.reduce((max, node) => {
      const numericId = Number(node.id);
      return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
    }, 0);
    nodeIdCounter.current = maxId + 1;
  }, []);

  const saveToJsonFile = useCallback(() => {
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      appTitle,
      nodes,
      edges,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `wireframe-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [appTitle, nodes, edges]);

  const copyCanvasScreenshotToClipboard = useCallback(async () => {
    if (isCapturingScreenshot) {
      return;
    }

    if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
      window.alert('Clipboard image copy is not supported in this browser.');
      return;
    }

    const screenshotTarget = document.querySelector<HTMLElement>('[data-capture-target="letter-canvas"]');
    if (!screenshotTarget) {
      window.alert('Could not find the canvas area to capture.');
      return;
    }

    try {
      setIsCapturingScreenshot(true);

      // Wait for controls to hide before rendering the capture.
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });

      const screenshotCanvas = await html2canvas(screenshotTarget, {
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        scale: Math.min(window.devicePixelRatio || 1, 2),
      });

      const screenshotBlob = await new Promise<Blob | null>((resolve) => {
        screenshotCanvas.toBlob(resolve, 'image/png');
      });

      if (!screenshotBlob) {
        throw new Error('Failed to generate screenshot blob.');
      }

      await navigator.clipboard.write([
        new ClipboardItem({ [screenshotBlob.type]: screenshotBlob }),
      ]);
    } catch (error) {
      console.error('Failed to copy screenshot to clipboard', error);
      window.alert('Unable to copy screenshot. Please make sure clipboard permissions are allowed.');
    } finally {
      setIsCapturingScreenshot(false);
    }
  }, [isCapturingScreenshot]);

  const resetToEmptyCanvas = useCallback(() => {
    const emptyNodes: Node[] = [];
    const emptyEdges: Edge[] = [];
    setNodes(emptyNodes);
    setEdges(emptyEdges);
    const resolvedTitle = appTitleRef.current;
    onHeaderChangeRef.current?.({
      title: resolvedTitle,
    });
    syncNodeCounter(emptyNodes);
  }, [setEdges, setNodes, syncNodeCounter]);

  const loadFromJsonFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const {
        nodes: nextNodes,
        edges: nextEdges,
        appTitle: nextAppTitle,
      } = getWireframePayload(parsed);
      const normalizedNodes = normalizeNodesToGrid(nextNodes);

      setNodes(normalizedNodes);
      setEdges(nextEdges);
      const resolvedTitle = nextAppTitle || appTitleRef.current;
      onHeaderChangeRef.current?.({
        title: resolvedTitle,
      });
      syncNodeCounter(normalizedNodes);
    } catch (error) {
      console.error('Failed to load wireframe JSON', error);
      window.alert('Unable to load this file. Please choose a valid wireframe JSON export.');
    } finally {
      event.target.value = '';
    }
  }, [setNodes, setEdges, syncNodeCounter]);

  useEffect(() => {
    try {
      const source = executiveSummaryDashboard;
      const {
        nodes: nextNodes,
        edges: nextEdges,
        appTitle: nextAppTitle,
      } = getWireframePayload(source);
      const normalizedNodes = normalizeNodesToGrid(nextNodes);

      setNodes(normalizedNodes);
      setEdges(nextEdges);
      const resolvedTitle = nextAppTitle || appTitleRef.current;
      onHeaderChangeRef.current?.({
        title: resolvedTitle,
      });
      syncNodeCounter(normalizedNodes);
    } catch (error) {
      console.error('Failed to load starter dashboard', error);
    }
  }, [setNodes, setEdges, syncNodeCounter]);

  useEffect(() => {
    if (!externalDashboardLoad || externalDashboardLoad.requestId <= 0) {
      return;
    }

    const {
      nodes: nextNodes,
      edges: nextEdges,
      appTitle: nextAppTitle,
    } = getWireframePayload(externalDashboardLoad.payload);
    const normalizedNodes = normalizeNodesToGrid(nextNodes);
    const resolvedTitle = nextAppTitle || appTitleRef.current;

    setNodes(normalizedNodes);
    setEdges(nextEdges);
    onHeaderChangeRef.current?.({
      title: resolvedTitle,
    });
    syncNodeCounter(normalizedNodes);
  }, [externalDashboardLoad, setNodes, setEdges, syncNodeCounter]);

  // Handle delete key and Ctrl+A
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isFormTarget = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );

      if (isFormTarget) {
        return;
      }

      const withModifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (event.key === 'Delete') {
        setNodes((nds) => nds.filter((node) => !node.selected));
        setEdges((eds) => eds.filter((edge) => !edge.selected));
      }

      if (withModifier && key === 'a') {
        event.preventDefault();
        setNodes((nds) => nds.map((node) => ({ ...node, selected: true })));
      }

      if (withModifier && key === 'c') {
        event.preventDefault();
        setNodes((nds) => {
          const selectedNodes = nds.filter((node) => node.selected);
          copiedNodesRef.current = JSON.parse(JSON.stringify(selectedNodes));
          pasteCountRef.current = 0;
          return nds;
        });
      }

      if (withModifier && key === 'v') {
        if (!copiedNodesRef.current.length) {
          return;
        }

        event.preventDefault();
        setNodes((nds) => {
          const offset = 40 * (pasteCountRef.current + 1);
          const pastedNodes = copiedNodesRef.current.map((node) => ({
            ...node,
            id: `${nodeIdCounter.current++}`,
            selected: true,
            position: {
              x: node.position.x + offset,
              y: node.position.y + offset,
            },
            data: JSON.parse(JSON.stringify(node.data)),
          }));

          pasteCountRef.current += 1;

          return nds
            .map((node) => ({ ...node, selected: false }))
            .concat(pastedNodes);
        });
      }
    };

    // Clean up drag preview when drag ends globally
    const handleDragEnd = () => {
      console.log('Global drag ended');
      setDragPreview(null);
      (window as any).currentDragData = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragend', handleDragEnd, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragend', handleDragEnd, true);
    };
  }, [setNodes, setEdges]);

  // Debug: Log dragPreview changes
  useEffect(() => {
    console.log('dragPreview state changed:', dragPreview);
  }, [dragPreview]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    console.log('onDragOver fired');

    // Read from global window variable set by Toolbar during dragstart
    const dragData = (window as any).currentDragData;
    console.log('dragData from window:', dragData);

    if (!dragData) {
      console.log('No drag data available');
      setDragPreview(null);
      return;
    }

    const { componentType, label } = dragData;
    console.log('componentType:', componentType, 'label:', label);

    if (componentType && reactFlowWrapper.current) {
      // Get the position where the node would be dropped
      let position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const defaultSize = getDefaultSize(componentType);

      // Center the node on the mouse cursor
      position = {
        x: position.x - defaultSize.width / 2,
        y: position.y - defaultSize.height / 2,
      };

      // Snap to grid (20x20)
      position = {
        x: Math.round(position.x / 20) * 20,
        y: Math.round(position.y / 20) * 20,
      };

      // Convert snapped top-left position to screen coordinates for accurate preview
      const screenPosition = flowToScreenPosition(position);
      const zoom = getZoom();

      const nodeData = getDefaultData(componentType, label || 'New Component');

      console.log('Setting drag preview with:', {
        position,
        screenPosition,
        size: defaultSize,
        zoom,
        data: nodeData,
      });

      // Create preview data
      setDragPreview({
        position,
        screenPosition,
        size: defaultSize,
        zoom,
        data: nodeData,
      });
    } else {
      console.log('componentType or wrapper not found, not setting preview');
    }
  }, [screenToFlowPosition, flowToScreenPosition, getZoom]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Read from global window variable
      const dragData = (window as any).currentDragData;
      
      // Clear preview and global drag data
      setDragPreview(null);
      (window as any).currentDragData = null;

      // Check if the dropped element is valid
      if (!dragData) {
        return;
      }

      const { componentType, label } = dragData;

      // Get the position where the node was dropped
      let position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const defaultSize = getDefaultSize(componentType);

      // Center the node on the mouse cursor
      position = {
        x: position.x - defaultSize.width / 2,
        y: position.y - defaultSize.height / 2,
      };

      // Snap to grid (20x20)
      position = {
        x: Math.round(position.x / 20) * 20,
        y: Math.round(position.y / 20) * 20,
      };

      const nodeData = getDefaultData(componentType, label || 'New Component');
      
      const newNode = {
        id: `${nodeIdCounter.current++}`,
        type: 'powerbi',
        position,
        data: nodeData,
        style: defaultSize,
        resizing: false,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onDragLeave = useCallback(() => {
    console.log('onDragLeave fired');
    setDragPreview(null);
    // Don't clear window.currentDragData yet - user might drag back over
  }, []);

  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full bg-gray-200" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          proOptions={{ hideAttribution: true }}
          autoPanOnNodeDrag={false}
          panActivationKeyCode={null}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          nodeTypes={nodeTypes}
          snapToGrid={true}
          snapGrid={[20, 20]}
          nodeDragThreshold={0}
          zoomOnDoubleClick={false}
          noDragClassName="rf-nodrag"
          noPanClassName="rf-nopan"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          multiSelectionKeyCode="Shift"
          className="bg-gray-200"
          style={{ backgroundColor: '#e5e7eb' }}
        >
          {gridVisible && <Background variant={BackgroundVariant.Lines} gap={20} size={0.12} color="#F7F7F7" />}
        </ReactFlow>
      </div>
      
      {/* Drag Preview Overlay - rendered outside wrapper to escape positioning context */}
      {dragPreview && (
        <>
          {console.log('Rendering preview element with position:', dragPreview.screenPosition)}
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: `${dragPreview.screenPosition.x}px`,
              top: `${dragPreview.screenPosition.y}px`,
              width: dragPreview.size.width,
              height: dragPreview.size.height,
              transform: `scale(${dragPreview.zoom})`,
              transformOrigin: 'top left',
              opacity: 0.7,
            }}
          >
            <div className="h-full flex flex-col bg-light shadow-lg rounded border-2 border-primary border-dashed overflow-hidden">
              <div className="px-3 py-2 border-b border-medium-gray">
                <div className="font-normal text-xs text-dark font-body">{dragPreview.data.label}</div>
                <div className="text-xs text-medium-gray capitalize mt-0.5 font-body">{dragPreview.data.componentType}</div>
              </div>
              <div className="flex-1 bg-light flex items-center justify-center text-sm text-medium-gray font-body">
                Placing {dragPreview.data.componentType}...
              </div>
            </div>
          </div>
        </>
      )}

      {gridVisible && (
        <div className={`absolute right-4 bottom-4 z-50 flex items-center gap-2 ${isCapturingScreenshot ? 'opacity-0 pointer-events-none' : ''}`}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:text-dark hover:border-gray-400"
            title="Load wireframe JSON"
          >
            Load
          </button>
          <button
            type="button"
            onClick={copyCanvasScreenshotToClipboard}
            className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:text-dark hover:border-gray-400"
            title="Copy screenshot of the center canvas to clipboard"
          >
            Screenshot
          </button>
          <button
            type="button"
            onClick={resetToEmptyCanvas}
            className="px-3 py-2 text-xs font-semibold bg-white border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
            title="Reset to an empty canvas"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={saveToJsonFile}
            className="px-3 py-2 text-xs font-semibold bg-primary text-light hover:bg-red-700"
            title="Save wireframe JSON"
          >
            Save
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={loadFromJsonFile}
      />
    </div>
  );
}

// Wrap with ReactFlowProvider to enable screenToFlowPosition
interface WireframeCanvasProps {
  gridVisible: boolean;
  appTitle: string;
  onHeaderChange?: (payload: { title: string }) => void;
  externalDashboardLoad?: {
    requestId: number;
    payload: unknown;
  } | null;
}

function WireframeCanvas({
  gridVisible,
  appTitle,
  onHeaderChange,
  externalDashboardLoad,
}: WireframeCanvasProps) {
  return (
    <ReactFlowProvider>
      <WireframeCanvasInner
        gridVisible={gridVisible}
        appTitle={appTitle}
        onHeaderChange={onHeaderChange}
        externalDashboardLoad={externalDashboardLoad}
      />
    </ReactFlowProvider>
  );
}

export default WireframeCanvas;
