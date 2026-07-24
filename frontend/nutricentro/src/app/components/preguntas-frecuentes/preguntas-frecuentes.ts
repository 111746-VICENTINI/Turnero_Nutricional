import {CommonModule} from '@angular/common';
import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {AccordionModule} from 'primeng/accordion';
import {ButtonModule} from 'primeng/button';
import {AuthService} from '../../core/services/auth-service';
import {
  PREGUNTAS_FRECUENTES,
  SECCIONES_PREGUNTAS_FRECUENTES
} from './preguntas-frecuentes-data';
import {PreguntaFrecuente} from './preguntas-frecuentes-model';

interface SeccionVisible {
  nombre: string;
  preguntas: PreguntaFrecuente[];
}

@Component({
  selector: 'app-preguntas-frecuentes',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    ButtonModule
  ],
  templateUrl: './preguntas-frecuentes.html',
  styleUrl: './preguntas-frecuentes.css',
})
export class PreguntasFrecuentes {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  get seccionesVisibles(): SeccionVisible[] {
    const rolesActuales = this.authService.roles();

    return SECCIONES_PREGUNTAS_FRECUENTES
      .filter(seccion => seccion.rolesPermitidos.some(role => rolesActuales.includes(role)))
      .sort((primera, segunda) => primera.orden - segunda.orden)
      .map(seccion => ({
        nombre: seccion.nombre,
        preguntas: PREGUNTAS_FRECUENTES
          .filter(pregunta => pregunta.seccion === seccion.nombre)
          .filter(pregunta => pregunta.rolesPermitidos.some(role => rolesActuales.includes(role)))
          .sort((primera, segunda) => primera.orden - segunda.orden)
      }))
      .filter(seccion => seccion.preguntas.length > 0);
  }

  navegar(pregunta: PreguntaFrecuente): void {
    this.router.navigate(pregunta.ruta, {
      queryParams: pregunta.parametrosConsulta
    });
  }

  trackSeccion(_index: number, seccion: SeccionVisible): string {
    return seccion.nombre;
  }

  trackPregunta(_index: number, pregunta: PreguntaFrecuente): string {
    return pregunta.id;
  }
}
