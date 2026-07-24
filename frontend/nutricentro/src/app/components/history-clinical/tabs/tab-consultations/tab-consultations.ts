import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { FormGeneric } from '../../../../shared/components/form-generic/form-generic';
import { GenericFormField } from '../../../../shared/components/form-generic/model/form-model';
import { ConsultationRequestDTO, ConsultationResponseDTO, MedicalHistoryResponseDTO} from '../../models/history-clinical-model';
import { HistoryClinicalService } from '../../services/history-clinical-service';

@Component({
  selector: 'app-tab-consultations',
  imports: [CommonModule, ButtonModule, ConfirmDialogModule, DialogModule, TagModule, FormGeneric],
  providers: [ConfirmationService],
  templateUrl: './tab-consultations.html',
  styleUrl: './tab-consultations.css',
})
export class TabConsultations {
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Input() appointmentContextId?: number;
  @Output() saved = new EventEmitter<void>();
  @Output() appointmentSelected = new EventEmitter<number>();
  @Output() finalized = new EventEmitter<void>();

  private historyService = inject(HistoryClinicalService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  form: ConsultationRequestDTO = this.emptyForm();
  selected?: ConsultationResponseDTO;
  dialogVisible = false;
  saving = false;
  hasUnsavedChanges = false;
  private formSnapshot = '';

  private readonly editableFields: GenericFormField[] = [
    { name: 'date', label: 'Fecha', type: 'date', required: true, allowFuture: true },
    { name: 'professionalId', label: 'Profesional', type: 'number', min: 1 },
    { name: 'reason', label: 'Motivo', type: 'text' },
    { name: 'goal', label: 'Objetivo', type: 'text' },
    { name: 'nextConsultation', label: 'Próximo control', type: 'text' },
    { name: 'diagnosis', label: 'Diagnostico / evaluacion', type: 'textarea', rows: 2 },
    { name: 'treatment', label: 'Tratamiento / indicaciones', type: 'textarea', rows: 2 },
    { name: 'observations', label: 'Observaciones', type: 'textarea', rows: 2 },
  ];

  private readonly createFields = this.editableFields.filter(
    (field) => !['date', 'professionalId'].includes(field.name)
  );

  get fields(): GenericFormField[] {
    return this.selected ? this.editableFields : this.createFields;
  }

  openCreate(): void {
    this.selected = undefined;
    this.form = this.emptyForm();
    this.trackFormSnapshot(this.form);
    this.dialogVisible = true;
  }

  openEdit(row: ConsultationResponseDTO): void {
    this.selected = row;
    this.form = { ...row };
    this.trackFormSnapshot(this.form);
    this.dialogVisible = true;
  }

  duplicate(row: ConsultationResponseDTO): void {
    const { id: _id, date: _date, appointmentId: _appointmentId, ...copy } = row;
    this.selected = undefined;
    this.form = {
      ...copy,
      date: new Date().toISOString().slice(0, 10),
      observations: row.observations ? `Duplicada: ${row.observations}` : 'Duplicada desde consulta previa',
    };
    this.trackFormSnapshot(this.form);
    this.dialogVisible = true;
  }

  requestCloseDialog(): void {
    if (!this.hasUnsavedChanges) {
      this.closeDialog();
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea salir?\nLos cambios no guardados se perderán.',
      header: 'Salir sin guardar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Salir',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.closeDialog()
    });
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.selected = undefined;
    this.form = this.emptyForm();
    this.hasUnsavedChanges = false;
    this.formSnapshot = '';
  }

  onFormValueChange(values: Record<string, any>): void {
    this.hasUnsavedChanges = this.formSnapshot !== this.snapshot(values as ConsultationRequestDTO);
  }

