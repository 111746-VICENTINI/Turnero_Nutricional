import {inject, Injectable} from '@angular/core';
import {RegisterRequestDTO, UpdateUserDTO, UserResponseDTO} from '../model/login-model';
import {environment} from '../../enviroment/enviroment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {PageResponse} from '../model/paginacion-general';

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

  getUserById(id: number) {
    return this.http.get<UserResponseDTO>(
      `${this.apiUrl}/${id}`
    );
  }

  updateUser(id: number, request: UpdateUserDTO) {
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

  searchUsers(filters: {
    search?: string;
    role?: string;
    isActive?: boolean;
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

    return this.http.get<PageResponse<UserResponseDTO>>(
      `${environment.apiUrl}/user`,
      { params }
    );
  }
}
