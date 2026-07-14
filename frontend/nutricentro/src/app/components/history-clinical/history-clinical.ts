import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { HistoryTabs } from './history-tabs/history-tabs';
import {
  AntropometryResponseDTO,
  ConsultationResponseDTO,
  LaboratoryResponseDTO,
  MedicalHistoryResponseDTO,
  NutritionalDataDTO,
} from './models/history-clinical-model';
import { PatientResponseDTO } from '../patients/models/patient-model';
import { PatientService } from '../patients/services/patient-service';
import { HistoryClinicalService } from './services/history-clinical-service';
import { Gender_Labels } from '../../shared/constants/genders';
import { PERSON_STATUS_LABELS, PersonStatus } from '../../shared/constants/person-status';
import { AppointmentDetailDrawer } from '../appointments/appointment-detail-drawer/appointment-detail-drawer';
import { AppointmentResponseDTO, AppointmentTimelineEventResponseDTO } from '../appointments/models/appointment-model';
import { AppointmentService } from '../appointments/services/appointment-service';
import { AppointmentStatus } from '../../shared/constants/appointment-status';
import {formatLocalTime} from '../../shared/utils/date-utils';
import { FollowUpService } from '../../core/services/follow-up-service';
import { PatientFollowUpStatusDTO } from '../../core/models/follow-up-model';

interface ContextMetric {
  label: string;
  value: string;
  trend: string;
  tone: string;
}

interface PatientCommunicationItem {
  appointmentId: number;
  occurredAt: string;
  title: string;
  detail: string;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-history-clinical',
  standalone: true,
  imports: [CommonModule, ToastModule, HistoryTabs, Button, AppointmentDetailDrawer],
  providers: [MessageService],
  templateUrl: './history-clinical.html',
  styleUrl: './history-clinical.css',
})
export class HistoryClinical implements OnInit {
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private historyService = inject(HistoryClinicalService);
  private appointmentService = inject(AppointmentService);
  private followUpService = inject(FollowUpService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  genderLabels = Gender_Labels;
  statusLabels = PERSON_STATUS_LABELS;
  nutritionData?: NutritionalDataDTO;
  patient?: PatientResponseDTO;
  history?: MedicalHistoryResponseDTO;
  appointments: AppointmentResponseDTO[] = [];
  followUpStatus?: PatientFollowUpStatusDTO;
  communicationEvents: PatientCommunicationItem[] = [];
  loading = true;
  communicationsLoading = false;
  communicationsLoaded = false;
  activeTab = 'summary';
  appointmentContextId?: number;
  selectedAppointmentId?: number;
  appointmentDrawerVisible = false;

  ngOnInit(): void {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.activeTab = this.route.snapshot.queryParamMap.get('tab') || 'summary';
    const appointmentId = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    this.appointmentContextId = Number.isFinite(appointmentId) && appointmentId > 0 ? appointmentId : undefined;
    if (this.appointmentContextId) {
      this.activeTab = 'consultations';
    }

    if (!patientId) {
      this.loading = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Paciente requerido',
        detail: 'Selecciona un paciente para abrir su historia clinica.',
      });
      return;
    }

