import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../core/services/auth-service';
import { TableColumnConfig } from '../../shared/components/table-generic/model/table-model';
import { TableGeneric } from '../../shared/components/table-generic/table-generic';

interface DashboardAppointment {
  hour: string;
  patient: string;
  professional: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule, TableGeneric],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  patientsCount = 0;
  todayAppointments = 2;
  professionalsCount = 0;

  upcomingAppointments: DashboardAppointment[] = [
    { hour: '09:00', patient: 'María González', professional: 'Lic. Ana Pérez' },
    { hour: '10:30', patient: 'Juan Rodríguez', professional: 'Lic. Ana Pérez' },
  ];

  appointmentColumns: TableColumnConfig<DashboardAppointment>[] = [
    { field: 'hour', header: 'Hora', width: '6rem' },
    { field: 'patient', header: 'Paciente' },
    { field: 'professional', header: 'Profesional' },
  ];

  public authService = inject(AuthService);
  actualUser = this.authService.getCurrentUser();

  getFullName(): string {
    return `${this.actualUser?.username || 'usuario'}`;
  }
}
