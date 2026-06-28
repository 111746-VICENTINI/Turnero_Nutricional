import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { PatientResponseDTO } from '../../patients/models/patient-model';
import { MedicalHistoryResponseDTO } from '../models/history-clinical-model';
import { TabAnthropometry } from '../tabs/tab-anthropometry/tab-anthropometry';
import { TabClinicalData } from '../tabs/tab-clinical-data/tab-clinical-data';
import { TabConsultations } from '../tabs/tab-consultations/tab-consultations';
import { TabLaboratory } from '../tabs/tab-laboratory/tab-laboratory';
import { TabNutritionalData } from '../tabs/tab-nutritional-data/tab-nutritional-data';
import { TabPatientSummary } from '../tabs/tab-patient-summary/tab-patient-summary';
import { TabPlans } from '../tabs/tab-plans/tab-plans';

@Component({
  selector: 'app-history-tabs',
  imports: [
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
  ],
  templateUrl: './history-tabs.html',
  styleUrl: './history-tabs.css',
})
export class HistoryTabs {
  @Input({ required: true }) patient!: PatientResponseDTO;
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;

  @Output() historyChanged = new EventEmitter<void>();

  notifyChange(): void {
    this.historyChanged.emit();
  }
}
