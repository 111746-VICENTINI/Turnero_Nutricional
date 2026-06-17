import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../../enviroment/enviroment';
import {SpecialtyRequestDTO, SpecialtyResponseDTO, SpecialtyUpdateDTO} from '../models/specialty-model';
import {PageResponse} from '../../../../core/model/paginacion-general';

@Injectable({
  providedIn: 'root',
})
export class SpecialtyService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/specialty`;

  createSpecialty(request: SpecialtyRequestDTO) {
    return this.http.post<SpecialtyResponseDTO>(`${this.apiUrl}/create`, request);
  }

  getAllSpecialties() {
    return this.http.get<SpecialtyResponseDTO[]>(`${this.apiUrl}/all`);
  }

  getByIdSpecialty(id: number) {
    return this.http.get<SpecialtyResponseDTO>(`${this.apiUrl}/${id}`);
  }

  updateSpecialty(id: number, request: SpecialtyUpdateDTO) {
    return this.http.put<SpecialtyResponseDTO>(`${this.apiUrl}/${id}`, request);
  }

  deleteSpecialty(id: number) {
    return this.http.delete<SpecialtyResponseDTO>(`${this.apiUrl}/${id}`);
  }

  searchSpecialties(filters: {
    name?: string;
    active?: string;
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

    return this.http.get<PageResponse<SpecialtyResponseDTO>>(
      `${environment.apiUrl}/specialty`,
      { params }
    );
  }
}
