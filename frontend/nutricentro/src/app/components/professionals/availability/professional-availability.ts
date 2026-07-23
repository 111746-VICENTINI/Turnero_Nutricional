import {CommonModule} from '@angular/common';
import {Component, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {forkJoin, finalize} from 'rxjs';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {DatePickerModule} from 'primeng/datepicker';
import {DialogModule} from 'primeng/dialog';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {Toast} from 'primeng/toast';
import {AuthService} from '../../../core/services/auth-service';
import {SearchAutocomplete} from '../../../shared/components/search-autocomplete/search-autocomplete';
import {PersonStatus} from '../../../shared/enums/person-status';
import {formatLocalTime, toIsoLocalDate, toIsoLocalTime} from '../../../shared/utils/date-utils';
import {ProfessionalResponseDTO} from '../models/professional-model';
import {ProfessionalService} from '../services/professional-service';
import {SpecialtyResponseDTO} from '../specialties/models/specialty-model';
import {SpecialtyService} from '../specialties/services/specialty-service';
import {ExceptionForm, FeeForm, ScheduleForm, WeekDayConfig} from '../models/professional-availibility-model';
import {
  AppointmentModality,
  AvailabilityExceptionType,
  ProfessionalAvailabilityExceptionRequestDTO,
  ProfessionalAvailabilityExceptionResponseDTO,
  ProfessionalScheduleBreakDTO,
  ProfessionalScheduleRequestDTO,
  ProfessionalScheduleResponseDTO,
  ProfessionalScheduleUpdateDTO,
  WeekDay, WhatsAppConfigurationStatus
} from '../models/professional-schedule-model';
import {ProfessionalScheduleService} from '../services/professional-schedule-service';

type DayActionMode = 'ADD' | 'REMOVE';
type DayActionScope = 'DAY' | 'WEEK' | 'MONTH' | 'RECURRENT';
type ScheduleDeleteScope = 'DAY' | 'MONTH' | 'RECURRENT';
type ScheduleCreateScope = 'DAY' | 'MONTH' | 'RECURRENT';

@Component({
  selector: 'app-professional-availability',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    ConfirmDialogModule,
    DatePickerModule,
    DialogModule,
    SelectModule,
    TagModule,
    SearchAutocomplete,
    Toast
  ],
  templateUrl: './professional-availability.html',
  styleUrl: './professional-availability.css',
  providers: [ConfirmationService]
})
/** Planifica la disponibilidad semanal y las excepciones de los profesionales. */
export class ProfessionalAvailability implements OnInit {
  readonly weekDays: WeekDayConfig[] = [
    {key: 'MONDAY', label: 'Lunes', shortLabel: 'Lun'},
    {key: 'TUESDAY', label: 'Martes', shortLabel: 'Mar'},
    {key: 'WEDNESDAY', label: 'Miércoles', shortLabel: 'Mie'},
    {key: 'THURSDAY', label: 'Jueves', shortLabel: 'Jue'},
    {key: 'FRIDAY', label: 'Viernes', shortLabel: 'Vie'},
    {key: 'SATURDAY', label: 'Sábado', shortLabel: 'Sab'},
    {key: 'SUNDAY', label: 'Domingo', shortLabel: 'Dom'}
  ];
  readonly modalityOptions = [
    {label: 'Presencial', value: 'IN_PERSON'},
    {label: 'Virtual', value: 'VIRTUAL'},
    {label: 'Hibrida', value: 'HYBRID'}
  ];
  readonly exceptionOptions = [
    {label: 'Bloqueo temporal', value: 'BLOCKED'},
    {label: 'Vacaciones', value: 'VACATION'},
    {label: 'Licencia', value: 'LEAVE'},
    {label: 'Feriado', value: 'HOLIDAY'},
    {label: 'Horario especial', value: 'SPECIAL_HOURS'}
  ];
  readonly dayActionScopeOptions = [
    {label: 'Solo esta semana', value: 'WEEK'},
    {label: 'Aplicar al resto del mes', value: 'MONTH'}
  ];
  professionals: ProfessionalResponseDTO[] = [];
  professionalSuggestions: ProfessionalResponseDTO[] = [];
  specialtyOptions: {label: string; value: number | null}[] = [{label: 'Todas las especialidades', value: null}];
  selectedSpecialtyId: number | null = null;
  selectedProfessionalModel?: ProfessionalResponseDTO;
  selectedProfessionalId?: number;
  schedules: ProfessionalScheduleResponseDTO[] = [];
  exceptionsByDate: Record<string, ProfessionalAvailabilityExceptionResponseDTO[]> = {};
  slotsByDate: Record<string, string[]> = {};
  weekStartDate = this.startOfWeek(new Date());
  calendarDate = new Date();
  loading = false;
  saving = false;
  scheduleDialogVisible = false;
  scheduleChoiceDialogVisible = false;
  feeDialogVisible = false;
  exceptionDialogVisible = false;
  copyDialogVisible = false;
  dayActionDialogVisible = false;
  scheduleDeleteDialogVisible = false;
  dayActionMode: DayActionMode = 'REMOVE';
  dayActionDay: WeekDay = 'MONDAY';
  dayActionScope: DayActionScope = 'DAY';
  scheduleCreateScope: ScheduleCreateScope = 'RECURRENT';
  scheduleToDelete?: ProfessionalScheduleResponseDTO;
  scheduleChoiceDay: WeekDay = 'MONDAY';
  scheduleForm = this.emptyScheduleForm('MONDAY');
  exceptionForm = this.emptyExceptionForm(this.toIsoDate(new Date()));
  copySourceDay: WeekDay = 'MONDAY';
  copyTargets = new Set<WeekDay>();
  enabledWeekendDays = new Set<WeekDay>();
  removedWeekDays = new Set<WeekDay>();
  enabledDates = new Set<string>();
  removedDates = new Set<string>();
  expandedSlotDays = new Set<string>();
  feeForm: FeeForm = this.emptyFeeForm();
  whatsappStatus?: WhatsAppConfigurationStatus;
  testingWhatsApp = false;

