import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroment/enviroment';
import {toIsoLocalDate} from '../../../shared/utils/date-utils';
import {
  AppointmentModality,
  ProfessionalAvailabilityExceptionRequestDTO, ProfessionalAvailabilityExceptionResponseDTO,
  ProfessionalScheduleRequestDTO,
  ProfessionalScheduleResponseDTO,
  ProfessionalScheduleUpdateDTO, WhatsAppConfigurationStatus
} from '../models/professional-schedule-model';

@Injectable({
  providedIn: 'root',
})
export class ProfessionalScheduleService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/professional-schedule`;
  private readonly exceptionApiUrl = `${environment.apiUrl}/professional-availability-exception`;
  private readonly whatsappApiUrl = `${environment.apiUrl}/whatsapp`;

  getByProfessional(professionalId: number) {
    return this.http.get<ProfessionalScheduleResponseDTO[]>(`${this.apiUrl}/professional/${professionalId}`);
  }

  createSchedule(request: ProfessionalScheduleRequestDTO) {
    return this.http.post<ProfessionalScheduleResponseDTO>(`${this.apiUrl}/create`, request);
  }

  updateSchedule(id: number, request: ProfessionalScheduleUpdateDTO) {
    return this.http.put<ProfessionalScheduleResponseDTO>(`${this.apiUrl}/${id}`, request);
  }

  deleteSchedule(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createException(request: ProfessionalAvailabilityExceptionRequestDTO) {
    return this.http.post<ProfessionalAvailabilityExceptionResponseDTO>(
      `${this.exceptionApiUrl}/create`,
      {...request, date: toIsoLocalDate(request.date)}
    );
  }

  getExceptionsByProfessionalAndDate(professionalId: number, date: string) {
    const params = new HttpParams().set('date', toIsoLocalDate(date));
    return this.http.get<ProfessionalAvailabilityExceptionResponseDTO[]>(
      `${this.exceptionApiUrl}/professional/${professionalId}`,
      { params }
    );
  }

  deleteException(id: number) {
    return this.http.delete<void>(`${this.exceptionApiUrl}/${id}`);
  }

  getAvailableSlots(professionalId: number, date: string, filters?: {
    modality?: AppointmentModality;
    locationKey?: string;
    durationMinutes?: number;
  }) {
    const params = new HttpParams()
      .set('professionalId', String(professionalId))
      .set('date', toIsoLocalDate(date));

    let requestParams = params;
    if (filters?.modality) {
      requestParams = requestParams.set('modality', filters.modality);
    }
    if (filters?.locationKey) {
      requestParams = requestParams.set('locationKey', filters.locationKey);
    }
    if (filters?.durationMinutes) {
      requestParams = requestParams.set('durationMinutes', String(filters.durationMinutes));
    }

    return this.http.get<string[]>(`${this.apiUrl}/available-slots`, { params: requestParams });
  }

  getWhatsAppStatus() {
    return this.http.get<WhatsAppConfigurationStatus>(`${this.whatsappApiUrl}/status`);
  }

  testWhatsAppConnection() {
    return this.http.post<WhatsAppConfigurationStatus>(`${this.whatsappApiUrl}/test-connection`, {});
  }
}