  save(values: Record<string, any>): void {
    const editing = !!this.selected;
    const request = this.toConsultationRequest(values as ConsultationRequestDTO);
    const operation = this.selected
      ? this.historyService.updateConsultation(this.selected.id, request)
      : this.historyService.addConsultation(this.history.id, request);

    this.saving = true;
    operation.subscribe({
      next: () => {
        this.saving = false;
        this.closeDialog();
        this.messageService.add({
          severity: 'success',
          summary: editing ? 'Consulta actualizada' : 'Consulta registrada',
          detail: 'El control quedo guardado en la historia.',
        });
        this.saved.emit();
      },
      error: (error) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: this.errorMessage(error, 'Revisa la informacion de la consulta.'),
        });
      },
    });
  }

  finalize(row: ConsultationResponseDTO): void {
    const request = this.toConsultationRequest(row, {
      status: 'FINALIZADA',
      endTime: this.currentTime(),
    });
    const validationMessage = this.finalizeValidationMessage(request);
    if (validationMessage) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No se pudo finalizar',
        detail: validationMessage,
      });
      return;
    }

    this.saving = true;
    this.historyService.updateConsultation(row.id, request).subscribe({
      next: () => {
        this.saving = false;
        this.closeDialog();
        this.messageService.add({
          severity: 'success',
          summary: 'Consulta finalizada',
          detail: 'El control quedó finalizado y el turno fue actualizado.',
        });
        this.saved.emit();
        this.finalized.emit();
      },
      error: (error) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo finalizar',
          detail: this.errorMessage(error, 'Revisa el estado del turno e intenta nuevamente.'),
        });
      },
    });
  }

  delete(row: ConsultationResponseDTO): void {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar esta consulta?\nSe eliminará el registro clínico.',
      header: 'Eliminar consulta',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.historyService.deleteConsultation(row.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Consulta eliminada',
              detail: 'El registro fue quitado de la historia.',
            });
            this.saved.emit();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'No se pudo eliminar',
              detail: this.errorMessage(error, 'Intenta nuevamente en unos segundos.'),
            });
          },
        });
      }
    });
  }

  openAppointment(appointmentId?: number | null): void {
    if (appointmentId) {
      this.appointmentSelected.emit(appointmentId);
    }
  }

  consultationStatusLabel(status?: string | null): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Consulta en curso',
      EN_CURSO: 'Consulta en curso',
      FINALIZADA: 'Finalizada'
    };

    return status ? labels[status] ?? status : 'Sin estado';
  }

  consultationSeverity(status?: string | null): 'success' | 'info' | 'warn' | 'secondary' {
    if (status === 'FINALIZADA') {
      return 'success';
    }
    if (status === 'BORRADOR') {
      return 'warn';
    }
    return 'secondary';
  }

  canFinalize(row: ConsultationResponseDTO): boolean {
    return row.status !== 'FINALIZADA';
  }

  isInProgressContext(row: ConsultationResponseDTO): boolean {
    return row.status !== 'FINALIZADA'
      && !!this.appointmentContextId
      && row.appointmentId === this.appointmentContextId;
  }

  durationText(row: ConsultationResponseDTO): string {
    if (!row.startTime || !row.endTime) {
      return 'Sin duración';
    }

    const start = this.timeToMinutes(row.startTime);
    const end = this.timeToMinutes(row.endTime);
    if (end <= start) {
      return 'Sin duración';
    }

    return `${end - start} min`;
  }

  private emptyForm(): ConsultationRequestDTO {
    return {
      date: new Date().toISOString().slice(0, 10),
    };
  }

  private trackFormSnapshot(value: ConsultationRequestDTO): void {
    this.formSnapshot = this.snapshot(value);
    this.hasUnsavedChanges = false;
  }

  private snapshot(value: ConsultationRequestDTO): string {
    return JSON.stringify(this.toConsultationRequest(value));
  }

  private currentTime(): string {
    const date = new Date();
    return [
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0'),
      String(date.getSeconds()).padStart(2, '0')
    ].join(':');
  }

  private timeToMinutes(value: string): number {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  }

  private toConsultationRequest(
    source: ConsultationRequestDTO,
    overrides: Partial<ConsultationRequestDTO> = {}
  ): ConsultationRequestDTO {
    const value = {...source, ...overrides};
    return {
      date: this.toDateOnly(value.date) ?? new Date().toISOString().slice(0, 10),
      startTime: this.toLocalTime(value.startTime),
      endTime: this.toLocalTime(value.endTime),
      status: value.status,
      patientId: value.patientId ?? null,
      appointmentId: value.appointmentId ?? null,
      professionalId: value.professionalId ?? null,
      reason: value.reason ?? null,
      diagnosis: value.diagnosis ?? null,
      treatment: value.treatment ?? null,
      goal: value.goal ?? null,
      evolution: value.evolution ?? null,
      observations: value.observations ?? null,
      indications: value.indications ?? null,
      nextConsultation: value.nextConsultation ?? null,
    };
  }

  private finalizeValidationMessage(request: ConsultationRequestDTO): string | null {
    if (!request.date) {
      return 'Debe ingresar la fecha de la consulta.';
    }
    if (typeof request.date !== 'string' || !this.isDateOnly(request.date)) {
      return 'La fecha de la consulta no es valida.';
    }
    if (request.startTime && !this.isLocalTime(request.startTime)) {
      return 'La hora de inicio no es valida.';
    }
    if (!request.endTime) {
      return 'Debe ingresar la hora de finalizacion.';
    }
    if (!this.isLocalTime(request.endTime)) {
      return 'La hora de finalizacion no es valida.';
    }
    return null;
  }

  private toDateOnly(value?: string | Date | null): string | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : this.formatDateOnly(value);
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : this.formatDateOnly(parsed);
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toLocalTime(value?: string | Date | null): string | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return [
        String(value.getHours()).padStart(2, '0'),
        String(value.getMinutes()).padStart(2, '0'),
        String(value.getSeconds()).padStart(2, '0')
      ].join(':');
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const match = trimmed.match(/^(\d{2}:\d{2})(?::(\d{2}))?/);
    if (!match) {
      return trimmed;
    }
    return match[2] ? trimmed.slice(0, 8) : `${match[1]}:00`;
  }

  private isDateOnly(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private isLocalTime(value: string): boolean {
    return /^\d{2}:\d{2}:\d{2}$/.test(value);
  }

  private errorMessage(error: unknown, fallback: string): string {
    const response = error as {error?: {message?: string} | string; message?: string};
    if (response?.error && typeof response.error === 'object' && response.error.message) {
      return response.error.message;
    }
    if (typeof response?.error === 'string') {
      return response.error;
    }
    return response?.message || fallback;
  }
}
