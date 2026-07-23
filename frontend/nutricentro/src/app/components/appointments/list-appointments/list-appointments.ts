import {CommonModule} from '@angular/common';
import {Component, OnDestroy, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, debounceTime, finalize, takeUntil} from 'rxjs';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {Toast} from 'primeng/toast';
import {TooltipModule} from 'primeng/tooltip';
import {AuthService} from '../../../core/services/auth-service';
import {TableState} from '../../../core/models/paginacion-general';
import {SearchAutocomplete} from '../../../shared/components/search-autocomplete/search-autocomplete';
import {TableGeneric} from '../../../shared/components/table-generic/table-generic';
import {TableActionConfig, TableColumnConfig, TableFilterConfig} from '../../../shared/components/table-generic/model/table-model';
import {APPOINTMENT_STATUS_CLASS, APPOINTMENT_STATUS_ICON, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_OPTIONS, APPOINTMENT_STATUS_SEVERITY, AppointmentStatus} from '../../../shared/enums/appointment-status';
import {PersonStatus} from '../../../shared/enums/person-status';
import {formatLocalTime, toIsoLocalDate} from '../../../shared/utils/date-utils';
import {ProfessionalResponseDTO} from '../../professionals/models/professional-model';
import {ProfessionalScheduleService} from '../../professionals/services/professional-schedule-service';
import {ProfessionalService} from '../../professionals/services/professional-service';
import {SpecialtyResponseDTO} from '../../professionals/specialties/models/specialty-model';
import {SpecialtyService} from '../../professionals/specialties/services/specialty-service';
import {AppointmentDetailDrawer} from '../appointment-detail-drawer/appointment-detail-drawer';
import {AppointmentFilters, AppointmentResponseDTO} from '../models/appointment-model';
import {AppointmentService} from '../services/appointment-service';

type AgendaViewMode = 'day' | 'week' | 'list';

@Component({
  selector: 'app-list-appointments',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    ConfirmDialogModule,
    DatePickerModule,
    SelectModule,
    TagModule,
    Toast,
    TooltipModule,
    SearchAutocomplete,
    TableGeneric,
    AppointmentDetailDrawer
  ],
  templateUrl: './list-appointments.html',
  styleUrl: './list-appointments.css',
  providers: [ConfirmationService]
})
/** Gestiona la agenda operativa de turnos */
export class ListAppointments implements OnDestroy {
  appointment: AppointmentResponseDTO[] = [];
  professionals: ProfessionalResponseDTO[] = [];
  professionalSuggestions: ProfessionalResponseDTO[] = [];
  agendaSearchValue = '';
  agendaSearchSuggestions: string[] = [];
  specialtyOptions: {label: string; value: number | null}[] = [{label: 'Todas las especialidades', value: null}];
  statusOptions = [{label: 'Todos los estados', value: null}, ...APPOINTMENT_STATUS_OPTIONS];
  availableSlots: string[] = [];
  totalRecords = 0;
  loading = false;
  slotsLoading = false;
  viewMode: AgendaViewMode = 'day';
  selectedDate = this.toIsoDate(new Date());
  selectedCalendarDate = this.parseIsoDate(this.selectedDate);
  selectedProfessionalId: number | null = null;
  selectedProfessionalModel?: ProfessionalResponseDTO;
  selectedSpecialtyId: number | null = null;
  selectedStatus: AppointmentStatus | null = null;
  searchTerm = '';
  pageSize = 20;
  selectedAppointmentId?: number;
  detailDrawerVisible = false;
  readonly APPOINTMENT_STATUS_SEVERITY = APPOINTMENT_STATUS_SEVERITY;
  readonly AppointmentStatus = AppointmentStatus;

