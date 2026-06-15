export type TableColumnType = 'text' | 'number' | 'date' | 'boolean' | 'custom';

export type TableTagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface TableColumnConfig<T = any> {
  field: string;
  header: string;
  type?: TableColumnType;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  formatFn?: (value: any, row?: T) => string;
  alignCenter?: boolean;
  tagSeverityFn?: (value: any, row?: T) => TableTagSeverity;
}

export interface TableActionConfig<T = any> {
  field: string;
  label: string;
  icon?: string;
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'help' | 'secondary';
  disabled?: (row: T) => boolean;
  visible?: (row: T) => boolean;
}

export interface TableState {
  first: number;
  rows: number;
  sortField?: string;
  sortOrder?: number;
}
