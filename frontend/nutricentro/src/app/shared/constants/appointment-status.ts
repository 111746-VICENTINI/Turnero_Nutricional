export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PATIENT_PRESENT = 'PATIENT_PRESENT',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
  RESCHEDULED = 'RESCHEDULED',
  ABSENT = 'ABSENT'
}

export const APPOINTMENT_STATUS_OPTIONS = [
  { label: 'Pendiente', value: AppointmentStatus.PENDING },
  { label: 'Confirmado', value: AppointmentStatus.CONFIRMED },
  { label: 'Paciente presente', value: AppointmentStatus.PATIENT_PRESENT },
  { label: 'Completado', value: AppointmentStatus.COMPLETED },
  { label: 'Cancelado', value: AppointmentStatus.CANCELED },
  { label: 'Rechazado', value: AppointmentStatus.REJECTED },
  { label: 'Reprogramado', value: AppointmentStatus.RESCHEDULED },
  { label: 'Ausente', value: AppointmentStatus.ABSENT }
];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'Pendiente',
  [AppointmentStatus.CONFIRMED]: 'Confirmado',
  [AppointmentStatus.PATIENT_PRESENT]: 'Paciente presente',
  [AppointmentStatus.COMPLETED]: 'Completado',
  [AppointmentStatus.CANCELED]: 'Cancelado',
  [AppointmentStatus.REJECTED]: 'Rechazado',
  [AppointmentStatus.RESCHEDULED]: 'Reprogramado',
  [AppointmentStatus.ABSENT]: 'Ausente'
};

export const APPOINTMENT_STATUS_SEVERITY: Record<AppointmentStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
  [AppointmentStatus.PENDING]: 'warn',
  [AppointmentStatus.CONFIRMED]: 'success',
  [AppointmentStatus.PATIENT_PRESENT]: 'success',
  [AppointmentStatus.COMPLETED]: 'info',
  [AppointmentStatus.CANCELED]: 'danger',
  [AppointmentStatus.REJECTED]: 'secondary',
  [AppointmentStatus.RESCHEDULED]: 'info',
  [AppointmentStatus.ABSENT]: 'secondary'
};

export const APPOINTMENT_STATUS_ICON: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'pi pi-clock',
  [AppointmentStatus.CONFIRMED]: 'pi pi-check-circle',
  [AppointmentStatus.PATIENT_PRESENT]: 'pi pi-user-plus',
  [AppointmentStatus.COMPLETED]: 'pi pi-verified',
  [AppointmentStatus.CANCELED]: 'pi pi-ban',
  [AppointmentStatus.REJECTED]: 'pi pi-times-circle',
  [AppointmentStatus.RESCHEDULED]: 'pi pi-calendar-clock',
  [AppointmentStatus.ABSENT]: 'pi pi-user-minus'
};

export const APPOINTMENT_STATUS_CLASS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'status-pending',
  [AppointmentStatus.CONFIRMED]: 'status-confirmed',
  [AppointmentStatus.PATIENT_PRESENT]: 'status-confirmed',
  [AppointmentStatus.COMPLETED]: 'status-completed',
  [AppointmentStatus.CANCELED]: 'status-canceled',
  [AppointmentStatus.REJECTED]: 'status-rejected',
  [AppointmentStatus.RESCHEDULED]: 'status-rescheduled',
  [AppointmentStatus.ABSENT]: 'status-rejected'
};
