import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map} from 'rxjs';
import {environment} from '../../../enviroment/enviroment';
import {toIsoLocalDate} from '../../../shared/utils/date-utils';
import {
  AppointmentFilters,
  AppointmentTimelineEventResponseDTO,
  AppointmentPageDTO,
  AppointmentRequestDTO,
  AppointmentResponseDTO,
  AppointmentUpdateDTO
} from '../models/appointment-model';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/appointment`;

  createAppointment(request: AppointmentRequestDTO){
    return this.http.post<AppointmentResponseDTO>(
      `${this.apiUrl}/create`, request);
  }

  getAllAppointment(){
    return this.searchAppointments({ page: 0, size: 100 }).pipe(
      map((response) => response.content)
    );
  }

  searchAppointments(filters: AppointmentFilters = {}) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const normalizedValue = key === 'dateFrom' || key === 'dateTo'
          ? toIsoLocalDate(value)
          : String(value);
        params = params.set(key, normalizedValue);
      }
    });

    return this.http.get<AppointmentPageDTO>(this.apiUrl, { params });
  }

  getAppointmentsByStatus(status: string) {
    return this.http.get<AppointmentResponseDTO[]>(
      `${this.apiUrl}/status/${status}`
    );
  }

  getByIdAppointment(id: number){
    return this.http.get<AppointmentResponseDTO>(
      `${this.apiUrl}/${id}`
    );
  }

  getAppointmentTimeline(id: number){
    return this.http.get<AppointmentTimelineEventResponseDTO[]>(
      `${this.apiUrl}/${id}/timeline`
    );
  }

  updateAppointment(id: number, request: AppointmentUpdateDTO){
    return this.http.put<AppointmentResponseDTO>(
      `${this.apiUrl}/${id}`, request
    );
  }

  deleteAppointment(id: number){
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
