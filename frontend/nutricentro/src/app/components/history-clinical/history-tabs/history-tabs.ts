import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Button } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import {MedicalHistoryResponseDTO, NutritionalDataDTO} from '../models/history-clinical-model';
import { TabAnthropometry } from '../tabs/tab-anthropometry/tab-anthropometry';
import { TabClinicalData } from '../tabs/tab-clinical-data/tab-clinical-data';
import { TabConsultations } from '../tabs/tab-consultations/tab-consultations';
import { TabLaboratory } from '../tabs/tab-laboratory/tab-laboratory';
import { TabNutritionalData } from '../tabs/tab-nutritional-data/tab-nutritional-data';
import { TabPatientSummary } from '../tabs/tab-patient-summary/tab-patient-summary';
import { TabPlans } from '../tabs/tab-plans/tab-plans';
import { TabFiles } from '../tabs/tab-files/tab-files';
import { AppointmentResponseDTO } from '../../appointments/models/appointment-model';
import {
  APPOINTMENT_STATUS_ICON,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_SEVERITY,
  AppointmentStatus
} from '../../../shared/enums/appointment-status';
import {formatLocalTime} from '../../../shared/utils/date-utils';

@Component({
  selector: 'app-history-tabs',
  imports: [
    CommonModule,
    Button,
    TagModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TabPatientSummary,
    TabNutritionalData,
    TabClinicalData,
    TabLaboratory,
    TabAnthropometry,
    TabPlans,
    TabConsultations,
    TabFiles,
  ],
  templateUrl: './history-tabs.html',
  styleUrl: './history-tabs.css',
})
export class HistoryTabs {
  @Input() nutritionData?: NutritionalDataDTO;
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Input() appointments: AppointmentResponseDTO[] = [];
  @Input() communicationEvents: Array<{
    appointmentId: number;
    occurredAt: string;
    title: string;
    detail: string;
    icon: string;
    tone: string;
  }> = [];
  @Input() communicationsLoading = false;
  @Input() activeTab = 'summary';
  @Input() appointmentContextId?: number;

  @Output() historyChanged = new EventEmitter<void>();
  @Output() activeTabChanged = new EventEmitter<string>();
  @Output() appointmentSelected = new EventEmitter<number>();

  readonly statusSeverity = APPOINTMENT_STATUS_SEVERITY;

  notifyChange(): void {
    this.historyChanged.emit();
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.activeTabChanged.emit(tab);
  }

  openAppointment(appointmentId: number): void {
    this.appointmentSelected.emit(appointmentId);
  }

  statusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status] ?? status;
  }

  statusIcon(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_ICON[status] ?? 'pi pi-circle';
  }

  formatTime(value?: unknown): string {
    return formatLocalTime(value);
  }

  appointmentConsultationId(appointmentId: number): number | null {
    return this.history.consultations?.find((consultation) => consultation.appointmentId === appointmentId)?.id ?? null;
  }

  linkedRecordsCount(appointmentId: number): number {
    const hasConsultation = this.history.consultations?.some((consultation) => consultation.appointmentId === appointmentId);
    return hasConsultation ? 1 : 0;
  }
}
