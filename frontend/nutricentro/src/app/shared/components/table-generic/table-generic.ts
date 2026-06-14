import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TableActionConfig, TableColumnConfig, TableState } from './model/table-model';

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
    TooltipModule,
  ],
  templateUrl: './table-generic.html',
  styleUrl: './table-generic.css',
  providers: [ConfirmationService, MessageService],
})
export class TableGeneric<T extends Record<string, any> = Record<string, any>>
  implements OnInit, OnChanges
{
  @ViewChild('dataTable') table?: Table;

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
  @Input() emptyMessage = 'No hay datos disponibles.';
  @Input() dataKey = 'id';
  @Input() title = '';
  @Input() subtitle = '';

  @Output() onActionClick = new EventEmitter<{ action: TableActionConfig<T>; row: T }>();
  @Output() onDelete = new EventEmitter<T>();
  @Output() onEdit = new EventEmitter<T>();
  @Output() onView = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() tableStateChange = new EventEmitter<TableState>();

  globalFilter = '';
  filteredData: T[] = [];
  first = 0;
  rows = 10;
  totalRecords = 0;
  sortField: string | undefined;
  sortOrder: number | undefined;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.rows = this.pageSize;
    this.updateTableData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageSize']) {
      this.rows = this.pageSize;
      this.updateTableData();
    }
  }

  updateTableData(): void {
    this.filteredData = [...this.data];
    this.totalRecords = this.filteredData.length;
  }

  onGlobalFilter(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase().trim();

    if (!searchValue) {
      this.filteredData = [...this.data];
      this.totalRecords = this.filteredData.length;
      this.first = 0;
      return;
    }

    const fields = this.globalFilterFields.length
      ? this.globalFilterFields
      : this.columns.map((column) => column.field);

    this.filteredData = this.data.filter((row) =>
      fields.some((field) =>
        String(this.getNestedProperty(row, field) ?? '')
          .toLowerCase()
          .includes(searchValue)
      )
    );

    this.totalRecords = this.filteredData.length;
    this.first = 0;
  }

  onTableStateChange(event: any): void {
    this.first = event.first || 0;
    this.rows = event.rows || this.pageSize;
    this.sortField = event.sortField;
    this.sortOrder = event.sortOrder;

    this.tableStateChange.emit({
      first: this.first,
      rows: this.rows,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
    });
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

  formatValue(value: any, type: string, formatFn?: (value: any, row?: T) => string, row?: T): string {
    if (value === null || value === undefined || value === '') return '-';

    if (formatFn) {
      return formatFn(value, row);
    }

    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('es-AR');
      case 'number':
        return Number(value).toLocaleString('es-AR');
      case 'boolean':
        return value ? 'Sí' : 'No';
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
    this.filteredData = [...this.data];
    this.totalRecords = this.filteredData.length;
  }

  reset(): void {
    this.first = 0;
    this.globalFilter = '';
    this.sortField = undefined;
    this.sortOrder = undefined;
    this.filteredData = [...this.data];
    this.totalRecords = this.filteredData.length;
  }
}
