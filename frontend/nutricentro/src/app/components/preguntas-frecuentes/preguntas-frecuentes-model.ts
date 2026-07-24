export type RolPreguntasFrecuentes = 'ADMIN' | 'SECRETARY' | 'PROFESSIONAL';

export interface PreguntaFrecuente {
  id: string;
  seccion: string;
  rolesPermitidos: RolPreguntasFrecuentes[];
  pregunta: string;
  respuesta: string;
  ruta: string[];
  parametrosConsulta?: Record<string, string>;
  textoBoton: string;
  orden: number;
}

export interface SeccionPreguntasFrecuentes {
  nombre: string;
  rolesPermitidos: RolPreguntasFrecuentes[];
  orden: number;
}
