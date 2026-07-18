import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroment/enviroment';
import { FollowUpDashboardDTO, PatientFollowUpStatusDTO } from '../models/follow-up-model';

@Injectable({
  providedIn: 'root',
})
export class FollowUpService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/follow-up`;

  getPatientStatus(patientId: number) {
    return this.http.get<PatientFollowUpStatusDTO>(`${this.apiUrl}/patients/${patientId}/status`);
  }

  getDashboardMetrics() {
    return this.http.get<FollowUpDashboardDTO>(`${this.apiUrl}/dashboard`);
  }
}
