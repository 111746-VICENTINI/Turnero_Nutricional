import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  AntropometryResponseDTO,
  ConsultationResponseDTO,
  FoodPlanResponseDTO,
  LaboratoryResponseDTO,
  MedicalHistoryResponseDTO,
  NutritionalDataDTO,
} from '../../models/history-clinical-model';

@Component({
  selector: 'app-tab-patient-summary',
  imports: [CommonModule],
  templateUrl: './tab-patient-summary.html',
  styleUrl: './tab-patient-summary.css',
})
export class TabPatientSummary {
  @Input() nutritionData?: NutritionalDataDTO;
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;

  get latestAnthropometry(): AntropometryResponseDTO | undefined {
    return this.history.anthropometries?.[0];
  }

  get latestLaboratory(): LaboratoryResponseDTO | undefined {
    return this.history.laboratories?.[0];
  }

  get activePlan(): FoodPlanResponseDTO | undefined {
    return this.history.foodPlans?.find((plan) => plan.active) ?? this.history.foodPlans?.[0];
  }

  get latestConsultation(): ConsultationResponseDTO | undefined {
    return this.history.consultations?.[0];
  }

  get primaryGoal(): string {
    return this.latestConsultation?.goal || this.activePlan?.title || 'Definir objetivo';
  }

  get importantObservations(): string {
    return (
      this.history.clinicalData?.observations ||
      this.latestConsultation?.observations ||
      this.history.observations ||
      'Sin observaciones importantes'
    );
  }

  get chartMetrics() {
    return [
      {
        label: 'Peso',
        value: this.latestAnthropometry?.weight ?? 0,
        display: this.valueWithUnit(this.latestAnthropometry?.weight, 'kg'),
        max: 160,
      },
      {
        label: 'Grasa',
        value: this.latestAnthropometry?.bodyFatPercentage ?? 0,
        display: this.valueWithUnit(this.latestAnthropometry?.bodyFatPercentage, '%'),
        max: 60,
      },
      {
        label: 'IMC',
        value: this.latestAnthropometry?.bmi ?? 0,
        display: this.valueWithUnit(this.latestAnthropometry?.bmi, ''),
        max: 45,
      },
      {
        label: 'Músculo',
        value: this.latestAnthropometry?.muscleMass ?? 0,
        display: this.valueWithUnit(this.latestAnthropometry?.muscleMass, 'kg'),
        max: 80,
      },
    ];
  }

  get laboratoryHighlights() {
    const lab = this.latestLaboratory;
    return [
      { label: 'Glucosa', value: lab?.glucose, unit: 'mg/dl' },
      { label: 'Hemoglobina', value: lab?.hemoglobin, unit: 'mg/dl' },
      { label: 'TSH', value: lab?.tsh, unit: 'ml' },
      { label: 'Col.Total', value: lab?.cholesterol, unit: 'mg/dl' },
      { label: 'HDL', value: lab?.hdl, unit: 'mg/dl' },
      { label: 'LDL', value: lab?.ldl, unit: 'mg/dl' },
      { label: 'Trigliceridos', value: lab?.triglycerides, unit: 'mg/dl' },
      { label: 'Vit. B12', value: lab?.vitaminB12, unit: 'mg/dl' },
      { label: 'Vit. D', value: lab?.vitaminD, unit: 'mg/dl' },
    ];
  }

  get hasConsultation(): boolean {
    return !!this.latestConsultation;
  }

  get planDelivered(): boolean {
    return !!this.activePlan?.planDelivered;
  }

  get materialDelivered(): boolean {
    return !!this.activePlan?.menuDelivered;
  }

  get consultationState() {
    return [
      {
        label: 'Consulta',
        value: this.hasConsultation ? 'Completada' : 'No registrada',
        tone: this.hasConsultation ? 'green' : 'gray',
      },
      {
        label: 'Plan',
        value: !this.hasConsultation ? 'No corresponde' : this.planDelivered ? 'Enviado' : 'Pendiente',
        tone: !this.hasConsultation ? 'gray' : this.planDelivered ? 'green' : 'warning',
      },
      {
        label: 'Material',
        value: !this.hasConsultation ? 'No corresponde' : this.materialDelivered ? 'Enviado' : 'Pendiente',
        tone: !this.hasConsultation ? 'gray' : this.materialDelivered ? 'green' : 'warning',
      },
      {
        label: 'Antropometría',
        value: this.latestAnthropometry ? 'Actualizada' : 'No cargada',
        tone: this.latestAnthropometry ? 'green' : 'gray',
      },
      {
        label: 'Laboratorio',
        value: this.latestLaboratory ? 'Cargado' : 'No cargado',
        tone: this.latestLaboratory ? 'green' : 'gray',
      },
    ];
  }

  barWidth(value: number, max: number): string {
    return `${Math.min(100, Math.max(4, (value / max) * 100))}%`;
  }

  private valueWithUnit(value: number | null | undefined, unit: string): string {
    return value === null || value === undefined ? '-' : `${value}${unit ? ` ${unit}` : ''}`;
  }
}