  private appointmentService = inject(AppointmentService);
  private professionalService = inject(ProfessionalService);
  private professionalScheduleService = inject(ProfessionalScheduleService);
  private specialtyService = inject(SpecialtyService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly agendaSearch$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  readonly textLabel = (item: unknown): string => String(item ?? '');
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

  columns: TableColumnConfig<AppointmentResponseDTO>[] = [
    { field: 'date', header: 'Fecha', width: '8rem' },
    { field: 'time', header: 'Hora', width: '7rem', formatFn: value => this.formatTime(value) },
    { field: 'patientFullName', header: 'Paciente', minWidth: '14rem' },
    { field: 'professionalFullName', header: 'Profesional', minWidth: '14rem' },
    { field: 'reason', header: 'Motivo', minWidth: '16rem' },
    {
      field: 'appliedFee',
      header: 'Costo',
      width: '8rem',
      formatFn: (_value, appointment) => this.formatMoney(appointment?.appliedFee, appointment?.feeCurrency || 'ARS')
    },
    {
      field: 'status',
      header: 'Estado',
      type: 'tag',
      alignCenter: true,
      width: '11rem',
      formatFn: value => this.statusLabel(value as AppointmentStatus),
      tagSeverityFn: value => APPOINTMENT_STATUS_SEVERITY[value as AppointmentStatus],
      tagIconFn: value => APPOINTMENT_STATUS_ICON[value as AppointmentStatus]
    }
  ];

  actions: TableActionConfig<AppointmentResponseDTO>[] = [
    { field: 'view', label: 'Ver detalle', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'history', label: 'Timeline', icon: 'pi pi-history', severity: 'secondary' },
    {
      field: 'edit',
      label: 'Reprogramar',
      icon: 'pi pi-calendar-clock',
      severity: 'info',
      visible: () => this.canManageAppointments
    },
    {
      field: 'delete',
      label: 'Cancelar',
      icon: 'pi pi-ban',
      severity: 'danger',
      visible: () => this.canManageAppointments,
      disabled: appointment => this.isTerminal(appointment.status)
    },
  ];

  filterConfigs: TableFilterConfig[] = [
    {
      field: 'status',
      label: 'Estado',
      placeholder: 'Todos',
      options: this.statusOptions
    }
  ];

  ngOnInit(): void {
    this.restoreAgendaStateFromQuery();
    this.agendaSearch$.pipe(
      debounceTime(250),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadAppointments(0, this.pageSize));
    this.loadSpecialties();
    this.loadProfessionals();
    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isProfessionalWorkspace(): boolean {
    return false;
  }

  get canManageAppointments(): boolean {
    const roles = this.authService.getUserRoles();
    return roles.includes('ADMIN') || roles.includes('SECRETARY') || roles.includes('PROFESSIONAL');
  }

  get canManagePresence(): boolean {
    const roles = this.authService.getUserRoles();
    return this.canManageAppointments || roles.includes('PROFESSIONAL');
  }

  get isProfessionalOnly(): boolean {
    const roles = this.authService.getUserRoles();
    return roles.includes('PROFESSIONAL') && !roles.includes('ADMIN') && !roles.includes('SECRETARY');
  }

  get agendaScopeLabel(): string {
    if (this.isProfessionalOnly) {
      return 'Mi agenda';
    }
    if (this.selectedProfessionalId) {
      return 'Agenda de profesional';
    }
    if (this.selectedSpecialtyId || this.selectedStatus || this.searchTerm) {
      return 'Agenda filtrada';
    }
    return 'Agenda general';
  }

  get selectedProfessionalLabel(): string {
    const professional = this.selectedProfessionalModel
      ?? this.professionals.find(item => item.id === this.selectedProfessionalId);
    return professional ? `${professional.firstName} ${professional.lastName}` : 'Todos los profesionales';
  }

  get selectedSpecialtyLabel(): string {
    if (this.selectedSpecialtyId) {
      return this.specialtyOptions.find(option => option.value === this.selectedSpecialtyId)?.label ?? 'Especialidad seleccionada';
    }
    return this.selectedProfessionalModel ? this.specialtyText(this.selectedProfessionalModel) : 'Todas las especialidades';
  }

  get selectedWeekLabel(): string {
    const [start, end] = this.currentDateRange();
    return `${this.shortDateLabel(start)} - ${this.shortDateLabel(end)}`;
  }

  get selectedDateLabel(): string {
    return this.parseIsoDate(this.selectedDate).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  get selectedRangeLabel(): string {
    if (this.viewMode !== 'week') {
      return this.selectedDateLabel;
    }

    const [start, end] = this.currentDateRange();
    return `${this.shortDateLabel(start)} - ${this.shortDateLabel(end)}`;
  }

  get dailyAppointments(): AppointmentResponseDTO[] {
    return this.sortAppointments(this.appointment.filter(item => item.date === this.selectedDate));
  }

  get nextPatients(): AppointmentResponseDTO[] {
    return this.dailyAppointments.filter(item => [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED].includes(item.status));
  }

  get presentPatients(): AppointmentResponseDTO[] {
    return this.dailyAppointments.filter(item => item.status === AppointmentStatus.PATIENT_PRESENT);
  }

  get finishedPatients(): AppointmentResponseDTO[] {
    return this.dailyAppointments.filter(item => item.status === AppointmentStatus.COMPLETED);
  }

  get absentPatients(): AppointmentResponseDTO[] {
    return this.dailyAppointments.filter(item => item.status === AppointmentStatus.ABSENT);
  }

  get weekDays(): string[] {
    const [start] = this.currentDateRange();
    return Array.from({length: 7}, (_, index) => {
      const date = this.parseIsoDate(start);
      date.setDate(date.getDate() + index);
      return this.toIsoDate(date);
    });
  }

  get visibleStatusCards(): AppointmentStatus[] {
    return [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.PATIENT_PRESENT,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.ABSENT,
      AppointmentStatus.CANCELED
    ];
  }

  get visibleFeeTotal(): number | undefined {
    return this.feeTotal(this.appointment);
  }

  get dailyFeeTotal(): number | undefined {
    return this.feeTotal(this.dailyAppointments);
  }

  get filteredFreeSlots(): string[] {
    const busy = new Set(this.dailyAppointments.map(item => this.formatTime(item.time)));
    return this.availableSlots
      .map(slot => this.formatTime(slot))
      .filter(slot => !busy.has(slot));
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
        this.professionalSuggestions = this.professionals.filter(professional => this.professionalMatchesSpecialty(professional));
        this.selectedProfessionalModel = this.professionals.find(professional => professional.id === this.selectedProfessionalId);
        if (this.isProfessionalOnly) {
          const ownProfessional = this.professionals[0];
          if (ownProfessional) {
            this.selectedProfessionalModel = ownProfessional;
            this.selectedProfessionalId = ownProfessional.id;
            this.professionalSuggestions = [ownProfessional];
            this.persistAgendaState();
            this.loadAppointments(0, this.pageSize);
          }
        }
      },
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Agenda',
        detail: 'No se pudo cargar la lista de profesionales para filtrar la agenda.'
      })
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

  searchProfessionals(event: {query: string}): void {
    if (this.isProfessionalOnly) {
      this.professionalSuggestions = this.selectedProfessionalModel ? [this.selectedProfessionalModel] : [];
      return;
    }

    const query = event.query.trim().toLowerCase();
    this.professionalSuggestions = this.professionals.filter((professional) => {
      const searchable = [
        professional.firstName,
        professional.lastName,
        professional.registration,
        professional.tuition,
        this.specialtyText(professional)
      ].filter(Boolean).join(' ').toLowerCase();
      return this.professionalMatchesSpecialty(professional) && (!query || searchable.includes(query));
    });
  }

  onProfessionalChange(): void {
    if (this.isProfessionalOnly) {
      this.selectedProfessionalId = this.selectedProfessionalModel?.id ?? this.selectedProfessionalId;
      return;
    }
    this.selectedProfessionalId = this.selectedProfessionalModel?.id ?? null;
    this.persistAgendaState();
    this.loadAppointments(0, this.pageSize);
  }

  clearProfessionalFilter(): void {
    if (this.isProfessionalOnly) {
      return;
    }
    this.selectedProfessionalModel = undefined;
    this.selectedProfessionalId = null;
    this.persistAgendaState();
    this.loadAppointments(0, this.pageSize);
  }

  onSpecialtyChange(): void {
    if (this.isProfessionalOnly) {
      this.selectedSpecialtyId = null;
      return;
    }
    if (this.selectedProfessionalModel && !this.professionalMatchesSpecialty(this.selectedProfessionalModel)) {
      this.selectedProfessionalModel = undefined;
      this.selectedProfessionalId = null;
    }
    this.searchProfessionals({query: ''});
    this.persistAgendaState();
    this.loadAppointments(0, this.pageSize);
  }

  loadAppointments(page = 0, size = this.pageSize): void {
    this.loading = true;
    this.pageSize = size;
    const [dateFrom, dateTo] = this.currentDateRange();
    const visualMode = this.viewMode !== 'list';
    const requestPage = visualMode ? 0 : page;
    const requestSize = visualMode ? 100 : size;

    this.appointmentService.searchAppointments(<AppointmentFilters>{
      search: this.searchTerm,
      status: this.selectedStatus ?? undefined,
      professionalId: this.isProfessionalOnly ? undefined : this.selectedProfessionalId ?? undefined,
      dateFrom,
      dateTo,
      page: requestPage,
      size: requestSize,
      sortBy: 'date',
      direction: 'asc'
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response) => {
        this.appointment = response.content;
        this.totalRecords = response.totalElements;
        this.loadAvailableSlots();
      },
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Agenda',
        detail: 'No se pudo cargar la agenda para la fecha seleccionada.'
      })
    });
  }

  completeAgendaSearch(event: {query: string}): void {
    const query = event.query.trim().toLowerCase();
    const values = new Set<string>();
    this.appointment.forEach((appointment) => {
      [
        appointment.patientFullName,
        appointment.professionalFullName,
        appointment.reason,
        appointment.status ? this.statusLabel(appointment.status) : ''
      ].filter(Boolean).forEach(value => values.add(String(value)));
    });
    this.professionals.forEach((professional) => {
      [
        professional.firstName,
        professional.lastName,
        professional.registration,
        professional.tuition,
        this.specialtyText(professional)
      ].filter(Boolean).forEach(value => values.add(String(value)));
    });
    this.agendaSearchSuggestions = [...values]
      .filter(value => !query || value.toLowerCase().includes(query))
      .slice(0, 10);
    if (query && !this.agendaSearchSuggestions.some(value => value.toLowerCase() === query)) {
      this.agendaSearchSuggestions.unshift(event.query.trim());
    }
  }

  onAgendaSearchChange(value: unknown): void {
    this.agendaSearchValue = typeof value === 'string' ? value : this.textLabel(value);
    this.searchTerm = this.agendaSearchValue.trim();
    this.agendaSearch$.next();
  }

  onAgendaSearchSelected(value: unknown): void {
    this.agendaSearchValue = this.textLabel(value);
    this.searchTerm = this.agendaSearchValue.trim();
    this.loadAppointments(0, this.pageSize);
  }

  clearAgendaSearch(): void {
    this.agendaSearchValue = '';
    this.searchTerm = '';
    this.loadAppointments(0, this.pageSize);
  }

  loadAvailableSlots(): void {
    this.availableSlots = [];
    if (!this.selectedProfessionalId) {
      return;
    }

    this.slotsLoading = true;
    this.professionalScheduleService.getAvailableSlots(this.selectedProfessionalId, toIsoLocalDate(this.selectedDate)).pipe(
      finalize(() => this.slotsLoading = false)
    ).subscribe({
      next: (slots) => this.availableSlots = slots,
      error: () => this.messageService.add({
        severity: 'warn',
        summary: 'Horarios',
        detail: 'No existen horarios disponibles para la fecha seleccionada.'
      })
    });
  }

  createAppointment(date = this.selectedDate, time?: string): void {
    this.router.navigate(['/agenda/create'], {
      queryParams: {
        date: toIsoLocalDate(date),
        time,
        professionalId: this.isProfessionalOnly ? undefined : this.selectedProfessionalId ?? undefined,
        returnTo: this.currentAgendaUrl()
      }
    });
  }

  createAppointmentForDay(date: string): void {
    this.selectedDate = toIsoLocalDate(date);
    this.selectedCalendarDate = this.parseIsoDate(this.selectedDate);
    this.persistAgendaState();
    this.createAppointment(date);
  }

  viewAppointment(appointment: AppointmentResponseDTO): void {
    this.selectedAppointmentId = appointment.id;
    this.detailDrawerVisible = true;
  }

  viewHistory(appointment: AppointmentResponseDTO): void {
    this.viewAppointment(appointment);
  }

  openConsultation(appointment: AppointmentResponseDTO): void {
    this.router.navigate(['/medical-history', appointment.patientId], {
      queryParams: {
        tab: 'consultations',
        appointmentId: appointment.id
      }
    });
  }

  onAppointmentUpdated(): void {
    this.loadAppointments(0, this.pageSize);
  }

  cancelAppointment(appointment: AppointmentResponseDTO): void {
    this.confirmationService.confirm({
      message: `Cancelar el turno de ${appointment.patientFullName}?`,
      header: 'Cancelar turno',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cancelar turno',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.appointmentService.deleteAppointment(Number(appointment.id)).subscribe({
          next: () => {
            this.loadAppointments();
            this.showSuccess('Turno cancelado correctamente.');
          },
          error: (error) => this.showError(this.errorMessage(error, 'No se pudo cancelar el turno.'))
        });
      }
    });
  }

  editAppointment(appointment: AppointmentResponseDTO): void {
    this.router.navigate(['/agenda', appointment.id, 'edit']);
  }

  updateAppointmentStatus(appointment: AppointmentResponseDTO, status: AppointmentStatus): void {
    this.appointmentService.updateAppointment(appointment.id, {status}).subscribe({
      next: () => {
        this.showSuccess(this.statusSuccessMessage(status));
        this.loadAppointments(0, this.pageSize);
      },
      error: (error) => this.showError(this.errorMessage(error, 'No se pudo actualizar el turno con el estado seleccionado.'))
    });
  }

  onViewModeChange(mode: AgendaViewMode): void {
    this.viewMode = mode;
    this.persistAgendaState();
    this.loadAppointments(0, this.pageSize);
  }

  onFilterChange(): void {
    this.persistAgendaState();
    this.loadAppointments(0, this.pageSize);
  }

  onTableChange(event: TableState): void {
    const filters = event.filters ?? {};
    const date = filters['date'] ? toIsoLocalDate(filters['date']) : this.selectedDate;

    this.selectedDate = date;
    this.selectedCalendarDate = this.parseIsoDate(date);
    this.searchTerm = event.search || filters['patientFullName'] || filters['professionalFullName'] || filters['reason'] || '';
    this.agendaSearchValue = this.searchTerm;
    this.selectedStatus = filters['status'] ?? this.selectedStatus;

    const page = Math.floor(event.first / event.rows);
    this.persistAgendaState();
    this.loadAppointments(page, event.rows);
  }

  goToPreviousPeriod(): void {
    this.changeSelectedDate(this.viewMode === 'week' ? -7 : -1);
  }

  goToNextPeriod(): void {
    this.changeSelectedDate(this.viewMode === 'week' ? 7 : 1);
  }

  goToToday(): void {
    this.selectedDate = this.toIsoDate(new Date());
    this.selectedCalendarDate = this.parseIsoDate(this.selectedDate);
    this.persistAgendaState();
    this.loadAppointments(0, this.pageSize);
  }

  onSelectedDateChange(value: Date | string | null): void {
    if (!value) {
      return;
    }

    const selectedDate = toIsoLocalDate(value);
    if (selectedDate === this.selectedDate) {
      const selectedCalendarDate = this.parseIsoDate(selectedDate);
      if (selectedCalendarDate.getTime() !== this.selectedCalendarDate.getTime()) {
        this.selectedCalendarDate = selectedCalendarDate;
      }
      return;
    }

    this.selectedDate = selectedDate;
    this.selectedCalendarDate = this.parseIsoDate(this.selectedDate);
    this.persistAgendaState();
    this.loadAppointments(0, this.pageSize);
  }

  appointmentsForDate(date: string): AppointmentResponseDTO[] {
    return this.sortAppointments(this.appointment.filter(item => item.date === date));
  }

  onWeekDayEmptyClick(date: string, event: MouseEvent): void {
    if (!this.canManageAppointments || (event.target as HTMLElement).closest('button')) {
      return;
    }
    this.createAppointmentForDay(date);
  }

  statusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status] ?? status;
  }

  statusIcon(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_ICON[status] ?? 'pi pi-circle';
  }

  statusClass(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_CLASS[status] ?? 'status-muted';
  }

  specialtyText(professional?: ProfessionalResponseDTO): string {
    const specialties = professional?.specialties ?? [];
    return specialties.length ? specialties.map(specialty => specialty.name).join(', ') : 'Sin especialidad';
  }

  statusCount(status: AppointmentStatus): number {
    return this.appointment.filter(appointment => appointment.status === status).length;
  }

  formatTime(value: unknown): string {
    return formatLocalTime(value);
  }

  formatMoney(value?: number, currency = 'ARS'): string {
    if (value === null || value === undefined) {
      return 'No informado';
    }
    const symbol = currency === 'ARS' ? '$' : `${currency} `;
    return `${symbol}${Number(value).toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
  }

  shortDateLabel(value: string): string {
    return this.parseIsoDate(value).toLocaleDateString('es-AR', {day: '2-digit', month: 'short'});
  }

  weekdayLabel(value: string): string {
    return this.parseIsoDate(value).toLocaleDateString('es-AR', {weekday: 'short', day: '2-digit'});
  }

  canConfirm(appointment: AppointmentResponseDTO): boolean {
    return this.canManageAppointments && [AppointmentStatus.PENDING, AppointmentStatus.RESCHEDULED].includes(appointment.status);
  }

  canMarkPresent(appointment: AppointmentResponseDTO): boolean {
    return this.canManagePresence && [AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED].includes(appointment.status);
  }

  canMarkAbsent(appointment: AppointmentResponseDTO): boolean {
    return this.canManagePresence && [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED].includes(appointment.status);
  }

  canCorrectAbsent(appointment: AppointmentResponseDTO): boolean {
    return this.canManagePresence && appointment.status === AppointmentStatus.ABSENT && appointment.date === this.selectedDate;
  }

  canCancel(appointment: AppointmentResponseDTO): boolean {
    return this.canManageAppointments && !this.isTerminal(appointment.status);
  }

  canStartConsultation(appointment: AppointmentResponseDTO): boolean {
    return appointment.status === AppointmentStatus.PATIENT_PRESENT;
  }

  private currentDateRange(): [string, string] {
    if (this.viewMode !== 'week') {
      return [this.selectedDate, this.selectedDate];
    }

    const start = this.parseIsoDate(this.selectedDate);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [this.toIsoDate(start), this.toIsoDate(end)];
  }

  private changeSelectedDate(days: number): void {
    const date = this.parseIsoDate(this.selectedDate);
    date.setDate(date.getDate() + days);
    this.selectedDate = this.toIsoDate(date);
    this.selectedCalendarDate = this.parseIsoDate(this.selectedDate);
    this.persistAgendaState();
    this.loadAppointments(0, this.pageSize);
  }

  private sortAppointments(items: AppointmentResponseDTO[]): AppointmentResponseDTO[] {
    return [...items].sort((first, second) =>
      `${first.date}T${this.formatTime(first.time)}`.localeCompare(`${second.date}T${this.formatTime(second.time)}`)
    );
  }

  private feeTotal(items: AppointmentResponseDTO[]): number | undefined {
    const values = items
      .map(item => item.appliedFee)
      .filter((value): value is number => value !== null && value !== undefined);
    return values.length ? values.reduce((total, value) => total + Number(value), 0) : undefined;
  }

  private isTerminal(status: AppointmentStatus): boolean {
    return [
      AppointmentStatus.CANCELED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.REJECTED,
      AppointmentStatus.ABSENT
    ].includes(status);
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

  private restoreAgendaStateFromQuery(): void {
    const query = this.route.snapshot.queryParamMap;
    const date = query.get('date');
    const view = query.get('view') as AgendaViewMode | null;
    const professionalId = query.get('professionalId');
    const specialtyId = query.get('specialtyId');
    const status = query.get('status') as AppointmentStatus | null;

    if (date) {
      this.selectedDate = toIsoLocalDate(date);
      this.selectedCalendarDate = this.parseIsoDate(this.selectedDate);
    }
    if (view && ['day', 'week', 'list'].includes(view)) {
      this.viewMode = view;
    }
    if (professionalId) {
      this.selectedProfessionalId = Number(professionalId);
    }
    if (specialtyId) {
      this.selectedSpecialtyId = Number(specialtyId);
    }
    if (status) {
      this.selectedStatus = status;
    }
  }

  private persistAgendaState(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        date: this.selectedDate,
        professionalId: this.isProfessionalOnly ? null : this.selectedProfessionalId ?? null,
        specialtyId: this.selectedSpecialtyId ?? null,
        status: this.selectedStatus ?? null,
        view: this.viewMode
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private currentAgendaUrl(): string {
    const queryParams = new URLSearchParams();
    queryParams.set('date', this.selectedDate);
    queryParams.set('view', this.viewMode);
    if (this.selectedProfessionalId && !this.isProfessionalOnly) {
      queryParams.set('professionalId', String(this.selectedProfessionalId));
    }
    if (this.selectedSpecialtyId) {
      queryParams.set('specialtyId', String(this.selectedSpecialtyId));
    }
    if (this.selectedStatus) {
      queryParams.set('status', this.selectedStatus);
    }
    return `/agenda?${queryParams.toString()}`;
  }

  private professionalMatchesSpecialty(professional: ProfessionalResponseDTO): boolean {
    return !this.selectedSpecialtyId
      || (professional.specialties?.some(specialty => specialty.id === this.selectedSpecialtyId) ?? false);
  }

  private statusSuccessMessage(status: AppointmentStatus): string {
    const messages: Partial<Record<AppointmentStatus, string>> = {
      [AppointmentStatus.CONFIRMED]: 'Turno confirmado correctamente.',
      [AppointmentStatus.PATIENT_PRESENT]: 'Paciente marcado como presente.',
      [AppointmentStatus.ABSENT]: 'Paciente marcado como ausente.',
      [AppointmentStatus.COMPLETED]: 'Turno finalizado correctamente.',
      [AppointmentStatus.RESCHEDULED]: 'Turno reprogramado correctamente.'
    };
    return messages[status] ?? 'Turno actualizado correctamente.';
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
    this.messageService.add({severity: 'error', summary: 'Agenda', detail});
  }
}
