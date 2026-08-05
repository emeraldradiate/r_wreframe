import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
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
  NodeProps,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import PowerBINode from './nodes/PowerBINode';

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

const GRID_SIZE = 20;
const PRINT_ZOOM_MODIFIER = 0.96;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;

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

// Helper function to get default size based on component type
const getDefaultSize = (componentType: string) => {
  switch (componentType) {
    case 'card':
      return { width: 260, height: 200 };
    case 'gauge':
      return { width: 220, height: 220 };
    case 'slicer':
      return { width: 1600, height: 90 };
    case 'fieldChooser':
      return { width: 260, height: 520 };
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
        seriesColors: ['#8B0000', '#FF8C00', '#FFF275', '#2E8B57', '#003A8C', '#7B3FB3', '#FFB6C1'],
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
        cardLayout: 'periodKpi',
        value: '$42.5K',
        ytdPriorYear: '$39.8K',
        cardPriorActualLabel: 'Prior Year Total',
        cardBudgetLabel: 'Budget',
        cardPriorLabel: 'YTD YoY',
        budgetVariance: { dollarValue: '+$2.7K', percentage: '6.8%' },
        priorVariance: { dollarValue: '+$2.7K', percentage: '6.8%' },
      };
    case 'slicer':
      return {
        ...baseData,
        slicerLayout: 'filterBar',
        hideHeader: true,
        slicerFilters: [
          { type: 'dateRange', label: 'Date Range', startValue: '07/01/2026', endValue: '07/10/2026' },
          {
            type: 'dropdown',
            label: 'In the',
            value: 'Last 7 days',
            panel: 'bubble',
            options: ['Last 3 days', 'Last 7 days', 'Last 30 days', 'Last 60 days', 'Last 90 days'],
          },
          {
            type: 'dropdown',
            label: 'Customer Type',
            value: 'All',
            panel: 'checklist',
            options: ['Retail', 'DTC'],
          },
          {
            type: 'dropdown',
            label: 'Partner',
            value: 'All',
            panel: 'checklist',
            options: [
              'Ace Hardware - Wholesale',
              'Atwoods',
              'Emery Jensen',
              'Independents',
              'Lv Distributes',
              "Murdoch's",
            ],
          },
          {
            type: 'dropdown',
            label: 'Store Tier',
            value: 'All',
            panel: 'bubble',
            options: ['All', 'Authorized', 'Diamond'],
          },
          {
            type: 'dropdown',
            label: 'Chain',
            value: 'All',
            panel: 'checklist',
            options: [
              '66 Ace Hardware',
              'A Few Cool Hardware Stores',
              'Ace Of Commerce',
              'Ace Retail Group',
              'Agrishop',
              'Appliance',
            ],
          },
          {
            type: 'dropdown',
            label: 'Group',
            value: 'All',
            panel: 'checklist',
            options: ['Farm', 'Ace', 'Independents', 'Sporting'],
          },
          {
            type: 'dropdown',
            label: 'Contains',
            value: 'None',
            panel: 'checklist',
            options: ['Make-Right', 'Complimentary'],
            selected: [],
          },
          {
            type: 'dropdown',
            label: 'Product Category',
            value: 'All',
            panel: 'checklist',
            options: ['Grills', 'Accessories', 'Rubs & Sauces', 'Pellets', 'Other'],
          },
        ],
      };
    case 'fieldChooser':
      return {
        ...baseData,
        label: 'Choose your field',
        hideHeader: true,
        fieldChooserFields: [
          { label: 'Select all', checked: false },
          { label: 'Sales Date', checked: true },
          { label: 'Ship Date', checked: true },
          { label: 'Shipping Method', checked: true },
          { label: 'Sales Channel', checked: true },
          { label: 'Shipping Location', checked: true },
          { label: 'Shipping State', checked: false },
          { label: 'Transaction Status', checked: true },
          { label: 'Sales Order', checked: true },
          { label: 'Sales Order Internal ID', checked: false },
          { label: 'Customer Name', checked: false },
          { label: 'Item Display Name', checked: true },
          { label: 'Item Code', checked: false },
          { label: 'Qty', checked: true },
          { label: 'Terms', checked: false },
          { label: 'Age Pending Notes', checked: false },
          { label: 'Age Pending Owner', checked: false },
          { label: 'Order Notes', checked: false },
          { label: 'Created By', checked: false },
          { label: 'P/O Number', checked: false },
          { label: 'Reason for Hold', checked: false },
          { label: 'Partner Name', checked: false },
          { label: 'Net Amount', checked: true },
          { label: 'Credit Number', checked: false },
        ],
      };
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
  matrixScrollable?: boolean;
  zoomResetRequestId?: number;
  watermarkSources?: {
    left: string;
    right: string;
  };
  onHeaderChange?: (payload: { title: string }) => void;
  externalDashboardLoad?: {
    requestId: number;
    payload: unknown;
    defaultZoom?: number;
    defaultViewport?: {
      x: number;
      y: number;
    };
  } | null;
}

