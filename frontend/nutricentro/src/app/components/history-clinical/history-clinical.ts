import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { ConfirmationService, MessageService} from 'primeng/api';
import { Button } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { FormGeneric } from '../../shared/components/form-generic/form-generic';
import { GenericFormField } from '../../shared/components/form-generic/model/form-model';
import { HistoryTabs } from './history-tabs/history-tabs';
import {
  AntropometryResponseDTO,
  ConsultationResponseDTO, ContextMetric,
  LaboratoryResponseDTO,
  MedicalHistoryResponseDTO,
  NutritionalDataDTO, PatientCommunicationItem,
} from './models/history-clinical-model';
import { PatientResponseDTO, PatientUpdateDTO } from '../patients/models/patient-model';
import { PatientService } from '../patients/services/patient-service';
import { HistoryClinicalService } from './services/history-clinical-service';
import { Gender_Labels, Gender_Options } from '../../shared/enums/genders';
import { PERSON_STATUS_LABELS, PERSON_STATUS_OPTIONS, PersonStatus } from '../../shared/enums/person-status';
import { AppointmentDetailDrawer } from '../appointments/appointment-detail-drawer/appointment-detail-drawer';
import { AppointmentResponseDTO, AppointmentTimelineEventResponseDTO } from '../appointments/models/appointment-model';
import { AppointmentService } from '../appointments/services/appointment-service';
import { AppointmentStatus } from '../../shared/enums/appointment-status';
import {formatLocalTime, toIsoLocalDate} from '../../shared/utils/date-utils';
import { FollowUpService } from '../../core/services/follow-up-service';
import { PatientFollowUpStatusDTO } from '../../core/models/follow-up-model';
import { AnthropometricEvolutionPanel } from './components/anthropometric-evolution-panel/anthropometric-evolution-panel';

