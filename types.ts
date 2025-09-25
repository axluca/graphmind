export interface Node {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

export interface Link {
  source: string;
  target: string;
  label:string;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface SavedGraph {
  id?: number;
  name: string;
  createdAt: Date;
  graphData: GraphData;
}

export interface SavedGraphMeta {
  id: number;
  name: string;
  createdAt: Date;
}

export interface PortkeyConfig {
  apiKey: string;
  virtualKey: string;
  model: string;
  baseURL?: string;
}

export type Theme = 'dark' | 'light';