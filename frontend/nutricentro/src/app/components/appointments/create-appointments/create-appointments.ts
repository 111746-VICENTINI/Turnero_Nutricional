import {CommonModule} from '@angular/common';
import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, debounceTime, distinctUntilChanged, finalize, takeUntil} from 'rxjs';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {DatePickerModule} from 'primeng/datepicker';
import {DialogModule} from 'primeng/dialog';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {Toast} from 'primeng/toast';
import {FormGeneric} from '../../../shared/components/form-generic/form-generic';
import {GenericFormField} from '../../../shared/components/form-generic/model/form-model';
import {
  APPOINTMENT_STATUS_ICON,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_SEVERITY,
  AppointmentStatus
} from '../../../shared/enums/appointment-status';
import {Gender_Options, GenderType} from '../../../shared/enums/genders';
import {PersonStatus} from '../../../shared/enums/person-status';
import {formatLocalTime, toIsoLocalDate} from '../../../shared/utils/date-utils';
import {isValidEmail} from '../../../shared/utils/email-validation';
import {AuthService} from '../../../core/services/auth-service';
import {PatientResponseDTO} from '../../patients/models/patient-model';
import {PatientService} from '../../patients/services/patient-service';
import {ProfessionalResponseDTO} from '../../professionals/models/professional-model';
import {ProfessionalScheduleService} from '../../professionals/services/professional-schedule-service';
import {ProfessionalService} from '../../professionals/services/professional-service';
import {SpecialtyResponseDTO} from '../../professionals/specialties/models/specialty-model';
import {SpecialtyService} from '../../professionals/specialties/services/specialty-service';
import {
  AppointmentFeeType,
  AppointmentRequestDTO,
  AppointmentResponseDTO,
  AppointmentTimelineEventResponseDTO,
  AppointmentUpdateDTO
} from '../models/appointment-model';
import {AppointmentService} from '../services/appointment-service';

type UserFormMode = 'create' | 'view' | 'edit';
type WhatsAppStatus = 'idle' | 'pending' | 'sent' | 'failed';

