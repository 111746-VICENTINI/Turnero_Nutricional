export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
  RESCHEDULED = 'RESCHEDULED'
}

export const APPOINTMENT_STATUS_OPTIONS = [
  { label: 'Pendiente', value: AppointmentStatus.PENDING },
  { label: 'Confirmado', value: AppointmentStatus.CONFIRMED },
  { label: 'Completado', value: AppointmentStatus.COMPLETED },
  { label: 'Cancelado', value: AppointmentStatus.CANCELED },
  { label: 'Rechazado', value: AppointmentStatus.REJECTED },
  { label: 'Reprogramado', value: AppointmentStatus.RESCHEDULED }
];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'Pendiente',
  [AppointmentStatus.CONFIRMED]: 'Confirmado',
  [AppointmentStatus.COMPLETED]: 'Completado',
  [AppointmentStatus.CANCELED]: 'Cancelado',
  [AppointmentStatus.REJECTED]: 'Rechazado',
  [AppointmentStatus.RESCHEDULED]: 'Reprogramado'
};

export const APPOINTMENT_STATUS_SEVERITY: Record<AppointmentStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
  [AppointmentStatus.PENDING]: 'warn',
  [AppointmentStatus.CONFIRMED]: 'success',
  [AppointmentStatus.COMPLETED]: 'info',
  [AppointmentStatus.CANCELED]: 'danger',
  [AppointmentStatus.REJECTED]: 'secondary',
  [AppointmentStatus.RESCHEDULED]: 'info'
};
