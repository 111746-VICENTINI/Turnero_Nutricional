import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../enviroment/enviroment';
import { EmailRequestDTO, EmailResponseDTO } from '../models/email-model';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/email`;

  send(request: EmailRequestDTO) {
    return this.http.post<EmailResponseDTO>(`${this.apiUrl}/send`, request);
  }
}
