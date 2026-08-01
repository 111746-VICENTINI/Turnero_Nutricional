import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormGeneric } from '../../../../shared/components/form-generic/form-generic';
import { GenericFormField } from '../../../../shared/components/form-generic/model/form-model';
import { TableGeneric } from '../../../../shared/components/table-generic/table-generic';
import {
  TableActionConfig,
  TableColumnConfig,
} from '../../../../shared/components/table-generic/model/table-model';
import { ClinicalImportDialog } from '../../components/clinical-import-dialog/clinical-import-dialog';
import {
  ClinicalImportPreviewDTO,
  LaboratoryRequestDTO,
  LaboratoryResponseDTO,
  MedicalHistoryResponseDTO,
} from '../../models/history-clinical-model';
import { HistoryClinicalService } from '../../services/history-clinical-service';

@Component({
  selector: 'app-tab-laboratory',
  imports: [CommonModule, ButtonModule, DialogModule, FormGeneric, TableGeneric, ClinicalImportDialog],
  templateUrl: './tab-laboratory.html',
  styleUrl: './tab-laboratory.css',
})
export class TabLaboratory {
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Output() saved = new EventEmitter<void>();

  private historyService = inject(HistoryClinicalService);
  private messageService = inject(MessageService);

  form: LaboratoryRequestDTO = this.emptyForm();
  selected?: LaboratoryResponseDTO;
  detailSelected?: LaboratoryResponseDTO;
  dialogVisible = false;
  detailDialogVisible = false;
  importDialogVisible = false;
  importPreview?: ClinicalImportPreviewDTO;
  importForm: LaboratoryRequestDTO = this.emptyForm();
  importLoading = false;
  importSaving = false;
  saving = false;

  fields: GenericFormField[] = [
    { name: 'date', label: 'Fecha', type: 'date', required: true, allowFuture: true },
    { name: 'glucose', label: 'Glucosa', type: 'number', min: 0 },
    { name: 'cholesterol', label: 'Colesterol', type: 'number', min: 0 },
    { name: 'hdl', label: 'HDL', type: 'number', min: 0 },
    { name: 'ldl', label: 'LDL', type: 'number', min: 0 },
    { name: 'triglycerides', label: 'Trigliceridos', type: 'number', min: 0 },
    { name: 'vitaminD', label: 'Vitamina D', type: 'number', min: 0 },
    { name: 'vitaminB12', label: 'Vitamina B12', type: 'number', min: 0 },
    { name: 'iron', label: 'Hierro', type: 'number', min: 0 },
    { name: 'ferritin', label: 'Ferritina', type: 'number', min: 0 },
    { name: 'insulin', label: 'Insulina', type: 'number', min: 0 },
    { name: 'hba1c', label: 'HbA1c', type: 'number', min: 0 },
    { name: 'pcr', label: 'PCR', type: 'number', min: 0 },
    { name: 'ast', label: 'AST', type: 'number', min: 0 },
    { name: 'alt', label: 'ALT', type: 'number', min: 0 },
    { name: 'tsgo', label: 'TSGO', type: 'number', min: 0 },
    { name: 'tsgp', label: 'TSGP', type: 'number', min: 0 },
    { name: 'sodium', label: 'Sodio', type: 'number', min: 0 },
    { name: 'potassium', label: 'Potasio', type: 'number', min: 0 },
    { name: 'calcium', label: 'Calcio', type: 'number', min: 0 },
    { name: 'magnesium', label: 'Magnesio', type: 'number', min: 0 },
    { name: 'phosphorus', label: 'Fosforo', type: 'number', min: 0 },
    { name: 'proteins', label: 'Proteinas', type: 'number', min: 0 },
    { name: 'albumin', label: 'Albumina', type: 'number', min: 0 },
    { name: 'cortisol', label: 'Cortisol', type: 'number', min: 0 },
    { name: 'testosterone', label: 'Testosterona', type: 'number', min: 0 },
    { name: 'estradiol', label: 'Estradiol', type: 'number', min: 0 },
    { name: 'fsh', label: 'FSH', type: 'number', min: 0 },
    { name: 'lh', label: 'LH', type: 'number', min: 0 },
    { name: 't3', label: 'T3', type: 'number', min: 0 },
    { name: 'tsh', label: 'TSH', type: 'number', min: 0 },
    { name: 't4', label: 'T4', type: 'number', min: 0 },
    { name: 'hemoglobin', label: 'Hemoglobina', type: 'number', min: 0 },
    {
      name: 'customParameters',
      label: 'Parámetros personalizados',
      type: 'textarea',
      rows: 3,
      colSpan: 3,
      placeholder: 'Nombre: valor / unidad',
    },
    { name: 'observations', label: 'Observaciones', type: 'textarea', rows: 3, colSpan: 3 },
  ];

