export type TableColumnType = 'text' | 'number' | 'date' | 'datetime' | 'time' | 'currency' | 'boolean' | 'custom' | 'tag';
export type TableTagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
export type TableFilterType = 'select' | 'text' | 'number' | 'boolean' | 'date';

export interface TableFilterOption {
  label: string;
  value: any;
}

export interface TableFilterConfig {
  field: string;
  label: string;
  type?: TableFilterType;
  placeholder?: string;
  options?: TableFilterOption[];
}

export interface TableColumnConfig<T = any> {
  field: string;
  header: string;
  type?: TableColumnType;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  formatFn?: (value: any, row?: T) => string;
  alignCenter?: boolean;
  dateFormat?: 'short' | 'long' | 'dayOnly';
  tagSeverityFn?: (value: any, row?: T) => TableTagSeverity;
  filterable?: boolean;
  filterType?: TableFilterType;
  filterPlaceholder?: string;
  filterOptions?: TableFilterOption[];
}

export interface TableActionConfig<T = any> {
  field: string;
  label: string;
  icon?: string;
  severity?: TableTagSeverity;
  disabled?: (row: T) => boolean;
  visible?: (row: T) => boolean;
}

export interface TableState {
  first: number;
  rows: number;
  sortField?: string;
  sortOrder?: number;
  search?: string;
  filters?: Record<string, any>;
}
