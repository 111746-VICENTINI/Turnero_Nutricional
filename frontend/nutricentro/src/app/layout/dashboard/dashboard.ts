import {Component, inject} from '@angular/core';
import {CardModule} from 'primeng/card';
import {AuthService} from '../../core/services/auth-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
    public authService = inject(AuthService);
}