  private readonly scheduleService = inject(ProfessionalScheduleService);
  private readonly professionalService = inject(ProfessionalService);
  private readonly specialtyService = inject(SpecialtyService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly breakKeys = new WeakMap<ProfessionalScheduleBreakDTO, string>();
  private nextBreakKey = 0;

  readonly professionalLabel = (item: unknown): string => {
    const professional = item as ProfessionalResponseDTO | undefined;
    return professional ? `${professional.firstName} ${professional.lastName}` : '';
  };
  readonly professionalDetail = (item: unknown): string => {
    const professional = item as ProfessionalResponseDTO | undefined;
    return professional
      ? `${this.specialtyText(professional)} - Matrícula ${professional.registration || professional.tuition || '-'}`
      : '';
  };
  ngOnInit(): void {
    const date = this.route.snapshot.queryParamMap.get('date');
    if (date) {
      this.calendarDate = this.parseIsoDate(toIsoLocalDate(date));
      this.weekStartDate = this.startOfWeek(this.calendarDate);
    }
    this.loadSpecialties();
    this.loadProfessionals();
    this.loadWhatsAppStatus();
  }

  get canEdit(): boolean {
    const roles = this.authService.roles();
    return roles.includes('ADMIN') || roles.includes('PROFESSIONAL');
  }

  get isProfessionalOnly(): boolean {
    const roles = this.authService.roles();
    return roles.includes('PROFESSIONAL') && !roles.includes('ADMIN') && !roles.includes('SECRETARY');
  }

  get selectedProfessional(): ProfessionalResponseDTO | undefined {
    return this.selectedProfessionalModel
      ?? this.professionals.find(professional => professional.id === this.selectedProfessionalId);
  }

  get selectedProfessionalLabel(): string {
    const professional = this.selectedProfessional;
    return professional ? `${professional.firstName} ${professional.lastName}` : 'Seleccionar profesional';
  }

  get weekDates(): string[] {
    return this.weekDays.map((_, index) => {
      const date = new Date(this.weekStartDate);
      date.setDate(this.weekStartDate.getDate() + index);
      return this.toIsoDate(date);
    });
  }

  get visibleWeekDays(): WeekDayConfig[] {
    return this.weekDays.filter(day => {
      const date = this.dayDateByKey(day.key);
      return !this.removedDates.has(date)
      && !this.removedWeekDays.has(day.key)
      && (
        !['SATURDAY', 'SUNDAY'].includes(day.key)
        || this.enabledDates.has(date)
        || this.enabledWeekendDays.has(day.key)
        || this.schedulesFor(day.key).length > 0
      );
    });
  }

  get dayActionOptions(): WeekDayConfig[] {
    return this.availableDaysForAction(this.dayActionMode);
  }

  get dayActionTitle(): string {
    return this.dayActionMode === 'ADD' ? 'Agregar día' : 'Eliminar día';
  }

  get dayActionHelp(): string {
    return this.dayActionMode === 'ADD'
      ? 'Elegir si se agrega unicamente esta semana o tambien al resto del mes visible.'
      : 'Elegir si se elimina unicamente esta semana o tambien al resto del mes visible.';
  }

  get scheduleChoiceDateLabel(): string {
    return this.formatDate(this.dayDateByKey(this.scheduleChoiceDay));
  }

  get scheduleChoiceDayLabel(): string {
    return this.weekDays.find(day => day.key === this.scheduleChoiceDay)?.label ?? 'día seleccionado';
  }

  get scheduleScopeTitle(): string {
    return `Agregar horario para ${this.scheduleChoiceDayLabel}`;
  }

  get totalWeeklySlots(): number {
    return this.visibleWeekDays.reduce((total, day) => {
      const date = this.dayDateByKey(day.key);
      return total + this.slotsFor(date).length;
    }, 0);
  }

  get minDate(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  get feeSummary(): string {
    const professional = this.selectedProfessional;
    if (!professional?.firstConsultationFee && !professional?.followUpConsultationFee && !professional?.onlineConsultationFee) {
      return 'Honorarios no cargados';
    }
    const currency = professional.feeCurrency || 'ARS';
    const first = this.formatMoney(professional.firstConsultationFee, currency);
    const control = this.formatMoney(professional.followUpConsultationFee, currency);
    return `1° Consulta ${first} - Control ${control}`;
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

  loadProfessionals(): void {
    this.professionalService.searchProfessionals({
      status: PersonStatus.ACTIVE,
      page: 0,
      size: 100,
      sortBy: 'lastName',
      direction: 'asc'
    }).subscribe({
      next: (page) => {
        this.professionals = page.content;
        this.professionalSuggestions = page.content;
        const professionalId = Number(this.route.snapshot.queryParamMap.get('professionalId'));
        this.selectedProfessionalModel = this.professionals.find(professional => professional.id === professionalId)
          ?? this.professionals[0];
        this.selectedProfessionalId = this.selectedProfessionalModel?.id;
        this.syncFeeForm();
        this.loadPlanner();
      },
      error: () => this.showError('No se pudieron cargar los profesionales.')
    });
  }

  loadWhatsAppStatus(): void {
    this.scheduleService.getWhatsAppStatus().subscribe({
      next: (status) => this.whatsappStatus = status,
      error: () => this.whatsappStatus = {
        connected: false,
        phoneNumberId: 'No disponible',
        lastSend: 'Sin registro',
        lastError: 'No se pudo obtener el estado'
      }
    });
  }

  testWhatsAppConnection(): void {
    this.testingWhatsApp = true;
    this.scheduleService.testWhatsAppConnection().pipe(
      finalize(() => this.testingWhatsApp = false)
    ).subscribe({
      next: (status) => {
        this.whatsappStatus = {...(this.whatsappStatus ?? status), ...status};
        if (status.connected) {
          this.showSuccess(status.message || 'Conexion de WhatsApp verificada.');
        } else {
          this.showError(status.message || 'No se pudo verificar WhatsApp.');
        }
      },
      error: () => this.showError('No se pudo probar la conexion de WhatsApp.')
    });
  }

  loadPlanner(): void {
    if (!this.selectedProfessionalId) {
      return;
    }

    this.loading = true;
    const professionalId = this.selectedProfessionalId;
    const exceptionRequests = this.weekDates.map(date =>
      this.scheduleService.getExceptionsByProfessionalAndDate(professionalId, date)
    );
    const slotRequests = this.weekDates.map(date =>
      this.scheduleService.getAvailableSlots(professionalId, date)
    );

    forkJoin({
      schedules: this.scheduleService.getByProfessional(professionalId),
      exceptions: forkJoin(exceptionRequests),
      slots: forkJoin(slotRequests)
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: ({schedules, exceptions, slots}) => {
        this.schedules = schedules;
        this.syncRemovedDaysWithLoadedSchedules();
        this.exceptionsByDate = this.weekDates.reduce((accumulator, date, index) => ({
          ...accumulator,
          [date]: exceptions[index] ?? []
        }), {});
        this.slotsByDate = this.weekDates.reduce((accumulator, date, index) => ({
          ...accumulator,
          [date]: slots[index] ?? []
        }), {});
      },
      error: () => this.showError('No se pudo cargar la disponibilidad.')
    });
  }

  onProfessionalChange(): void {
    this.selectedProfessionalId = this.selectedProfessionalModel?.id;
    this.enabledWeekendDays.clear();
    this.removedWeekDays.clear();
    this.enabledDates.clear();
    this.removedDates.clear();
    this.syncFeeForm();
    this.loadPlanner();
  }

  onProfessionalCleared(): void {
    this.selectedProfessionalModel = undefined;
    this.selectedProfessionalId = undefined;
    this.enabledWeekendDays.clear();
    this.removedWeekDays.clear();
    this.enabledDates.clear();
    this.removedDates.clear();
    this.schedules = [];
    this.slotsByDate = {};
    this.exceptionsByDate = {};
    this.syncFeeForm();
  }

  onSpecialtyChange(): void {
    if (this.selectedProfessionalModel && !this.professionalMatchesSpecialty(this.selectedProfessionalModel)) {
      this.selectedProfessionalModel = undefined;
      this.selectedProfessionalId = undefined;
      this.removedWeekDays.clear();
      this.enabledDates.clear();
      this.removedDates.clear();
      this.schedules = [];
      this.slotsByDate = {};
      this.exceptionsByDate = {};
    }
    this.searchProfessionals({query: ''});
  }

  searchProfessionals(event: {query: string}): void {
    const term = event.query.trim().toLowerCase();
    this.professionalSuggestions = this.professionals.filter(professional => {
      const fullName = `${professional.firstName} ${professional.lastName}`.toLowerCase();
      const registration = `${professional.registration || ''} ${professional.tuition || ''}`.toLowerCase();
      const specialties = this.specialtyText(professional).toLowerCase();
      return this.professionalMatchesSpecialty(professional)
        && (!term || fullName.includes(term) || registration.includes(term) || specialties.includes(term));
    });
  }

  onWeekChange(value: Date | string | null): void {
    if (!value) {
      return;
    }
    const date = this.parseIsoDate(toIsoLocalDate(value));
    const nextWeekStart = this.startOfWeek(date);
    const sameWeek = this.toIsoDate(nextWeekStart) === this.toIsoDate(this.weekStartDate);
    const sameCalendarDate = this.toIsoDate(date) === this.toIsoDate(this.calendarDate);

    if (sameWeek && sameCalendarDate) {
      return;
    }

    this.weekStartDate = nextWeekStart;
    this.calendarDate = sameCalendarDate ? this.calendarDate : new Date(date);

    if (!sameWeek) {
      this.loadPlanner();
    }
  }

  moveWeek(days: number): void {
    const next = new Date(this.weekStartDate);
    next.setDate(this.weekStartDate.getDate() + days);
    this.weekStartDate = this.startOfWeek(next);
    this.calendarDate = new Date(this.weekStartDate);
    this.loadPlanner();
  }

  goToToday(): void {
    const today = new Date();
    this.weekStartDate = this.startOfWeek(today);
    this.calendarDate = today;
    this.loadPlanner();
  }

  schedulesFor(day: WeekDay): ProfessionalScheduleResponseDTO[] {
    return this.schedules
      .filter(schedule => schedule.dayOfWeek === day && schedule.status === PersonStatus.ACTIVE)
      .sort((first, second) => first.startTime.localeCompare(second.startTime));
  }

  visibleSchedulesFor(day: WeekDay): ProfessionalScheduleResponseDTO[] {
    const date = this.dayDateByKey(day);
    return this.hasFullDayBlock(date)
      ? []
      : this.schedulesFor(day).filter(schedule => !this.isScheduleRemovedForDate(schedule, date));
  }

  exceptionsFor(date: string): ProfessionalAvailabilityExceptionResponseDTO[] {
    return this.exceptionsByDate[date] ?? [];
  }

  slotsFor(date: string): string[] {
    if (this.hasFullDayBlock(date)) {
      return [];
    }
    return this.slotsByDate[date] ?? [];
  }

  visibleSlotsFor(date: string): string[] {
    const slots = this.slotsFor(date);
    return this.expandedSlotDays.has(date) ? slots : slots.slice(0, 6);
  }

  toggleSlots(date: string): void {
    if (this.expandedSlotDays.has(date)) {
      this.expandedSlotDays.delete(date);
      return;
    }
    this.expandedSlotDays.add(date);
  }

  openDayAction(mode: DayActionMode): void {
    const options = this.availableDaysForAction(mode);
    if (!options.length) {
      this.showError(mode === 'ADD'
        ? 'No hay días disponibles para agregar.'
        : 'No hay días visibles para eliminar.');
      return;
    }
    this.dayActionMode = mode;
    this.dayActionDay = options[0].key;
    this.dayActionScope = 'WEEK';
    this.dayActionDialogVisible = true;
  }

  applyDayAction(): void {
    const config = this.weekDays.find(item => item.key === this.dayActionDay);
    if (!config) {
      return;
    }
    const dateError = this.validateDayActionDate(this.dayActionDay, this.dayActionMode);
    if (dateError) {
      this.showError(dateError);
      return;
    }

    if (this.dayActionMode === 'ADD') {
      this.addDay(this.dayActionDay, this.dayActionScope);
      this.dayActionDialogVisible = false;
      return;
    }

    this.confirmationService.confirm({
      message: this.dayActionScope === 'MONTH'
        ? `Eliminar la atencion de los ${config.label.toLowerCase()} restantes del mes visible?`
        : `Eliminar la atencion del ${config.label.toLowerCase()} solo en esta semana?`,
      header: 'Eliminar día',
      icon: 'pi pi-calendar-times',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.dayActionDialogVisible = false;
        this.deleteDay(this.dayActionDay, this.dayActionScope);
      }
    });
  }

  openScheduleDialog(day: WeekDay, schedule?: ProfessionalScheduleResponseDTO): void {
    if (this.isPastDate(this.dayDateByKey(day))) {
      this.showError(schedule
        ? 'No es posible modificar una disponibilidad correspondiente a una fecha pasada.'
        : 'No es posible agregar horarios para una fecha pasada.');
      return;
    }

    if (!schedule) {
      this.scheduleChoiceDay = day;
      this.scheduleCreateScope = 'RECURRENT';
      this.scheduleChoiceDialogVisible = true;
      return;
    }

    this.scheduleForm = schedule
      ? {
          id: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: this.formatTime(schedule.startTime),
          endTime: this.formatTime(schedule.endTime),
          slotDurationMinutes: schedule.slotDurationMinutes,
          bufferMinutes: schedule.bufferMinutes ?? 0,
          maxDailyAppointments: schedule.maxDailyAppointments,
          modality: schedule.modality ?? 'IN_PERSON',
          locationKey: schedule.locationKey ?? '',
          breaks: [...(schedule.breaks ?? [])].map(item => ({
            startTime: this.formatTime(item.startTime),
            endTime: this.formatTime(item.endTime)
          }))
        }
      : this.emptyScheduleForm(day);
    this.scheduleDialogVisible = true;
  }

  openHabitualSchedule(day = this.scheduleChoiceDay): void {
    this.openScheduleFormForScope(day, 'RECURRENT');
  }

  openMonthSchedule(day = this.scheduleChoiceDay): void {
    this.openScheduleFormForScope(day, 'MONTH');
  }

  openSingleDateSchedule(day = this.scheduleChoiceDay): void {
    this.openScheduleFormForScope(day, 'DAY');
  }

  private openScheduleFormForScope(day: WeekDay, scope: ScheduleCreateScope): void {
    if (this.isPastDate(this.dayDateByKey(day))) {
      this.showError('No es posible agregar horarios para una fecha pasada.');
      return;
    }

    this.scheduleChoiceDialogVisible = false;
    this.scheduleCreateScope = scope;
    this.scheduleForm = this.emptyScheduleForm(day);
    this.scheduleDialogVisible = true;
  }

  openFeeDialog(): void {
    this.syncFeeForm();
    this.feeDialogVisible = true;
  }

  saveProfessionalFees(): void {
    const professional = this.selectedProfessional;
    if (!professional) {
      this.showError('Selecciona un profesional para configurar honorarios.');
      return;
    }
    const feeError = this.validateFeeForm();
    if (feeError) {
      this.showError(feeError);
      return;
    }

    this.saving = true;
    this.professionalService.updateProfessional(professional.id, {
      firstName: professional.firstName,
      lastName: professional.lastName,
      birthDate: toIsoLocalDate(professional.birthDate),
      mobile: professional.mobile,
      gender: professional.gender,
      email: professional.email,
      registration: professional.registration,
      status: professional.status,
      document: professional.document,
      tuition: professional.tuition,
      specialtyIds: professional.specialties?.map(item => item.id) ?? [],
      firstConsultationFee: this.optionalMoney(this.feeForm.firstConsultationFee),
      followUpConsultationFee: this.optionalMoney(this.feeForm.followUpConsultationFee),
      onlineConsultationFee: this.optionalMoney(this.feeForm.onlineConsultationFee),
      feeCurrency: this.feeForm.feeCurrency || 'ARS',
      allowAppointmentFeeOverride: this.feeForm.allowAppointmentFeeOverride
    }).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: (updated) => {
        this.professionals = this.professionals.map(item => item.id === updated.id ? updated : item);
        this.selectedProfessionalModel = updated;
        this.selectedProfessionalId = updated.id;
        this.feeDialogVisible = false;
        this.showSuccess('Honorarios actualizados.');
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudieron guardar los honorarios.'))
    });
  }

  saveSchedule(): void {
    const validationError = this.validateScheduleForm();
    if (!this.selectedProfessionalId || validationError) {
      this.showError(validationError || 'Selecciona un profesional para guardar el bloque.');
      return;
    }
    const scheduleDate = this.dayDateByKey(this.scheduleForm.dayOfWeek);
    if (this.isPastDate(scheduleDate)) {
      this.showError(this.scheduleForm.id
        ? 'No es posible modificar una disponibilidad correspondiente a una fecha pasada.'
        : 'No es posible agregar horarios para una fecha pasada.');
      return;
    }

    const previousDay = this.scheduleForm.id
      ? this.schedules.find(schedule => schedule.id === this.scheduleForm.id)?.dayOfWeek
      : undefined;
    const request: ProfessionalScheduleRequestDTO = {
      professionalId: this.selectedProfessionalId,
      dayOfWeek: this.scheduleForm.dayOfWeek,
      startTime: toIsoLocalTime(this.scheduleForm.startTime),
      endTime: toIsoLocalTime(this.scheduleForm.endTime),
      slotDurationMinutes: this.scheduleForm.slotDurationMinutes,
      bufferMinutes: this.optionalPositiveInteger(this.scheduleForm.bufferMinutes),
      maxDailyAppointments: this.optionalPositiveInteger(this.scheduleForm.maxDailyAppointments),
      modality: this.scheduleForm.modality,
      locationKey: this.scheduleForm.locationKey || undefined,
      breaks: this.normalizedBreaks(this.scheduleForm.breaks),
      status: PersonStatus.ACTIVE
    };
    if (!this.scheduleForm.id && this.scheduleCreateScope !== 'RECURRENT') {
      this.saveScopedSpecialHours(request, this.scheduleCreateScope);
      return;
    }

    this.saving = true;
    const operation = this.scheduleForm.id
      ? this.scheduleService.updateSchedule(this.scheduleForm.id, this.toScheduleUpdateRequest(request))
      : this.scheduleService.createSchedule(request);

    operation.pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: (savedSchedule) => {
        this.upsertSchedule(savedSchedule);
        this.scheduleDialogVisible = false;
        this.showSuccess(this.scheduleForm.id
          ? 'Horario actualizado correctamente.'
          : 'Horario agregado correctamente.');
        this.refreshScheduleDays(previousDay, savedSchedule.dayOfWeek);
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo guardar el bloque.'))
    });
  }

