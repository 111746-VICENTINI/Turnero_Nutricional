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
import {
  AntropometryRequestDTO,
  AntropometryResponseDTO,
  MedicalHistoryResponseDTO,
} from '../../models/history-clinical-model';
import { HistoryClinicalService } from '../../services/history-clinical-service';

type AntropometryFormValue = AntropometryRequestDTO & { rawMeasurementsText?: string | null };

@Component({
  selector: 'app-tab-anthropometry',
  imports: [CommonModule, ButtonModule, DialogModule, FormGeneric, TableGeneric],
  templateUrl: './tab-anthropometry.html',
  styleUrl: './tab-anthropometry.css',
})
export class TabAnthropometry {
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Output() saved = new EventEmitter<void>();

  private historyService = inject(HistoryClinicalService);
  private messageService = inject(MessageService);

  form: AntropometryFormValue = this.emptyForm();
  selected?: AntropometryResponseDTO;
  detailSelected?: AntropometryResponseDTO;
  dialogVisible = false;
  detailDialogVisible = false;
  saving = false;

  private readonly editableFields: GenericFormField[] = [
    { name: 'date', label: 'Fecha', type: 'date', required: true, allowFuture: true },
    { name: 'professionalName', label: 'Profesional', type: 'text' },
    { name: 'source', label: 'Origen', type: 'select',
      options: [
        { label: 'Manual', value: 'MANUAL' },
        { label: 'AntroSport', value: 'ANTROSPORT' },
        { label: 'Importado PDF', value: 'IMPORTADO_PDF' }
      ],
    },
    { name: 'weight', label: 'Peso (kg)', type: 'number', min: 0 },
    { name: 'height', label: 'Altura (cm)', type: 'number', min: 0 },
    { name: 'sittingHeight', label: 'Talla sentado', type: 'number', min: 0 },
    { name: 'anthropometricAge', label: 'Edad antropometrica', type: 'number', min: 0 },
    { name: 'anthropometricGoal', label: 'Objetivo antropometrico', type: 'text' },
    { name: 'headCircumference', label: 'Cabeza', type: 'number', min: 0 },
    { name: 'relaxedArmCircumference', label: 'Brazo relajado', type: 'number', min: 0 },
    { name: 'flexedArmCircumference', label: 'Brazo flexionado', type: 'number', min: 0 },
    { name: 'forearmCircumference', label: 'Antebrazo', type: 'number', min: 0 },
    { name: 'thoraxCircumference', label: 'Torax', type: 'number', min: 0 },
    { name: 'waist', label: 'Cintura (cm)', type: 'number', min: 0 },
    { name: 'umbilicalWaist', label: 'Onfalico', type: 'number', min: 0 },
    { name: 'hips', label: 'Cadera (cm)', type: 'number', min: 0 },
    { name: 'maxThighCircumference', label: 'Muslo maximo', type: 'number', min: 0 },
    { name: 'medialThighCircumference', label: 'Muslo medial', type: 'number', min: 0 },
    { name: 'calfCircumference', label: 'Pantorrilla', type: 'number', min: 0 },
    { name: 'biacromialDiameter', label: 'Biacromial', type: 'number', min: 0 },
    { name: 'transverseThoraxDiameter', label: 'Torax transverso', type: 'number', min: 0 },
    { name: 'anteroposteriorThoraxDiameter', label: 'Torax anteroposterior', type: 'number', min: 0 },
    { name: 'biiliocristalDiameter', label: 'Biiliocrestideo', type: 'number', min: 0 },
    { name: 'humeralDiameter', label: 'Humeral', type: 'number', min: 0 },
    { name: 'femoralDiameter', label: 'Femoral', type: 'number', min: 0 },
    { name: 'tricepsSkinfold', label: 'Pliegue triceps', type: 'number', min: 0 },
    { name: 'subscapularSkinfold', label: 'Pliegue subescapular', type: 'number', min: 0 },
    { name: 'supraspinaleSkinfold', label: 'Pliegue supraespinal', type: 'number', min: 0 },
    { name: 'abdominalSkinfold', label: 'Pliegue abdominal', type: 'number', min: 0 },
    { name: 'medialThighSkinfold', label: 'Pliegue muslo medial', type: 'number', min: 0 },
    { name: 'calfSkinfold', label: 'Pliegue pantorrilla', type: 'number', min: 0 },
    { name: 'skinfoldSum', label: 'Suma de pliegues', type: 'number', min: 0 },
    { name: 'arm', label: 'Brazo (cm)', type: 'number', min: 0 },
    { name: 'bodyFatPercentage', label: 'Grasa corporal (%)', type: 'number', min: 0 },
    { name: 'muscleMass', label: 'Masa muscular', type: 'number', min: 0 },
    { name: 'adiposeMassPercentage', label: 'Masa adiposa %', type: 'number', min: 0 },
    { name: 'adiposeMassKg', label: 'Masa adiposa kg', type: 'number', min: 0 },
    { name: 'muscleMassPercentage', label: 'Masa muscular %', type: 'number', min: 0 },
    { name: 'muscleMassKg', label: 'Masa muscular kg', type: 'number', min: 0 },
    { name: 'boneMassPercentage', label: 'Masa osea %', type: 'number', min: 0 },
    { name: 'boneMassKg', label: 'Masa osea kg', type: 'number', min: 0 },
    { name: 'residualMassPercentage', label: 'Masa residual %', type: 'number', min: 0 },
    { name: 'residualMassKg', label: 'Masa residual kg', type: 'number', min: 0 },
    { name: 'skinMassPercentage', label: 'Masa piel %', type: 'number', min: 0 },
    { name: 'skinMassKg', label: 'Masa piel kg', type: 'number', min: 0 },
    { name: 'muscleBoneIndex', label: 'Indice musculo/oseo', type: 'number', min: 0 },
    { name: 'armMuscleArea', label: 'Area muscular brazo', type: 'number', min: 0 },
    { name: 'thighMuscleArea', label: 'Area muscular muslo', type: 'number', min: 0 },
    { name: 'calfMuscleArea', label: 'Area muscular pantorrilla', type: 'number', min: 0 },
    { name: 'zScore', label: 'Score-Z', type: 'number' },
    { name: 'peakHeightVelocityAge', label: 'Edad PVC', type: 'number', min: 0 },
    { name: 'maturation', label: 'Maduracion', type: 'text' },
    { name: 'bsa', label: 'BSA', type: 'number', min: 0 },
    { name: 'softwareSource', label: 'Software / origen', type: 'text' },
    { name: 'externalReference', label: 'Referencia externa', type: 'text' },
    {
      name: 'rawMeasurementsText',
      label: 'Mediciones crudas',
      type: 'textarea',
      rows: 4,
      colSpan: 2,
    },
    { name: 'observations', label: 'Observaciones', type: 'textarea', rows: 2, colSpan: 2 },
  ];

