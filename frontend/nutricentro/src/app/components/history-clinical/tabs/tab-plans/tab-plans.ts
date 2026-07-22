import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { FormGeneric } from '../../../../shared/components/form-generic/form-generic';
import { GenericFormField } from '../../../../shared/components/form-generic/model/form-model';
import { TableGeneric } from '../../../../shared/components/table-generic/table-generic';
import { TableActionConfig, TableColumnConfig,} from '../../../../shared/components/table-generic/model/table-model';
import { FoodPlanItemDTO, FoodPlanRequestDTO, FoodPlanResponseDTO, FoodResponseDTO, MedicalHistoryResponseDTO} from '../../models/history-clinical-model';
import { HistoryClinicalService } from '../../services/history-clinical-service';
import { EmailService } from '../../../../core/services/email-service';
import {PlanTotals} from './plan-model';
import {isValidEmail} from '../../../../shared/utils/email-validation';

@Component({
  selector: 'app-tab-plans',
  imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule, DialogModule, TextareaModule, FormGeneric, TableGeneric],
  templateUrl: './tab-plans.html',
  styleUrl: './tab-plans.css',
})
export class TabPlans implements OnChanges {
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Output() saved = new EventEmitter<void>();

  private historyService = inject(HistoryClinicalService);
  private emailService = inject(EmailService);
  private messageService = inject(MessageService);

  form: FoodPlanRequestDTO = this.emptyForm();
  editForm: FoodPlanRequestDTO = {};
  selectedPlan?: FoodPlanResponseDTO;
  editDialogVisible = false;
  items: FoodPlanItemDTO[] = [];
  foodQuery = '';
  foodResults: FoodResponseDTO[] = [];
  selectedFood?: FoodResponseDTO;
  selectedGrams = 100;
  searching = false;
  saving = false;
  savingEdit = false;
  emailDialogVisible = false;
  emailSending = false;
  readonly maxEmailAttachmentBytes = 25_000_000;
  emailDraft = this.defaultEmailDraft();

  planFields: GenericFormField[] = [
    { name: 'title', label: 'Tipo de plan', type: 'text', placeholder: 'Plan hipocalorico, deportivo...' },
    { name: 'menuDeliveredDate', label: 'Fecha de entrega', type: 'date' },
    { name: 'description', label: 'Descripcion', type: 'textarea', rows: 1 },
    { name: 'menu', label: 'Menu / indicaciones', type: 'textarea', rows: 1 },
    { name: 'observations', label: 'Notas / observaciones', type: 'textarea', rows: 2, colSpan: 2},
  ];

  planColumns: TableColumnConfig<FoodPlanResponseDTO>[] = [
    { field: 'title', header: 'Titulo', minWidth: '12rem' },
    { field: 'active', header: 'Activo', type: 'boolean' },
    { field: 'planDelivered', header: 'Plan enviado', type: 'boolean' },
    { field: 'planDeliveredDate', header: 'Fecha envio', type: 'date', minWidth: '11rem' },
    { field: 'menuMaterialName', header: 'Material', minWidth: '12rem' },
    { field: 'description', header: 'Descripcion', minWidth: '18rem' },
    { field: 'observations', header: 'Observaciones', minWidth: '16rem' }
  ];