@Component({
  selector: 'app-create-appointments',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    ConfirmDialogModule,
    DatePickerModule,
    DialogModule,
    FormGeneric,
    SelectModule,
    TagModule,
    Toast
  ],
  templateUrl: './create-appointments.html',
  styleUrl: './create-appointments.css',
  providers: [ConfirmationService]
})
/** Permite crear o reprogramar turnos desde una pantalla rapida de agenda. */
export class CreateAppointments implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('patientSearchInput') patientSearchInput?: ElementRef<HTMLInputElement>;

  selectedAppointment: AppointmentResponseDTO | null = null;
  mode: UserFormMode = 'create';
  appointmentId?: number;
  isFormEditable = true;
  saving = false;
  searchingPatients = false;
  loadingSlots = false;
  loadingBusySlots = false;
  fields: GenericFormField[] = [];
  initialValues: Record<string, any> = {};
  patientSearch = '';
  patientResults: PatientResponseDTO[] = [];
  selectedPatient?: PatientResponseDTO;
  patientAppointments: AppointmentResponseDTO[] = [];
  creatingPatient = false;
  creatingPatientSaving = false;
  createPatientDialogVisible = false;
  newPatient = this.emptyPatient();
  professionalSearch = '';
  specialtyOptions: {label: string; value: number | null}[] = [{label: 'Todas las especialidades', value: null}];
  selectedSpecialtyId: number | null = null;
  professionals: ProfessionalResponseDTO[] = [];
  selectedProfessional?: ProfessionalResponseDTO;
  selectedDate = this.toIsoDate(new Date());
  selectedCalendarDate = new Date();
  availableSlots: string[] = [];
  occupiedAppointments: AppointmentResponseDTO[] = [];
  selectedTime = '';
  reason = '';
  selectedFeeType: AppointmentFeeType = 'FIRST';
  appliedFee?: number;
  feeCurrency = 'ARS';
  returnTo?: string | null;
  createdAppointment?: AppointmentResponseDTO;
  whatsappStatus: WhatsAppStatus = 'idle';
  whatsappDetail = 'Se usara el telefono del paciente.';
  readonly genderOptions = Gender_Options;
  readonly statusSeverity = APPOINTMENT_STATUS_SEVERITY;
  readonly statusIcon = APPOINTMENT_STATUS_ICON;
  readonly statusLabels = APPOINTMENT_STATUS_LABELS;

  private patientSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentFormValues: Record<string, any> = {};
  private lastSlotLookupKey?: string;
  private appointmentsService = inject(AppointmentService);
  private professionalScheduleService = inject(ProfessionalScheduleService);
  private professionalService = inject(ProfessionalService);
  private specialtyService = inject(SpecialtyService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const routePath = this.route.snapshot.routeConfig?.path || '';

    this.selectedDate = this.route.snapshot.queryParamMap.get('date') || this.selectedDate;
    this.selectedTime = this.route.snapshot.queryParamMap.get('time') || this.selectedTime;
    this.selectedCalendarDate = this.parseIsoDate(this.selectedDate);
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo');
    this.setupPatientSearch();

    if (id) {
      this.mode = routePath.endsWith('/edit') ? 'edit' : 'view';
      this.appointmentId = Number(id);
      this.isFormEditable = this.mode === 'edit';
      this.loadAppointment(this.appointmentId);
    }

    this.buildFields();
    this.loadSpecialties();
    this.loadProfessionals();
    this.loadPatientFromQuery();

    if (this.mode === 'create') {
      this.initialValues = {
        status: AppointmentStatus.PENDING
      };
    }
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.patientSearchInput?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pageTitle(): string {
    if (this.mode === 'edit') {
      return 'Reprogramar turno';
    }
    if (this.mode === 'view') {
      return 'Ver turno';
    }

    return 'Nuevo turno';
  }

  get subtitle(): string {
    return this.mode === 'edit'
      ? 'Usa el mismo flujo rápido para cambiar paciente, profesional, fecha u horario.'
      : 'Buscar paciente, elegir profesional y seleccionar horario libre.';
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Crear' : 'Actualizar';
  }

  get isQuickMode(): boolean {
    return this.mode === 'create' || this.mode === 'edit';
  }

  get filteredProfessionals(): ProfessionalResponseDTO[] {
    const search = this.professionalSearch.trim().toLowerCase();

    return this.professionals.filter((professional) => {
      const fullName = `${professional.firstName} ${professional.lastName} ${professional.registration || ''} ${professional.tuition || ''}`.toLowerCase();
      const specialties = this.specialtyText(professional).toLowerCase();
      const matchesSearch = !search || fullName.includes(search) || specialties.includes(search);
      const matchesSpecialty = !this.selectedSpecialtyId
        || (professional.specialties?.some(specialty => specialty.id === this.selectedSpecialtyId) ?? false);
      return matchesSearch && matchesSpecialty;
    });
  }

  get daysToShow(): string[] {
    const start = this.parseIsoDate(this.selectedDate);
    start.setDate(start.getDate() - 2);
    return Array.from({length: 7}, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return this.toIsoDate(date);
    });
  }

  get nextPatientAppointment(): AppointmentResponseDTO | undefined {
    return this.patientAppointments
      .filter((appointment) => this.appointmentTime(appointment) >= Date.now())
      .filter((appointment) => !this.isTerminal(appointment.status))
      .sort((first, second) => this.appointmentTime(first) - this.appointmentTime(second))[0];
  }

  get lastPatientAppointment(): AppointmentResponseDTO | undefined {
    return [...this.patientAppointments]
      .filter((appointment) => this.appointmentTime(appointment) < Date.now() || this.isTerminal(appointment.status))
      .sort((first, second) => this.appointmentTime(second) - this.appointmentTime(first))[0];
  }

  get canCreateAppointment(): boolean {
    return !!this.selectedPatient && !!this.selectedProfessional && !!this.selectedDate && !!this.selectedTime && !this.saving;
  }

  get selectedProfessionalSpecialty(): string {
    return this.specialtyText(this.selectedProfessional);
  }

  get selectedWeekLabel(): string {
    const selected = this.parseIsoDate(this.selectedDate);
    const day = selected.getDay() || 7;
    const start = new Date(selected);
    start.setDate(selected.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${this.formatDate(this.toIsoDate(start))} - ${this.formatDate(this.toIsoDate(end))}`;
  }

  get selectedPatientPhone(): string {
    return this.selectedPatient?.mobile || this.newPatient.mobile || '-';
  }

  get canEditAppliedFee(): boolean {
    return this.selectedProfessional?.allowAppointmentFeeOverride !== false;
  }

  get isProfessionalOnly(): boolean {
    const roles = this.authService.getUserRoles();
    return roles.includes('PROFESSIONAL') && !roles.includes('ADMIN') && !roles.includes('SECRETARY');
  }

  get selectedDurationLabel(): string {
    return `${this.consultationDurationMinutes(this.selectedFeeType)} minutos`;
  }

  get consecutiveSlotSuggestions(): string[] {
    if (!this.selectedTime) {
      return [];
    }
    const selectedIndex = this.availableSlots
      .map(slot => this.formatTime(slot))
      .findIndex(slot => slot === this.formatTime(this.selectedTime));
    if (selectedIndex < 0) {
      return [];
    }
    return this.availableSlots
      .slice(selectedIndex + 1, selectedIndex + 4)
      .map(slot => this.formatTime(slot));
  }

  get minDate(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  loadAppointment(id: number): void {
    this.appointmentsService.getByIdAppointment(id).subscribe({
      next: (appointment) => {
        this.selectedAppointment = appointment;
        this.selectedDate = appointment.date;
        this.selectedCalendarDate = this.parseIsoDate(appointment.date);
        this.selectedTime = appointment.time;
        this.reason = appointment.reason || '';
        this.selectedFeeType = appointment.feeType || 'FIRST';
        this.appliedFee = appointment.appliedFee;
        this.feeCurrency = appointment.feeCurrency || 'ARS';
        this.initialValues = {
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          reason: appointment.reason,
          patientId: appointment.patientId,
          professionalId: appointment.professionalId,
          secretaryId: appointment.secretaryId,
          patientFullName: appointment.patientFullName,
          professionalFullName: appointment.professionalFullName,
          secretaryFullName: appointment.secretaryFullName
        };
        this.patientService.getByIdPatient(appointment.patientId).subscribe({
          next: (patient) => this.selectPatient(patient),
          error: () => this.showError('No se pudo cargar el paciente del turno.')
        });
        this.professionalService.getByIdProfessional(appointment.professionalId).subscribe({
          next: (professional) => this.selectProfessional(professional, true),
          error: () => this.showError('No se pudo cargar el profesional del turno.')
        });
      },
      error: () => {
        this.showError('No se pudieron cargar los turnos.');
      },
    });
  }

  loadProfessionals(): void {
    this.professionalService.searchProfessionals({
      status: PersonStatus.ACTIVE,
      page: 0,
      size: 100,
      sortBy: 'lastName',
      direction: 'asc'
    }).subscribe({
      next: (response) => {
        this.professionals = response.content;
        const professionalId = Number(this.route.snapshot.queryParamMap.get('professionalId'));
        if (this.isProfessionalOnly && !this.selectedProfessional && this.professionals.length) {
          this.selectProfessional(this.professionals[0], true);
          return;
        }
        if (professionalId && !this.selectedProfessional) {
          const professional = this.professionals.find(item => item.id === professionalId);
          if (professional) {
            this.selectProfessional(professional, true);
          }
        }
      },
      error: () => this.showError('No se pudieron cargar los profesionales.')
    });
  }

  loadSpecialties(): void {
    this.specialtyService.getAllSpecialties().subscribe({
      next: (specialties) => {
        this.specialtyOptions = [
          {label: 'Todas las especialidades', value: null},
          ...specialties
            .filter((specialty: SpecialtyResponseDTO) => specialty.isActive !== false)
            .map((specialty: SpecialtyResponseDTO) => ({label: specialty.name, value: specialty.id}))
        ];
      }
    });
  }

  onSpecialtyChange(): void {
    if (this.selectedProfessional && !this.filteredProfessionals.some(professional => professional.id === this.selectedProfessional?.id)) {
      this.selectedProfessional = undefined;
      this.selectedTime = '';
      this.availableSlots = [];
      this.occupiedAppointments = [];
    }
  }

  loadPatientFromQuery(): void {
    const patientId = Number(this.route.snapshot.queryParamMap.get('patientId'));
    if (!patientId || this.mode !== 'create') {
      return;
    }

    this.patientService.getByIdPatient(patientId).subscribe({
      next: (patient) => {
        this.patientResults = [patient];
        this.selectPatient(patient);
      },
      error: () => this.showError('No se pudo precargar el paciente.')
    });
  }

  onPatientSearchChange(value: string): void {
    this.patientSearch = value;
    if (this.selectedPatient && value.trim() !== `${this.selectedPatient.firstName} ${this.selectedPatient.lastName}`.trim()) {
      this.clearSelectedPatient(value);
    }
    this.patientSearch$.next(value);
  }

  searchPatients(): void {
    const search = this.patientSearch.trim();
    if (search.length < 2) {
      this.patientResults = [];
      return;
    }

    this.searchingPatients = true;
    this.patientService.searchPatients({
      search,
      status: PersonStatus.ACTIVE,
      page: 0,
      size: 8,
      sortBy: 'lastName',
      direction: 'asc'
    }).pipe(
      finalize(() => this.searchingPatients = false)
    ).subscribe({
      next: (page) => this.patientResults = page.content,
      error: () => this.showError('No se pudieron buscar pacientes.')
    });
  }

  selectPatient(patient: PatientResponseDTO): void {
    this.selectedPatient = patient;
    this.patientSearch = `${patient.firstName} ${patient.lastName}`;
    this.creatingPatient = false;
    this.createPatientDialogVisible = false;
    this.loadPatientAppointments(patient.id);
  }

  clearSelectedPatient(searchValue = ''): void {
    this.selectedPatient = undefined;
    this.patientSearch = searchValue;
    this.patientAppointments = [];
    this.selectedTime = '';
    this.createdAppointment = undefined;
    this.whatsappStatus = 'idle';
    this.whatsappDetail = 'Se usara el telefono del paciente.';
  }

  openCreatePatientDialog(): void {
    this.createPatientDialogVisible = true;
  }

  selectProfessional(professional: ProfessionalResponseDTO, keepCurrentTime = false): void {
    this.selectedProfessional = professional;
    if (!keepCurrentTime) {
      this.selectedTime = '';
    }
    this.syncSuggestedFee();
    this.loadAvailability();
  }

  onFeeTypeChange(): void {
    this.appliedFee = this.feeForType(this.selectedFeeType);
    this.selectedTime = '';
    this.loadAvailability();
  }

  onDateChange(value: Date | string | null): void {
    if (!value) {
      return;
    }

    const selectedDate = toIsoLocalDate(value);
    if (this.isPastDate(selectedDate)) {
      this.showError('No se pueden crear turnos en fechas pasadas.');
      this.selectedDate = this.toIsoDate(new Date());
    } else {
      this.selectedDate = selectedDate;
    }
    this.selectedCalendarDate = this.parseIsoDate(this.selectedDate);
    this.selectedTime = '';
    this.loadAvailability();
  }

  selectDay(day: string): void {
    day = toIsoLocalDate(day);
    if (this.isPastDate(day)) {
      this.showError('No se pueden crear turnos en fechas pasadas.');
      return;
    }
    this.selectedDate = day;
    this.selectedCalendarDate = this.parseIsoDate(day);
    this.selectedTime = '';
    this.loadAvailability();
  }

  selectTime(slot: unknown): void {
    this.selectedTime = this.formatTime(slot);
  }

  isSlotOccupied(slot: unknown): boolean {
    return this.occupiedAppointments.some((appointment) => this.formatTime(appointment.time) === this.formatTime(slot));
  }

  createPatientInline(): void {
    if (this.newPatient.email.trim() && !isValidEmail(this.newPatient.email)) {
      this.showError('Ingresa un email valido.');
      return;
    }

    if (!this.canCreatePatientInline()) {
      this.showError('Completa los datos minimos del paciente.');
      return;
    }

    this.creatingPatientSaving = true;
    this.patientService.createPatient({
      firstName: this.newPatient.firstName.trim(),
      lastName: this.newPatient.lastName.trim(),
      birthDate: toIsoLocalDate(this.newPatient.birthDate),
      document: Number(this.newPatient.document),
      mobile: this.newPatient.mobile.trim(),
      gender: this.newPatient.gender,
      email: this.newPatient.email.trim(),
      status: PersonStatus.ACTIVE
    }).pipe(
      finalize(() => this.creatingPatientSaving = false)
    ).subscribe({
      next: (patient) => {
        this.showSuccess('Paciente creado y seleccionado.');
        this.newPatient = this.emptyPatient();
        this.selectPatient(patient);
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo crear el paciente con los datos ingresados.'))
    });
  }

  saveQuickAppointment(): void {
    if (!this.canCreateAppointment) {
      this.showError('Selecciona paciente, profesional y horario.');
      return;
    }
    if (!this.isFutureDateTime(this.selectedDate, this.selectedTime)) {
      this.showError('La fecha y hora del turno deben ser futuras.');
      return;
    }

    this.confirmDuplicateSameDayAppointment(() => this.persistQuickAppointment());
  }

  private persistQuickAppointment(): void {
    this.saving = true;
    this.whatsappStatus = 'pending';
    const request: AppointmentRequestDTO | AppointmentUpdateDTO = {
      date: toIsoLocalDate(this.selectedDate),
      time: this.selectedTime,
      status: this.selectedAppointment?.status ?? AppointmentStatus.PENDING,
      reason: this.reason,
      patientId: this.selectedPatient!.id,
      appliedFee: this.appliedFee,
      feeType: this.selectedFeeType,
      feeCurrency: this.feeCurrency
    };
    if (!this.isProfessionalOnly) {
      request.professionalId = this.selectedProfessional!.id;
    }

    const operation = this.mode === 'edit' && this.appointmentId
      ? this.appointmentsService.updateAppointment(this.appointmentId, request as AppointmentUpdateDTO)
      : this.appointmentsService.createAppointment(request as AppointmentRequestDTO);

    operation.pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: (appointment) => {
        this.createdAppointment = appointment;
        this.selectedAppointment = appointment;
        this.showSuccess(this.mode === 'edit' ? 'Turno actualizado correctamente.' : 'Turno creado correctamente.');
        this.loadAvailability();
        this.loadPatientAppointments(appointment.patientId);
        this.loadWhatsAppResult(appointment.id);
      },
      error: (error) => {
        this.whatsappStatus = 'idle';
        this.showError(this.errorMessage(
          error,
          this.mode === 'edit'
            ? 'No se pudo actualizar el turno con la fecha, horario y profesional seleccionados.'
            : 'No se pudo crear el turno con la fecha, horario y profesional seleccionados.'
        ));
      }
    });
  }

  private confirmDuplicateSameDayAppointment(continueSave: () => void): void {
    if (this.mode !== 'create' || !this.selectedPatient) {
      continueSave();
      return;
    }

    const selectedDate = toIsoLocalDate(this.selectedDate);
    const selectedTime = this.formatTime(this.selectedTime);
    this.appointmentsService.searchAppointments({
      patientId: this.selectedPatient.id,
      dateFrom: selectedDate,
      dateTo: selectedDate,
      page: 0,
      size: 100,
      sortBy: 'time',
      direction: 'asc'
    }).subscribe({
      next: (page) => {
        const hasDuplicateAppointment = page.content.some((appointment) =>
          appointment.id !== this.appointmentId
          && appointment.patientId === this.selectedPatient?.id
          && appointment.date === selectedDate
          && this.formatTime(appointment.time) !== selectedTime
          && !this.isTerminal(appointment.status)
        );

        if (!hasDuplicateAppointment) {
          continueSave();
          return;
        }

        this.confirmationService.confirm({
          message: 'Este paciente ya posee un turno agendado para ese mismo día en otro horario. ¿Desea agendarlo igualmente?',
          header: 'Turno existente',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Agendar igualmente',
          rejectLabel: 'Cancelar',
          accept: continueSave
        });
      },
      error: () => continueSave()
    });
  }

  saveAppointment(formData: Record<string, any>): void {
    this.saving = true;

    if (this.mode !== 'create') {
      const request: AppointmentUpdateDTO = {
        date: toIsoLocalDate(formData['date']),
        time: formData['time'],
        status: formData['status'],
        reason: formData['reason'],
        patientId: formData['patientId'],
        professionalId: this.isProfessionalOnly ? undefined : formData['professionalId'],
        secretaryId: formData['secretaryId']
      };

      this.appointmentsService.updateAppointment(this.appointmentId!, request).subscribe({
        next: () => {
          this.saving = false;
          this.showSuccess('Turno actualizado correctamente.');
          this.navigateBackToContext();
        },
        error: (error) => {
          this.saving = false;
          this.showError(this.errorMessage(error, 'No se pudo actualizar el turno con los datos seleccionados.'));
        },
      });

      return;
    }
  }

  onFormValueChange(values: Record<string, any>): void {
    this.currentFormValues = values;
    if (!this.isFormEditable) {
      return;
    }

    const professionalId = this.isProfessionalOnly
      ? this.selectedProfessional?.id
      : Number(values['professionalId']);
    const date = toIsoLocalDate(values['date']);
    if (!professionalId || !date) {
      this.updateTimeOptions([], values);
      this.lastSlotLookupKey = undefined;
      return;
    }

    const lookupKey = `${professionalId}-${date}-${this.selectedFeeType}`;
    if (lookupKey === this.lastSlotLookupKey) {
      return;
    }
    this.lastSlotLookupKey = lookupKey;

    this.professionalScheduleService.getAvailableSlots(professionalId, date, {
      durationMinutes: this.consultationDurationMinutes(this.selectedFeeType)
    }).subscribe({
      next: (slots) => this.updateTimeOptions(slots, values),
      error: () => {
        this.updateTimeOptions([], values);
        this.showError('No se pudieron cargar los horarios disponibles.');
      }
    });
  }

  cancel(): void {
    if (this.isQuickMode) {
      this.navigateBackToContext();
      return;
    }

    this.initialValues = {
      date: this.selectedAppointment?.date,
      time: this.selectedAppointment?.time,
      status: this.selectedAppointment?.status,
      reason: this.selectedAppointment?.reason,
      patientId: this.selectedAppointment?.patientId,
      professionalId: this.selectedAppointment?.professionalId,
      secretaryId: this.selectedAppointment?.secretaryId
    };

    this.isFormEditable = false;
  }

  goBack(): void {
    this.navigateBackToContext();
  }

  specialtyText(professional?: ProfessionalResponseDTO): string {
    const specialties = professional?.specialties ?? [];
    return specialties.length ? specialties.map(item => item.name).join(', ') : 'Sin especialidad';
  }

  formatTime(value?: unknown): string {
    return formatLocalTime(value);
  }

  formatDate(value?: string | Date | null): string {
    if (!value) {
      return '-';
    }
    return this.parseIsoDate(toIsoLocalDate(value)).toLocaleDateString('es-AR', {day: '2-digit', month: 'short', year: 'numeric'});
  }

  formatMoney(value?: number, currency = this.feeCurrency): string {
    if (value === null || value === undefined) {
      return 'No informado';
    }
    const symbol = currency === 'ARS' ? '$' : `${currency} `;
    return `${symbol}${Number(value).toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
  }

  dayLabel(value: string): string {
    return this.parseIsoDate(value).toLocaleDateString('es-AR', {weekday: 'short', day: '2-digit'});
  }

  whatsappTag(): {label: string; severity: 'success' | 'warn' | 'secondary'; icon: string} {
    if (this.whatsappStatus === 'sent') {
      return {label: 'WhatsApp enviado', severity: 'success', icon: 'pi pi-whatsapp'};
    }
    if (this.whatsappStatus === 'failed') {
      return {label: 'Error al enviar', severity: 'warn', icon: 'pi pi-exclamation-triangle'};
    }
    if (this.whatsappStatus === 'pending') {
      return {label: 'Verificando envio', severity: 'secondary', icon: 'pi pi-spin pi-spinner'};
    }

    return {label: 'Envio automatico', severity: 'secondary', icon: 'pi pi-whatsapp'};
  }

  private setupPatientSearch(): void {
    this.patientSearch$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.searchPatients());
  }

  private loadPatientAppointments(patientId: number): void {
    this.appointmentsService.searchAppointments({
      patientId,
      page: 0,
      size: 20,
      sortBy: 'date',
      direction: 'desc'
    }).subscribe({
      next: (page) => this.patientAppointments = page.content,
      error: () => this.patientAppointments = []
    }).add(() => this.syncSuggestedFee());
  }

  private syncSuggestedFee(): void {
    if (!this.selectedProfessional || this.mode === 'edit') {
      return;
    }

    const hasPreviousWithProfessional = this.patientAppointments
      .some(appointment => appointment.professionalId === this.selectedProfessional?.id
        && appointment.status === AppointmentStatus.COMPLETED);
    this.selectedFeeType = hasPreviousWithProfessional ? 'CONTROL' : 'FIRST';
    this.feeCurrency = this.selectedProfessional.feeCurrency || 'ARS';
    this.appliedFee = this.feeForType(this.selectedFeeType);
  }

  private feeForType(type: AppointmentFeeType): number | undefined {
    if (!this.selectedProfessional) {
      return undefined;
    }
    if (type === 'ONLINE') {
      return this.selectedProfessional.onlineConsultationFee ?? this.selectedProfessional.followUpConsultationFee;
    }
    if (type === 'CONTROL') {
      return this.selectedProfessional.followUpConsultationFee;
    }
    return this.selectedProfessional.firstConsultationFee;
  }

  private consultationDurationMinutes(type?: AppointmentFeeType): number {
    return type === 'FIRST' ? 60 : 30;
  }

  feeTypeLabel(type?: AppointmentFeeType): string {
    const labels: Record<AppointmentFeeType, string> = {
      FIRST: 'Primera consulta',
      CONTROL: 'Control',
      ONLINE: 'Online'
    };
    return type ? labels[type] : '-';
  }

  goToProfessionalAvailability(): void {
    this.router.navigate(['/availability'], {
      queryParams: {
        professionalId: this.isProfessionalOnly ? undefined : this.selectedProfessional?.id,
        date: this.selectedDate,
        returnTo: this.router.url
      }
    });
  }

  private loadAvailability(): void {
    if (!this.selectedProfessional || !this.selectedDate) {
      this.availableSlots = [];
      this.occupiedAppointments = [];
      return;
    }

    this.loadingSlots = true;
    this.professionalScheduleService.getAvailableSlots(this.selectedProfessional.id, toIsoLocalDate(this.selectedDate), {
      durationMinutes: this.consultationDurationMinutes(this.selectedFeeType)
    }).pipe(
      finalize(() => this.loadingSlots = false)
    ).subscribe({
      next: (slots) => this.availableSlots = slots,
      error: () => {
        this.availableSlots = [];
        this.showError('No existen horarios disponibles para la fecha seleccionada.');
      }
    });

    this.loadingBusySlots = true;
    this.appointmentsService.searchAppointments({
      professionalId: this.isProfessionalOnly ? undefined : this.selectedProfessional.id,
      dateFrom: this.selectedDate,
      dateTo: this.selectedDate,
      page: 0,
      size: 100,
      sortBy: 'time',
      direction: 'asc'
    }).pipe(
      finalize(() => this.loadingBusySlots = false)
    ).subscribe({
      next: (page) => this.occupiedAppointments = page.content.filter((appointment) =>
        appointment.id !== this.appointmentId && !this.isTerminal(appointment.status)
      ),
      error: () => this.occupiedAppointments = []
    });
  }

  private loadWhatsAppResult(appointmentId: number): void {
    this.appointmentsService.getAppointmentTimeline(appointmentId).subscribe({
      next: (timeline) => this.applyWhatsAppStatus(timeline),
      error: () => {
        this.whatsappStatus = 'idle';
        this.whatsappDetail = 'Turno creado. No se pudo verificar el envio.';
      }
    });
  }

  private applyWhatsAppStatus(timeline: AppointmentTimelineEventResponseDTO[]): void {
    const lastWhatsApp = [...timeline].reverse().find((event) =>
      event.eventType === 'WHATSAPP_MESSAGE_SENT' || event.eventType === 'WHATSAPP_MESSAGE_FAILED'
    );

    if (!lastWhatsApp) {
      this.whatsappStatus = 'idle';
      this.whatsappDetail = 'Turno creado. Sin evento de WhatsApp registrado aun.';
      return;
    }

    this.whatsappStatus = lastWhatsApp.eventType === 'WHATSAPP_MESSAGE_SENT' ? 'sent' : 'failed';
    this.whatsappDetail = lastWhatsApp.observations || lastWhatsApp.reason || lastWhatsApp.responsibleUsername || 'Evento registrado.';
  }

  private buildFields(): void {
    this.fields = [
      {
        name: 'date',
        label: 'Fecha',
        type: 'date',
        required: true
      },
      {
        name: 'time',
        label: 'Hora',
        type: 'select',
        required: true,
        placeholder: 'Seleccione profesional y fecha',
        options: []
      },
      {
        name: 'patientId',
        label: 'Paciente',
        type: 'text',
        required: true
      },
      {
        name: 'professionalId',
        label: 'Profesional',
        type: 'text',
        required: true
      },
      {
        name: 'reason',
        label: 'Motivo de la consulta',
        type: 'textarea',
        rows: 1,
        colSpan: 2
      }
    ];
  }

  private canCreatePatientInline(): boolean {
    return !!this.newPatient.firstName.trim()
      && !!this.newPatient.lastName.trim()
      && !!this.newPatient.mobile.trim()
      && !!this.newPatient.document
      && !!this.newPatient.birthDate
      && !!this.newPatient.gender;
  }

  private emptyPatient() {
    return {
      firstName: '',
      lastName: '',
      mobile: '',
      document: '',
      birthDate: '',
      gender: GenderType.PREFER_NOT_TO_SAY,
      email: ''
    };
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

  private showSuccess(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Listo', detail });
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Agenda', detail });
  }

  private updateTimeOptions(slots: string[], values: Record<string, any>): void {
    const options = slots.map((slot) => ({
      label: this.formatTime(slot),
      value: slot
    }));
    const selectedTime = options.some((option) => option.value === values['time'])
      ? values['time']
      : null;

    this.initialValues = {
      ...this.initialValues,
      ...values,
      time: selectedTime
    };
    this.fields = this.fields.map((field) =>
      field.name === 'time'
        ? {
            ...field,
            placeholder: options.length ? 'Seleccionar horario' : 'Sin horarios disponibles',
            options
          }
        : field
    );
  }

  private parseIsoDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private appointmentTime(appointment: AppointmentResponseDTO): number {
    return new Date(`${appointment.date}T${this.formatTime(appointment.time)}:00`).getTime();
  }

  private isPastDate(value: string): boolean {
    const today = this.parseIsoDate(this.toIsoDate(new Date()));
    return this.parseIsoDate(value).getTime() < today.getTime();
  }

  private isFutureDateTime(date: string, time: string): boolean {
    return new Date(`${date}T${this.formatTime(time)}:00`).getTime() > Date.now();
  }

  private isTerminal(status: AppointmentStatus): boolean {
    return [
      AppointmentStatus.CANCELED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.REJECTED,
      AppointmentStatus.ABSENT
    ].includes(status);
  }

  private navigateBackToContext(): void {
    if (this.returnTo) {
      this.router.navigateByUrl(this.returnTo);
      return;
    }

    this.router.navigate(['/agenda']);
  }
}