    this.loadPatientAndHistory(patientId);
  }

  loadPatientAndHistory(patientId: number): void {
    this.loading = true;
    this.patientService
      .getByIdPatient(patientId)
      .pipe(
        switchMap((patient) => {
          this.patient = patient;
          if (patient.status === PersonStatus.INACTIVE) {
            return of(null);
          }

          return this.historyService.getByPatientId(patientId).pipe(
            catchError(() =>
              this.historyService.createOrUpdateHistory({
                patientId,
                consultationDate: new Date(),
                consultationReason: 'Apertura de historia clinica',
              })
            )
          );
        }),
        catchError(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo cargar',
            detail: 'Revisa la conexion con el servidor e intenta nuevamente.',
          });
          return of(null);
        })
      )
      .subscribe((history) => {
        this.history = history ?? undefined;
        this.nutritionData = history?.nutritionalData ?? undefined;
        this.loading = false;
        if (this.patient && !this.isPatientInactive) {
          this.loadFollowUpStatus(this.patient.id);
          this.loadAppointments(this.patient.id);
          if (history) {
            this.ensureAppointmentConsultation(history);
          }
        }
      });
  }

  refreshHistory(): void {
    const patientId = this.patient?.id;
    if (!patientId) {
      return;
    }

    this.historyService.getByPatientId(patientId).subscribe({
      next: (history) => {
        this.history = history;
        this.nutritionData = history.nutritionalData ?? undefined;
        this.communicationEvents = [];
        this.communicationsLoaded = false;
        this.loadFollowUpStatus(patientId);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se actualizo la ficha',
          detail: 'El registro se guardo, pero no se pudo refrescar la informacion.',
        });
      },
    });
  }

  get patientName(): string {
    if (!this.patient) {
      return 'Historia clinica';
    }

    return `${this.patient.firstName} ${this.patient.lastName}`;
  }

  get latestAnthropometry(): AntropometryResponseDTO | undefined {
    return this.history?.anthropometries?.[0];
  }

  get previousAnthropometry(): AntropometryResponseDTO | undefined {
    return this.history?.anthropometries?.[1];
  }

  get latestConsultation(): ConsultationResponseDTO | undefined {
    return this.history?.consultations?.[0];
  }

  get followUpTone(): string {
    const status = this.followUpStatus?.status;
    if (status === 'OVER_ONE_YEAR') {
      return 'danger';
    }
    if (status === 'OVER_SIX_MONTHS') {
      return 'orange';
    }
    if (status === 'OVER_THREE_MONTHS') {
      return 'warning';
    }
    if (status === 'WITHOUT_VALID_CONSULTATION') {
      return 'muted';
    }
    return 'success';
  }

  get followUpIcon(): string {
    const status = this.followUpStatus?.status;
    if (status === 'OVER_ONE_YEAR') {
      return 'pi pi-exclamation-triangle';
    }
    if (status === 'OVER_SIX_MONTHS') {
      return 'pi pi-exclamation-circle';
    }
    if (status === 'OVER_THREE_MONTHS') {
      return 'pi pi-clock';
    }
    if (status === 'WITHOUT_VALID_CONSULTATION') {
      return 'pi pi-calendar-minus';
    }
    return 'pi pi-check-circle';
  }

  get latestLaboratory(): LaboratoryResponseDTO | undefined {
    return this.history?.laboratories?.[0];
  }

  get activePlan() {
    return this.history?.foodPlans?.find((plan) => plan.active) ?? this.history?.foodPlans?.[0];
  }

  get isPatientInactive(): boolean {
    return this.patient?.status === PersonStatus.INACTIVE;
  }

  get nextAppointment(): AppointmentResponseDTO | undefined {
    return this.appointments
      .filter((appointment) => !this.isTerminalAppointment(appointment.status))
      .filter((appointment) => this.appointmentTime(appointment) >= Date.now())
      .sort((first, second) => this.appointmentTime(first) - this.appointmentTime(second))?.[0];
  }

  get latestAppointment(): AppointmentResponseDTO | undefined {
    return [...this.appointments]
      .sort((first, second) => this.appointmentTime(second) - this.appointmentTime(first))?.[0];
  }

  get absentCount(): number {
    return this.appointments.filter((appointment) => appointment.status === AppointmentStatus.ABSENT).length;
  }

  get canceledCount(): number {
    return this.appointments.filter((appointment) => appointment.status === AppointmentStatus.CANCELED).length;
  }

  get rescheduledCount(): number {
    return this.appointments.filter((appointment) => appointment.status === AppointmentStatus.RESCHEDULED).length;
  }

  get completedCount(): number {
    return this.appointments.filter((appointment) => appointment.status === AppointmentStatus.COMPLETED).length;
  }

  get lastCommunicationText(): string {
    if (this.communicationsLoading) {
      return 'Cargando comunicaciones';
    }
    if (!this.communicationsLoaded) {
      return 'Ver historial de comunicaciones';
    }
    const event = this.communicationEvents[0];
    return event ? `${event.title} · ${this.formatDate(event.occurredAt)}` : 'Sin comunicaciones registradas';
  }

  get primaryGoal(): string {
    return this.latestConsultation?.goal || this.activePlan?.title || 'Definir objetivo';
  }

  get nextConsultationText(): string {
    return this.nextAppointment
      ? `${this.formatDate(this.nextAppointment.date)} ${this.formatTime(this.nextAppointment.time)}`
      : this.latestConsultation?.nextConsultation || 'Sin turno programado';
  }

  get lastConsultationSummary(): string {
    return (
      this.latestConsultation?.observations ||
      this.latestConsultation?.treatment ||
      this.latestConsultation?.reason ||
      'Sin resumen cargado'
    );
  }

  get whatsappUrl(): string | null {
    const phone = this.patient?.mobile?.replace(/\D/g, '');
    return phone ? `https://wa.me/${phone}` : null;
  }

  get clinicalAlerts(): { label: string; tone: string; icon: string; prefix?: string }[] {
    const clinical = this.history?.clinicalData;
    const nutrition = this.history?.nutritionalData;

    return [
      ...this.toBadges(clinical?.allergies, 'warning', 'pi pi-exclamation-triangle', 'Alergia'),
      ...this.toBadges(clinical?.diseases, 'danger', 'pi pi-heart', 'Enfermedad'),
      ...this.toBadges(clinical?.familyHistory, 'danger', 'pi pi-heart-fill', 'Historial familiar'),
      ...this.toBadges(clinical?.surgeries, 'warning', 'pi pi-exclamation-circle', 'Cirugias'),
      ...this.toBadges(nutrition?.dislikedFoods, 'info', 'pi pi-ban', 'Alimento rechazado'),
    ].slice(0, 8);
  }

  get medications(): string {
    return this.history?.clinicalData?.medications?.trim() || 'Sin medicación';
  }

  get quickMetrics(): ContextMetric[] {
    switch (this.activeTab) {
      case 'anthropometry':
        return this.anthropometryMetrics;
      case 'laboratory':
        return this.laboratoryMetrics;
      case 'consultations':
        return this.consultationMetrics;
      case 'nutrition':
        return this.nutritionMetrics;
      case 'plans':
        return this.planMetrics;
      case 'files':
        return this.fileMetrics;
      default:
        return this.summaryMetrics;
    }
  }

  get showSummaryActions(): boolean {
    return this.activeTab === 'summary';
  }

  get summaryMetrics(): ContextMetric[] {
    const latest = this.latestAnthropometry;
    const previous = this.previousAnthropometry;
    const weightTarget = this.activePlan?.description?.match(/(\d+(?:[.,]\d+)?)\s*kg/i)?.[1];
    const targetNumber = weightTarget ? Number(weightTarget.replace(',', '.')) : null;
    const currentWeight = latest?.weight ?? null;

    return [
      {
        label: 'Peso actual',
        value: this.formatValue(currentWeight, 'kg'),
        trend: this.formatDelta(currentWeight, previous?.weight, 'kg'),
        tone: 'green',
      },
      {
        label: 'Peso objetivo',
        value: targetNumber ? `${targetNumber} kg` : '-',
        trend:
          targetNumber && currentWeight
            ? `${Math.abs(currentWeight - targetNumber).toFixed(1)} kg restantes`
            : 'Sin objetivo',
        tone: 'mint',
      },
      {
        label: 'Diferencia restante',
        value:
          targetNumber && currentWeight
            ? `${Math.abs(currentWeight - targetNumber).toFixed(1)} kg`
            : '-',
        trend: this.primaryGoal,
        tone: 'orange',
      },
      {
        label: 'Estado del plan',
        value: this.activePlan?.planDelivered ? 'Enviado' : this.latestConsultation ? 'Pendiente' : 'No corresponde',
        trend: this.activePlan?.planDeliveryMedium || 'Dashboard',
        tone: 'blue',
      },
      {
        label: 'Material',
        value: this.activePlan?.menuDelivered ? 'Enviado' : this.latestConsultation ? 'Pendiente' : 'No corresponde',
        trend: this.activePlan?.menuDeliveredDate ? this.formatDate(this.activePlan.menuDeliveredDate) : 'Seguimiento',
        tone: this.activePlan?.menuDelivered ? 'green' : this.latestConsultation ? 'orange' : 'gray',
      },
      {
        label: 'Proximo turno',
        value: this.nextConsultationText,
        trend: this.nextAppointment?.professionalFullName || 'Sin turno activo',
        tone: 'gray',
      },
      {
        label: 'Ausencias',
        value: String(this.absentCount),
        trend: `${this.canceledCount} cancelaciones`,
        tone: this.absentCount ? 'orange' : 'green',
      }
    ];
  }

  get anthropometryMetrics(): ContextMetric[] {
    const latest = this.latestAnthropometry;
    return [
      { label: 'Peso', value: this.formatValue(latest?.weight, 'kg'), trend: this.formatDelta(latest?.weight, this.previousAnthropometry?.weight, 'kg'), tone: 'green' },
      { label: 'IMC', value: this.formatValue(latest?.bmi, ''), trend: this.formatDelta(latest?.bmi, this.previousAnthropometry?.bmi, ''), tone: 'blue' },
      { label: 'Grasa', value: this.formatValue(latest?.bodyFatPercentage, '%'), trend: this.formatDelta(latest?.bodyFatPercentage, this.previousAnthropometry?.bodyFatPercentage, '%'), tone: 'orange' },
      { label: 'Musculo', value: this.formatValue(latest?.muscleMass, 'kg'), trend: this.formatDelta(latest?.muscleMass, this.previousAnthropometry?.muscleMass, 'kg'), tone: 'violet' },
      { label: 'Ultima medicion', value: this.formatDate(latest?.date), trend: latest?.softwareSource || 'Sin origen', tone: 'gray' },
    ];
  }

  get laboratoryMetrics(): ContextMetric[] {
    const lab = this.latestLaboratory;
    return [
      { label: 'Glucosa', value: this.formatValue(lab?.glucose, 'mg/dl'), trend: 'Ultimo valor', tone: 'green' },
      { label: 'HDL', value: this.formatValue(lab?.hdl, 'mg/dl'), trend: 'Colesterol protector', tone: 'blue' },
      { label: 'LDL', value: this.formatValue(lab?.ldl, 'mg/dl'), trend: 'Riesgo cardiometabolico', tone: 'orange' },
      { label: 'Trigliceridos', value: this.formatValue(lab?.triglycerides, 'mg/dl'), trend: 'Ultimo valor', tone: 'orange' },
      { label: 'Fecha', value: this.formatDate(lab?.date), trend: 'Laboratorio reciente', tone: 'gray' },
    ];
  }

  get consultationMetrics(): ContextMetric[] {
    return [
      { label: 'Consultas', value: String(this.history?.consultations?.length ?? 0), trend: 'Registradas', tone: 'green' },
      { label: 'Ultima consulta', value: this.formatDate(this.latestConsultation?.date), trend: this.latestConsultation?.reason || 'Control', tone: 'gray' },
      { label: 'Objetivo', value: this.primaryGoal, trend: 'Actual', tone: 'blue' },
      { label: 'Proximo control', value: this.nextConsultationText, trend: 'Agenda', tone: 'orange' },
    ];
  }

  get nutritionMetrics(): ContextMetric[] {
    const nutrition = this.history?.nutritionalData;
    return [
      { label: 'Actividad', value: nutrition?.physicalActivity || '-', trend: nutrition?.activityFrequency || 'Sin frecuencia', tone: 'green' },
      { label: 'Agua', value: nutrition?.waterIntake || '-', trend: 'Ingesta diaria', tone: 'blue' },
      { label: 'Preferencias', value: nutrition?.favoriteFoods ? 'Cargadas' : '-', trend: 'Alimentos favoritos', tone: 'gray' },
      { label: 'Restricciones', value: nutrition?.dislikedFoods ? 'Cargadas' : '-', trend: 'Rechazos/intolerancias', tone: 'orange' },
    ];
  }

  get planMetrics(): ContextMetric[] {
    const plan = this.activePlan;
    return [
      { label: 'Plan activo', value: plan?.title || '-', trend: plan?.active ? 'Activo' : 'Sin plan activo', tone: 'green' },
      { label: 'Plan enviado', value: plan?.planDelivered ? 'Si' : 'No', trend: plan?.planDeliveredDate ? this.formatDate(plan.planDeliveredDate) : 'Pendiente', tone: plan?.planDelivered ? 'green' : this.latestConsultation ? 'orange' : 'gray' },
      { label: 'Medio', value: plan?.planDeliveryMedium || '-', trend: 'WhatsApp / Email / PDF', tone: 'blue' },
      { label: 'Material', value: plan?.menuDelivered ? 'Si' : 'No', trend: plan?.menuDeliveredDate ? this.formatDate(plan.menuDeliveredDate) : 'Pendiente', tone: plan?.menuDelivered ? 'green' : 'gray' },
      { label: 'Kcal', value: this.formatValue(plan?.totalCalories, 'kcal'), trend: 'Totales calculados', tone: 'violet' },
    ];
  }

  get fileMetrics(): ContextMetric[] {
    const files = this.history?.files ?? [];
    return [
      { label: 'Archivos', value: String(files.length), trend: 'Adjuntos', tone: 'green' },
      { label: 'Analisis', value: String(files.filter((file) => file.type === 'Analisis').length), trend: 'Clasificados', tone: 'blue' },
      { label: 'Antropometria', value: String(files.filter((file) => file.type === 'Antropometria').length), trend: 'PDFs / informes', tone: 'orange' },
      { label: 'Ultimo archivo', value: files[0]?.date ? this.formatDate(files[0].date) : '-', trend: files[0]?.originalName || 'Sin adjuntos', tone: 'gray' },
    ];
  }

  get lastMeasurementDate(): string | Date | null | undefined {
    return this.latestAnthropometry?.date;
  }

  openWhatsApp(): void {
    if (!this.whatsappUrl) {
      this.messageService.add({ severity: 'warn', summary: 'Número no disponible', detail: 'Agrega un número de celular.' });
      return;
    }

    window.open(this.whatsappUrl, '_blank', 'noopener');
  }

  selectTab(tab: string): void {
    this.onTabChanged(tab);
    document.querySelector('.clinical-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onTabChanged(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    if (tab === 'communications') {
      this.loadCommunicationEvents();
    }
  }

  openAppointmentDetail(appointmentId: number): void {
    this.selectedAppointmentId = appointmentId;
    this.appointmentDrawerVisible = true;
  }

  createAppointment(): void {
    const returnTo = this.patient?.id
      ? `/medical-history/${this.patient.id}?tab=appointments`
      : this.router.url;

    this.router.navigate(['/agenda/create'], {
      queryParams: {
        patientId: this.patient?.id,
        returnTo
      }
    });
  }

  openAntropoGym(): void {
    window.open('https://antrosport.com/', '_blank', 'noopener');
  }

  activatePatient(): void {
    if (!this.patient) {
      return;
    }

    this.patientService.updatePatient(this.patient.id, {
      firstName: this.patient.firstName,
      lastName: this.patient.lastName,
      birthDate: this.patient.birthDate,
      document: this.patient.document,
      mobile: this.patient.mobile,
      gender: this.patient.gender,
      email: this.patient.email,
      status: PersonStatus.ACTIVE,
      address: this.patient.address,
    }).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.messageService.add({
          severity: 'success',
          summary: 'Paciente activado',
          detail: 'Ya podes trabajar sobre su historia clinica.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo activar',
          detail: 'Intenta nuevamente en unos segundos.',
        });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/patient']);
  }

  private toBadges(value: string | null | undefined, tone: string, icon: string, prefix?: string) {
    return (value ?? '')
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((label) => ({ label, tone, icon, prefix }));
  }

  private loadAppointments(patientId: number): void {
    this.appointmentService.searchAppointments({
      patientId,
      page: 0,
      size: 100,
      sortBy: 'date',
      direction: 'desc'
    }).subscribe({
      next: (page) => this.appointments = page.content,
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Turnos',
          detail: 'No se pudieron cargar los turnos del paciente.',
        });
      }
    });
  }

  private ensureAppointmentConsultation(history: MedicalHistoryResponseDTO): void {
    const appointmentId = this.appointmentContextId;
    if (!appointmentId) {
      return;
    }

    const existing = history.consultations?.some((consultation) => consultation.appointmentId === appointmentId);
    if (existing) {
      return;
    }

    this.loading = true;
    this.historyService.addConsultation(history.id, {
      appointmentId,
      status: 'BORRADOR',
    }).pipe(
      switchMap(() => this.historyService.getByPatientId(history.patientId)),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (updatedHistory) => {
        this.history = updatedHistory;
        this.nutritionData = updatedHistory.nutritionalData ?? undefined;
        this.loadAppointments(updatedHistory.patientId);
        this.messageService.add({
          severity: 'success',
          summary: 'Consulta iniciada',
          detail: 'La consulta quedo vinculada al turno.',
        });
      },
      error: (error) => {
        this.loading = false;
        const response = error as {error?: {message?: string}};
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo iniciar la consulta',
          detail: response?.error?.message || 'Revisa el estado del turno e intenta nuevamente.',
        });
      }
    });
  }

  private loadFollowUpStatus(patientId: number): void {
    this.followUpService.getPatientStatus(patientId).subscribe({
      next: (status) => this.followUpStatus = status,
      error: () => this.followUpStatus = undefined
    });
  }

  private loadCommunicationEvents(): void {
    if (this.communicationsLoaded || this.communicationsLoading) {
      return;
    }

    if (!this.appointments.length) {
      this.communicationEvents = [];
      this.communicationsLoaded = true;
      return;
    }

    this.communicationsLoading = true;
    forkJoin(
      this.appointments.slice(0, 30).map((appointment) =>
        this.appointmentService.getAppointmentTimeline(appointment.id).pipe(catchError(() => of([])))
      )
    ).pipe(
      finalize(() => {
        this.communicationsLoading = false;
        this.communicationsLoaded = true;
      })
    ).subscribe((eventsByAppointment) => {
      this.communicationEvents = eventsByAppointment
        .flatMap((events) => events)
        .filter((event) => this.isCommunicationEvent(event))
        .map((event) => this.toCommunicationItem(event))
        .sort((first, second) => new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime());
    });
  }

  private isCommunicationEvent(event: AppointmentTimelineEventResponseDTO): boolean {
    return event.eventType.includes('WHATSAPP') ||
      [
        'APPOINTMENT_CONFIRMED',
        'APPOINTMENT_CANCELED',
        'APPOINTMENT_RESCHEDULED',
        'APPOINTMENT_ABSENT'
      ].includes(event.eventType);
  }

  private toCommunicationItem(event: AppointmentTimelineEventResponseDTO): PatientCommunicationItem {
    const titleByType: Record<string, string> = {
      APPOINTMENT_CONFIRMED: 'Confirmacion registrada',
      APPOINTMENT_CANCELED: 'Cancelacion registrada',
      APPOINTMENT_RESCHEDULED: 'Turno reprogramado',
      APPOINTMENT_ABSENT: 'Ausencia registrada',
      WHATSAPP_MESSAGE_SENT: 'WhatsApp enviado',
      WHATSAPP_MESSAGE_FAILED: 'Error de WhatsApp',
      WHATSAPP_REMINDER_SENT: 'Recordatorio enviado',
      WHATSAPP_REMINDER_FAILED: 'Error de recordatorio',
      WHATSAPP_RESPONSE_RECEIVED: 'Respuesta recibida',
      WHATSAPP_RESPONSE_AMBIGUOUS: 'Respuesta ambigua',
      WHATSAPP_RESPONSE_INVALID: 'Respuesta no reconocida'
    };

    const tone = event.eventType.includes('FAILED') || event.eventType.includes('CANCELED') || event.eventType.includes('ABSENT')
      ? 'danger'
      : event.eventType.includes('CONFIRMED') || event.eventType.includes('RECEIVED')
        ? 'success'
        : 'info';

    return {
      appointmentId: event.appointmentId,
      occurredAt: event.occurredAt,
      title: titleByType[event.eventType] ?? event.eventType,
      detail: event.observations || event.reason || event.responsibleUsername || 'Sin observaciones',
      icon: event.eventType.includes('WHATSAPP') ? 'pi pi-whatsapp' : 'pi pi-calendar',
      tone
    };
  }

  private formatValue(value: number | null | undefined, unit: string): string {
    return value === null || value === undefined ? '-' : `${value}${unit ? ` ${unit}` : ''}`;
  }

  private formatDate(value: string | Date | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat('es-AR').format(date);
  }

  private formatTime(value: unknown): string {
    return formatLocalTime(value);
  }

  private appointmentTime(appointment: AppointmentResponseDTO): number {
    return new Date(`${appointment.date}T${this.formatTime(appointment.time)}:00`).getTime();
  }

  private isTerminalAppointment(status: AppointmentStatus): boolean {
    return [
      AppointmentStatus.CANCELED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.REJECTED,
      AppointmentStatus.ABSENT
    ].includes(status);
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

  private rawValue(key: string, unit: string): string {
    const raw = this.latestAnthropometry?.rawMeasurements;
    if (!raw) {
      return '-';
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw) as Record<string, number>;
        const value = parsed[key];
        return value === undefined ? '-' : `${value} ${unit}`;
      } catch {
        return '-';
      }
    }

    const value = raw[key];
    return value === undefined ? '-' : `${value} ${unit}`;
  }
}
