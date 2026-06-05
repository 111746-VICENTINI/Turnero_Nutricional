import { Component } from '@angular/core';
import {UsersList} from './users-list/users-list';
import {CreateUser} from './create-user/create-user';

@Component({
  selector: 'app-user-component',
  standalone: true,
  imports: [
    UsersList,
    CreateUser
  ],
  templateUrl: './user-component.html',
  styleUrl: './user-component.css',
})
export class UserComponent {

}
