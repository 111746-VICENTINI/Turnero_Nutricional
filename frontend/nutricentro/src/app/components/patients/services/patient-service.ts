import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../enviroment/enviroment';
import {PatientRequestDTO, PatientResponseDTO, PatientUpdateDTO} from '../models/patient-model';
import {PageResponse} from '../../../core/models/paginacion-general';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/patient`;

  createPatient(request: PatientRequestDTO) {
    return this.http.post<PatientResponseDTO>(
      `${this.apiUrl}/create`, request);
  }

  getAllPatients() {
    return this.http.get<PatientResponseDTO[]>(
      `${this.apiUrl}/all`
    );
  }

  getByIdPatient(id: number) {
    return this.http.get<PatientResponseDTO>(
      `${this.apiUrl}/${id}`
    );
  }

  updatePatient(id: number, request: PatientUpdateDTO) {
    return this.http.put<PatientResponseDTO>(
      `${this.apiUrl}/${id}`, request
    );
  }

  deletePatient(id: number) {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, {});
  }

  searchPatients(filters: {
    search?: string;
    gender?: string;
    status?: string;
    professionalId?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    size?: number;
  }){
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {

      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        params = params.set(key, String(value));
      }

    });

    return this.http.get<PageResponse<PatientResponseDTO>>(
      `${environment.apiUrl}/patient`,
      { params }
    );
  }
}
