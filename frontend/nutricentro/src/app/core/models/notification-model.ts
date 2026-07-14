import { NotificationPriority } from './follow-up-model';

export type NotificationType = 'PATIENT_INACTIVITY';

export interface NotificationResponseDTO {
  key: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  priority: NotificationPriority;
  read: boolean;
  patientId: number;
  patientFullName: string;
  professionalId?: number | null;
  professionalFullName?: string | null;
  lastConsultationDate?: string | null;
  daysSinceLastConsultation?: number | null;
  monthsSinceLastConsultation?: number | null;
  actionRoute: string;
}

export interface NotificationSummaryDTO {
  unreadCount: number;
}
