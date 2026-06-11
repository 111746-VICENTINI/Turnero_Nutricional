import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {Button} from 'primeng/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    Button,
    RouterLink
  ],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.css'
})

export class UnauthorizedComponent {

}