  planActions: TableActionConfig<FoodPlanResponseDTO>[] = [
    {
      field: 'deliverPlan',
      label: 'Marcar plan enviado',
      icon: 'pi pi-send',
      severity: 'success',
      visible: (row) => !row.planDelivered,
    },
    {
      field: 'deliver',
      label: 'Marcar material entregado',
      icon: 'pi pi-check-circle',
      severity: 'success',
      visible: (row) => !row.menuDelivered,
    },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['history'] && this.history && !this.emailDialogVisible) {
      this.emailDraft = this.emptyEmailDraft();
    }
  }

  get totals(): PlanTotals {
    return this.items.reduce<PlanTotals>(
      (acc, item) => {
        const factor = (item.grams ?? 100) / 100;
        acc.calories += (item.calories ?? 0) * factor;
        acc.protein += (item.protein ?? 0) * factor;
        acc.carbohydrates += (item.carbohydrates ?? 0) * factor;
        acc.fat += (item.fat ?? 0) * factor;
        return acc;
      },
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
    );
  }

  get patientEmail(): string {
    return this.history?.patient?.email?.trim() || '';
  }

  get patientName(): string {
    const patient = this.history?.patient;
    return patient ? `${patient.firstName} ${patient.lastName}`.trim() : 'paciente';
  }

  get hasFoodPlan(): boolean {
    return !!this.history?.foodPlans?.length;
  }

  get hasAnthropometry(): boolean {
    return !!this.history?.anthropometries?.length;
  }

  get hasLaboratories(): boolean {
    return !!this.history?.laboratories?.length;
  }

  get hasClinicalFiles(): boolean {
    return !!this.history?.files?.length;
  }

  get plans(): FoodPlanResponseDTO[] {
    return this.history?.foodPlans ?? [];
  }

  get emailAttachmentSize(): number {
    if (!this.emailDraft.includeClinicalFiles) {
      return 0;
    }
    return (this.history?.files ?? []).reduce((total, file) => total + (file.size ?? 0), 0);
  }

  get canSendEmail(): boolean {
    return !this.emailSending
      && isValidEmail(this.emailDraft.to)
      && !!this.emailDraft.subject.trim()
      && !!this.emailDraft.message.trim()
      && this.emailAttachmentSize <= this.maxEmailAttachmentBytes;
  }

  searchFoods(): void {
    if (this.foodQuery.trim().length < 2) {
      this.foodResults = [];
      return;
    }

    this.searching = true;
    this.historyService.searchFoods(this.foodQuery.trim()).subscribe({
      next: (foods) => {
        this.foodResults = foods;
        this.searching = false;
      },
      error: () => {
        this.searching = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Buscador no disponible',
          detail: 'No se pudo consultar la base de alimentos.',
        });
      },
    });
  }

  selectFood(food: FoodResponseDTO): void {
    this.selectedFood = food;
    this.foodQuery = food.brand ? `${food.name} - ${food.brand}` : food.name;
    this.foodResults = [];
  }

  addFoodItem(): void {
    if (!this.selectedFood) {
      return;
    }

    this.items = [
      ...this.items,
      {
        foodId: this.selectedFood.id ?? null,
        externalId: this.selectedFood.externalId ?? null,
        name: this.selectedFood.name,
        grams: this.selectedGrams,
        calories: this.selectedFood.calories ?? 0,
        protein: this.selectedFood.protein ?? 0,
        carbohydrates: this.selectedFood.carbohydrates ?? 0,
        fat: this.selectedFood.fat ?? 0,
      },
    ];
    this.selectedFood = undefined;
    this.foodQuery = '';
    this.selectedGrams = 100;
  }

  removeItem(item: FoodPlanItemDTO): void {
    this.items = this.items.filter((current) => current !== item);
  }

  save(values: Record<string, any>): void {
    const request: FoodPlanRequestDTO = {
      ...(values as FoodPlanRequestDTO),
      items: this.items,
      active: values['active'] ?? true,
      menuDelivered: values['menuDelivered'] ?? false,
    };

    this.saving = true;
    this.historyService.createFoodPlan(this.history.id, request).subscribe({
      next: () => {
        this.saving = false;
        this.form = this.emptyForm();
        this.items = [];
        this.messageService.add({
          severity: 'success',
          summary: 'Plan alimentario creado',
          detail: 'Los totales nutricionales fueron calculados.',
        });
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo crear el plan',
          detail: 'Revisa los alimentos y el detalle del menu.',
        });
      },
    });
  }

  openEdit(plan: FoodPlanResponseDTO): void {
    this.selectedPlan = plan;
    this.editForm = { ...plan };
    this.editDialogVisible = true;
  }

  closeEdit(): void {
    this.editDialogVisible = false;
    this.selectedPlan = undefined;
    this.editForm = {};
  }

  saveEdit(values: Record<string, any>): void {
    if (!this.selectedPlan) {
      return;
    }

    this.savingEdit = true;
    this.historyService.updateFoodPlan(this.selectedPlan.id, values as FoodPlanRequestDTO).subscribe({
      next: () => {
        this.savingEdit = false;
        this.closeEdit();
        this.messageService.add({
          severity: 'success',
          summary: 'Plan actualizado',
          detail: 'La informacion del plan quedo guardada.',
        });
        this.saved.emit();
      },
      error: () => {
        this.savingEdit = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: 'Revisa la informacion del plan.',
        });
      },
    });
  }

  delete(plan: FoodPlanResponseDTO): void {
    this.historyService.deleteFoodPlan(plan.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Plan eliminado',
          detail: 'El plan fue quitado de la historia.',
        });
        this.saved.emit();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo eliminar',
          detail: 'Intenta nuevamente en unos segundos.',
        });
      },
    });
  }

  openEmailDialog(): void {
    if (!this.patientEmail) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Email requerido',
        detail: 'El paciente no tiene un email cargado.',
      });
      return;
    }

    if (!isValidEmail(this.patientEmail)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Email invalido',
        detail: 'Revisa el email del paciente antes de enviar.',
      });
      return;
    }

    this.emailDraft = this.emptyEmailDraft();
    this.emailDialogVisible = true;
  }

  closeEmailDialog(): void {
    if (this.emailSending) {
      return;
    }
    this.emailDialogVisible = false;
  }

  sendEmail(): void {
    if (!this.canSendEmail) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Revisa destinatario, asunto, mensaje y adjuntos.',
      });
      return;
    }

    this.emailSending = true;
    this.emailService.send({
      to: [this.emailDraft.to.trim()],
      subject: this.emailDraft.subject.trim(),
      textMessage: this.emailDraft.message.trim(),
      patientId: this.history.patientId,
      historyId: this.history.id,
      includeFoodPlan: this.emailDraft.includeFoodPlan,
      includeAnthropometry: this.emailDraft.includeAnthropometry,
      includeLaboratories: this.emailDraft.includeLaboratories,
      includeClinicalFiles: this.emailDraft.includeClinicalFiles,
    }).subscribe({
      next: () => {
        this.emailSending = false;
        this.emailDialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Email enviado',
          detail: 'El envio quedo registrado en el sistema.',
        });
      },
      error: () => {
        this.emailSending = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo enviar',
          detail: 'Revisa la configuracion de email o intenta nuevamente.',
        });
      },
    });
  }

  onPlanAction(event: { action: TableActionConfig<FoodPlanResponseDTO>; row: FoodPlanResponseDTO }): void {
    if (event.action.field === 'deliverPlan') {
      this.markPlanDelivered(event.row);
      return;
    }

    if (event.action.field === 'deliver') {
      this.markDelivered(event.row);
    }
  }

  markPlanDelivered(plan: FoodPlanResponseDTO): void {
    this.historyService
      .updateFoodPlan(plan.id, {
        ...plan,
        planDelivered: true,
        planDeliveredDate: new Date(),
        planDeliveryMedium: plan.planDeliveryMedium || 'WhatsApp / PDF',
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Plan enviado',
            detail: 'La entrega del plan quedo registrada.',
          });
          this.saved.emit();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo marcar el envio',
            detail: 'Intenta nuevamente en unos segundos.',
          });
        },
      });
  }

  markDelivered(plan: FoodPlanResponseDTO): void {
    this.historyService
      .updateMenuMaterial(plan.id, {
        delivered: true,
        deliveredDate: new Date(),
        materialName: plan.menuMaterialName ?? plan.title ?? 'Menu entregado',
        materialUrl: plan.menuMaterialUrl,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Menu entregado',
            detail: 'La entrega del material quedo registrada.',
          });
          this.saved.emit();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo marcar la entrega',
            detail: 'Intenta nuevamente en unos segundos.',
          });
        },
      });
  }

  private emptyForm(): FoodPlanRequestDTO {
    return {
      startDate: new Date().toISOString().slice(0, 10),
      active: true,
      planDelivered: false,
      menuDelivered: false,
    };
  }

  private emptyEmailDraft() {
    return {
      to: this.patientEmail,
      subject: `Plan alimentario - ${this.patientName}`,
      message: `Hola ${this.patientName},\n\nTe enviamos el material preparado desde NutriCentro.\n\nSaludos.`,
      includeFoodPlan: this.hasFoodPlan,
      includeAnthropometry: false,
      includeLaboratories: false,
      includeClinicalFiles: false,
    };
  }

  private defaultEmailDraft() {
    return {
      to: '',
      subject: 'Plan alimentario - paciente',
      message: 'Hola paciente,\n\nTe enviamos el material preparado desde NutriCentro.\n\nSaludos.',
      includeFoodPlan: false,
      includeAnthropometry: false,
      includeLaboratories: false,
      includeClinicalFiles: false,
    };
  }

}
