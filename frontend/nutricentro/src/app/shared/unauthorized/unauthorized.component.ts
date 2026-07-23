import {Location} from '@angular/common';
import { Component, inject } from '@angular/core';
import {Router} from '@angular/router';
import {Button} from 'primeng/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    Button
  ],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.css'
})

export class UnauthorizedComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/login']);
  }
}
