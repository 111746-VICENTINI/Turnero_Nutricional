import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../enviroment/enviroment';
import {PatientRequestDTO, PatientResponseDTO, PatientUpdateDTO} from '../models/patient-model';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/patient`;

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

}
