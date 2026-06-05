import {inject, Injectable} from '@angular/core';
import {RegisterRequestDTO, UserResponseDTO} from '../model/login-model';
import {environment} from '../../enviroment/enviroment';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/user`;

  createUser(request: RegisterRequestDTO) {
    return this.http.post<UserResponseDTO>(
      `${this.apiUrl}/create`,
      request
    );
  }

  getUsers() {
    return this.http.get<UserResponseDTO[]>(
      `${this.apiUrl}/all`
    );
  }

  updateUser(id: number, request: RegisterRequestDTO) {
    return this.http.put<UserResponseDTO>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  deleteUser(id: number) {
    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }
}
