import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { FormGeneric } from '../../../../shared/components/form-generic/form-generic';
import { GenericFormField } from '../../../../shared/components/form-generic/model/form-model';
import { ConsultationRequestDTO, ConsultationResponseDTO, MedicalHistoryResponseDTO} from '../../models/history-clinical-model';
import { HistoryClinicalService } from '../../services/history-clinical-service';

@Component({
  selector: 'app-tab-consultations',
  imports: [CommonModule, ButtonModule, DialogModule, TagModule, FormGeneric],
  templateUrl: './tab-consultations.html',
  styleUrl: './tab-consultations.css',
})
export class TabConsultations implements OnChanges {
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Input() appointmentContextId?: number;
  @Output() saved = new EventEmitter<void>();
  @Output() appointmentSelected = new EventEmitter<number>();

  private historyService = inject(HistoryClinicalService);
  private messageService = inject(MessageService);

  form: ConsultationRequestDTO = this.emptyForm();
  selected?: ConsultationResponseDTO;
  dialogVisible = false;
  saving = false;
  private openedContextConsultationId?: number;

  fields: GenericFormField[] = [
    { name: 'date', label: 'Fecha', type: 'date', required: true, allowFuture: true },
    { name: 'professionalId', label: 'Profesional', type: 'number', min: 1 },
    { name: 'reason', label: 'Motivo', type: 'text' },
    { name: 'goal', label: 'Objetivo', type: 'text' },
    { name: 'nextConsultation', label: 'Próximo control', type: 'text' },
    { name: 'diagnosis', label: 'Diagnostico / evaluacion', type: 'textarea', rows: 2 },
    { name: 'treatment', label: 'Tratamiento / indicaciones', type: 'textarea', rows: 2 },
    { name: 'observations', label: 'Observaciones', type: 'textarea', rows: 2 },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['history'] || changes['appointmentContextId']) {
      this.openContextConsultation();
    }
  }

  openCreate(): void {
    this.selected = undefined;
    this.form = this.emptyForm();
    this.dialogVisible = true;
  }

  openEdit(row: ConsultationResponseDTO): void {
    this.selected = row;
    this.form = { ...row };
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
    this.dialogVisible = true;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.selected = undefined;
    this.form = this.emptyForm();
  }

  save(values: Record<string, any>): void {
    const editing = !!this.selected;
    const request = values as ConsultationRequestDTO;
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
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: 'Revisá la información de la consulta.',
        });
      },
    });
  }

  finalize(row: ConsultationResponseDTO): void {
    this.saving = true;
    this.historyService.updateConsultation(row.id, {
      ...row,
      status: 'FINALIZADA',
      endTime: this.currentTime(),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.closeDialog();
        this.messageService.add({
          severity: 'success',
          summary: 'Consulta finalizada',
          detail: 'El control quedó finalizado y el turno fue actualizado.',
        });
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo finalizar',
          detail: 'Revisá el estado del turno e intenta nuevamente.',
        });
      },
    });
  }

  delete(row: ConsultationResponseDTO): void {
    this.historyService.deleteConsultation(row.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Consulta eliminada',
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

  openAppointment(appointmentId?: number | null): void {
    if (appointmentId) {
      this.appointmentSelected.emit(appointmentId);
    }
  }

  consultationStatusLabel(status?: string | null): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      EN_CURSO: 'En curso',
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

  private openContextConsultation(): void {
    if (!this.appointmentContextId || !this.history?.consultations?.length) {
      return;
    }

    const consultation = this.history.consultations.find((item) => item.appointmentId === this.appointmentContextId);
    if (!consultation || consultation.id === this.openedContextConsultationId) {
      return;
    }

    this.openedContextConsultationId = consultation.id;
    this.openEdit(consultation);
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
}