  private readonly createFields = this.editableFields.filter(
    (field) => !['date', 'professionalName'].includes(field.name)
  );

  get fields(): GenericFormField[] {
    return this.selected ? this.editableFields : this.createFields;
  }

  columns: TableColumnConfig<AntropometryResponseDTO>[] = [
    { field: 'date', header: 'Fecha', type: 'date', width: '8rem' },
    { field: 'weight', header: 'Peso', type: 'number' },
    { field: 'height', header: 'Altura', type: 'number' },
    { field: 'bmi', header: 'IMC', type: 'number' },
    { field: 'bodyFatPercentage', header: 'Grasa %', type: 'number' },
    { field: 'muscleMass', header: 'Masa muscular', type: 'number' },
    { field: 'skinfoldSum', header: 'Suma pliegues', type: 'number', minWidth: '11rem' },
  ];

  actions: TableActionConfig<AntropometryResponseDTO>[] = [
    { field: 'detail', label: 'Ver detalle', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

  get latest(): AntropometryResponseDTO | undefined {
    return this.history.anthropometries?.[0];
  }

  get previous(): AntropometryResponseDTO | undefined {
    return this.history.anthropometries?.[1];
  }

  get anthropometryKpis() {
    return [
      { label: 'Peso', value: this.formatDisplay(this.latest?.weight, 'kg'), delta: this.formatDelta(this.latest?.weight, this.previous?.weight, 'kg') },
      { label: 'IMC', value: this.formatDisplay(this.latest?.bmi, ''), delta: this.formatDelta(this.latest?.bmi, this.previous?.bmi, '') },
      { label: 'Grasa corporal', value: this.formatDisplay(this.latest?.bodyFatPercentage, '%'), delta: this.formatDelta(this.latest?.bodyFatPercentage, this.previous?.bodyFatPercentage, '%') },
      { label: 'Masa muscular', value: this.formatDisplay(this.latest?.muscleMass, 'kg'), delta: this.formatDelta(this.latest?.muscleMass, this.previous?.muscleMass, 'kg') },
      { label: 'Pliegues', value: this.formatDisplay(this.latest?.skinfoldSum, 'mm'), delta: this.formatDelta(this.latest?.skinfoldSum, this.previous?.skinfoldSum, 'mm') },
      { label: 'Mediciones', value: String(this.history.anthropometries?.length ?? 0), delta: 'Historico' },
    ];
  }

  get recentEvolutionRows() {
    return (this.history.anthropometries ?? []).slice(0, 5).map((item, index, items) => {
      const previous = items[index + 1];
      return {
        date: item.date,
        weight: this.formatDisplay(item.weight, 'kg'),
        weightDelta: this.formatDelta(item.weight, previous?.weight, 'kg'),
        fat: this.formatDisplay(item.bodyFatPercentage, '%'),
        muscle: this.formatDisplay(item.muscleMass, 'kg'),
        source: item.source || item.softwareSource || '-',
      };
    });
  }

  get detailGroups() {
    const row = this.detailSelected;
    if (!row) {
      return [];
    }

    return [
      {
        title: 'Basicos',
        items: [
          ['Fecha', row.date ? new Date(row.date).toLocaleDateString('es-AR') : '-'],
          ['Profesional', row.professionalName],
          ['Origen', row.source || row.softwareSource],
          ['Peso', this.formatDisplay(row.weight, 'kg')],
          ['Talla', this.formatDisplay(row.height, 'cm')],
          ['Talla sentado', this.formatDisplay(row.sittingHeight, 'cm')],
          ['Objetivo', row.anthropometricGoal],
        ],
      },
      {
        title: 'Circunferencias',
        items: [
          ['Cabeza', this.formatDisplay(row.headCircumference, 'cm')],
          ['Brazo relajado', this.formatDisplay(row.relaxedArmCircumference, 'cm')],
          ['Brazo flexionado', this.formatDisplay(row.flexedArmCircumference, 'cm')],
          ['Antebrazo', this.formatDisplay(row.forearmCircumference, 'cm')],
          ['Torax', this.formatDisplay(row.thoraxCircumference, 'cm')],
          ['Cintura', this.formatDisplay(row.waist, 'cm')],
          ['Onfalico', this.formatDisplay(row.umbilicalWaist, 'cm')],
          ['Cadera', this.formatDisplay(row.hips, 'cm')],
          ['Muslo maximo', this.formatDisplay(row.maxThighCircumference, 'cm')],
          ['Pantorrilla', this.formatDisplay(row.calfCircumference, 'cm')],
        ],
      },
      {
        title: 'Composicion e indices',
        items: [
          ['IMC', this.formatDisplay(row.bmi, '')],
          ['Grasa corporal', this.formatDisplay(row.bodyFatPercentage, '%')],
          ['Masa adiposa', this.formatDisplay(row.adiposeMassKg, 'kg')],
          ['Masa muscular', this.formatDisplay(row.muscleMassKg ?? row.muscleMass, 'kg')],
          ['Masa osea', this.formatDisplay(row.boneMassKg, 'kg')],
          ['Suma pliegues', this.formatDisplay(row.skinfoldSum, 'mm')],
          ['Score-Z', this.formatDisplay(row.zScore, '')],
          ['BSA', this.formatDisplay(row.bsa, '')],
        ],
      },
    ];
  }

  openAntropoGym(): void {
    window.open('https://antrosport.com/', '_blank', 'noopener');
  }

  openCreate(): void {
    this.selected = undefined;
    this.form = this.emptyForm();
    this.dialogVisible = true;
  }

  openEdit(row: AntropometryResponseDTO): void {
    this.selected = row;
    const { id: _id, bmi: _bmi, bmr: _bmr, waistHipRatio: _waistHipRatio, rawMeasurements: _rawMeasurements, ...editable } = row;
    this.form = {
      ...editable,
      rawMeasurementsText: this.formatRawMeasurements(row.rawMeasurements, true),
    };
    this.dialogVisible = true;
  }

  openDetail(row: AntropometryResponseDTO): void {
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
    const editing = !!this.selected;
    const { rawMeasurementsText, ...rest } = values as AntropometryFormValue;
    const request: AntropometryRequestDTO = {
      ...rest,
      date: rest.date ?? new Date().toISOString().slice(0, 10),
      rawMeasurements: this.parseRawMeasurements(rawMeasurementsText),
    };
    const operation = this.selected
      ? this.historyService.updateAnthropometry(this.selected.id, request)
      : this.historyService.addAnthropometry(this.history.id, request);

    this.saving = true;
    operation.subscribe({
      next: () => {
        this.saving = false;
        this.closeDialog();
        this.messageService.add({
          severity: 'success',
          summary: editing ? 'Antropometria actualizada' : 'Antropometria cargada',
          detail: 'Las mediciones y calculos quedaron actualizados.',
        });
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: 'Revisa las mediciones ingresadas.',
        });
      },
    });
  }