  columns: TableColumnConfig<LaboratoryResponseDTO>[] = [
    { field: 'date', header: 'Fecha', type: 'date', width: '8rem' },
    { field: 'glucose', header: 'Glucosa', type: 'number' },
    { field: 'cholesterol', header: 'Colesterol', type: 'number' },
    { field: 'hdl', header: 'HDL', type: 'number' },
    { field: 'ldl', header: 'LDL', type: 'number' },
    { field: 'triglycerides', header: 'Trigliceridos', type: 'number' },
    { field: 'tsh', header: 'TSH', type: 'number' },
    { field: 'hemoglobin', header: 'Hemoglobina', type: 'number' },
  ];

  actions: TableActionConfig<LaboratoryResponseDTO>[] = [
    { field: 'detail', label: 'Ver detalle', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

  get latest(): LaboratoryResponseDTO | undefined {
    return this.history.laboratories?.[0];
  }

  get highlights() {
    const lab = this.latest;
    return [
      { label: 'Glucosa', value: lab?.glucose, unit: 'mg/dL', status: this.rangeStatus(lab?.glucose, 70, 99) },
      { label: 'Colesterol Total', value: lab?.cholesterol, unit: 'mg/dL', status: this.rangeStatus(lab?.cholesterol, 120, 199) },
      { label: 'HDL', value: lab?.hdl, unit: 'mg/dL', status: this.minimumStatus(lab?.hdl, 40) },
      { label: 'LDL', value: lab?.ldl, unit: 'mg/dL', status: this.rangeStatus(lab?.ldl, 0, 100) },
      { label: 'Trigliceridos', value: lab?.triglycerides, unit: 'mg/dL', status: this.rangeStatus(lab?.triglycerides, 0, 149) },
      { label: 'Vitamina D', value: lab?.vitaminD, unit: 'ng/mL', status: this.rangeStatus(lab?.vitaminD, 30, 100) },
      { label: 'Vitamina B12', value: lab?.vitaminB12, unit: 'pg/mL', status: this.rangeStatus(lab?.vitaminB12, 200, 900) },
      { label: 'Hierro', value: lab?.iron, unit: 'µg/dL', status: this.rangeStatus(lab?.iron, 60, 170) },
      { label: 'Ferritina', value: lab?.ferritin, unit: 'ng/mL', status: this.rangeStatus(lab?.ferritin, 30, 300) },
      { label: 'Insulina', value: lab?.insulin, unit: 'µIU/mL', status: this.rangeStatus(lab?.insulin, 2, 25) },
      { label: 'HbA1c', value: lab?.hba1c, unit: '%', status: this.rangeStatus(lab?.hba1c, 4, 5.6) },
      { label: 'PCR', value: lab?.pcr, unit: 'mg/L', status: this.rangeStatus(lab?.pcr, 0, 3) },
      { label: 'AST (TGO)', value: lab?.ast ?? lab?.tsgo, unit: 'U/L', status: this.rangeStatus(lab?.ast ?? lab?.tsgo, 10, 40) },
      { label: 'ALT (TGP)', value: lab?.alt ?? lab?.tsgp, unit: 'U/L', status: this.rangeStatus(lab?.alt ?? lab?.tsgp, 7, 56) },
      { label: 'Sodio', value: lab?.sodium, unit: 'mmol/L', status: this.rangeStatus(lab?.sodium, 135, 145) },
      { label: 'Potasio', value: lab?.potassium, unit: 'mmol/L', status: this.rangeStatus(lab?.potassium, 3.5, 5.0) },
      { label: 'Calcio', value: lab?.calcium, unit: 'mg/dL', status: this.rangeStatus(lab?.calcium, 8.5, 10.5) },
      { label: 'Magnesio', value: lab?.magnesium, unit: 'mg/dL', status: this.rangeStatus(lab?.magnesium, 1.7, 2.2) },
      { label: 'Fosforo', value: lab?.phosphorus, unit: 'mg/dL', status: this.rangeStatus(lab?.phosphorus, 2.5, 4.5) },
      { label: 'Proteinas Totales', value: lab?.proteins, unit: 'g/dL', status: this.rangeStatus(lab?.proteins, 6.0, 8.3) },
      { label: 'Albumina', value: lab?.albumin, unit: 'g/dL', status: this.rangeStatus(lab?.albumin, 3.5, 5.0) },
      { label: 'Cortisol', value: lab?.cortisol, unit: 'µg/dL', status: this.rangeStatus(lab?.cortisol, 5, 25) },
      { label: 'Testosterona', value: lab?.testosterone, unit: 'ng/dL', status: this.rangeStatus(lab?.testosterone, 300, 1000) },
      { label: 'Estradiol', value: lab?.estradiol, unit: 'pg/mL', status: this.rangeStatus(lab?.estradiol, 30, 400) },
      { label: 'FSH', value: lab?.fsh, unit: 'mIU/mL', status: this.rangeStatus(lab?.fsh, 1.5, 12.4) },
      { label: 'LH', value: lab?.lh, unit: 'mIU/mL', status: this.rangeStatus(lab?.lh, 1.7, 8.6) },
      { label: 'T3', value: lab?.t3, unit: 'pg/mL', status: this.rangeStatus(lab?.t3, 2.3, 4.2) },
      { label: 'TSH', value: lab?.tsh, unit: 'mIU/L', status: this.rangeStatus(lab?.tsh, 0.4, 4.0) },
      { label: 'T4 Libre', value: lab?.t4, unit: 'ng/dL', status: this.rangeStatus(lab?.t4, 0.8, 1.8) },
      { label: 'Hemoglobina', value: lab?.hemoglobin, unit: 'g/dL', status: this.rangeStatus(lab?.hemoglobin, 12, 17) },
    ];
  }

  get detailGroups() {
    const lab = this.detailSelected;
    if (!lab) {
      return [];
    }

    return [
      {
        title: 'Metabolico',
        items: [
          ['Fecha', lab.date ? new Date(lab.date).toLocaleDateString('es-AR') : '-'],
          ['Glucosa', this.valueWithUnit(lab.glucose, 'mg/dl')],
          ['Insulina', this.valueWithUnit(lab.insulin, '')],
          ['HbA1c', this.valueWithUnit(lab.hba1c, '%')],
          ['PCR', this.valueWithUnit(lab.pcr, '')],
          ['Cortisol', this.valueWithUnit(lab.cortisol, '')],
        ],
      },
      {
        title: 'Lipidico y vitaminas',
        items: [
          ['Colesterol', this.valueWithUnit(lab.cholesterol, 'mg/dl')],
          ['HDL', this.valueWithUnit(lab.hdl, 'mg/dl')],
          ['LDL', this.valueWithUnit(lab.ldl, 'mg/dl')],
          ['Trigliceridos', this.valueWithUnit(lab.triglycerides, 'mg/dl')],
          ['Vitamina D', this.valueWithUnit(lab.vitaminD, '')],
          ['Vitamina B12', this.valueWithUnit(lab.vitaminB12, '')],
          ['Hierro', this.valueWithUnit(lab.iron, '')],
          ['Ferritina', this.valueWithUnit(lab.ferritin, '')],
        ],
      },
      {
        title: 'Hepatico, renal y electrolitos',
        items: [
          ['AST', this.valueWithUnit(lab.ast, '')],
          ['ALT', this.valueWithUnit(lab.alt, '')],
          ['TSGO', this.valueWithUnit(lab.tsgo, '')],
          ['TSGP', this.valueWithUnit(lab.tsgp, '')],
          ['Sodio', this.valueWithUnit(lab.sodium, '')],
          ['Potasio', this.valueWithUnit(lab.potassium, '')],
          ['Calcio', this.valueWithUnit(lab.calcium, '')],
          ['Magnesio', this.valueWithUnit(lab.magnesium, '')],
          ['Fosforo', this.valueWithUnit(lab.phosphorus, '')],
          ['Proteinas', this.valueWithUnit(lab.proteins, '')],
          ['Albumina', this.valueWithUnit(lab.albumin, '')],
        ],
      },
      {
        title: 'Hormonal y observaciones',
        items: [
          ['TSH', this.valueWithUnit(lab.tsh, '')],
          ['T3', this.valueWithUnit(lab.t3, '')],
          ['T4', this.valueWithUnit(lab.t4, '')],
          ['Testosterona', this.valueWithUnit(lab.testosterone, '')],
          ['Estradiol', this.valueWithUnit(lab.estradiol, '')],
          ['FSH', this.valueWithUnit(lab.fsh, '')],
          ['LH', this.valueWithUnit(lab.lh, '')],
          ['Hemoglobina', this.valueWithUnit(lab.hemoglobin, 'g/dl')],
          ['Personalizados', lab.customParameters],
          ['Observaciones', lab.observations],
        ],
      },
    ];
  }

  openCreate(): void {
    this.selected = undefined;
    this.form = this.emptyForm();
    this.dialogVisible = true;
  }

  openImport(): void {
    this.importDialogVisible = true;
    this.importPreview = undefined;
    this.importForm = this.emptyForm();
  }

  closeImport(): void {
    if (this.importLoading || this.importSaving) {
      return;
    }
    this.importDialogVisible = false;
    this.importPreview = undefined;
    this.importForm = this.emptyForm();
  }

  clearImportPreview(): void {
    this.importPreview = undefined;
    this.importForm = this.emptyForm();
  }

  previewImport(file: File): void {
    this.importLoading = true;
    this.historyService.previewLaboratoryImport(this.history.id, file).subscribe({
      next: (preview) => {
        this.importLoading = false;
        this.importPreview = preview;
        this.importForm = {
          ...this.emptyForm(),
          ...(preview.laboratoryDraft ?? {}),
        };
      },
      error: () => {
        this.importLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo importar',
          detail: 'El archivo no pudo interpretarse correctamente.',
        });
      },
    });
  }

