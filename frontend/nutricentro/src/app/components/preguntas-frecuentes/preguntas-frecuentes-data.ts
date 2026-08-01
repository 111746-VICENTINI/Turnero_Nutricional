import {PreguntaFrecuente, SeccionPreguntasFrecuentes} from './preguntas-frecuentes-model';

export const SECCIONES_PREGUNTAS_FRECUENTES: SeccionPreguntasFrecuentes[] = [
  {nombre: 'Agenda', rolesPermitidos: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'], orden: 10},
  {nombre: 'Pacientes', rolesPermitidos: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'], orden: 20},
  {nombre: 'Profesionales', rolesPermitidos: ['ADMIN'], orden: 30},
  {nombre: 'Disponibilidad', rolesPermitidos: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'], orden: 40},
  {nombre: 'Historia Clínica', rolesPermitidos: ['ADMIN', 'PROFESSIONAL'], orden: 50},
  {nombre: 'Usuarios', rolesPermitidos: ['ADMIN'], orden: 60},
  {nombre: 'Configuración', rolesPermitidos: ['ADMIN'], orden: 70},
  {nombre: 'Mi Cuenta', rolesPermitidos: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'], orden: 80},
];

export const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  {
    id: 'agenda-crear-turno',
    seccion: 'Agenda',
    rolesPermitidos: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'],
    pregunta: '¿Cómo crear un turno?',
    respuesta: 'Desde agenda presione NUEVO TURNO, complete paciente, profesional, fecha, horario y guarde el turno.',
    ruta: ['/agenda/create'],
    textoBoton: 'Ir a Agenda',
    orden: 10
  },
  {
    id: 'agenda-historia',
    seccion: 'Agenda',
    rolesPermitidos: ['ADMIN', 'PROFESSIONAL'],
    pregunta: '¿Cómo abrir la historia clínica desde un turno?',
    respuesta: 'Desde agenda busque el turno del paciente, una vez que el paciente esté presente puede acceder a la historia clínica.',
    ruta: ['/agenda'],
    textoBoton: 'Ir a Agenda',
    orden: 30
  },
  {
    id: 'pacientes-donde',
    seccion: 'Pacientes',
    rolesPermitidos: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'],
    pregunta: '¿Dónde encuentro los pacientes?',
    respuesta: 'Desde pacientes podrá buscar personas, crearlos, editarlos o desactivarlos.',
    ruta: ['/patient'],
    textoBoton: 'Ir a Pacientes',
    orden: 40
  },
  {
    id: 'profesionales-donde',
    seccion: 'Profesionales',
    rolesPermitidos: ['ADMIN'],
    pregunta: '¿Dónde encuentro los profesionales?',
    respuesta: 'Desde profesionales podrá crear, editar, desactivarlos y darles especialidades.',
    ruta: ['/professional'],
    textoBoton: 'Ir a Profesionales',
    orden: 70
  },
  {
    id: 'disponibilidad-agregar',
    seccion: 'Disponibilidad',
    rolesPermitidos: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'],
    pregunta: '¿Cómo agregar horarios?',
    respuesta: 'Desde disponibilidad seleccione un día, agregue un bloque de atención y guarde.',
    ruta: ['/availability'],
    textoBoton: 'Ir a Disponibilidad',
    orden: 100
  },
  {
    id: 'disponibilidad-bloquear',
    seccion: 'Disponibilidad',
    rolesPermitidos: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'],
    pregunta: '¿Cómo bloquear un día u horario?',
    respuesta: 'Desde disponibilidad seleccione un día, cree una excepción o bloqueo y guarde.',
    ruta: ['/availability'],
    textoBoton: 'Ir a Disponibilidad',
    orden: 110
  },
  {
    id: 'historia-antropometria',
    seccion: 'Historia Clínica',
    rolesPermitidos: ['ADMIN', 'PROFESSIONAL'],
    pregunta: '¿Cómo cargar una antropometría?',
    respuesta: 'Desde historia clínica ingrese a antropometría, cargue las mediciones y guarde.',
    ruta: ['/medical-history'],
    parametrosConsulta: {tab: 'anthropometry'},
    textoBoton: 'Ir a Historia Clínica',
    orden: 140
  },
  {
    id: 'historia-laboratorio',
    seccion: 'Historia Clínica',
    rolesPermitidos: ['ADMIN', 'PROFESSIONAL'],
    pregunta: '¿Cómo registrar un laboratorio?',
    respuesta: 'Desde historia clínica ingrese a laboratorio, complete los valores y guarde.',
    ruta: ['/medical-history'],
    parametrosConsulta: {tab: 'laboratory'},
    textoBoton: 'Ir a Historia Clínica',
    orden: 150
  },
  {
    id: 'historia-archivos',
    seccion: 'Historia Clínica',
    rolesPermitidos: ['ADMIN', 'PROFESSIONAL'],
    pregunta: '¿Cómo adjuntar archivos?',
    respuesta: 'Desde historia clínica ingrese a archivos, agregue el documento y guarde.',
    ruta: ['/medical-history'],
    parametrosConsulta: {tab: 'files'},
    textoBoton: 'Ir a Historia Clínica',
    orden: 170
  },
  {
    id: 'usuarios-donde',
    seccion: 'Usuarios',
    rolesPermitidos: ['ADMIN'],
    pregunta: '¿Dónde encuentro los usuarios?',
    respuesta: 'Desde usuarios podrá buscar, crear, editar y desactivar usuarios.',
    ruta: ['/users'],
    textoBoton: 'Ir a Usuarios',
    orden: 180
  },
  {
    id: 'usuarios-invitacion',
    seccion: 'Usuarios',
    rolesPermitidos: ['ADMIN'],
    pregunta: '¿Se puede reenviar una invitación?',
    respuesta: 'Desde usuarios busque la persona y presione REENVIAR INVITACIÓN, esto solo si todavía no creo la contraseña.',
    ruta: ['/users'],
    textoBoton: 'Ir a Usuarios',
    orden: 200
  },
  {
    id: 'mi-cuenta-especialidades',
    seccion: 'Mi Cuenta',
    rolesPermitidos: ['PROFESSIONAL'],
    pregunta: '¿Cómo ver o editar mis especialidades?',
    respuesta: 'Desde MI PERFIL ingresá a mis datos. Allí podrás agregar o quitar tus especialidades y guardar los cambios.',
    ruta: ['/preguntas-frecuentes'],
    parametrosConsulta: {panel: 'mis-datos'},
    textoBoton: 'Ir a Mis Datos',
    orden: 220
  },
  {
    id: 'mi-cuenta-contrasena',
    seccion: 'Mi Cuenta',
    rolesPermitidos: ['ADMIN', 'SECRETARY', 'PROFESSIONAL'],
    pregunta: '¿Cómo cambiar mi contraseña?',
    respuesta: 'Desde MI PERFIL elija cambiar contraseña, complete los datos y guarde.',
    ruta: ['/preguntas-frecuentes'],
    parametrosConsulta: {panel: 'contrasena'},
    textoBoton: 'Ir a Mi Cuenta',
    orden: 230
  }
];
