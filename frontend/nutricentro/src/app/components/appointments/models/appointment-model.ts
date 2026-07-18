import {AppointmentStatus} from '../../../shared/enums/appointment-status';

export interface AppointmentRequestDTO{
  date: string;
  time: string;
  status?: AppointmentStatus;
  reason?: string;
  patientId: number;
  professionalId: number;
  secretaryId?: number;
  appliedFee?: number;
  feeType?: AppointmentFeeType;
  feeCurrency?: string;
}

export interface AppointmentResponseDTO{
  id: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason?: string;
  patientId: number;
  patientFullName: string;
  professionalId: number;
  professionalFullName: string;
  secretaryId?: number;
  secretaryFullName?: string;
  appliedFee?: number;
  feeType?: AppointmentFeeType;
  feeCurrency?: string;
  feeEditable?: boolean;
}

export interface AppointmentUpdateDTO{
  date?: string;
  time?: string;
  status?: AppointmentStatus;
  reason?: string;
  patientId?: number;
  professionalId?: number;
  secretaryId?: number;
  appliedFee?: number;
  feeType?: AppointmentFeeType;
  feeCurrency?: string;
}

export type AppointmentFeeType = 'FIRST' | 'CONTROL' | 'ONLINE';

export interface AppointmentFilters {
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  patientId?: number;
  professionalId?: number;
  secretaryId?: number;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export interface AppointmentPageDTO {
  content: AppointmentResponseDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export type AppointmentEventType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'STATUS_CHANGED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELED'
  | 'APPOINTMENT_REJECTED'
  | 'APPOINTMENT_PATIENT_PRESENT'
  | 'APPOINTMENT_ABSENT'
  | 'APPOINTMENT_COMPLETED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'WHATSAPP_MESSAGE_SENT'
  | 'WHATSAPP_MESSAGE_FAILED'
  | 'WHATSAPP_REMINDER_SENT'
  | 'WHATSAPP_REMINDER_FAILED'
  | 'WHATSAPP_RESPONSE_RECEIVED'
  | 'WHATSAPP_RESPONSE_AMBIGUOUS'
  | 'WHATSAPP_RESPONSE_INVALID'
  | 'PROFESSIONAL_CHANGED'
  | 'DATE_CHANGED'
  | 'TIME_CHANGED';

export interface AppointmentTimelineEventResponseDTO {
  id: number;
  appointmentId: number;
  occurredAt: string;
  responsibleUserId?: number;
  responsibleUsername: string;
  responsibleRole: string;
  eventType: AppointmentEventType;
  previousStatus?: AppointmentStatus;
  newStatus?: AppointmentStatus;
  reason?: string;
  observations?: string;
  notificationRequested?: boolean;
  notificationRequestedAt?: string;
}
