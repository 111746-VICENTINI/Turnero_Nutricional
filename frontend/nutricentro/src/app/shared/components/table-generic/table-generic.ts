import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import {SelectModule} from 'primeng/select';
import {TableActionConfig, TableColumnConfig, TableFilterConfig} from './model/table-model';
import {TableState} from '../../../core/models/paginacion-general';
import {Menu, MenuModule} from 'primeng/menu';
import {DatePipe} from '../../pipes/date-pipe';
import {Popover} from 'primeng/popover';
import {InputNumber} from 'primeng/inputnumber';
import {DatePickerModule} from 'primeng/datepicker';

@Component({
  selector: 'app-table-generic',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    MenuModule,
    TooltipModule,
    SelectModule,
    Popover,
    InputNumber,
    DatePickerModule,
  ],
  templateUrl: './table-generic.html',
  styleUrl: './table-generic.css',
  providers: [ConfirmationService, MessageService, DatePipe],
})
export class TableGeneric<T extends Record<string, any> = Record<string, any>>
  implements OnInit, OnChanges
{
  @ViewChild('dataTable') table?: Table;
  @ViewChild('filterPopover') filterPopover?: Popover;

  @Input() data: T[] = [];
  @Input() columns: TableColumnConfig<T>[] = [];
  @Input() actions: TableActionConfig<T>[] = [];
  @Input() pageSize = 10;
  @Input() pageSizeOptions = [5, 10, 20, 50];
  @Input() columnsPerRow: 1 | 2 | 3 | 4 = 2;
  @Input() formWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'lg';
  @Input() fontSize: 'sm' | 'md' | 'lg' = 'md';
  @Input() globalFilterFields: string[] = [];
  @Input() showPagination = true;
  @Input() scrollable = false;
  @Input() loading = false;
  @Input() selection: T[] = [];
  @Input() showCheckbox = false;
  @Input() showGlobalFilter = true;
  @Input() globalFilterPlaceholder = 'Buscar...';
  @Input() emptyMessage = 'No hay datos disponibles.';
  @Input() dataKey = 'id';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() lazy = false;
  @Input() totalRecords = 0;
  @Input() filterConfigs: TableFilterConfig[] = [];

  @Output() onActionClick = new EventEmitter<{ action: TableActionConfig<T>; row: T }>();
  @Output() onDelete = new EventEmitter<T>();
  @Output() onEdit = new EventEmitter<T>();
  @Output() onView = new EventEmitter<T>();
  @Output() onHistory = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() tableStateChange = new EventEmitter<TableState>();

  menuItems: MenuItem[] = [];
  globalFilter = '';
  filteredData: T[] = [];
  first = 0;
  rows = 10;
  sortField: string | undefined;
  sortOrder: number | undefined;
  columnFilters: Record<string, any> = {};
  private lastEmittedLazyState?: string;

  constructor(private confirmationService: ConfirmationService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.rows = this.pageSize;
    this.updateTableData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pageSize']) {
      this.rows = this.pageSize;
    }

    if (changes['data']) {
      this.updateTableData();
    }
  }

  updateTableData(): void {
    if (this.lazy) {
      this.filteredData = [...this.data];
      return;
    }

    this.filteredData = this.applyLocalFilters(this.data);
    this.totalRecords = this.filteredData.length;
  }

  onGlobalFilter(event: Event): void {
    this.globalFilter = (event.target as HTMLInputElement).value;
    this.first = 0;

    if (this.lazy) {
      this.emitTableState({ first: 0, search: this.globalFilter });
      return;
    }

    this.updateTableData();
  }

  private applyLocalFilters(data: T[]): T[] {
    const searchValue = this.globalFilter.toLowerCase().trim();

    const fields = this.globalFilterFields.length
      ? this.globalFilterFields
      : this.columns.map((column) => column.field);

    return data.filter((row) =>
      this.matchesSearch(row, fields, searchValue) &&
      this.matchesFilters(row)
    );
  }

  private matchesSearch(row: T, fields: string[], searchValue: string): boolean {
    if (!searchValue) {
      return true;
    }

    return fields.some((field) =>
      String(this.getNestedProperty(row, field) ?? '')
        .toLowerCase()
        .includes(searchValue)
    );
  }

  private matchesFilters(row: T): boolean {
    return Object.entries(this.columnFilters).every(([field, filterValue]) => {
      if (filterValue === null || filterValue === undefined || filterValue === '') {
        return true;
      }

      const value = this.getNestedProperty(row, field);

      if (Array.isArray(value)) {
        return value.some((item) => this.valueMatchesFilter(item, filterValue));
      }

      return this.valueMatchesFilter(value, filterValue);
    });
  }

  private valueMatchesFilter(value: any, filterValue: any): boolean {
    if (value && typeof value === 'object') {
      return Object.values(value).some((nestedValue) => this.valueMatchesFilter(nestedValue, filterValue));
    }

    return String(value ?? '').toLowerCase().includes(String(filterValue).toLowerCase());
  }

  onTableStateChange(event: any): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.pageSize;

    this.sortField =
      typeof event.sortField === 'string'
        ? event.sortField
        : undefined;

    this.sortOrder = event.sortOrder;

    this.emitTableState({
      first: this.first,
      rows: this.rows,
      sortField: this.sortField,
      sortOrder: this.sortOrder
    });
  }

  private emitTableState(partial: Partial<TableState> = {}): void {
    const filters = Object.keys(partial.filters ?? {}).length
      ? partial.filters!
      : this.cleanFilters();

    const state: TableState = {
      first: partial.first ?? this.first,
      rows: partial.rows ?? this.rows,
      sortField: partial.sortField ?? this.sortField,
      sortOrder: partial.sortOrder ?? this.sortOrder,
      search: partial.search ?? this.globalFilter,
      filters
    };

    if (this.lazy) {
      const signature = this.tableStateSignature(state);
      if (signature === this.lastEmittedLazyState) {
        return;
      }
      this.lastEmittedLazyState = signature;
    }

    this.tableStateChange.emit(state);
  }

  private tableStateSignature(state: TableState): string {
    const sortedFilters = Object.keys(state.filters ?? {})
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = state.filters?.[key];
        return acc;
      }, {});

    return JSON.stringify({
      first: state.first,
      rows: state.rows,
      sortField: state.sortField ?? null,
      sortOrder: state.sortOrder ?? null,
      search: state.search ?? '',
      filters: sortedFilters
    });
  }

  private cleanFilters(): Record<string, any> {
    return Object.entries(this.columnFilters).reduce<Record<string, any>>((acc, [field, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[field] = value;
      }

      return acc;
    }, {});
  }

  onSelectionChange(selected: T[]): void {
    this.selection = selected;
    this.selectionChange.emit(this.selection);
  }

  performAction(action: TableActionConfig<T>, row: T): void {
    if (action.field === 'delete') {
      this.confirmDelete(row);
      return;
    }

    if (action.field === 'edit') {
      this.onEdit.emit(row);
      return;
    }

    if (action.field === 'view') {
      this.onView.emit(row);
      return;
    }

    if (action.field === 'history') {
      this.onHistory.emit(row);
      return;
    }

    this.onActionClick.emit({ action, row });
  }

  confirmDelete(row: T): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar este registro?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.onDelete.emit(row),
    });
  }

  formatValue(value: any, column: TableColumnConfig<T>, row?: T): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (column.formatFn) {
      return column.formatFn(value, row);
    }

    switch (column.type) {
      case 'date':
        return this.datePipe.transform(value, column.dateFormat ?? 'short');

      case 'number':
        return Number(value).toLocaleString('es-AR');

      case 'boolean':
        return value ? 'Activo' : 'Inactivo';

      default:
        return String(value);
    }
  }

  getNestedProperty(obj: T, path: string): any {
    return path.split('.').reduce<any>((value, key) => {
      if (value && typeof value === 'object' && key in value) {
        return value[key];
      }

      return undefined;
    }, obj);
  }

  isActionEnabled(action: TableActionConfig<T>, row: T): boolean {
    return action.disabled ? !action.disabled(row) : true;
  }

  isActionVisible(action: TableActionConfig<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  clear(): void {
    this.table?.clear();
    this.globalFilter = '';
    this.columnFilters = {};
    this.updateTableData();

    this.emitTableState({
      first: 0,
      rows: this.rows,
      search: '',
      filters: {}
    });
  }

  openFilterPanel(event: Event): void {
    this.filterPopover?.toggle(event);
  }

  onFilterValueChange(field: string, value: any): void {
    if (value === null || value === undefined || value === '') {
      delete this.columnFilters[field];
    } else {
      this.columnFilters[field] = value;
    }
  }

  applyFilters(): void {
    this.first = 0;

    if (this.lazy) {
      this.emitTableState({ first: 0, filters: this.cleanFilters() });
    } else {
      this.updateTableData();
    }

    this.filterPopover?.hide();
  }

  clearFilters(): void {
    this.columnFilters = {};
    this.applyFilters();
  }

  filtersActive(): boolean {
    return this.filtersCount() > 0;
  }

  filtersCount(): number {
    return Object.keys(this.cleanFilters()).length;
  }

  reset(): void {
    this.first = 0;
    this.globalFilter = '';
    this.columnFilters = {};
    this.sortField = undefined;
    this.sortOrder = undefined;
    this.updateTableData();

    if (this.lazy) {
      this.emitTableState({
        first: 0,
        rows: this.rows,
        search: '',
        filters: {}
      });
    }
  }

  openActionMenu(event: Event, row: T, menu: Menu): void {
    this.menuItems = this.actions
      .filter(action => this.isActionVisible(action, row))
      .map(action => ({
        label: action.label,
        icon: action.icon,
        disabled: !this.isActionEnabled(action, row),
        command: () => this.performAction(action, row)
      }));

    menu.toggle(event);
  }
}
