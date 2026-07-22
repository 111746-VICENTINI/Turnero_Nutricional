import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|com\.ar|org|net|edu|gov|es)$/i;

export function isValidEmail(value: string | null | undefined): boolean {
  return EMAIL_PATTERN.test((value ?? '').trim());
}

export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    return isValidEmail(String(value)) ? null : { email: true };
  };
}
