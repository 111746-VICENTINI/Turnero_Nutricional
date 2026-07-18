export type FollowUpStatus =
  | 'ACTIVE'
  | 'OVER_THREE_MONTHS'
  | 'OVER_SIX_MONTHS'
  | 'OVER_ONE_YEAR'
  | 'WITHOUT_VALID_CONSULTATION';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PatientFollowUpStatusDTO {
  patientId: number;
  patientFullName?: string | null;
  professionalId?: number | null;
  professionalFullName?: string | null;
  lastConsultationDate?: string | null;
  daysSinceLastConsultation?: number | null;
  monthsSinceLastConsultation?: number | null;
  status: FollowUpStatus;
  priority: NotificationPriority;
  label: string;
  recommendation: string;
}

export interface FollowUpDashboardDTO {
  activePatients: number;
  patientsOverThreeMonths: number;
  patientsOverSixMonths: number;
  patientsOverOneYear: number;
}
