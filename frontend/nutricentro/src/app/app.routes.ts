import { Routes } from '@angular/router';
import {LoginForm} from './components/login/login-form/login-form';
import {CreatePassword} from './components/login/create-password/create-password';
import {ResetPassword} from './components/login/reset-password/reset-password';
import {authGuard, workspaceRedirectGuard} from './core/guard/auth-guard';
import {Dashboard} from './layout/dashboard/dashboard';
import {Drawer} from './layout/drawer/drawer';
import {roleGuard} from './core/guard/role-guard';
import {HistoryClinical} from './components/history-clinical/history-clinical';
import {UnauthorizedComponent} from './shared/unauthorized/unauthorized.component';
import {UsersList} from './components/users/user-component/users-list/users-list';
import {CreateUser} from './components/users/user-component/create-user/create-user';
import {ListPatients} from './components/patients/list-patients/list-patients';
import {ProfessionalList} from './components/professionals/professional-list/professional-list';
import {CreateProfessionals} from './components/professionals/create-professionals/create-professionals';
import {CreatePatients} from './components/patients/create-patients/create-patients';
import {CreateSpecialty} from './components/professionals/specialties/create-specialty/create-specialty';
import {ListSpecialties} from './components/professionals/specialties/list-specialties/list-specialties';
import {ListAppointments} from './components/appointments/list-appointments/list-appointments';
import {CreateAppointments} from './components/appointments/create-appointments/create-appointments';
import {ProfessionalAvailability} from './components/professionals/availability/professional-availability';
import {PreguntasFrecuentes} from './components/preguntas-frecuentes/preguntas-frecuentes';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginForm
  },
  {
    path: 'create-password',
    component: CreatePassword
  },
  {
    path: 'reset-password',
    component: ResetPassword
  },
  {
    path: '',
    component: Drawer,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [workspaceRedirectGuard],
        children: []
      },
      // USUARIOS
      {
        path: 'users',
        component: UsersList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'users/create',
        component: CreateUser,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'users/:id',
        component: CreateUser,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'users/:id/edit',
        component: CreateUser,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      // PANTALLA PRINCIPAL
      {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      // PACIENTES
      {
        path: 'patient',
        component: ListPatients,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'patient/create',
        component: CreatePatients,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY'] }
      },
      {
        path: 'patient/:id',
        component: CreatePatients,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'patient/:id/edit',
        component: CreatePatients,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      // PROFESIONALES
      {
        path: 'professional',
        component: ProfessionalList,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'professional/create',
        component: CreateProfessionals,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'professional/:id',
        component: CreateProfessionals,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'professional/:id/edit',
        component: CreateProfessionals,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'availability',
        component: ProfessionalAvailability,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      // ESPECIALIDADES
      {
        path: 'specialty',
        component: ListSpecialties,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'specialty/create',
        component: CreateSpecialty,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'specialty/:id',
        component: CreateSpecialty,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'specialty/:id/edit',
        component: CreateSpecialty,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      // AGENDA-TURNOS
      {
        path: 'agenda',
        component: ListAppointments,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'mi-dia',
        component: ListAppointments,
        canActivate: [roleGuard],
        data: { roles: ['PROFESSIONAL'] }
      },
      {
        path: 'agenda/create',
        component: CreateAppointments,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'agenda/:id',
        component: CreateAppointments,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      {
        path: 'agenda/:id/edit',
        component: CreateAppointments,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
      // HISTORIAL CLINICO
      {
        path: 'medical-history',
        component: HistoryClinical,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'PROFESSIONAL'] }
      },
      {
        path: 'medical-history/:id',
        component: HistoryClinical,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'PROFESSIONAL'] }
      },
      {
        path: 'preguntas-frecuentes',
        component: PreguntasFrecuentes,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'] }
      },
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
