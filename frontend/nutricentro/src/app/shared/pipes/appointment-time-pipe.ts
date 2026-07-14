import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appointmentTime',
})
export class AppointmentTimePipe implements PipeTransform {
  transform(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }

    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!timeRegex.test(value)) {
      return value;
    }

    const [hours, minutes] = value.split(':');
    return `${hours}:${minutes}`;
  }
}
