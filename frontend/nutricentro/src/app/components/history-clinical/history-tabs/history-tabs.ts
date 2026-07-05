import { Component, EventEmitter, Input, Output } from '@angular/core';
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
    TabFiles,
  ],
  templateUrl: './history-tabs.html',
  styleUrl: './history-tabs.css',
})
export class HistoryTabs {
  @Input() nutritionData?: NutritionalDataDTO;
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Input() activeTab = 'summary';

  @Output() historyChanged = new EventEmitter<void>();
  @Output() activeTabChanged = new EventEmitter<string>();

  notifyChange(): void {
    this.historyChanged.emit();
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.activeTabChanged.emit(tab);
  }
}
