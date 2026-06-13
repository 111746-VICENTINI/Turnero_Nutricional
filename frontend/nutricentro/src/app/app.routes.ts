import { Routes } from '@angular/router';
import {LoginForm} from './components/login/login-form/login-form';
import {authGuard} from './core/guard/auth-guard';
import {Dashboard} from './layout/dashboard/dashboard';
import {Drawer} from './layout/drawer/drawer';
import {roleGuard} from './core/guard/role-guard';
import {HistoryClinical} from './components/history-clinical/history-clinical';
import {Calendar} from './components/appointments/calendar/calendar';
import {UnauthorizedComponent} from './shared/unauthorized/unauthorized.component';
import {UserComponent} from './components/users/user-component/user-component';
import {Patients} from './components/patients/patients';
import {UsersList} from './components/users/user-component/users-list/users-list';
import {CreateUser} from './components/users/user-component/create-user/create-user';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginForm
  },
  {
    path: '',
    component: Drawer,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'users',
        component: UsersList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'users/create',
        component: CreateUser,
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'users/:id/edit',
        component: CreateUser,
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'agenda',
        component: Calendar,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'history',
        component: HistoryClinical,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'PROFESSIONAL'] }
      },
      {
        path: 'history/:patientId',
        component: HistoryClinical,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'PROFESSIONAL'] }
      },
      {
        path: 'patients',
        component: Patients,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      }
    ]
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '**',
    redirectTo: 'login'
  }
  ];
