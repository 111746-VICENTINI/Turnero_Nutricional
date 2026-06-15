export type GenericFieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'date'
  | 'datetime'
  | 'time';

export interface GenericSelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

export interface GenericFormField {
  name: string;
  label: string;
  type: GenericFieldType;
  required?: boolean;
  placeholder?: string;
  colSpan?: 1 | 2 | 3 | 4;
  options?: GenericSelectOption[];
  disabled?: boolean;
  readonly?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  errorMessage?: string;
  rows?: number;
  hint?: string;
  autocomplete?: string;
}
