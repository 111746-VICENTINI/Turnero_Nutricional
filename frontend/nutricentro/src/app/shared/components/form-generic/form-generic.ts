import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { GenericFormField } from './model/form-model';

@Component({
  selector: 'app-form-generic',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    ButtonModule,
    CheckboxModule,
    RadioButtonModule,
    TextareaModule,
    DatePickerModule,
    InputNumberModule,
    TooltipModule,
  ],
  templateUrl: './form-generic.html',
  styleUrl: './form-generic.css',
})
export class FormGeneric implements OnChanges {
  @Input({ required: true }) fields: GenericFormField[] = [];
  @Input() initialValues: Record<string, any> = {};
  @Input() isSubmitting = false;
  @Input() columnsPerRow: 1 | 2 | 3 | 4 = 2;
  @Input() formWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'lg';
  @Input() fontSize: 'sm' | 'md' | 'lg' = 'md';
  @Input() submitLabel = 'Guardar';
  @Input() showBackButton = false;
  @Input() cancelLabel = 'Cancelar';
  @Input() showCancel = true;
  @Input() showSubmit = true;
  @Input() showActions = true;
  @Input() readonly = false;

  @Output() formSubmit = new EventEmitter<Record<string, any>>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  disabled?: boolean;

  form = new FormGroup({});

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['initialValues']) {
      this.buildForm();
    }

    if (changes['readonly'] && this.form) {
      if (this.readonly) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    }
  }

  private buildForm(): void {
    const group: Record<string, FormControl> = {};

    this.fields.forEach((field) => {
      const validators = [];

      if (field.required) {
        validators.push(Validators.required);
      }

      if (field.type === 'email') {
        validators.push(Validators.email);
      }

      if (field.type === 'number') {
        if (field.min !== undefined) {
          validators.push(Validators.min(field.min));
        }
        if (field.max !== undefined) {
          validators.push(Validators.max(field.max));
        }
      }

      if (field.minLength) {
        validators.push(Validators.minLength(field.minLength));
      }

      if (field.maxLength) {
        validators.push(Validators.maxLength(field.maxLength));
      }

      if (field.pattern) {
        validators.push(Validators.pattern(field.pattern));
      }

      const value =
        this.initialValues[field.name] !== undefined
          ? this.initialValues[field.name]
          : field.type === 'checkbox'
            ? false
            : null;

      group[field.name] = new FormControl({ value, disabled: field.disabled }, validators);
    });

    this.form = this.fb.group(group);

    if (this.readonly) {
      this.form.disable({ emitEvent: false });
    }
  }

  isInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getErrorMessage(field: GenericFormField): string {
    const control = this.form.get(field.name);
    if (!control?.errors) return '';

    if (field.errorMessage) return field.errorMessage;

    const errors = control.errors;

    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['email']) return 'Formato de correo electrónico inválido.';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['min']) return `El valor mínimo es ${errors['min'].min}.`;
    if (errors['max']) return `El valor máximo es ${errors['max'].max}.`;
    if (errors['pattern']) return 'Formato inválido.';

    return 'Campo inválido.';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmit.emit(this.form.getRawValue());
  }

  onCancel(): void {
    this.form.reset(this.initialValues);
    this.formCancel.emit();
  }

}