function WireframeCanvasInner({
  gridVisible,
  appTitle,
  matrixScrollable = false,
  zoomResetRequestId = 0,
  watermarkSources,
  onHeaderChange,
  externalDashboardLoad,
}: WireframeCanvasInnerProps) {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition, flowToScreenPosition, getZoom, getViewport, setViewport } = useReactFlow();
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const printViewportRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const appTitleRef = useRef(appTitle);
  const onHeaderChangeRef = useRef(onHeaderChange);

  useEffect(() => {
    appTitleRef.current = appTitle;
  }, [appTitle]);

  useEffect(() => {
    onHeaderChangeRef.current = onHeaderChange;
  }, [onHeaderChange]);

  useEffect(() => {
    const viewport = getViewport();
    setZoomLevel(getZoom());
    setCameraPosition({ x: viewport.x, y: viewport.y });
  }, [getViewport, getZoom]);

  useEffect(() => {
    const wrapper = reactFlowWrapper.current;
    if (!wrapper) {
      return undefined;
    }

    const rightPanState = {
      active: false,
      startX: 0,
      startY: 0,
      viewportX: 0,
      viewportY: 0,
    };

    const endRightPan = () => {
      if (!rightPanState.active) {
        return;
      }

      rightPanState.active = false;
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };

    const isEventInsideWrapper = (event: Event) => {
      const target = event.target;
      return target instanceof Element && wrapper.contains(target);
    };

    const beginRightPan = (clientX: number, clientY: number) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const viewport = getViewport();
      rightPanState.active = true;
      rightPanState.startX = clientX;
      rightPanState.startY = clientY;
      rightPanState.viewportX = viewport.x;
      rightPanState.viewportY = viewport.y;

      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 2 || !isEventInsideWrapper(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      beginRightPan(event.clientX, event.clientY);
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 2 || !isEventInsideWrapper(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (!rightPanState.active) {
        beginRightPan(event.clientX, event.clientY);
      }

    };

    const updatePanPosition = (clientX: number, clientY: number) => {
      const deltaX = clientX - rightPanState.startX;
      const deltaY = clientY - rightPanState.startY;
      const nextX = rightPanState.viewportX + deltaX;
      const nextY = rightPanState.viewportY + deltaY;
      const zoom = getViewport().zoom;

      setViewport({ x: nextX, y: nextY, zoom }, { duration: 0 });
      setZoomLevel(zoom);
      setCameraPosition({ x: nextX, y: nextY });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!rightPanState.active) {
        return;
      }

      event.preventDefault();
      updatePanPosition(event.clientX, event.clientY);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!rightPanState.active) {
        return;
      }

      event.preventDefault();
      updatePanPosition(event.clientX, event.clientY);
    };

    const onPointerUp = () => {
      endRightPan();
    };

    const onContextMenu = (event: Event) => {
      event.preventDefault();
    };

    const captureListenerOptions: AddEventListenerOptions = { capture: true };

    wrapper.addEventListener('pointerdown', onPointerDown, captureListenerOptions);
    wrapper.addEventListener('mousedown', onMouseDown, captureListenerOptions);
    wrapper.addEventListener('contextmenu', onContextMenu, captureListenerOptions);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      wrapper.removeEventListener('pointerdown', onPointerDown, captureListenerOptions);
      wrapper.removeEventListener('mousedown', onMouseDown, captureListenerOptions);
      wrapper.removeEventListener('contextmenu', onContextMenu, captureListenerOptions);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      endRightPan();
    };
  }, [getViewport, setViewport]);

  useEffect(() => {
    const handleBeforePrint = () => {
      if (printViewportRef.current) {
        return;
      }

      const currentViewport = getViewport();
      printViewportRef.current = currentViewport;

      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentViewport.zoom * PRINT_ZOOM_MODIFIER));
      const nextX = currentViewport.x;
      const nextY = currentViewport.y;

      setViewport({ x: nextX, y: nextY, zoom: nextZoom }, { duration: 0 });
      setZoomLevel(nextZoom);
      setCameraPosition({ x: nextX, y: nextY });
    };

    const handleAfterPrint = () => {
      if (!printViewportRef.current) {
        return;
      }

      const originalViewport = printViewportRef.current;
      printViewportRef.current = null;
      setViewport(originalViewport, { duration: 0 });
      setZoomLevel(originalViewport.zoom);
      setCameraPosition({ x: originalViewport.x, y: originalViewport.y });
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [getViewport, setViewport]);

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

  const applyDefaultView = useCallback((zoom?: number, viewport?: { x: number; y: number }) => {
    if (typeof zoom !== 'number' || !Number.isFinite(zoom)) {
      return;
    }

    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const currentViewport = getViewport();
    const nextX = typeof viewport?.x === 'number' && Number.isFinite(viewport.x)
      ? viewport.x
      : currentViewport.x;
    const nextY = typeof viewport?.y === 'number' && Number.isFinite(viewport.y)
      ? viewport.y
      : currentViewport.y;

    window.requestAnimationFrame(() => {
      setViewport({ x: nextX, y: nextY, zoom: clampedZoom }, { duration: 0 });
      setZoomLevel(clampedZoom);
      setCameraPosition({ x: nextX, y: nextY });
    });
  }, [getViewport, setViewport]);

  useEffect(() => {
    if (!zoomResetRequestId) {
      return;
    }

    applyDefaultView(1);
  }, [zoomResetRequestId, applyDefaultView]);

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
    applyDefaultView(externalDashboardLoad.defaultZoom, externalDashboardLoad.defaultViewport);
  }, [externalDashboardLoad, setNodes, setEdges, syncNodeCounter, applyDefaultView]);

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

  const nodeTypes = useMemo(
    () => ({
      powerbi: (props: NodeProps) => (
        <PowerBINode {...props} matrixScrollable={matrixScrollable} />
      ),
    }),
    [matrixScrollable],
  );

  return (
    <div className="relative h-full w-full">
      <div className="relative h-full w-full bg-[#f7f7f2]" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
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
          onMove={(_, viewport) => {
            setZoomLevel(viewport.zoom);
            setCameraPosition({ x: viewport.x, y: viewport.y });
          }}
          noDragClassName="rf-nodrag"
          noPanClassName="rf-nopan"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          multiSelectionKeyCode="Shift"
          className="wireframe-react-flow"
          style={{ backgroundColor: 'transparent' }}
        >
          {watermarkSources && (
            <div className="canvas-watermark-layer">
              <div className="canvas-watermark canvas-watermark-left">
                <img
                  src={watermarkSources.left}
                  alt=""
                  aria-hidden="true"
                  className="h-24 w-48 object-contain"
                />
              </div>
              <div className="canvas-watermark canvas-watermark-right">
                <img
                  src={watermarkSources.right}
                  alt=""
                  aria-hidden="true"
                  className="h-24 w-24 object-contain"
                />
              </div>
            </div>
          )}
          {gridVisible && <Background variant={BackgroundVariant.Lines} gap={20} size={0.12} color="#cdcdcd" />}
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
        <div className="absolute left-4 bottom-4 z-50">
          <div className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 text-gray-700 leading-5">
            <div>Zoom {Math.round(zoomLevel * 100)}%</div>
            <div>Camera x: {Math.round(cameraPosition.x)}, y: {Math.round(cameraPosition.y)}</div>
          </div>
        </div>
      )}

      {gridVisible && (
        <div className="absolute right-4 bottom-4 z-50 flex items-center gap-2">
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
  matrixScrollable?: boolean;
  zoomResetRequestId?: number;
  watermarkSources?: {
    left: string;
    right: string;
  };
  onHeaderChange?: (payload: { title: string }) => void;
  externalDashboardLoad?: {
    requestId: number;
    payload: unknown;
    defaultZoom?: number;
    defaultViewport?: {
      x: number;
      y: number;
    };
  } | null;
}

function WireframeCanvas({
  gridVisible,
  appTitle,
  matrixScrollable = false,
  zoomResetRequestId = 0,
  watermarkSources,
  onHeaderChange,
  externalDashboardLoad,
}: WireframeCanvasProps) {
  return (
    <ReactFlowProvider>
      <WireframeCanvasInner
        gridVisible={gridVisible}
        appTitle={appTitle}
        matrixScrollable={matrixScrollable}
        zoomResetRequestId={zoomResetRequestId}
        watermarkSources={watermarkSources}
        onHeaderChange={onHeaderChange}
        externalDashboardLoad={externalDashboardLoad}
      />
    </ReactFlowProvider>
  );
}

export default WireframeCanvas;
