import { Component, OnInit, inject } from '@angular/core';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth-service';
import {
  AppointmentFilters,
  AppointmentResponseDTO
} from '../../components/appointments/models/appointment-model';
import { AppointmentService } from '../../components/appointments/services/appointment-service';
import { AppointmentStatus } from '../../shared/enums/appointment-status';

interface DashboardMetric {
  label: string;
  value: string;
  icon: string;
  tone: string;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  loading = true;
  loadError = false;
  todayMetrics: DashboardMetric[] = [];
  activityMetrics: DashboardMetric[] = [];
  summaryMetrics: DashboardMetric[] = [];

  public authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  actualUser = this.authService.getCurrentUser();

  ngOnInit(): void {
    this.loadDashboard();
  }

  getFullName(): string {
    return `${this.actualUser?.username || ''}`.trim();
  }

  getDashboardDate(): string {
    return new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  }

  getDashboardTime(): string {
    return new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private loadDashboard(): void {
    const today = this.toIsoDate(new Date());
    const monthStart = this.monthStart(today);
    const monthEnd = this.monthEnd(today);

    forkJoin({
      todayAppointments: this.loadAllAppointments({
        dateFrom: today,
        dateTo: today,
        sortBy: 'time',
        direction: 'asc'
      }),
      completedMonthAppointments: this.loadAllAppointments({
        dateFrom: monthStart,
        dateTo: monthEnd,
        status: AppointmentStatus.COMPLETED,
        sortBy: 'date',
        direction: 'asc'
      }),
      rescheduledMonth: this.countAppointments({
        dateFrom: monthStart,
        dateTo: monthEnd,
        status: AppointmentStatus.RESCHEDULED
      }),
      canceledMonth: this.countAppointments({
        dateFrom: monthStart,
        dateTo: monthEnd,
        status: AppointmentStatus.CANCELED
      }),
      absentMonth: this.countAppointments({
        dateFrom: monthStart,
        dateTo: monthEnd,
        status: AppointmentStatus.ABSENT
      })
    }).subscribe({
      next: (data) => {
        const completedToday = this.countByStatus(data.todayAppointments, AppointmentStatus.COMPLETED);
        const pendingToday = this.countByStatus(data.todayAppointments, AppointmentStatus.PENDING);
        const confirmedToday = this.countByStatus(data.todayAppointments, AppointmentStatus.CONFIRMED);
        const monthIncome = this.monthIncome(data.completedMonthAppointments);
        const completedMonth = data.completedMonthAppointments.length;

        this.todayMetrics = [
          {
            label: 'Ingresos del mes',
            value: this.formatMoney(monthIncome),
            icon: 'pi pi-wallet',
            tone: 'teal',
            description: 'Turnos completados'
          },
          {
            label: 'Turnos del dia',
            value: String(data.todayAppointments.length),
            icon: 'pi pi-calendar-clock',
            tone: 'blue',
            description: 'Agenda de hoy'
          },
          {
            label: 'Pacientes atendidos hoy',
            value: String(completedToday),
            icon: 'pi pi-verified',
            tone: 'green',
            description: 'Turnos completados'
          },
          {
            label: 'Profesionales con agenda',
            value: String(this.activeProfessionals(data.todayAppointments)),
            icon: 'pi pi-id-card',
            tone: 'indigo',
            description: 'Con turnos hoy'
          },
          {
            label: 'Turnos pendientes',
            value: String(pendingToday),
            icon: 'pi pi-clock',
            tone: 'amber',
            description: 'Por confirmar hoy'
          },
          {
            label: 'Turnos confirmados',
            value: String(confirmedToday),
            icon: 'pi pi-check-circle',
            tone: 'green',
            description: 'Agenda confirmada'
          }
        ];
        this.activityMetrics = [
          {
            label: 'Reprogramaciones',
            value: String(data.rescheduledMonth),
            icon: 'pi pi-refresh',
            tone: 'blue',
            description: 'Este mes'
          },
          {
            label: 'Cancelaciones',
            value: String(data.canceledMonth),
            icon: 'pi pi-times-circle',
            tone: 'red',
            description: 'Este mes'
          },
          {
            label: 'Ausentes',
            value: String(data.absentMonth),
            icon: 'pi pi-user-minus',
            tone: 'orange',
            description: 'Este mes'
          }
        ];
        this.summaryMetrics = [
          {
            label: 'Proximo turno',
            value: this.nextAppointmentLabel(data.todayAppointments),
            icon: 'pi pi-arrow-right',
            tone: 'blue',
            description: 'Agenda de hoy'
          },
          {
            label: 'Pacientes atendidos del mes',
            value: String(this.uniquePatients(data.completedMonthAppointments)),
            icon: 'pi pi-users',
            tone: 'green',
            description: 'Con consulta completada'
          },
          {
            label: 'Ingreso promedio',
            value: this.formatMoney(this.averageIncome(monthIncome, completedMonth)),
            icon: 'pi pi-chart-line',
            tone: 'teal',
            description: 'Por consulta completada'
          }
        ];
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  private countAppointments(filters: AppointmentFilters) {
    return this.appointmentService.searchAppointments({
      ...filters,
      page: 0,
      size: 1
    }).pipe(map((page) => page.totalElements));
  }

  private loadAllAppointments(filters: AppointmentFilters) {
    return this.appointmentService.searchAppointments({
      ...filters,
      page: 0,
      size: 100
    }).pipe(
      switchMap((firstPage) => {
        if (firstPage.totalPages <= 1) {
          return of(firstPage.content);
        }

        const pageRequests = Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
          this.appointmentService.searchAppointments({
            ...filters,
            page: index + 1,
            size: 100
          })
        );

        return forkJoin(pageRequests).pipe(
          map((pages) => [
            ...firstPage.content,
            ...pages.flatMap((page) => page.content)
          ])
        );
      })
    );
  }

  private monthIncome(appointments: AppointmentResponseDTO[]): number {
    return appointments.reduce((total, appointment) => total + Number(appointment.appliedFee || 0), 0);
  }

  private averageIncome(total: number, quantity: number): number {
    return quantity ? total / quantity : 0;
  }

  private activeProfessionals(appointments: AppointmentResponseDTO[]): number {
    return new Set(appointments.map((appointment) => appointment.professionalId)).size;
  }

  private uniquePatients(appointments: AppointmentResponseDTO[]): number {
    return new Set(appointments.map((appointment) => appointment.patientId)).size;
  }

  private countByStatus(appointments: AppointmentResponseDTO[], status: AppointmentStatus): number {
    return appointments.filter((appointment) => appointment.status === status).length;
  }

  private nextAppointmentLabel(appointments: AppointmentResponseDTO[]): string {
    const now = new Date();
    const nextAppointment = appointments
      .filter((appointment) => new Date(`${appointment.date}T${appointment.time}`).getTime() >= now.getTime())
      .sort((first, second) => first.time.localeCompare(second.time))[0];

    return nextAppointment ? nextAppointment.time.substring(0, 5) : 'Sin turnos';
  }

  private formatMoney(value: number): string {
    return value.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    });
  }

  private monthStart(value: string): string {
    return `${value.substring(0, 8)}01`;
  }

  private monthEnd(value: string): string {
    const [year, month] = value.split('-').map(Number);
    return this.toIsoDate(new Date(year, month, 0));
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