  deleteSchedule(schedule: ProfessionalScheduleResponseDTO, date: string): void {
    if (!this.canEdit) {
      return;
    }
    if (this.isPastDate(date)) {
      this.showError('No es posible modificar una disponibilidad correspondiente a una fecha pasada.');
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea desactivar este bloque?\nSe eliminará el horario habitual.',
      header: 'Desactivar bloque',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteRecurringSchedule(schedule)
    });
  }

  private saveScopedSpecialHours(request: ProfessionalScheduleRequestDTO, scope: ScheduleCreateScope): void {
    const dates = this.datesForScope(request.dayOfWeek, scope);
    if (!dates.length) {
      this.showError('No hay fechas futuras para aplicar este horario.');
      return;
    }

    const exceptionRequests = dates.map(date => this.scheduleService.createException({
      professionalId: request.professionalId,
      date,
      type: 'SPECIAL_HOURS',
      startTime: request.startTime,
      endTime: request.endTime,
      slotDurationMinutes: request.slotDurationMinutes,
      bufferMinutes: request.bufferMinutes,
      maxDailyAppointments: request.maxDailyAppointments,
      modality: request.modality,
      locationKey: request.locationKey,
      reason: scope === 'DAY'
        ? 'Horario agregado solo para este día'
        : 'Horario agregado para este mes',
      status: PersonStatus.ACTIVE
    }));

    this.saving = true;
    forkJoin(exceptionRequests).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.scheduleDialogVisible = false;
        dates.forEach(date => this.refreshDate(date));
        this.showSuccess(scope === 'DAY'
          ? 'Horario agregado para este día.'
          : 'Horarios agregados para este mes.');
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo guardar el horario para el alcance seleccionado.'))
    });
  }

  private toScheduleUpdateRequest(request: ProfessionalScheduleRequestDTO): ProfessionalScheduleUpdateDTO {
    return {
      dayOfWeek: request.dayOfWeek,
      startTime: request.startTime,
      endTime: request.endTime,
      slotDurationMinutes: request.slotDurationMinutes,
      bufferMinutes: request.bufferMinutes,
      maxDailyAppointments: request.maxDailyAppointments,
      modality: request.modality,
      locationKey: request.locationKey,
      breaks: request.breaks,
      status: request.status
    };
  }

  addBreak(): void {
    this.scheduleForm.breaks = [
      ...this.scheduleForm.breaks,
      {startTime: this.scheduleForm.startTime, endTime: this.scheduleForm.startTime}
    ];
  }

  removeBreak(index: number): void {
    this.scheduleForm.breaks = this.scheduleForm.breaks.filter((_, itemIndex) => itemIndex !== index);
  }

  breakTrackKey(scheduleBreak: ProfessionalScheduleBreakDTO): string {
    if (scheduleBreak.id) {
      return `break-${scheduleBreak.id}`;
    }
    let key = this.breakKeys.get(scheduleBreak);
    if (!key) {
      key = `draft-break-${++this.nextBreakKey}`;
      this.breakKeys.set(scheduleBreak, key);
    }
    return key;
  }

  openCopyDialog(day: WeekDay): void {
    this.copySourceDay = day;
    this.copyTargets = new Set(this.weekDays.map(item => item.key).filter(item => item !== day));
    this.copyDialogVisible = true;
  }

  toggleCopyTarget(day: WeekDay): void {
    if (this.copyTargets.has(day)) {
      this.copyTargets.delete(day);
      return;
    }
    this.copyTargets.add(day);
  }

  applyCopy(): void {
    const sourceSchedules = this.schedulesFor(this.copySourceDay);
    if (!this.selectedProfessionalId || !sourceSchedules.length || !this.copyTargets.size) {
      this.showError('Seleccione un día para copiar los horarios.');
      return;
    }

    this.saving = true;
    const requests = [...this.copyTargets].flatMap(day =>
      sourceSchedules.map(schedule => this.scheduleService.createSchedule({
        professionalId: this.selectedProfessionalId!,
        dayOfWeek: day,
        startTime: toIsoLocalTime(schedule.startTime),
        endTime: toIsoLocalTime(schedule.endTime),
        slotDurationMinutes: schedule.slotDurationMinutes,
        bufferMinutes: schedule.bufferMinutes,
        maxDailyAppointments: this.optionalPositiveInteger(schedule.maxDailyAppointments),
        modality: schedule.modality,
        locationKey: schedule.locationKey,
        breaks: this.normalizedBreaks(schedule.breaks ?? []),
        status: PersonStatus.ACTIVE
      }))
    );

    forkJoin(requests).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.copyDialogVisible = false;
        this.showSuccess('Horarios copiados.');
        this.loadPlanner();
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudieron copiar algunos horarios. Revisa superposiciones existentes.'))
    });
  }

  openExceptionDialog(date: string, type: AvailabilityExceptionType = 'BLOCKED'): void {
    if (this.isPastDate(date)) {
      this.showError('No es posible bloquear un horario correspondiente a una fecha pasada.');
      return;
    }
    this.exceptionForm = this.emptyExceptionForm(date, type);
    this.exceptionDialogVisible = true;
  }

  onExceptionTypeChange(): void {
    if (this.exceptionForm.type === 'SPECIAL_HOURS') {
      this.exceptionForm.fullDay = false;
      this.exceptionForm.startTime ||= '09:00';
      this.exceptionForm.endTime ||= '13:00';
      this.exceptionForm.slotDurationMinutes ||= 30;
      this.exceptionForm.bufferMinutes ??= 0;
      return;
    }

    this.exceptionForm.fullDay = true;
  }

  saveException(): void {
    if (!this.selectedProfessionalId || !this.exceptionForm.date || !this.exceptionForm.type) {
      this.showError('Completa fecha y tipo de excepcion.');
      return;
    }
    if (this.isPastDate(this.exceptionForm.date)) {
      this.showError(this.exceptionForm.type === 'BLOCKED'
        ? 'No es posible bloquear un horario correspondiente a una fecha pasada.'
        : 'No es posible modificar una disponibilidad correspondiente a una fecha pasada.');
      return;
    }

    const request: ProfessionalAvailabilityExceptionRequestDTO = {
      professionalId: this.selectedProfessionalId,
      date: this.exceptionForm.date,
      type: this.exceptionForm.type,
      startTime: this.exceptionForm.type !== 'SPECIAL_HOURS' && this.exceptionForm.fullDay
        ? undefined
        : toIsoLocalTime(this.exceptionForm.startTime),
      endTime: this.exceptionForm.type !== 'SPECIAL_HOURS' && this.exceptionForm.fullDay
        ? undefined
        : toIsoLocalTime(this.exceptionForm.endTime),
      slotDurationMinutes: this.exceptionForm.type === 'SPECIAL_HOURS'
        ? this.optionalPositiveInteger(this.exceptionForm.slotDurationMinutes)
        : undefined,
      bufferMinutes: this.exceptionForm.type === 'SPECIAL_HOURS'
        ? this.optionalPositiveInteger(this.exceptionForm.bufferMinutes)
        : undefined,
      maxDailyAppointments: this.exceptionForm.type === 'SPECIAL_HOURS'
        ? this.optionalPositiveInteger(this.exceptionForm.maxDailyAppointments)
        : undefined,
      modality: this.exceptionForm.type === 'SPECIAL_HOURS'
        ? this.exceptionForm.modality
        : undefined,
      locationKey: this.exceptionForm.locationKey || undefined,
      reason: this.exceptionForm.reason,
      status: PersonStatus.ACTIVE
    };

    const validationError = this.validateExceptionRequest(request);
    if (validationError) {
      this.showError(validationError);
      return;
    }

    this.saving = true;
    this.scheduleService.createException(request).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: (createdException) => {
        this.exceptionsByDate = {
          ...this.exceptionsByDate,
          [createdException.date]: [
            ...(this.exceptionsByDate[createdException.date] ?? []),
            createdException
          ]
        };
        this.exceptionDialogVisible = false;
        this.showSuccess(this.exceptionForm.type === 'BLOCKED'
          ? 'Horario bloqueado correctamente.'
          : 'Disponibilidad actualizada correctamente.');
        this.refreshDate(createdException.date);
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo actualizar la disponibilidad para la fecha seleccionada.'))
    });
  }

  deleteException(exception: ProfessionalAvailabilityExceptionResponseDTO): void {
    if (!this.canEdit || !exception.id) {
      return;
    }
    if (this.isPastDate(exception.date)) {
      this.showError('No es posible eliminar un bloque correspondiente a una fecha pasada.');
      return;
    }

    this.confirmationService.confirm({
      message: 'Desea eliminar esta excepcion?',
      header: 'Eliminar excepcion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.scheduleService.deleteException(exception.id!).subscribe({
          next: () => {
            this.exceptionsByDate = {
              ...this.exceptionsByDate,
              [exception.date]: (this.exceptionsByDate[exception.date] ?? [])
                .filter(item => item.id !== exception.id)
            };
            this.showSuccess(exception.type === 'BLOCKED'
              ? 'Horario desbloqueado correctamente.'
              : 'Horario eliminado correctamente.');
            this.refreshDate(exception.date);
          },
          error: (error) => this.showError(this.errorMessage(error, 'No se pudo eliminar el horario.'))
        });
      }
    });
  }

  unblockDay(date: string): void {
    const blocks = this.fullDayBlockExceptions(date);
    if (!blocks.length) {
      this.refreshDate(date);
      return;
    }

    this.saving = true;
    forkJoin(blocks.map(block => this.scheduleService.deleteException(block.id!))).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.exceptionsByDate = {
          ...this.exceptionsByDate,
          [date]: (this.exceptionsByDate[date] ?? []).filter(exception =>
            !blocks.some(block => block.id === exception.id)
          )
        };
        this.showSuccess('Día desbloqueado correctamente.');
        this.refreshDate(date);
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo desbloquear el día.'))
    });
  }

  dayDate(index: number): string {
    return this.weekDates[index];
  }

  dayDateByKey(day: WeekDay): string {
    const index = this.weekDays.findIndex(item => item.key === day);
    return this.weekDates[index] ?? this.weekDates[0];
  }

  formatDate(value: string): string {
    return this.parseIsoDate(value).toLocaleDateString('es-AR', {day: '2-digit', month: 'short'});
  }

  formatTime(value?: unknown): string {
    const formatted = formatLocalTime(value);
    return formatted === '-' ? '' : formatted;
  }

  modalityLabel(modality?: AppointmentModality): string {
    const labels: Record<AppointmentModality, string> = {
      IN_PERSON: 'Presencial',
      VIRTUAL: 'Virtual',
      HYBRID: 'Hibrida'
    };
    return labels[modality ?? 'IN_PERSON'];
  }

  weekDayLabel(day: WeekDay): string {
    return this.weekDays.find(item => item.key === day)?.label ?? day;
  }

  specialtyText(professional?: ProfessionalResponseDTO): string {
    const specialties = professional?.specialties ?? [];
    return specialties.length ? specialties.map(item => item.name).join(', ') : 'Sin especialidad';
  }

  exceptionLabel(type?: AvailabilityExceptionType): string {
    const labels: Record<AvailabilityExceptionType, string> = {
      BREAK: 'Pausa',
      VACATION: 'Vacaciones',
      LEAVE: 'Licencia',
      HOLIDAY: 'Feriado',
      BLOCKED: 'Bloqueo',
      SPECIAL_HOURS: 'Horario especial'
    };
    return type ? labels[type] : 'Excepcion';
  }

  exceptionSeverity(type?: AvailabilityExceptionType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (type === 'SPECIAL_HOURS') {
      return 'success';
    }
    if (type === 'VACATION' || type === 'LEAVE') {
      return 'danger';
    }
    if (type === 'HOLIDAY') {
      return 'info';
    }
    return 'warn';
  }

  private emptyScheduleForm(day: WeekDay): ScheduleForm {
    return {
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '13:00',
      slotDurationMinutes: 30,
      bufferMinutes: 0,
      modality: 'IN_PERSON',
      locationKey: '',
      breaks: []
    };
  }

  private emptyFeeForm(): FeeForm {
    return {
      feeCurrency: 'ARS',
      allowAppointmentFeeOverride: true
    };
  }

  private syncFeeForm(): void {
    const professional = this.selectedProfessional;
    this.feeForm = {
      firstConsultationFee: professional?.firstConsultationFee,
      followUpConsultationFee: professional?.followUpConsultationFee,
      onlineConsultationFee: professional?.onlineConsultationFee,
      feeCurrency: professional?.feeCurrency || 'ARS',
      allowAppointmentFeeOverride: professional?.allowAppointmentFeeOverride !== false
    };
  }

  private professionalMatchesSpecialty(professional: ProfessionalResponseDTO): boolean {
    return !this.selectedSpecialtyId
      || (professional.specialties?.some(specialty => specialty.id === this.selectedSpecialtyId) ?? false);
  }

  hasFullDayBlock(date: string): boolean {
    return this.exceptionsFor(date).some(exception =>
      exception.type !== 'SPECIAL_HOURS' && !exception.startTime && !exception.endTime
    );
  }

  fullDayBlockReason(date: string): string | null {
    return this.exceptionsFor(date)
      .filter(exception => exception.type !== 'SPECIAL_HOURS' && !exception.startTime && !exception.endTime)
      .map(exception => exception.reason?.trim())
      .find(Boolean) ?? null;
  }

  private upsertSchedule(savedSchedule: ProfessionalScheduleResponseDTO): void {
    const index = this.schedules.findIndex(schedule => schedule.id === savedSchedule.id);
    this.schedules = index >= 0
      ? this.schedules.map(schedule => schedule.id === savedSchedule.id ? savedSchedule : schedule)
      : [...this.schedules, savedSchedule];
  }

  private refreshScheduleDays(...days: (WeekDay | undefined)[]): void {
    [...new Set(days.filter(Boolean) as WeekDay[])]
      .forEach(day => this.refreshDate(this.dayDateByKey(day)));
  }

  private refreshDate(date: string): void {
    if (!this.selectedProfessionalId) {
      return;
    }
    const professionalId = this.selectedProfessionalId;
    forkJoin({
      exceptions: this.scheduleService.getExceptionsByProfessionalAndDate(professionalId, date),
      slots: this.scheduleService.getAvailableSlots(professionalId, date)
    }).subscribe({
      next: ({exceptions, slots}) => {
        this.exceptionsByDate = {...this.exceptionsByDate, [date]: exceptions};
        this.slotsByDate = {...this.slotsByDate, [date]: slots};
      },
      error: () => this.showError('No se pudo actualizar la disponibilidad del día.')
    });
  }

  private availableDaysForAction(mode: DayActionMode): WeekDayConfig[] {
    if (mode === 'REMOVE') {
      return this.visibleWeekDays.filter(day => !this.isPastDate(this.dayDateByKey(day.key)));
    }
    return this.weekDays.filter(day =>
      !this.isPastDate(this.dayDateByKey(day.key))
      && (
        this.removedDates.has(this.dayDateByKey(day.key))
        || !this.visibleWeekDays.some(visibleDay => visibleDay.key === day.key)
      )
    );
  }

  private validateDayActionDate(day: WeekDay, mode: DayActionMode): string | null {
    if (!this.isPastDate(this.dayDateByKey(day))) {
      return null;
    }
    return mode === 'ADD'
      ? 'No es posible agregar un dia correspondiente a una fecha pasada.'
      : 'No es posible eliminar un dia correspondiente a una fecha pasada.';
  }

  private addDay(day: WeekDay, scope: DayActionScope = 'WEEK'): void {
    const scopedDates = this.datesForScope(day, scope);
    if (scope !== 'RECURRENT' && !scopedDates.length) {
      this.showError('No es posible agregar un dia correspondiente a una fecha pasada.');
      return;
    }
    const removableBlocks = scopedDates.flatMap(date => this.removableBlockExceptions(date));

    if (scope !== 'RECURRENT' && removableBlocks.length) {
      this.saving = true;
      forkJoin(removableBlocks.map(exception => this.scheduleService.deleteException(exception.id!))).pipe(
        finalize(() => this.saving = false)
      ).subscribe({
        next: () => {
          this.showDay(day);
          scopedDates.forEach(date => this.refreshDate(date));
          this.showSuccess('Día agregado correctamente.');
        },
        error: (error) => this.showError(this.errorMessage(error, 'No se pudo agregar el día porque existe un bloqueo activo.'))
      });
      return;
    }

    this.showDay(day);
    scopedDates.forEach(date => this.refreshDate(date));
    this.showSuccess('Día agregado correctamente.');
  }

  private showDay(day: WeekDay): void {
    const date = this.dayDateByKey(day);
    this.removedDates.delete(date);
    this.enabledDates.add(date);
    this.removedWeekDays.delete(day);
    if (day === 'SATURDAY' || day === 'SUNDAY') {
      this.enabledWeekendDays.add(day);
    }
  }

  private deleteDay(day: WeekDay, scope: DayActionScope = 'WEEK'): void {
    if (this.isPastDate(this.dayDateByKey(day))) {
      this.showError('No es posible eliminar un dia correspondiente a una fecha pasada.');
      return;
    }
    if (scope !== 'RECURRENT') {
      this.removeDaySchedulesWithExceptions(day, scope);
      return;
    }

    const date = this.dayDateByKey(day);
    const schedules = this.schedulesFor(day);
    const exceptions = this.exceptionsFor(date).filter(exception => exception.id && !this.isPastDate(exception.date));
    const requests = [
      ...schedules.map(schedule => this.scheduleService.deleteSchedule(schedule.id)),
      ...exceptions.map(exception => this.scheduleService.deleteException(exception.id!))
    ];

    if (!requests.length) {
      this.enabledWeekendDays.delete(day);
      this.removedWeekDays.add(day);
      this.exceptionsByDate = {...this.exceptionsByDate, [date]: []};
      this.slotsByDate = {...this.slotsByDate, [date]: []};
      this.showSuccess('Día eliminado correctamente.');
      return;
    }

    this.saving = true;
    forkJoin(requests).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.enabledWeekendDays.delete(day);
        this.removedWeekDays.add(day);
        this.schedules = this.schedules.filter(schedule => schedule.dayOfWeek !== day);
        this.exceptionsByDate = {...this.exceptionsByDate, [date]: []};
        this.slotsByDate = {...this.slotsByDate, [date]: []};
        this.showSuccess('Día eliminado correctamente.');
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo eliminar el día.'))
    });
  }

  private deleteRecurringSchedule(schedule: ProfessionalScheduleResponseDTO): void {
    this.saving = true;
    this.scheduleService.deleteSchedule(schedule.id).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.schedules = this.schedules.filter(item => item.id !== schedule.id);
        this.scheduleDeleteDialogVisible = false;
        this.scheduleToDelete = undefined;
        this.showSuccess('Horario eliminado correctamente.');
        this.refreshScheduleDays(schedule.dayOfWeek);
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo eliminar el horario.'))
    });
  }

  private removeScheduleForDate(schedule: ProfessionalScheduleResponseDTO, date: string): void {
    if (!this.selectedProfessionalId) {
      this.showError('Selecciona un profesional para desactivar el bloque.');
      return;
    }
    if (this.isPastDate(date)) {
      this.showError('No se puede desactivar la disponibilidad de una fecha pasada.');
      return;
    }
    if (this.hasScheduleRemovalException(schedule, date)) {
      this.showSuccess('Horario eliminado correctamente.');
      return;
    }

    this.saving = true;
    this.scheduleService.createException({
      professionalId: this.selectedProfessionalId,
      date,
      type: 'BLOCKED',
      startTime: this.formatTime(schedule.startTime),
      endTime: this.formatTime(schedule.endTime),
      reason: 'Horario eliminado desde disponibilidad',
      status: PersonStatus.ACTIVE
    }).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.refreshDate(date);
        this.showSuccess('Horario eliminado correctamente.');
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo eliminar el horario para esta fecha.'))
    });
  }

  private removeScheduleWithExceptions(schedule: ProfessionalScheduleResponseDTO, scope: ScheduleDeleteScope): void {
    if (!this.selectedProfessionalId) {
      this.showError('Selecciona un profesional para desactivar el bloque.');
      return;
    }

    const dates = this.datesForScope(schedule.dayOfWeek, scope)
      .filter(date => !this.hasScheduleRemovalException(schedule, date));
    if (scope !== 'RECURRENT' && !dates.length) {
      this.showError('No es posible modificar una disponibilidad correspondiente a una fecha pasada.');
      return;
    }

    if (!dates.length) {
      this.scheduleDeleteDialogVisible = false;
      this.scheduleToDelete = undefined;
      this.showSuccess('Horario eliminado correctamente.');
      return;
    }

    this.saving = true;
    forkJoin(dates.map(date => this.scheduleService.createException({
      professionalId: this.selectedProfessionalId!,
      date,
      type: 'BLOCKED',
      startTime: this.formatTime(schedule.startTime),
      endTime: this.formatTime(schedule.endTime),
      reason: 'Horario eliminado desde disponibilidad',
      status: PersonStatus.ACTIVE
    }))).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.scheduleDeleteDialogVisible = false;
        this.scheduleToDelete = undefined;
        dates.forEach(date => this.refreshDate(date));
        this.showSuccess('Horario eliminado correctamente.');
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo eliminar el horario para el alcance seleccionado.'))
    });
  }

  private removeDaySchedulesWithExceptions(day: WeekDay, scope: DayActionScope): void {
    if (!this.selectedProfessionalId) {
      this.showError('Selecciona un profesional para eliminar el día.');
      return;
    }

    const schedules = this.schedulesFor(day);
    const dates = this.datesForScope(day, scope);
    if (!dates.length) {
      this.showError('No es posible eliminar un dia correspondiente a una fecha pasada.');
      return;
    }
    const requests = dates.flatMap(date =>
      schedules
        .filter(schedule => !this.hasScheduleRemovalException(schedule, date))
        .map(schedule => this.scheduleService.createException({
          professionalId: this.selectedProfessionalId!,
          date,
          type: 'BLOCKED' as AvailabilityExceptionType,
          startTime: this.formatTime(schedule.startTime),
          endTime: this.formatTime(schedule.endTime),
          reason: 'Horario eliminado desde disponibilidad',
          status: PersonStatus.ACTIVE
        }))
    );

    if (!requests.length) {
      this.enabledWeekendDays.delete(day);
      dates.forEach(date => this.removedDates.add(date));
      dates.forEach(date => this.refreshDate(date));
      this.showSuccess('Dia eliminado correctamente.');
      return;
    }

    this.saving = true;
    forkJoin(requests).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.enabledWeekendDays.delete(day);
        dates.forEach(date => this.removedDates.add(date));
        dates.forEach(date => this.refreshDate(date));
        this.showSuccess('Dia eliminado correctamente.');
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo eliminar el día para el alcance seleccionado.'))
    });
  }

  private blockDayWithExceptions(day: WeekDay, scope: DayActionScope): void {
    if (!this.selectedProfessionalId) {
      this.showError('Selecciona un profesional para eliminar el dia.');
      return;
    }

    const dates = this.datesForScope(day, scope)
      .filter(date => !this.hasFullDayBlock(date));
    if (!dates.length) {
      this.showSuccess('Día eliminado correctamente.');
      return;
    }

    this.saving = true;
    forkJoin(dates.map(date => this.scheduleService.createException({
      professionalId: this.selectedProfessionalId,
      date,
      type: 'BLOCKED',
      reason: 'Día eliminado desde disponibilidad',
      status: PersonStatus.ACTIVE
    }))).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.showDay(day);
        dates.forEach(date => this.refreshDate(date));
        this.showSuccess('Día eliminado correctamente.');
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo eliminar el día para el alcance seleccionado.'))
    });
  }

  private datesForScope(day: WeekDay, scope: DayActionScope): string[] {
    if (scope === 'RECURRENT') {
      return [];
    }
    if (scope === 'DAY' || scope === 'WEEK') {
      const date = this.dayDateByKey(day);
      return this.isPastDate(date) ? [] : [date];
    }

    const monthDate = new Date(this.calendarDate);
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const dates: string[] = [];
    while (date.getMonth() === monthDate.getMonth()) {
      const isoDate = this.toIsoDate(date);
      if (this.weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1]?.key === day && !this.isPastDate(isoDate)) {
        dates.push(isoDate);
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  }

  private fullDayBlockExceptions(date: string): ProfessionalAvailabilityExceptionResponseDTO[] {
    return this.exceptionsFor(date).filter(exception =>
      !!exception.id
      && exception.type !== 'SPECIAL_HOURS'
      && !exception.startTime
      && !exception.endTime
      && !this.isPastDate(exception.date)
    );
  }

  private removableBlockExceptions(date: string): ProfessionalAvailabilityExceptionResponseDTO[] {
    return this.exceptionsFor(date).filter(exception =>
      !!exception.id
      && exception.type !== 'SPECIAL_HOURS'
      && !this.isPastDate(exception.date)
    );
  }

  private isScheduleRemovedForDate(schedule: ProfessionalScheduleResponseDTO, date: string): boolean {
    return this.hasScheduleRemovalException(schedule, date);
  }

  private hasScheduleRemovalException(schedule: ProfessionalScheduleResponseDTO, date: string): boolean {
    const startTime = this.formatTime(schedule.startTime);
    const endTime = this.formatTime(schedule.endTime);

    return this.exceptionsFor(date).some(exception =>
      exception.type !== 'SPECIAL_HOURS'
      && !!exception.startTime
      && !!exception.endTime
      && this.formatTime(exception.startTime) <= startTime
      && endTime <= this.formatTime(exception.endTime)
    );
  }

  private syncRemovedDaysWithLoadedSchedules(): void {
    this.weekDays.forEach(day => {
      if (this.schedulesFor(day.key).length) {
        this.removedWeekDays.delete(day.key);
      }
    });
  }

  private emptyExceptionForm(date: string, type: AvailabilityExceptionType = 'BLOCKED'): ExceptionForm {
    return {
      date,
      type,
      fullDay: type !== 'SPECIAL_HOURS',
      startTime: '09:00',
      endTime: '13:00',
      slotDurationMinutes: 30,
      bufferMinutes: 0,
      modality: 'IN_PERSON',
      locationKey: '',
      reason: ''
    };
  }

  private validateScheduleForm(): string | null {
    if (!this.scheduleForm.dayOfWeek || !this.scheduleForm.startTime || !this.scheduleForm.endTime) {
      return 'Completá día, inicio y fin del bloque.';
    }
    if (this.scheduleForm.startTime >= this.scheduleForm.endTime) {
      return 'La hora de inicio debe ser anterior a la hora de finalizacion.';
    }
    if (!this.scheduleForm.slotDurationMinutes || this.scheduleForm.slotDurationMinutes < 15) {
      return 'La duración mínima de un turno es de 15 minutos.';
    }
    if (this.scheduleForm.bufferMinutes !== undefined && this.scheduleForm.bufferMinutes < 0) {
      return 'El tiempo entre pacientes no puede ser negativo.';
    }
    const maxDailyAppointments = this.optionalPositiveInteger(this.scheduleForm.maxDailyAppointments);
    if (this.hasValue(this.scheduleForm.maxDailyAppointments) && maxDailyAppointments === undefined) {
      return 'El maximo diario debe ser un número entero.';
    }
    if (maxDailyAppointments !== undefined && maxDailyAppointments < 1) {
      return 'El máximo diario de pacientes debe ser mayor a cero.';
    }

    const rangeMinutes = this.minutesBetween(this.scheduleForm.startTime, this.scheduleForm.endTime);
    if (rangeMinutes < this.scheduleForm.slotDurationMinutes) {
      return 'La franja horaria es menor que la duración del turno.';
    }

    const overlappingSchedule = this.schedulesFor(this.scheduleForm.dayOfWeek)
      .filter(schedule => schedule.id !== this.scheduleForm.id)
      .some(schedule => this.scheduleForm.startTime < this.formatTime(schedule.endTime)
        && this.formatTime(schedule.startTime) < this.scheduleForm.endTime);
    if (overlappingSchedule) {
      return 'El horario seleccionado se superpone con otro bloque existente.';
    }

    const breaks = this.normalizedBreaks(this.scheduleForm.breaks);
    for (const scheduleBreak of breaks) {
      if (scheduleBreak.startTime >= scheduleBreak.endTime) {
        return 'Cada pausa debe tener inicio anterior al fin.';
      }
      if (scheduleBreak.startTime < this.scheduleForm.startTime || scheduleBreak.endTime > this.scheduleForm.endTime) {
        return 'Las pausas deben estar dentro del bloque horario.';
      }
    }
    for (let i = 0; i < breaks.length; i++) {
      for (let j = i + 1; j < breaks.length; j++) {
        if (breaks[i].startTime < breaks[j].endTime && breaks[j].startTime < breaks[i].endTime) {
          return 'Las pausas no pueden superponerse.';
        }
      }
    }
    return null;
  }

  private validateExceptionRequest(request: ProfessionalAvailabilityExceptionRequestDTO): string | null {
    if (!this.isValidException(request)) {
      return request.type === 'SPECIAL_HOURS'
        ? 'El horario especial requiere inicio, fin y duracion de turno.'
        : 'La excepcion requiere un rango horario valido.';
    }

    if (request.type !== 'SPECIAL_HOURS' || !request.startTime || !request.endTime) {
      return null;
    }

    const day = this.dayKeyForDate(request.date);
    const overlapsRegularSchedule = this.schedulesFor(day).some(schedule =>
      this.rangesOverlap(
        request.startTime!,
        request.endTime!,
        this.formatTime(schedule.startTime),
        this.formatTime(schedule.endTime)
      )
    );
    if (overlapsRegularSchedule) {
      return 'El horario seleccionado se superpone con otro bloque existente.';
    }

    const overlapsSpecialHours = this.exceptionsFor(request.date).some(exception =>
      exception.type === 'SPECIAL_HOURS'
      && !!exception.startTime
      && !!exception.endTime
      && this.rangesOverlap(
        request.startTime!,
        request.endTime!,
        this.formatTime(exception.startTime),
        this.formatTime(exception.endTime)
      )
    );
    if (overlapsSpecialHours) {
      return 'El horario seleccionado se superpone con otro bloque existente.';
    }

    return null;
  }

  private isValidException(request: ProfessionalAvailabilityExceptionRequestDTO): boolean {
    if (request.type === 'SPECIAL_HOURS') {
      return !!request.startTime
        && !!request.endTime
        && request.startTime < request.endTime
        && !!request.slotDurationMinutes
        && request.slotDurationMinutes >= 15;
    }
    if (request.startTime || request.endTime) {
      return !!request.startTime && !!request.endTime && request.startTime < request.endTime;
    }
    return true;
  }

  private dayKeyForDate(value: string): WeekDay {
    const date = this.parseIsoDate(value);
    return this.weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1].key;
  }

  private rangesOverlap(start: string, end: string, otherStart: string, otherEnd: string): boolean {
    return start < otherEnd && otherStart < end;
  }

  private isPastDate(value: string): boolean {
    const today = this.startOfDay(new Date());
    return this.parseIsoDate(value).getTime() < today.getTime();
  }

  private normalizedBreaks(breaks: ProfessionalScheduleBreakDTO[]): ProfessionalScheduleBreakDTO[] {
    return breaks
      .filter(item => item.startTime && item.endTime)
      .map(item => ({
        startTime: toIsoLocalTime(item.startTime),
        endTime: toIsoLocalTime(item.endTime)
      }));
  }

  private validateFeeForm(): string | null {
    if (this.isNegative(this.feeForm.firstConsultationFee)) {
      return 'El valor de primera consulta no puede ser negativo.';
    }
    if (this.isNegative(this.feeForm.followUpConsultationFee)) {
      return 'El valor de consulta de control no puede ser negativo.';
    }
    if (this.isNegative(this.feeForm.onlineConsultationFee)) {
      return 'El valor de consulta online no puede ser negativo.';
    }
    return null;
  }

  private isNegative(value?: number): boolean {
    return value !== null && value !== undefined && Number(value) < 0;
  }

  private optionalPositiveInteger(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : undefined;
  }

  private hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  private optionalMoney(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private minutesBetween(start: string, end: string): number {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  }

  private startOfWeek(date: Date): Date {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
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

  private formatMoney(value?: number, currency = 'ARS'): string {
    if (value === null || value === undefined) {
      return 'No informado';
    }
    const symbol = currency === 'ARS' ? '$' : `${currency} `;
    return `${symbol}${Number(value).toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
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
    this.messageService.add({severity: 'success', summary: 'Listo', detail});
  }

  private showError(detail: string): void {
    this.messageService.add({severity: 'error', summary: 'Disponibilidad', detail});
  }
}
