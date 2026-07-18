import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {catchError, finalize, forkJoin, of, switchMap} from 'rxjs';
import {MessageService} from 'primeng/api';
import {Avatar} from 'primeng/avatar';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {Divider} from 'primeng/divider';
import {DialogModule} from 'primeng/dialog';
import {Drawer} from 'primeng/drawer';
import {TagModule} from 'primeng/tag';
import {Timeline} from 'primeng/timeline';
import {TooltipModule} from 'primeng/tooltip';
import {AuthService} from '../../../core/services/auth-service';
import {formatLocalTime} from '../../../shared/utils/date-utils';
import {
  APPOINTMENT_STATUS_ICON,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_SEVERITY,
  AppointmentStatus
} from '../../../shared/enums/appointment-status';
import {MedicalHistoryResponseDTO} from '../../history-clinical/models/history-clinical-model';
import {HistoryClinicalService} from '../../history-clinical/services/history-clinical-service';
import {PatientResponseDTO} from '../../patients/models/patient-model';
import {PatientService} from '../../patients/services/patient-service';
import {ProfessionalResponseDTO} from '../../professionals/models/professional-model';
import {ProfessionalService} from '../../professionals/services/professional-service';
import {AppointmentFeeType, AppointmentResponseDTO, AppointmentTimelineEventResponseDTO} from '../models/appointment-model';
import {AppointmentService} from '../services/appointment-service';
import {ConsultationDraft, TimelineViewItem} from '../models/appointment-detail-model';