  openEdit(row: LaboratoryResponseDTO): void {
    this.selected = row;
    this.form = { ...row };
    this.dialogVisible = true;
  }

  openDetail(row: LaboratoryResponseDTO): void {
    this.detailSelected = row;
    this.detailDialogVisible = true;
  }

  closeDetail(): void {
    this.detailDialogVisible = false;
    this.detailSelected = undefined;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.selected = undefined;
    this.form = this.emptyForm();
  }

  save(values: Record<string, any>): void {
    const request = values as LaboratoryRequestDTO;
    const editing = !!this.selected;
    const operation = this.selected
      ? this.historyService.updateLaboratory(this.selected.id, request)
      : this.historyService.addLaboratory(this.history.id, request);

    this.saving = true;
    operation.subscribe({
      next: () => {
        this.saving = false;
        this.closeDialog();
        this.messageService.add({
          severity: 'success',
          summary: editing ? 'Laboratorio actualizado' : 'Laboratorio agregado',
          detail: 'El analisis quedo registrado en la historia.',
        });
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: 'Revisa los valores ingresados.',
        });
      },
    });
  }

  saveImported(values: Record<string, any>): void {
    this.importSaving = true;
    this.historyService.confirmLaboratoryImport(this.history.id, values as LaboratoryRequestDTO).subscribe({
      next: () => {
        this.importSaving = false;
        this.closeImport();
        this.messageService.add({
          severity: 'success',
          summary: 'Importacion confirmada',
          detail: 'El analisis quedo registrado en la historia.',
        });
        this.saved.emit();
      },
      error: () => {
        this.importSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: 'Revisa los valores importados antes de confirmar.',
        });
      },
    });
  }

  delete(row: LaboratoryResponseDTO): void {
    this.historyService.deleteLaboratory(row.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Laboratorio eliminado',
          detail: 'El registro fue quitado de la historia.',
        });
        this.saved.emit();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo eliminar',
          detail: 'Intenta nuevamente en unos segundos.',
        });
      },
    });
  }

  private emptyForm(): LaboratoryRequestDTO {
    return {
      date: new Date().toISOString().slice(0, 10),
    };
  }

  private rangeStatus(value: number | null | undefined, min: number, max: number): string {
    if (value === null || value === undefined) {
      return 'Sin dato';
    }

    if (value < min) {
      return 'Bajo';
    }

    if (value > max) {
      return 'Alto';
    }

    return 'Normal';
  }

  private minimumStatus(value: number | null | undefined, min: number): string {
    if (value === null || value === undefined) {
      return 'Sin dato';
    }

    return value < min ? 'Bajo' : 'Normal';
  }

  private valueWithUnit(value: number | string | null | undefined, unit: string): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return `${value}${unit ? ` ${unit}` : ''}`;
  }
}
