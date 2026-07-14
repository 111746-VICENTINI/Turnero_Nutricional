import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { FormGeneric } from '../../../../shared/components/form-generic/form-generic';
import { GenericFormField } from '../../../../shared/components/form-generic/model/form-model';
import { MedicalHistoryResponseDTO, NutritionalDataDTO } from '../../models/history-clinical-model';
import { HistoryClinicalService } from '../../services/history-clinical-service';

@Component({
  selector: 'app-tab-nutritional-data',
  imports: [CommonModule, FormGeneric],
  templateUrl: './tab-nutritional-data.html',
  styleUrl: './tab-nutritional-data.css',
})
export class TabNutritionalData implements OnChanges {
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Output() saved = new EventEmitter<void>();

  private historyService = inject(HistoryClinicalService);
  private messageService = inject(MessageService);

  form: NutritionalDataDTO = {};
  saving = false;

  fields: GenericFormField[] = [
    { name: 'headerFood', label: 'Ejemplos de un día habitual', type: 'header' },
    { name: 'breakfast', label: 'Desayuno', type: 'textarea', placeholder: 'Ej: 2 huevos, 2 tostadas, 1 yogurt' },
    { name: 'midMorningSnack', label: 'Media mañana', type: 'textarea', placeholder: 'Colaciones de la mañana' },
    { name: 'lunch', label: 'Almuerzo', type: 'textarea', placeholder: 'Ej: carne, arroz, ensalada' },
    { name: 'snack', label: 'Merienda', type: 'textarea', placeholder: 'Ej: 1 fruta, pan' },
    { name: 'midAfternoonSnack', label: 'Media tarde', type: 'textarea', placeholder: 'Colaciones de la tarde' },
    { name: 'dinner', label: 'Cena', type: 'textarea', placeholder: 'Ej: fideos, atun, huevo' },
    { name: 'favoriteFoods', label: 'Alimentos preferidos', type: 'textarea', rows: 3 },
    { name: 'dislikedFoods', label: 'Alimentos rechazados', type: 'textarea', rows: 3 },
    { name: 'prohibitedFoods', label: 'Alimentos prohibidos', type: 'textarea', rows: 2 },
    { name: 'restrictions', label: 'Restricciones', type: 'textarea', rows: 2 },
    { name: 'observations', label: 'Observaciones/notas', type: 'textarea', rows: 2 },

    { name: 'headerHydration', label: 'Hidratación', type: 'header' },
    { name: 'waterIntake', label: 'Agua diaria', type: 'numeric', placeholder: 'Ej: 1.5 lts', suffix: 'lts', colSpan: 1 },
    { name: 'drinksSoda', label: 'Gaseosas', type: 'checkbox' },

    { name: 'headerActivity', label: 'Actividad', type: 'header' },
    { name: 'physicalActivity', label: 'Actividad fisica', type: 'text', placeholder: 'Basquet, rugby, gimnasio, correr, caminar, futbol...' },
    { name: 'sportGoal', label: 'Objetivo fisico', type: 'text', placeholder: 'Perder peso, ganar masa muscular..' },
    { name: 'activityFrequency', label: 'Frecuencia', type: 'text', placeholder: 'Ej: 3 veces por semana' },
    { name: 'activityIntensity', label: 'Intensidad', type: 'text', placeholder: 'Baja, media, alta' },
    { name: 'activityDuration', label: 'Duracion', type: 'text', placeholder: 'Ej: 40, 60, 90 minutos' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['history']) {
      this.form = { ...(this.history.nutritionalData ?? {}) };
    }
  }

  save(values: Record<string, any>): void {
    this.saving = true;
    this.historyService.updateNutritionalData(this.history.id, values as NutritionalDataDTO).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Hábitos guardados',
          detail: 'Los datos nutricionales fueron actualizados.',
        });
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: 'Revisá los datos e intenta nuevamente.',
        });
      },
    });
  }
}
