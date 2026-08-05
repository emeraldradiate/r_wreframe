export type ComponentType = 
  | 'table' 
  | 'bar' 
  | 'line'
  | 'stackedArea'
  | 'expectedReality'
  | 'pie' 
  | 'gauge' 
  | 'slicer'
  | 'fieldChooser'
  | 'card'
  | 'matrix'
  | 'map'
  | 'chart';

export interface PowerBIComponent {
  id: string;
  type: ComponentType;
  label: string;
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  properties?: Record<string, any>;
}

export interface Wireframe {
  id: string;
  name: string;
  components: PowerBIComponent[];
  createdAt: string;
  updatedAt: string;
}