@Component({
  selector: 'app-history-clinical',
  standalone: true,
  imports: [CommonModule, ToastModule, ConfirmDialogModule, DialogModule, FormGeneric, HistoryTabs, Button, AppointmentDetailDrawer, AnthropometricEvolutionPanel],
  providers: [ConfirmationService, MessageService],
  templateUrl: './history-clinical.html',
  styleUrl: './history-clinical.css',
})
export class HistoryClinical implements OnInit {
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);
  private historyService = inject(HistoryClinicalService);
  private appointmentService = inject(AppointmentService);
  private followUpService = inject(FollowUpService);
  private confirmationService = inject(ConfirmationService);
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
  summaryExpanded = false;
  patientEditDialogVisible = false;
  patientSaving = false;
  patientEditInitialValues: Record<string, any> = {};
  readonly patientEditFields: GenericFormField[] = [
    { name: 'firstName', label: 'Nombre', type: 'text', required: true, minLength: 3, maxLength: 100 },
    { name: 'lastName', label: 'Apellido', type: 'text', required: true, minLength: 3, maxLength: 100 },
    { name: 'document', label: 'Documento', type: 'numeric', required: true, pattern: /^[0-9]{7,8}$/ },
    { name: 'birthDate', label: 'Fecha de nacimiento', type: 'date', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'mobile', label: 'Telefono', type: 'numeric', pattern: /^\+?[0-9\s\-]{6,20}$/ },
    { name: 'gender', label: 'Genero', type: 'select', options: Gender_Options },
    { name: 'status', label: 'Estado', type: 'select', options: PERSON_STATUS_OPTIONS },
  ];

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

  get contextConsultation(): ConsultationResponseDTO | undefined {
    if (!this.appointmentContextId) {
      return undefined;
    }

    return this.history?.consultations?.find((consultation) => consultation.appointmentId === this.appointmentContextId);
  }

  get activeConsultation(): ConsultationResponseDTO | undefined {
    const context = this.contextConsultation;
    if (context && context.status !== 'FINALIZADA') {
      return context;
    }

    return this.history?.consultations?.find((consultation) => consultation.status !== 'FINALIZADA');
  }

  get canFinalizeContextConsultation(): boolean {
    return !!this.activeConsultation;
  }

  get isNewPatient(): boolean {
    return !(this.history?.consultations?.length);
  }

  get shouldShowFollowUp(): boolean {
    return !!this.visibleFollowUpStatus;
  }

  get visibleFollowUpStatus(): PatientFollowUpStatusDTO | null {
    if (!this.followUpStatus || this.isNewPatient || this.followUpStatus.status === 'WITHOUT_VALID_CONSULTATION') {
      return null;
    }

    return this.followUpStatus;
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

  get absentCount(): number {
    return this.appointments.filter((appointment) => appointment.status === AppointmentStatus.ABSENT).length;
  }

  get canceledCount(): number {
    return this.appointments.filter((appointment) => appointment.status === AppointmentStatus.CANCELED).length;
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
    return this.latestConsultation?.goal || this.activePlan?.title || 'Objetivo nutricional';
  }

  get nextConsultationText(): string {
    if (this.isNewPatient && !this.nextAppointment) {
      return `Primera consulta ${this.formatDate(new Date())}`;
    }
    return this.nextAppointment
      ? `${this.formatDate(this.nextAppointment.date)} ${this.formatTime(this.nextAppointment.time)}`
      : this.latestConsultation?.nextConsultation || 'Sin turno programado';
  }

  get lastConsultationSummary(): string {
    if (this.isNewPatient) {
      return 'Paciente nuevo';
    }
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
      {
        label: 'Peso',
        value: this.formatValue(latest?.weight, 'kg'),
        trend: this.formatDelta(latest?.weight, this.previousAnthropometry?.weight, 'kg'),
        tone: 'green'
      },
      {
        label: 'IMC',
        value: this.formatValue(latest?.bmi, ''),
        trend: this.formatDelta(latest?.bmi, this.previousAnthropometry?.bmi, ''),
        tone: 'blue'
      },
      {
        label: 'Grasa',
        value: this.formatValue(latest?.bodyFatPercentage, '%'),
        trend: this.formatDelta(latest?.bodyFatPercentage, this.previousAnthropometry?.bodyFatPercentage, '%'),
        tone: 'orange'
      },
      {
        label: 'Musculo',
        value: this.formatValue(latest?.muscleMass, 'kg'),
        trend: this.formatDelta(latest?.muscleMass, this.previousAnthropometry?.muscleMass, 'kg'),
        tone: 'violet'
      },
      {
        label: 'Ultima medicion',
        value: this.formatDate(latest?.date),
        trend: latest?.softwareSource || 'Sin origen',
        tone: 'gray'
      },
    ];
  }

  get laboratoryMetrics(): ContextMetric[] {
    const lab = this.latestLaboratory;
    return [
      {label: 'Glucosa', value: this.formatValue(lab?.glucose, 'mg/dl'), trend: 'Ultimo valor', tone: 'green'},
      {label: 'HDL', value: this.formatValue(lab?.hdl, 'mg/dl'), trend: 'Colesterol protector', tone: 'blue'},
      {label: 'LDL', value: this.formatValue(lab?.ldl, 'mg/dl'), trend: 'Riesgo cardiometabolico', tone: 'orange'},
      {
        label: 'Trigliceridos',
        value: this.formatValue(lab?.triglycerides, 'mg/dl'),
        trend: 'Ultimo valor',
        tone: 'orange'
      },
      {label: 'Fecha', value: this.formatDate(lab?.date), trend: 'Laboratorio reciente', tone: 'gray'},
    ];
  }

  get consultationMetrics(): ContextMetric[] {
    return [
      {
        label: 'Consultas',
        value: String(this.history?.consultations?.length ?? 0),
        trend: 'Registradas',
        tone: 'green'
      },
      {
        label: 'Ultima consulta',
        value: this.formatDate(this.latestConsultation?.date),
        trend: this.latestConsultation?.reason || 'Control',
        tone: 'gray'
      },
      {label: 'Objetivo', value: this.primaryGoal, trend: 'Actual', tone: 'blue'},
      {label: 'Proximo control', value: this.nextConsultationText, trend: 'Agenda', tone: 'orange'},
    ];
  }

  get nutritionMetrics(): ContextMetric[] {
    const nutrition = this.history?.nutritionalData;
    return [
      {
        label: 'Actividad',
        value: nutrition?.physicalActivity || '-',
        trend: nutrition?.activityFrequency || 'Sin frecuencia',
        tone: 'green'
      },
      {label: 'Agua', value: nutrition?.waterIntake || '-', trend: 'Ingesta diaria', tone: 'blue'},
      {
        label: 'Preferencias',
        value: nutrition?.favoriteFoods ? 'Cargadas' : '-',
        trend: 'Alimentos favoritos',
        tone: 'gray'
      },
      {
        label: 'Restricciones',
        value: nutrition?.dislikedFoods ? 'Cargadas' : '-',
        trend: 'Rechazos/intolerancias',
        tone: 'orange'
      },
    ];
  }

  get planMetrics(): ContextMetric[] {
    const plan = this.activePlan;
    return [
      {
        label: 'Plan activo',
        value: plan?.title || '-',
        trend: plan?.active ? 'Activo' : 'Sin plan activo',
        tone: 'green'
      },
      {
        label: 'Plan enviado',
        value: plan?.planDelivered ? 'Si' : 'No',
        trend: plan?.planDeliveredDate ? this.formatDate(plan.planDeliveredDate) : 'Pendiente',
        tone: plan?.planDelivered ? 'green' : this.latestConsultation ? 'orange' : 'gray'
      },
      {label: 'Medio', value: plan?.planDeliveryMedium || '-', trend: 'WhatsApp / Email / PDF', tone: 'blue'},
      {
        label: 'Material',
        value: plan?.menuDelivered ? 'Si' : 'No',
        trend: plan?.menuDeliveredDate ? this.formatDate(plan.menuDeliveredDate) : 'Pendiente',
        tone: plan?.menuDelivered ? 'green' : 'gray'
      },
      {
        label: 'Kcal',
        value: this.formatValue(plan?.totalCalories, 'kcal'),
        trend: 'Totales calculados',
        tone: 'violet'
      },
    ];
  }

  get fileMetrics(): ContextMetric[] {
    const files = this.history?.files ?? [];
    return [
      {label: 'Archivos', value: String(files.length), trend: 'Adjuntos', tone: 'green'},
      {
        label: 'Analisis',
        value: String(files.filter((file) => file.type === 'Analisis').length),
        trend: 'Clasificados',
        tone: 'blue'
      },
      {
        label: 'Antropometria',
        value: String(files.filter((file) => file.type === 'Antropometria').length),
        trend: 'PDFs / informes',
        tone: 'orange'
      },
      {
        label: 'Ultimo archivo',
        value: files[0]?.date ? this.formatDate(files[0].date) : '-',
        trend: files[0]?.originalName || 'Sin adjuntos',
        tone: 'gray'
      },
    ];
  }

  openWhatsApp(): void {
    if (!this.whatsappUrl) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Número no disponible',
        detail: 'Agrega un número de celular.'
      });
      return;
    }

    window.open(this.whatsappUrl, '_blank', 'noopener');
  }

  openEmail(): void {
    const email = this.patient?.email?.trim();
    if (!email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Email no disponible',
        detail: 'El paciente no posee un correo electrónico registrado.'
      });
      return;
    }

    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Historia clinica - ' + this.patientName)}`;
  }

  toggleSummary(): void {
    this.summaryExpanded = !this.summaryExpanded;
  }

  openPatientEditDialog(): void {
    if (!this.patient) {
      return;
    }
    this.patientEditInitialValues = {
      firstName: this.patient.firstName,
      lastName: this.patient.lastName,
      document: this.patient.document,
      birthDate: this.patient.birthDate,
      email: this.patient.email,
      mobile: this.patient.mobile,
      gender: this.patient.gender,
      status: this.patient.status,
    };
    this.patientEditDialogVisible = true;
  }

  closePatientEditDialog(): void {
    if (this.patientSaving) {
      return;
    }
    this.patientEditDialogVisible = false;
  }

  savePatient(values: Record<string, any>): void {
    if (!this.patient) {
      return;
    }
    const request: PatientUpdateDTO = {
      firstName: values['firstName'],
      lastName: values['lastName'],
      document: values['document'],
      birthDate: toIsoLocalDate(values['birthDate']),
      email: values['email'],
      mobile: values['mobile'],
      gender: values['gender'],
      status: values['status'],
      address: this.patient.address,
    };

    this.patientSaving = true;
    this.patientService.updatePatient(this.patient.id, request).subscribe({
      next: (patient) => {
        this.patient = patient;
        if (this.history) {
          this.history = {
            ...this.history,
            patient,
            patientId: patient.id
          };
        }
        this.patientSaving = false;
        this.patientEditDialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Paciente actualizado',
          detail: 'Los datos personales quedaron actualizados.',
        });
      },
      error: () => {
        this.patientSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo actualizar',
          detail: 'Revisa los datos del paciente e intenta nuevamente.',
        });
      },
    });
  }

  selectTab(tab: string): void {
    this.onTabChanged(tab);
    document.querySelector('.clinical-tabs')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  onTabChanged(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {tab},
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

  finalizeContextConsultation(): void {
    const consultation = this.activeConsultation;
    if (!consultation) {
      return;
    }

    this.historyService.updateConsultation(consultation.id, {
      ...consultation,
      date: consultation.date ?? new Date().toISOString().slice(0, 10),
      status: 'FINALIZADA',
      endTime: this.currentTime()
    }).subscribe({
      next: () => {
        this.refreshHistory();
        this.showPostFinalizeDialog();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo finalizar',
          detail: 'Revisa el estado del turno e intenta nuevamente.'
        });
      }
    });
  }

  onConsultationFinalizedFromTab(): void {
    this.showPostFinalizeDialog();
  }

  private showPostFinalizeDialog(): void {
    this.confirmationService.confirm({
      header: 'Consulta finalizada correctamente.',
      message: `La consulta fue finalizada correctamente.\n\nDesea agendar ahora el proximo control de ${this.patientName}?`,
      icon: 'pi pi-calendar-plus',
      acceptLabel: 'Agendar proximo control',
      rejectLabel: 'Volver a Agenda',
      accept: () => this.createNextControlAppointment(),
      reject: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Consulta finalizada',
          detail: 'La consulta fue guardada correctamente.'
        });
        this.router.navigateByUrl(this.agendaReturnUrl());
      }
    });
  }

  private createNextControlAppointment(): void {
    const appointment = this.appointments.find((item) => item.id === this.appointmentContextId);
    this.router.navigate(['/agenda/create'], {
      queryParams: {
        patientId: this.patient?.id,
        professionalId: appointment?.professionalId ?? this.activeConsultation?.professionalId ?? this.history?.professionalId,
        feeType: 'CONTROL',
        returnTo: this.withQueryParam(this.agendaReturnUrl(), 'success', 'next-control'),
        navigateAfterSave: true
      }
    });
  }

  private agendaReturnUrl(): string {
    const configuredReturnTo = this.route.snapshot.queryParamMap.get('returnTo');
    if (configuredReturnTo) {
      return configuredReturnTo;
    }

    const appointment = this.appointments.find((item) => item.id === this.appointmentContextId);
    return appointment?.date ? `/agenda?date=${appointment.date}&view=day` : '/agenda';
  }

  private withQueryParam(url: string, key: string, value: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
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

  private currentTime(): string {
    const date = new Date();
    return [
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0'),
      String(date.getSeconds()).padStart(2, '0')
    ].join(':');
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
      .map((label) => ({label, tone, icon, prefix}));
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
      },
      error: (error) => {
        this.loading = false;
        const response = error as { error?: { message?: string } };
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

    const detail = this.translateAppointmentStatuses(
      event.observations || event.reason || event.responsibleUsername || 'Sin observaciones'
    );

    return {
      appointmentId: event.appointmentId,
      occurredAt: event.occurredAt,
      title: titleByType[event.eventType] ?? event.eventType,
      detail,
      icon: event.eventType.includes('WHATSAPP') ? 'pi pi-whatsapp' : 'pi pi-calendar',
      tone
    };
  }

  private translateAppointmentStatuses(value: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      CANCELED: 'Cancelado',
      PATIENT_PRESENT: 'Paciente presente',
      COMPLETED: 'Consulta finalizada',
      RESCHEDULED: 'Reprogramado',
      ABSENT: 'Ausente',
      REJECTED: 'Rechazado'
    };

    return Object.entries(labels).reduce(
      (text, [status, label]) => text.replace(new RegExp(`\\b${status}\\b`, 'g'), label),
      value
    );
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
}
