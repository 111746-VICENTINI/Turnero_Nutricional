import {
  AppointmentModality,
  AvailabilityExceptionType,
  ProfessionalScheduleBreakDTO,
  WeekDay
} from './professional-schedule-model';

export interface WeekDayConfig {
  key: WeekDay;
  label: string;
  shortLabel: string;
}

export interface ScheduleForm {
  id?: number;
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  bufferMinutes: number;
  maxDailyAppointments?: number;
  modality: AppointmentModality;
  locationKey: string;
  breaks: ProfessionalScheduleBreakDTO[];
}

export interface FeeForm {
  firstConsultationFee?: number;
  followUpConsultationFee?: number;
  onlineConsultationFee?: number;
  feeCurrency: string;
  allowAppointmentFeeOverride: boolean;
}

export interface ExceptionForm {
  id?: number;
  date: string;
  type: AvailabilityExceptionType;
  fullDay: boolean;
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  bufferMinutes?: number;
  maxDailyAppointments?: number;
  modality: AppointmentModality;
  locationKey: string;
  reason: string;
}
