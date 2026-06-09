import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../enviroment/enviroment';
import {ProfessionalRequestDTO, ProfessionalResponseDTO, ProfessionalUpdateDTO} from '../models/professional-model';

@Injectable({
  providedIn: 'root',
})
export class ProfessionalService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/professional`;

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
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}
