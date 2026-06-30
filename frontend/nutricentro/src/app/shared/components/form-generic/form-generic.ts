import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { formatLocalDate, parseLocalDate, parseLocalTime, toIsoLocalDate, toIsoLocalTime } from '../../utils/date-utils';
import {InputMaskDirective} from 'primeng/inputmask';
import {InputGroupAddonModule} from 'primeng/inputgroupaddon';
import {InputGroupModule} from 'primeng/inputgroup';

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
    InputMaskDirective,
    InputGroupModule,
    InputGroupAddonModule
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
  today = new Date();

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
      const validators: ValidatorFn[] = [];

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

      if (field.type === 'date') {
        validators.push(this.dateValidator(field));
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

      const rawValue =
        this.initialValues[field.name] !== undefined
          ? this.initialValues[field.name]
          : field.type === 'checkbox'
            ? false
            : null;

      const value = this.normalizeInitialValue(field, rawValue);

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

    const errors = control.errors;

    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['email']) return 'Formato de correo electrónico inválido.';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['min']) return `El valor mínimo es ${errors['min'].min}.`;
    if (errors['max']) return `El valor máximo es ${errors['max'].max}.`;
    if (errors['invalidDate']) return 'Ingresá una fecha válida.';
    if (errors['futureDate']) return 'La fecha no puede ser futura.';
    if (errors['pattern']) {
      return field.hint ?? 'Formato inválido.';
    }

    return 'Campo inválido.';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmit.emit(this.normalizeSubmitValue(this.form.getRawValue()));
  }

  onCancel(): void {
    const values = this.fields.reduce<Record<string, any>>((acc, field) => {
      acc[field.name] = this.normalizeInitialValue(field, this.initialValues[field.name]);
      return acc;
    }, {});

    this.form.reset(values);
    this.formCancel.emit();
  }

  private normalizeInitialValue(field: GenericFormField, value: any): any {
    if (field.type === 'date') {
      return parseLocalDate(value);
    }

    if (field.type === 'time') {
      return parseLocalTime(value);
    }

    return value;
  }

  private normalizeSubmitValue(values: Record<string, any>): Record<string, any> {
    const normalized = { ...values };

    this.fields.forEach((field) => {
      if (field.type === 'date') {
        normalized[field.name] = toIsoLocalDate(values[field.name]);
      }

      if (field.type === 'time') {
        normalized[field.name] = toIsoLocalTime(values[field.name]);
      }
    });

    return normalized;
  }

  private dateValidator(field: GenericFormField): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const date = parseLocalDate(control.value);

      if (!date) {
        return { invalidDate: true };
      }

      if (this.shouldRejectFutureDate(field) && this.stripTime(date) > this.stripTime(this.today)) {
        return { futureDate: true };
      }

      return null;
    };
  }

  getMaxDate(field: GenericFormField): Date | undefined {
    if (field.maxDate) {
      return field.maxDate;
    }

    return this.shouldRejectFutureDate(field) ? this.today : undefined;
  }

  private shouldRejectFutureDate(field: GenericFormField): boolean {
    const normalizedName = field.name.toLowerCase();
    const normalizedLabel = field.label.toLowerCase();

    return field.allowFuture === false ||
      normalizedName.includes('birth') ||
      normalizedLabel.includes('nacimiento');
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  getDisplayValue(field: GenericFormField): string {
    const value = this.form.get(field.name)?.value;

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (field.type === 'date') {
      return formatLocalDate(value);
    }

    if (field.type === 'time') {
      return toIsoLocalTime(value).slice(0, 5);
    }

    if (field.type === 'checkbox') {
      return value ? 'Activo' : 'Inactivo';
    }

    if (field.type === 'select') {
      return field.options?.find((option) => option.value === value)?.label ?? String(value);
    }

    if (field.type === 'multiselect') {
      const values = Array.isArray(value) ? value : [value];
      const labels = values.map((item) =>
        field.options?.find((option) => option.value === item)?.label ?? String(item)
      );

      return labels.length ? labels.join(', ') : '-';
    }

    return String(value);
  }

}
