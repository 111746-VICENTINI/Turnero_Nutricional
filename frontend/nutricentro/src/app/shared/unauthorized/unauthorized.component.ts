import { Component } from '@angular/core';
import {RouterLinkActive} from '@angular/router';
import {Button} from 'primeng/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    RouterLinkActive,
    Button
  ],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.css'
})

export class UnauthorizedComponent {

}
