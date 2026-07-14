import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { FormGeneric } from '../../../../shared/components/form-generic/form-generic';
import { GenericFormField } from '../../../../shared/components/form-generic/model/form-model';
import { AllergyDTO, ClinicalDataDTO, MedicalHistoryResponseDTO, MedicationDTO} from '../../models/history-clinical-model';
import { HistoryClinicalService } from '../../services/history-clinical-service';

type ClinicalFormValue = Omit<ClinicalDataDTO, 'livingSituation'> & {
  livingSituation?: string | string[] | null;
  medicationRecordsText?: string | null;
  allergyRecordsText?: string | null;
};

@Component({
  selector: 'app-tab-clinical-data',
  imports: [CommonModule, FormGeneric],
  templateUrl: './tab-clinical-data.html',
  styleUrl: './tab-clinical-data.css',
})
export class TabClinicalData implements OnChanges {
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Output() saved = new EventEmitter<void>();

  private historyService = inject(HistoryClinicalService);
  private messageService = inject(MessageService);

  form: ClinicalFormValue = {};
  saving = false;

  fields: GenericFormField[] = [
    { name: 'headerGeneral', label: 'Ocupación del paciente', type: 'header' },
    { name: 'occupation', label: 'A que se dedica', type: 'text' },
    { name: 'workingHours', label: 'Horario laboral', type: 'text' },
    {
      name: 'livingSituation',
      label: 'Convivencia',
      type: 'multiselect',
      options: [
        { label: 'Vive solo', value: 'VIVE_SOLO' },
        { label: 'Con pareja', value: 'CON_PAREJA' },
        { label: 'Con hijos', value: 'CON_HIJOS' },
        { label: 'Con padres', value: 'CON_PADRES' },
        { label: 'Con familiares', value: 'CON_FAMILIARES' },
        { label: 'Con amigos', value: 'CON_AMIGOS' },
        { label: 'Otro', value: 'OTRO' },
      ],
    },
    { name: 'householdPeopleCount', label: 'Personas en el hogar', type: 'number', min: 0 },
    { name: 'responsibleForFood', label: 'Responsable de la alimentacion', type: 'text' },
    { name: 'cooksAtHome', label: 'Quien cocina', type: 'text' },
    { name: 'buysFood', label: 'Quien compra alimentos', type: 'text' },
    { name: 'organizesMeals', label: 'Quien organiza comidas', type: 'text' },

    { name: 'headerGynecology', label: 'Datos ginecologicos', type: 'header' },
    { name: 'pregnancies', label: 'Embarazos', type: 'checkbox' },
    {
      name: 'pregnancyCount',
      label: 'Cantidad de embarazos',
      type: 'number',
      min: 0,
      visibleWhen: { field: 'pregnancies', value: true },
    },
    { name: 'lactation', label: 'Lactancia', type: 'checkbox' },
    { name: 'menopause', label: 'Menopausia', type: 'checkbox' },
    { name: 'menstrualCycle', label: 'Ciclo menstrual', type: 'text' },
    { name: 'contraceptiveMethod', label: 'Metodo anticonceptivo', type: 'text' },

    { name: 'headerConsumption', label: 'Consumo y suplementación', type: 'header' },
    { name: 'smoker', label: 'Fuma', type: 'checkbox' },
    { name: 'alcohol', label: 'Alcohol', type: 'checkbox' },
    { name: 'caffeine', label: 'Cafeina', type: 'checkbox' },
    { name: 'mate', label: 'Mate', type: 'checkbox' },
    { name: 'energyDrinks', label: 'Bebidas energeticas', type: 'checkbox' },
    { name: 'supplements', label: 'Suplementacion', type: 'checkbox' },

    { name: 'headerSleepStress', label: 'Sueño y estres', type: 'header' },
    { name: 'sleepHoursPerNight', label: 'Horas por noche', type: 'number', min: 0, max: 24 },
    { name: 'sleepQuality', label: 'Calidad de sueño', type: 'text' },
    { name: 'stressLevel', label: 'Nivel de estres', type: 'text' },

    { name: 'headerPathologies', label: 'Patologías, medicación y alergias', type: 'header' },
    {
      name: 'pathologies',
      label: 'Patologías',
      type: 'multiselect',
      options: [
        { label: 'Hipotiroidismo', value: 'HIPOTIROIDISMO' },
        { label: 'Hipertiroidismo', value: 'HIPERTIROIDISMO' },
        { label: 'Diabetes tipo I', value: 'DIABETES_TIPO_I' },
        { label: 'Diabetes tipo II', value: 'DIABETES_TIPO_II' },
        { label: 'Hipertension', value: 'HIPERTENSION' },
        { label: 'Dislipidemia', value: 'DISLIPIDEMIA' },
        { label: 'Insulinorresistencia', value: 'INSULINORRESISTENCIA' },
        { label: 'Obesidad', value: 'OBESIDAD' },
        { label: 'Celiaquia', value: 'CELIAQUIA' },
        { label: 'Sindrome metabolico', value: 'SINDROME_METABOLICO' },
        { label: 'Enfermedades renales', value: 'ENFERMEDADES_RENALES' },
        { label: 'Enfermedades hepaticas', value: 'ENFERMEDADES_HEPATICAS' },
        { label: 'Autoinmunes', value: 'AUTOINMUNES' },
        { label: 'Cardiovasculares', value: 'CARDIOVASCULARES' },
        { label: 'Otra', value: 'OTRA' },
      ],
    },
    { name: 'diseases', label: 'Enfermedades o diagnosticos', type: 'textarea', rows: 2, placeholder: 'Diabetes, hipertension, hipotiroidismo...' },
    { name: 'allergies', label: 'Alergias e intolerancias', type: 'textarea', rows: 2, placeholder: 'Alimentos, medicamentos, intolerancias digestivas...' },
    { name: 'medications', label: 'Medicación habitual', type: 'textarea', rows: 2, placeholder: 'Farmacos, dosis y frecuencia si corresponde' },
    { name: 'familyHistory', label: 'Antecedentes familiares', type: 'textarea', rows: 2, placeholder: 'Cardiopatias, diabetes, cancer...' },
    { name: 'surgeries', label: 'Cirugias o tratamientos', type: 'textarea', rows: 2, placeholder: 'Procedimientos previos relevantes' },
    { name: 'observations', label: 'Observaciones', type: 'textarea', rows: 2 },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['history']) {
      const clinicalData = this.history.clinicalData ?? {};
      this.form = {
        ...clinicalData,
        livingSituation: this.toFormList(clinicalData.livingSituation),
        medicationRecordsText: this.formatMedications(clinicalData.medicationRecords),
        allergyRecordsText: this.formatAllergies(clinicalData.allergyRecords),
      };
    }
  }

  save(values: Record<string, any>): void {
    const { medicationRecordsText, allergyRecordsText, livingSituation, ...rest } = values as ClinicalFormValue;
    const request: ClinicalDataDTO = {
      ...rest,
      livingSituation: this.toBackendText(livingSituation),
      medicationRecords: this.parseMedications(medicationRecordsText),
      allergyRecords: this.parseAllergies(allergyRecordsText),
    };

    this.saving = true;
    this.historyService.updateClinicalData(this.history.id, request).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Datos clinicos guardados',
          detail: 'La historia clinica fue actualizada.',
        });
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: 'Revisa los datos e intenta nuevamente.',
        });
      },
    });
  }

  private parseMedications(value?: string | null): MedicationDTO[] {
    return this.parseLines(value).map(([name, dose, frequency, observations]) => ({
      name,
      dose,
      frequency,
      observations,
    }));
  }

  private parseAllergies(value?: string | null): AllergyDTO[] {
    return this.parseLines(value).map(([type, name, severity, observations]) => ({
      type,
      name,
      severity,
      observations,
    }));
  }

  private parseLines(value?: string | null): string[][] {
    return (value ?? '')
      .split('\n')
      .map((line) => line.split('|').map((part) => part.trim()))
      .filter((parts) => parts.some(Boolean));
  }

  private toFormList(value?: string | string[] | null): string[] {
    if (Array.isArray(value)) {
      return value;
    }

    return (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private toBackendText(value?: string | string[] | null): string | null {
    if (Array.isArray(value)) {
      const selected = value.map((item) => item.trim()).filter(Boolean);
      return selected.length ? selected.join(',') : null;
    }

    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private formatMedications(records?: MedicationDTO[] | null): string {
    return (records ?? [])
      .map((item) => [item.name, item.dose, item.frequency, item.observations].filter(Boolean).join(' | '))
      .join('\n');
  }

  private formatAllergies(records?: AllergyDTO[] | null): string {
    return (records ?? [])
      .map((item) => [item.type, item.name, item.severity, item.observations].filter(Boolean).join(' | '))
      .join('\n');
  }
}