@Component({
  selector: 'app-appointment-detail-drawer',
  imports: [
    CommonModule,
    FormsModule,
    Avatar,
    Button,
    Card,
    DialogModule,
    Divider,
    Drawer,
    TagModule,
    Timeline,
    TooltipModule
  ],
  templateUrl: './appointment-detail-drawer.html',
  styleUrl: './appointment-detail-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
/** Muestra el detalle operativo de un turno en un drawer reutilizable. */
export class AppointmentDetailDrawer implements OnChanges {
  @Input() appointmentId?: number | null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() appointmentUpdated = new EventEmitter<AppointmentResponseDTO | void>();

  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly professionalService = inject(ProfessionalService);
  private readonly historyService = inject(HistoryClinicalService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly appointment = signal<AppointmentResponseDTO | null>(null);
  readonly patient = signal<PatientResponseDTO | null>(null);
  readonly professional = signal<ProfessionalResponseDTO | null>(null);
  readonly history = signal<MedicalHistoryResponseDTO | null>(null);
  readonly timeline = signal<AppointmentTimelineEventResponseDTO[]>([]);
  readonly nextAppointment = signal<AppointmentResponseDTO | null>(null);
  consultationDraft: ConsultationDraft = this.emptyConsultationDraft();
  followUpDialogVisible = false;
  economicDialogVisible = false;
  economicDraftFee?: number;
  economicDraftType: AppointmentFeeType = 'CONTROL';
  economicDraftCurrency = 'ARS';

  readonly statusSeverity = APPOINTMENT_STATUS_SEVERITY;
  readonly statusIconMap = APPOINTMENT_STATUS_ICON;

  readonly currentConsultation = computed(() => {
    const appointment = this.appointment();
    const history = this.history();
    if (!appointment || !history?.consultations?.length) {
      return null;
    }
    return history.consultations.find(item => item.appointmentId === appointment.id) ?? null;
  });

  readonly latestConsultation = computed(() => {
    const currentId = this.currentConsultation()?.id;
    return this.history()?.consultations
      ?.filter(item => item.id !== currentId)
      ?.sort((first, second) => this.toTime(second.date) - this.toTime(first.date))?.[0] ?? null;
  });

  readonly timelineItems = computed(() => this.timeline().map(event => this.toTimelineItem(event)));
  readonly lastWhatsAppMessage = computed(() => this.lastEvent(['WHATSAPP_MESSAGE_SENT', 'WHATSAPP_MESSAGE_FAILED']));
  readonly lastReminder = computed(() => this.lastEvent(['WHATSAPP_REMINDER_SENT', 'WHATSAPP_REMINDER_FAILED']));
  readonly lastResponse = computed(() => this.lastEvent(['WHATSAPP_RESPONSE_RECEIVED', 'WHATSAPP_RESPONSE_AMBIGUOUS', 'WHATSAPP_RESPONSE_INVALID']));

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['appointmentId'] || changes['visible']) && this.visible && this.appointmentId) {
      this.loadAppointment();
    }
  }

  /** Sincroniza el estado visible del drawer con el componente contenedor. */
  onVisibleChange(value: boolean): void {
    this.visible = value;
    this.visibleChange.emit(value);
  }

  /** Recarga el turno y sus datos contextuales desde endpoints existentes. */
  loadAppointment(): void {
    if (!this.appointmentId) {
      return;
    }

    this.loading.set(true);
    this.appointmentService.getByIdAppointment(this.appointmentId).pipe(
      switchMap((appointment) => {
        this.appointment.set(appointment);
        return forkJoin({
          patient: this.patientService.getByIdPatient(appointment.patientId).pipe(catchError(() => of(null))),
          professional: this.professionalService.getByIdProfessional(appointment.professionalId).pipe(catchError(() => of(null))),
          history: this.historyService.getByPatientId(appointment.patientId).pipe(catchError(() => of(null))),
          timeline: this.appointmentService.getAppointmentTimeline(appointment.id).pipe(catchError(() => of([]))),
          nextAppointment: this.loadNextAppointment(appointment)
        });
      }),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: ({patient, professional, history, timeline, nextAppointment}) => {
        this.patient.set(patient);
        this.professional.set(professional);
        this.history.set(history);
        this.timeline.set(timeline);
        this.nextAppointment.set(nextAppointment);
        this.syncConsultationDraft();
        this.cdr.markForCheck();
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo cargar el detalle del turno'))
    });
  }

  /** Confirma un turno pendiente o reprogramado. */
  confirmAppointment(): void {
    this.updateStatus(AppointmentStatus.CONFIRMED, 'Turno confirmado correctamente.');
  }

  /** Marca al paciente como presente antes de iniciar la consulta. */
  markPatientPresent(): void {
    this.updateStatus(AppointmentStatus.PATIENT_PRESENT, 'Paciente marcado como presente.');
  }

  /** Marca el turno como ausente cuando el paciente no asiste. */
  markAbsent(): void {
    this.updateStatus(AppointmentStatus.ABSENT, 'Paciente marcado como ausente.');
  }

  /** Cancela el turno usando la operación existente de agenda. */
  cancelAppointment(): void {
    const appointment = this.appointment();
    if (!appointment) {
      return;
    }
    this.actionLoading.set(true);
    this.appointmentService.deleteAppointment(appointment.id).pipe(
      finalize(() => this.actionLoading.set(false))
    ).subscribe({
      next: () => {
        this.showSuccess('Turno cancelado correctamente.');
        this.appointmentUpdated.emit();
        this.loadAppointment();
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo cancelar el turno'))
    });
  }

  /** Crea una consulta en curso asociada al turno presente. */
  startConsultation(): void {
    this.openConsultation();
  }

  /** Finaliza la consulta y completa el turno asociado. */
  finishConsultation(): void {
    const appointment = this.appointment();
    const consultation = this.currentConsultation();
    if (!appointment || !consultation) {
      return;
    }

    this.actionLoading.set(true);
    this.historyService.updateConsultation(consultation.id, {
      ...consultation,
      ...this.consultationDraft,
      status: 'FINALIZADA',
      endTime: this.currentTime()
    }).pipe(
      finalize(() => this.actionLoading.set(false))
    ).subscribe({
      next: () => {
        this.showSuccess('Consulta finalizada');
        this.followUpDialogVisible = true;
        this.appointmentUpdated.emit();
        this.loadAppointment();
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo finalizar la consulta'))
    });
  }

  /** Guarda los avances de la consulta sin finalizar el turno. */
  saveConsultationDraft(): void {
    const consultation = this.currentConsultation();
    if (!consultation) {
      return;
    }

    this.actionLoading.set(true);
    this.historyService.updateConsultation(consultation.id, {
      ...consultation,
      ...this.consultationDraft,
      status: 'BORRADOR'
    }).pipe(
      finalize(() => this.actionLoading.set(false))
    ).subscribe({
      next: () => {
        this.showSuccess('Consulta guardada');
        this.loadAppointment();
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo guardar la consulta'))
    });
  }

  /** Abre la ficha del paciente relacionada al turno. */
  openPatient(): void {
    const patientId = this.appointment()?.patientId;
    if (patientId) {
      this.onVisibleChange(false);
      this.router.navigate(['/patient', patientId]);
    }
  }

  editPatient(): void {
    const patientId = this.appointment()?.patientId;
    if (patientId) {
      this.onVisibleChange(false);
      this.router.navigate(['/patient', patientId, 'edit']);
    }
  }

  openPatientHistory(): void {
    const patientId = this.appointment()?.patientId;
    if (patientId) {
      this.onVisibleChange(false);
      this.router.navigate(['/medical-history', patientId], {
        queryParams: { tab: 'summary' }
      });
    }
  }

  /** Abre la edicion del importe aplicado al turno. */
  openEconomicDialog(): void {
    const appointment = this.appointment();
    if (!appointment?.feeEditable) {
      return;
    }
    this.economicDraftFee = appointment.appliedFee;
    this.economicDraftType = appointment.feeType || 'CONTROL';
    this.economicDraftCurrency = appointment.feeCurrency || 'ARS';
    this.economicDialogVisible = true;
  }

  /** Guarda el resumen economico del turno sin cambiar otros datos. */
  saveEconomicSummary(): void {
    const appointment = this.appointment();
    if (!appointment) {
      return;
    }

    this.actionLoading.set(true);
    this.appointmentService.updateAppointment(appointment.id, {
      appliedFee: this.economicDraftFee,
      feeType: this.economicDraftType,
      feeCurrency: this.economicDraftCurrency
    }).pipe(
      finalize(() => this.actionLoading.set(false))
    ).subscribe({
      next: (updatedAppointment) => {
        this.showSuccess('Resumen economico actualizado');
        this.economicDialogVisible = false;
        this.appointmentUpdated.emit(updatedAppointment);
        this.loadAppointment();
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo actualizar el resumen economico'))
    });
  }

  /** Abre la historia clínica para trabajar la consulta. */
  openConsultation(): void {
    const patientId = this.appointment()?.patientId;
    const appointmentId = this.appointment()?.id;
    if (patientId) {
      this.onVisibleChange(false);
      this.router.navigate(['/medical-history', patientId], {
        queryParams: { tab: 'consultations', appointmentId }
      });
    }
  }

  /** Abre la creacion de un turno nuevo. */
  createNewAppointment(): void {
    this.onVisibleChange(false);
    this.router.navigate(['/agenda/create'], {
      queryParams: {
        patientId: this.appointment()?.patientId,
        returnTo: this.router.url
      }
    });
  }

  /** Abre el asistente para programar el proximo control del paciente. */
  scheduleFollowUp(): void {
    const patientId = this.appointment()?.patientId;
    this.followUpDialogVisible = false;
    this.onVisibleChange(false);
    this.router.navigate(['/agenda/create'], {
      queryParams: {
        patientId,
        returnTo: this.router.url
      }
    });
  }

  /** Cierra el flujo de consulta y vuelve al contexto actual. */
  closeFollowUpDialog(): void {
    this.followUpDialogVisible = false;
    this.onVisibleChange(false);
  }

  /** Abre el formulario existente de reprogramacion. */
  rescheduleAppointment(): void {
    const appointmentId = this.appointment()?.id;
    if (appointmentId) {
      this.onVisibleChange(false);
      this.router.navigate(['/agenda', appointmentId, 'edit']);
    }
  }

  get canManageAppointments(): boolean {
    const roles = this.authService.getUserRoles();
    return roles.includes('ADMIN') || roles.includes('SECRETARY');
  }

  get canManagePresence(): boolean {
    const roles = this.authService.getUserRoles();
    return this.canManageAppointments || roles.includes('PROFESSIONAL');
  }

  get canManageConsultations(): boolean {
    const roles = this.authService.getUserRoles();
    return roles.includes('ADMIN') || roles.includes('PROFESSIONAL') || roles.includes('SECRETARY');
  }

  get canConfirm(): boolean {
    return this.canManageAppointments && [AppointmentStatus.PENDING, AppointmentStatus.RESCHEDULED].includes(this.appointment()?.status as AppointmentStatus);
  }

  get canMarkPresent(): boolean {
    return this.canManagePresence
      && [AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED].includes(this.appointment()?.status as AppointmentStatus)
      && !this.isFutureDateOnly();
  }

  get canMarkAbsent(): boolean {
    return this.canManagePresence
      && [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED].includes(this.appointment()?.status as AppointmentStatus)
      && !this.isFutureDateTime();
  }

  get canCorrectAbsent(): boolean {
    return this.canManagePresence
      && this.appointment()?.status === AppointmentStatus.ABSENT
      && !this.isFutureDateOnly();
  }

  get canStartConsultation(): boolean {
    return this.canManageConsultations
      && this.appointment()?.status === AppointmentStatus.PATIENT_PRESENT
      && !this.currentConsultation();
  }

  get canFinishConsultation(): boolean {
    const consultation = this.currentConsultation();
    return this.canManageConsultations
      && this.appointment()?.status === AppointmentStatus.PATIENT_PRESENT
      && consultation?.status === 'BORRADOR';
  }

  get canCancel(): boolean {
    const status = this.appointment()?.status;
    return this.canManageAppointments
      && !!status
      && !this.isTerminal(status)
      && this.isFutureDateTime();
  }

  get canReschedule(): boolean {
    const status = this.appointment()?.status;
    return this.canManageAppointments
      && !!status
      && [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED].includes(status);
  }

  get canScheduleAgain(): boolean {
    const status = this.appointment()?.status;
    return this.canManagePresence
      && !!this.appointment()?.patientId
      && !!status
      && [AppointmentStatus.PATIENT_PRESENT, AppointmentStatus.COMPLETED].includes(status);
  }

  statusLabel(status?: AppointmentStatus): string {
    return status ? APPOINTMENT_STATUS_LABELS[status] ?? status : '-';
  }

  statusIcon(status?: AppointmentStatus): string {
    return status ? APPOINTMENT_STATUS_ICON[status] ?? 'pi pi-circle' : 'pi pi-circle';
  }

  fullName(person?: PatientResponseDTO | ProfessionalResponseDTO | null): string {
    return person ? `${person.firstName} ${person.lastName}`.trim() : '-';
  }

  specialtyText(): string {
    const specialties = this.professional()?.specialties ?? [];
    return specialties.length ? specialties.map(item => item.name).join(', ') : 'Sin especialidad cargada';
  }

  whatsappUrl(): string | null {
    const phone = this.patient()?.mobile?.replace(/\D/g, '');
    return phone ? `https://wa.me/${phone}` : null;
  }

  formatDate(value?: string | Date | null): string {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleDateString('es-AR', {day: '2-digit', month: 'short', year: 'numeric'});
  }

  formatTime(value?: unknown): string {
    return formatLocalTime(value);
  }

  /** Formatea importes con el simbolo de moneda configurado. */
  formatMoney(value?: number, currency = 'ARS'): string {
    if (value === null || value === undefined) {
      return 'No informado';
    }
    const symbol = currency === 'ARS' ? '$' : `${currency} `;
    return `${symbol}${Number(value).toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
  }

  appointmentDuration(): string {
    return this.appointment()?.feeType === 'FIRST' ? '60 minutos' : '30 minutos';
  }

  formatDateTime(value?: string | Date | null): string {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  consultationStatusLabel(status?: string | null): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Consulta en curso',
      FINALIZADA: 'Finalizada'
    };

    return status ? labels[status] ?? status : 'Sin consulta';
  }

  eventSummary(event?: AppointmentTimelineEventResponseDTO | null): string {
    if (!event) {
      return 'Sin registro';
    }
    return this.toTimelineItem(event).title;
  }

  feeTypeLabel(type?: AppointmentFeeType): string {
    const labels: Record<AppointmentFeeType, string> = {
      FIRST: 'Primera consulta',
      CONTROL: 'Control',
      ONLINE: 'Online'
    };
    return type ? labels[type] : '-';
  }

  private syncConsultationDraft(): void {
    const consultation = this.currentConsultation();
    this.consultationDraft = {
      reason: consultation?.reason || this.appointment()?.reason || '',
      evolution: consultation?.evolution || '',
      indications: consultation?.indications || consultation?.treatment || '',
      nextConsultation: consultation?.nextConsultation || '',
      observations: consultation?.observations || ''
    };
  }

  private emptyConsultationDraft(): ConsultationDraft {
    return {
      reason: '',
      evolution: '',
      indications: '',
      nextConsultation: '',
      observations: ''
    };
  }

  private updateStatus(status: AppointmentStatus, successMessage: string): void {
    const appointment = this.appointment();
    if (!appointment) {
      return;
    }

    this.actionLoading.set(true);
    this.appointmentService.updateAppointment(appointment.id, {status}).pipe(
      finalize(() => this.actionLoading.set(false))
    ).subscribe({
      next: (updatedAppointment) => {
        this.showSuccess(successMessage);
        this.appointmentUpdated.emit(updatedAppointment);
        this.loadAppointment();
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo actualizar el turno con el estado seleccionado'))
    });
  }

  private loadNextAppointment(appointment: AppointmentResponseDTO) {
    return this.appointmentService.searchAppointments({
      patientId: appointment.patientId,
      dateFrom: this.todayIso(),
      page: 0,
      size: 20,
      sortBy: 'date',
      direction: 'asc'
    }).pipe(
      catchError(() => of(null)),
      switchMap((page) => of(page?.content
        ?.filter(item => item.id !== appointment.id)
        ?.filter(item => !this.isTerminal(item.status))
        ?.sort((first, second) => this.appointmentTime(first) - this.appointmentTime(second))?.[0] ?? null))
    );
  }

  private lastEvent(types: string[]): AppointmentTimelineEventResponseDTO | null {
    return [...this.timeline()]
      .reverse()
      .find(event => types.includes(event.eventType)) ?? null;
  }

  private toTimelineItem(event: AppointmentTimelineEventResponseDTO): TimelineViewItem {
    const tone = event.eventType.includes('FAILED') || event.eventType.includes('CANCELED') || event.eventType.includes('ABSENT')
      ? 'danger'
      : event.eventType.includes('WHATSAPP')
        ? 'info'
        : event.eventType.includes('CONFIRMED') || event.eventType.includes('COMPLETED') || event.eventType.includes('PRESENT')
          ? 'success'
          : 'neutral';

    return {
      title: this.timelineLabel(event.eventType),
      detail: this.timelineDetail(event),
      date: this.formatDateTime(event.occurredAt),
      icon: this.iconForEvent(event.eventType),
      tone
    };
  }

  private iconForEvent(eventType: string): string {
    if (eventType.includes('WHATSAPP')) {
      return 'pi pi-whatsapp';
    }
    if (eventType.includes('CANCELED') || eventType.includes('ABSENT') || eventType.includes('FAILED')) {
      return 'pi pi-ban';
    }
    if (eventType.includes('CONFIRMED') || eventType.includes('COMPLETED') || eventType.includes('PRESENT')) {
      return 'pi pi-check';
    }
    if (eventType.includes('DATE') || eventType.includes('TIME') || eventType.includes('RESCHEDULED')) {
      return 'pi pi-calendar-clock';
    }
    return 'pi pi-circle';
  }

  private timelineDetail(event: AppointmentTimelineEventResponseDTO): string {
    const detail = event.observations || event.reason || 'Sin observaciones';
    return Object.entries(this.timelineLabels()).reduce(
      (text, [key, label]) => text.replace(new RegExp(`\\b${key}\\b`, 'g'), label),
      detail
    );
  }

  private timelineLabel(value?: string | null): string {
    if (!value) {
      return 'Sin registro';
    }
    return this.timelineLabels()[value] ?? value;
  }

  private timelineLabels(): Record<string, string> {
    return {
      APPOINTMENT_CREATED: 'Turno creado',
      APPOINTMENT_UPDATED: 'Turno actualizado',
      STATUS_CHANGED: 'Estado actualizado',
      APPOINTMENT_CONFIRMED: 'Turno confirmado',
      APPOINTMENT_CANCELED: 'Cancelado',
      APPOINTMENT_REJECTED: 'Turno rechazado',
      APPOINTMENT_PATIENT_PRESENT: 'Paciente presente',
      APPOINTMENT_ABSENT: 'Ausente',
      APPOINTMENT_COMPLETED: 'Consulta finalizada',
      APPOINTMENT_RESCHEDULED: 'Reprogramado',
      WHATSAPP_MESSAGE_SENT: 'WhatsApp enviado',
      WHATSAPP_MESSAGE_FAILED: 'WhatsApp no enviado',
      WHATSAPP_REMINDER_SENT: 'Recordatorio enviado',
      WHATSAPP_REMINDER_FAILED: 'Recordatorio no enviado',
      WHATSAPP_RESPONSE_RECEIVED: 'Respuesta recibida',
      WHATSAPP_RESPONSE_AMBIGUOUS: 'Respuesta ambigua',
      WHATSAPP_RESPONSE_INVALID: 'Respuesta no reconocida',
      PROFESSIONAL_CHANGED: 'Profesional actualizado',
      DATE_CHANGED: 'Fecha actualizada',
      TIME_CHANGED: 'Horario actualizado',
      CREATED: 'Turno creado',
      CONFIRMED: 'Turno confirmado',
      PATIENT_PRESENT: 'Paciente presente',
      COMPLETED: 'Consulta finalizada',
      CANCELED: 'Cancelado',
      CANCELLED: 'Cancelado',
      ABSENT: 'Ausente',
      RESCHEDULED: 'Reprogramado',
      REJECTED: 'Turno rechazado',
      PENDING: 'Pendiente',
    };
  }

  private isTerminal(status: AppointmentStatus): boolean {
    return [AppointmentStatus.CANCELED, AppointmentStatus.COMPLETED, AppointmentStatus.REJECTED, AppointmentStatus.ABSENT].includes(status);
  }

  private isFutureDateOnly(): boolean {
    const appointment = this.appointment();
    if (!appointment) {
      return false;
    }
    return new Date(`${appointment.date}T00:00:00`).getTime() > new Date(`${this.todayIso()}T00:00:00`).getTime();
  }

  private isFutureDateTime(future = true): boolean {
    const appointment = this.appointment();
    if (!appointment) {
      return false;
    }
    const isFuture = this.appointmentTime(appointment) > Date.now();
    return future ? isFuture : !isFuture;
  }

  private appointmentTime(appointment: AppointmentResponseDTO): number {
    return new Date(`${appointment.date}T${this.formatTime(appointment.time)}:00`).getTime();
  }

  private toTime(value?: string | Date | null): number {
    return value ? new Date(value).getTime() : 0;
  }

  private todayIso(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private currentTime(): string {
    const date = new Date();
    return [
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0'),
      String(date.getSeconds()).padStart(2, '0')
    ].join(':');
  }

  private showSuccess(detail: string): void {
    this.messageService.add({severity: 'success', summary: 'Listo', detail});
  }

  private errorMessage(error: unknown, fallback: string): string {
    const response = error as {error?: {message?: string} | string; message?: string};
    const backendMessage = response?.error && typeof response.error === 'object'
      ? response.error.message
      : undefined;
    if (this.isUserMessage(backendMessage)) {
      return backendMessage!;
    }
    if (typeof response?.error === 'string' && this.isUserMessage(response.error)) {
      return response.error;
    }
    return this.isUserMessage(response?.message) ? response.message! : fallback;
  }

  private isUserMessage(message?: string): boolean {
    if (!message) {
      return false;
    }
    const technicalFragments = [
      'JSON invalido',
      'JSON inválido',
      'Bad Request',
      'Internal Server Error',
      'Http failure response',
      'SyntaxError'
    ];
    return !technicalFragments.some(fragment => message.includes(fragment));
  }

  private showError(detail: string): void {
    this.messageService.add({severity: 'error', summary: 'Agenda', detail});
  }
}
