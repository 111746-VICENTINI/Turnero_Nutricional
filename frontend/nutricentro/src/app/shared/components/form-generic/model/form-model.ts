export type GenericFieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'numeric'
  | 'password'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'date'
  | 'header'
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
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  options?: GenericSelectOption[];
  disabled?: boolean;
  readonly?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  minDate?: Date;
  maxDate?: Date;
  allowFuture?: boolean;
  pattern?: string | RegExp;
  errorMessages?: {
    required?: string;
    email?: string;
    minlength?: string;
    maxlength?: string;
    min?: string;
    max?: string;
    pattern?: string;
    invalidDate?: string;
    futureDate?: string;
  };
  rows?: number;
  hint?: string;
  autocomplete?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  showIcon?: boolean;
  iconType?: 'prime' | 'svg';
  prefix?: string;
  suffix?: string;
  visibleWhen?: {
    field: string;
    value?: any;
  };
}
