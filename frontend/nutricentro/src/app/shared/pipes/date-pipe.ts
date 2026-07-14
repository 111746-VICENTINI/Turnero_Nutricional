import { Pipe, PipeTransform } from '@angular/core';
import { formatLocalDate, parseLocalDate } from '../utils/date-utils';

@Pipe({
  name: 'date',
  standalone: true
})
export class DatePipe implements PipeTransform {
  transform(value: string | Date | number, format: 'long' | 'short' | 'dayOnly' = 'long'): string {
    const date = parseLocalDate(value);

    if (!date) {
      return value ? String(value) : '-';
    }

    switch (format) {

      case 'short':
        return formatLocalDate(date);

      case 'dayOnly':
        return new Intl.DateTimeFormat('es-AR', {
          weekday: 'long'
        }).format(date);

      default:
        return new Intl.DateTimeFormat('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(date);
    }
  }
}
