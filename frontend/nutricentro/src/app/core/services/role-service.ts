import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../enviroment/enviroment';
import {RoleResponseDTO} from '../model/login-model';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/roles`;

  // createRole(request: RoleRequestDTO) {
  //   return this.http.post<RoleResponseDTO>(
  //     `${this.apiUrl}/create`,
  //     request
  //   );
  // }

  getRoles() {
    return this.http.get<RoleResponseDTO[]>(
      `${this.apiUrl}/all`
    );
  }
}