  delete(row: AntropometryResponseDTO): void {
    this.historyService.deleteAnthropometry(row.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Antropometria eliminada',
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

  private emptyForm(): AntropometryFormValue {
    return {
      date: new Date().toISOString().slice(0, 10),
      source: 'MANUAL',
      softwareSource: 'AntroSport',
      rawMeasurementsText: '',
    };
  }

  private formatDisplay(value: number | null | undefined, unit: string): string {
    return value === null || value === undefined ? '-' : `${value}${unit ? ` ${unit}` : ''}`;
  }

  private formatDelta(
    current: number | null | undefined,
    previous: number | null | undefined,
    unit: string
  ): string {
    if (current === null || current === undefined || previous === null || previous === undefined) {
      return 'Sin comparativa';
    }

    const delta = current - previous;
    if (Math.abs(delta) < 0.01) {
      return 'Sin cambios';
    }

    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}${unit ? ` ${unit}` : ''}`;
  }

  private parseRawMeasurements(value?: string | null): Record<string, number> | null {
    if (!value?.trim()) {
      return null;
    }

    return value.split('\n').reduce<Record<string, number>>((values, line) => {
      const [key, rawValue] = line.split(':').map((part) => part.trim());
      const numericValue = Number(rawValue);

      if (key && Number.isFinite(numericValue)) {
        values[key] = numericValue;
      }

      return values;
    }, {});
  }

  private formatRawMeasurements(value: AntropometryResponseDTO['rawMeasurements'], multiline = false): string {
    if (!value) {
      return '';
    }

    const separator = multiline ? '\n' : ' | ';

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as Record<string, number>;
        return Object.entries(parsed)
          .map(([key, rawValue]) => `${key}: ${rawValue}`)
          .join(separator);
      } catch {
        return value;
      }
    }

    return Object.entries(value)
      .map(([key, rawValue]) => `${key}: ${rawValue}`)
      .join(separator);
  }
}
