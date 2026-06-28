import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../enviroment/enviroment';
import {ProfessionalRequestDTO, ProfessionalResponseDTO, ProfessionalUpdateDTO} from '../models/professional-model';
import {PageResponse} from '../../../core/models/paginacion-general';

@Injectable({
  providedIn: 'root',
})
export class ProfessionalService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/professional`;

  createProfessional(request: ProfessionalRequestDTO){
    return this.http.post<ProfessionalResponseDTO>(
      `${this.apiUrl}/create`, request);
  }

  getAllProfessionals(){
    return this.http.get<ProfessionalResponseDTO[]>(
      `${this.apiUrl}/all`
    );
  }

  getByIdProfessional(id: number){
    return this.http.get<ProfessionalResponseDTO>(
      `${this.apiUrl}/${id}`
    );
  }

  updateProfessional(id: number, request: ProfessionalUpdateDTO){
    return this.http.put<ProfessionalResponseDTO>(
      `${this.apiUrl}/${id}`, request
    );
  }

  deleteProfessional(id: number){
    return this.http.patch<void>(`${this.apiUrl}/${id}`, {});
  }

  searchProfessionals(filters: {
    search?: string;
    gender?: string;
    status?: string;
    specialtyId?: number;
    page?: number;
    size?: number;
  }) {
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

    return this.http.get<PageResponse<ProfessionalResponseDTO>>(
      `${environment.apiUrl}/professional`,
      { params }
    );
  }
}
