export interface Operation {
  type: 'read' | 'create' | 'update' | 'delete' | 'unknown';
  table: string;
  key?: any;
  obj?: any;
  modifications?: Record<string, unknown>;
  timestamp: Date;
  duration?: number;
  keys?: any[];
  values?: any[];
  queryDetails?: any;
  results: any;
}
