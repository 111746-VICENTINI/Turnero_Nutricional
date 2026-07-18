import {PersonStatus} from '../../../shared/enums/person-status';

export type AppointmentModality = 'IN_PERSON' | 'VIRTUAL' | 'HYBRID';
export type AvailabilityExceptionType = 'BREAK' | 'VACATION' | 'LEAVE' | 'HOLIDAY' | 'BLOCKED' | 'SPECIAL_HOURS';
export type WeekDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface ProfessionalScheduleBreakDTO {
  id?: number;
  startTime: string;
  endTime: string;
}

export interface ProfessionalScheduleRequestDTO {
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  bufferMinutes?: number;
  maxDailyAppointments?: number;
  modality?: AppointmentModality;
  locationKey?: string;
  breaks?: ProfessionalScheduleBreakDTO[];
  dayOfWeek: WeekDay;
  professionalId: number;
  status?: PersonStatus;
}

export interface ProfessionalScheduleUpdateDTO {
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  bufferMinutes?: number;
  maxDailyAppointments?: number;
  modality?: AppointmentModality;
  locationKey?: string;
  breaks?: ProfessionalScheduleBreakDTO[];
  dayOfWeek?: WeekDay;
  status?: PersonStatus;
}

export interface ProfessionalScheduleResponseDTO extends ProfessionalScheduleRequestDTO {
  id: number;
  professionalName: string;
  breaks: ProfessionalScheduleBreakDTO[];
}

export interface ProfessionalAvailabilityExceptionRequestDTO {
  professionalId?: number;
  appliesToAllProfessionals?: boolean;
  date: string;
  startTime?: string;
  endTime?: string;
  type: AvailabilityExceptionType;
  slotDurationMinutes?: number;
  bufferMinutes?: number;
  maxDailyAppointments?: number;
  modality?: AppointmentModality;
  locationKey?: string;
  reason?: string;
  status?: PersonStatus;
}

export interface ProfessionalAvailabilityExceptionResponseDTO extends ProfessionalAvailabilityExceptionRequestDTO {
  id: number;
  professionalId?: number;
}

export interface WhatsAppConfigurationStatus {
  connected: boolean;
  phoneNumberId: string;
  lastSend: string;
  lastError: string;
  message?: string;
}
