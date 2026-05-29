// Datos iniciales del Sistema de Convivencia Escolar.
// Se ejecuta con: npx prisma db seed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Contraseña de todos los usuarios de prueba: "password123"
const HASH = '$2b$12$sJTBO8SrXF0QewtdxpIFk.2xY.UKOg9W.5RVGFaIRFtPtxcQSgCWe';

async function main() {
  console.log('Iniciando seed...');

  // -----------------------------------------------------------
  // 1. CATALOGOS
  // -----------------------------------------------------------

  await prisma.rol.createMany({
    data: [
      { nombre: 'Administrador', descripcion: 'Gestiona usuarios, roles y configuración del sistema' },
      { nombre: 'Docente', descripcion: 'Registra incidentes y anotaciones positivas' },
      { nombre: 'Inspector', descripcion: 'Registra y deriva incidentes' },
      { nombre: 'Orientador', descripcion: 'Gestiona casos e intervenciones' },
      { nombre: 'Equipo Directivo', descripcion: 'Supervisa y consulta reportes' },
    ],
  });

  await prisma.gravedad.createMany({
    data: [
      { nombre: 'Leve', nivel: 1, descripcion: 'Falta menor que no afecta gravemente la convivencia' },
      { nombre: 'Grave', nivel: 2, descripcion: 'Falta que afecta significativamente la convivencia' },
      { nombre: 'Muy grave', nivel: 3, descripcion: 'Falta que vulnera derechos o requiere protocolo formal' },
    ],
  });

  await prisma.estadoCaso.createMany({
    data: [
      { nombre: 'Abierto', descripcion: 'Incidente recién registrado, sin intervención' },
      { nombre: 'En seguimiento', descripcion: 'Incidente con intervenciones en curso' },
      { nombre: 'Cerrado', descripcion: 'Incidente resuelto y sin acciones pendientes' },
    ],
  });

  await prisma.rolEnConflicto.createMany({
    data: [
      { nombre: 'Agresor', descripcion: 'Estudiante que ejerce la conducta agresiva' },
      { nombre: 'Víctima', descripcion: 'Estudiante que recibe la conducta agresiva' },
      { nombre: 'Testigo', descripcion: 'Estudiante presente que presencia el hecho' },
    ],
  });

  await prisma.tipoIncidente.createMany({
    data: [
      { nombre: 'Agresión verbal', descripcion: 'Insultos, burlas, amenazas verbales' },
      { nombre: 'Agresión física', descripcion: 'Golpes, empujones, contacto físico violento' },
      { nombre: 'Acoso escolar', descripcion: 'Hostigamiento sistemático a un compañero' },
      { nombre: 'Discriminación', descripcion: 'Trato desigual por características personales' },
      { nombre: 'Daño a la propiedad', descripcion: 'Destrucción intencional de bienes ajenos o del colegio' },
      { nombre: 'Otro', descripcion: 'Incidente no clasificado en las categorías anteriores' },
    ],
  });

  await prisma.configuracionSistema.createMany({
    data: [
      { clave: 'positivas_para_compensar', valor: '3', descripcion: 'Cantidad de anotaciones positivas necesarias para compensar una anotación negativa' },
      { clave: 'incidentes_graves_para_alerta', valor: '3', descripcion: 'Cantidad de incidentes graves acumulados que dispara la alerta de reincidencia' },
    ],
  });

  console.log('Catálogos creados.');

  // -----------------------------------------------------------
  // 2. USUARIOS
  // -----------------------------------------------------------
  // rolId: 1=Admin, 2=Docente, 3=Inspector, 4=Orientador, 5=Directivo
  // Nota: los IDs asumen una base recién migrada (autoincremento empieza en 1)

  const usuarios = [
    ['Carlos Andrés Soto Vargas', 'admin.carlos@liceosanlorenzo.cl', 1],
    ['María Patricia Fernández Rojas', 'directivo.maria@liceosanlorenzo.cl', 5],
    ['Roberto Eduardo Pérez Muñoz', 'directivo.roberto@liceosanlorenzo.cl', 5],
    ['Claudia Andrea Sepúlveda Díaz', 'directivo.claudia@liceosanlorenzo.cl', 5],
    ['Andrea Paola Morales Contreras', 'orientador.andrea@liceosanlorenzo.cl', 4],
    ['Luis Felipe Hernández Torres', 'orientador.luis@liceosanlorenzo.cl', 4],
    ['Juan Manuel Castro Ramírez', 'inspector.juan@liceosanlorenzo.cl', 3],
    ['Patricia Elena Vargas Espinoza', 'inspector.patricia@liceosanlorenzo.cl', 3],
    ['Pedro Antonio Reyes Flores', 'inspector.pedro@liceosanlorenzo.cl', 3],
    ['Carolina Macarena Tapia Soto', 'inspector.carolina@liceosanlorenzo.cl', 3],
    ['Sergio Alejandro Cárdenas Lagos', 'inspector.sergio@liceosanlorenzo.cl', 3],
    ['Mónica Beatriz Saavedra Riquelme', 'inspector.monica@liceosanlorenzo.cl', 3],
    ['Héctor Mauricio Bravo Salinas', 'inspector.hector@liceosanlorenzo.cl', 3],
    ['Daniela Francisca Carrasco Henríquez', 'docente.daniela@liceosanlorenzo.cl', 2],
    ['Javier Andrés Figueroa Pizarro', 'docente.javier@liceosanlorenzo.cl', 2],
    ['Macarena Antonia Olivares Vega', 'docente.macarena@liceosanlorenzo.cl', 2],
    ['Cristián Eduardo Salazar Aguilera', 'docente.cristian@liceosanlorenzo.cl', 2],
    ['Paulina Andrea Sanhueza Becerra', 'docente.paulina@liceosanlorenzo.cl', 2],
    ['Francisco Javier Garrido Núñez', 'docente.francisco@liceosanlorenzo.cl', 2],
    ['Verónica Isabel Cortés Herrera', 'docente.veronica@liceosanlorenzo.cl', 2],
    ['Mauricio Patricio Álvarez Castillo', 'docente.mauricio@liceosanlorenzo.cl', 2],
    ['Jessica Carolina Vásquez Gutiérrez', 'docente.jessica@liceosanlorenzo.cl', 2],
    ['Rodrigo Sebastián Fuentes Araya', 'docente.rodrigo@liceosanlorenzo.cl', 2],
    ['Pamela Andrea Silva Martínez', 'docente.pamela@liceosanlorenzo.cl', 2],
    ['Andrés Felipe Rodríguez López', 'docente.andres@liceosanlorenzo.cl', 2],
    ['Carla Beatriz Núñez Valenzuela', 'docente.carla@liceosanlorenzo.cl', 2],
    ['Eduardo Patricio Torres Riquelme', 'docente.eduardo@liceosanlorenzo.cl', 2],
    ['Pía Constanza Espinoza Tapia', 'docente.pia@liceosanlorenzo.cl', 2],
    ['Marcelo Andrés Contreras Bravo', 'docente.marcelo@liceosanlorenzo.cl', 2],
  ];

  await prisma.usuario.createMany({
    data: usuarios.map(([nombre, correo, rolId]) => ({
      nombre: nombre as string,
      correo: correo as string,
      contrasenaHash: HASH,
      rolId: BigInt(rolId as number),
    })),
  });

  console.log(`${usuarios.length} usuarios creados.`);

  // -----------------------------------------------------------
  // 3. ESTUDIANTES
  // -----------------------------------------------------------

  const estudiantes = [
    ['23835243-6', 'Matías Carlos Flores Torres', '1°A Medio'],
    ['23617026-8', 'Juan Joaquín Lagos Salinas', '1°A Medio'],
    ['23967759-2', 'Javier Ignacio Rojas Muñoz', '1°A Medio'],
    ['23549123-0', 'Diego Daniel Aguilera Muñoz', '1°A Medio'],
    ['23794254-K', 'Pedro Pablo Garrido Cortés', '1°A Medio'],
    ['23719949-9', 'Nicolás Andrés Flores González', '1°A Medio'],
    ['23897833-5', 'Pedro Ignacio Castillo Flores', '1°A Medio'],
    ['23581516-8', 'Carlos Maximiliano Contreras Soto', '1°A Medio'],
    ['23699191-1', 'Bastián Luis Ramírez Aguilera', '1°A Medio'],
    ['23638685-6', 'Juan Nicolás Cortés Silva', '1°A Medio'],
    ['23983548-1', 'Antonella Paula Espinoza Olivares', '1°A Medio'],
    ['23824282-7', 'Paula Martina Cárdenas Pérez', '1°A Medio'],
    ['23524025-4', 'Carlos Lucas Soto Hernández', '1°A Medio'],
    ['23954286-7', 'Agustín Felipe Herrera Olivares', '1°A Medio'],
    ['23937314-3', 'Catalina Antonia Ramírez Fuentes', '1°A Medio'],
    ['23851364-2', 'Daniela Andrea Vega Pérez', '1°A Medio'],
    ['23819360-5', 'Daniel Carlos Torres Morales', '1°A Medio'],
    ['23742357-7', 'Javiera Andrea Garrido Salazar', '1°A Medio'],
    ['23615141-7', 'Carla Francisca Díaz Hernández', '1°A Medio'],
    ['23930861-9', 'Manuel Maximiliano Castro Flores', '1°A Medio'],
    ['23534701-6', 'Eduardo Javier Cárdenas Tapia', '1°A Medio'],
    ['23611477-5', 'Antonia Roxana Vega Herrera', '1°A Medio'],
    ['23174905-5', 'Constanza Javiera Salinas Salazar', '2°A Medio'],
    ['23382579-4', 'Macarena Paula Álvarez Figueroa', '2°A Medio'],
    ['23309400-5', 'Emilia Constanza Carrasco Saavedra', '2°A Medio'],
    ['23147662-8', 'José Joaquín Sepúlveda Olivares', '2°A Medio'],
    ['23183876-7', 'María Antonella Gutiérrez Gutiérrez', '2°A Medio'],
    ['23412417-K', 'Magdalena Javiera Salazar González', '2°A Medio'],
    ['23456664-4', 'Rodrigo Eduardo Cortés Henríquez', '2°A Medio'],
    ['23239893-0', 'Florencia Maite Álvarez Morales', '2°A Medio'],
    ['23337881-K', 'Juan Eduardo Becerra Araya', '2°A Medio'],
    ['23362451-9', 'Gabriel Joaquín Olivares Valenzuela', '2°A Medio'],
    ['23434993-7', 'Sebastián Agustín Henríquez Morales', '2°A Medio'],
    ['23382789-4', 'Andrés Maximiliano Saavedra Muñoz', '2°A Medio'],
    ['23158650-4', 'Claudia Carla Valenzuela Torres', '2°A Medio'],
    ['23130369-3', 'Luis Javier Soto Soto', '2°A Medio'],
    ['23483730-3', 'Carla Antonella Henríquez Cortés', '2°A Medio'],
    ['23165934-K', 'Rodrigo Martín Salazar Morales', '2°A Medio'],
    ['23238966-4', 'Martina Paula Henríquez Becerra', '2°A Medio'],
    ['23461689-7', 'Pedro Lucas Castro Sanhueza', '2°A Medio'],
    ['23440723-6', 'Camila Roxana Bravo Vásquez', '2°A Medio'],
    ['23163441-K', 'Diego Vicente Castillo Muñoz', '2°A Medio'],
    ['23408443-7', 'Javier Diego González Pérez', '2°A Medio'],
    ['23471112-1', 'Diego Vicente Rojas Castillo', '2°A Medio'],
    ['23137149-4', 'Felipe Pedro Saavedra Fuentes', '2°A Medio'],
    ['22982713-8', 'Juan Eduardo Riquelme Riquelme', '3°A Medio'],
    ['22947815-K', 'Manuel Martín Vargas López', '3°A Medio'],
    ['22749453-0', 'Rodrigo Ignacio Ramírez Álvarez', '3°A Medio'],
    ['22915535-0', 'Patricia Macarena Díaz Lagos', '3°A Medio'],
    ['23042598-1', 'Benjamín Ignacio Becerra Castillo', '3°A Medio'],
    ['22757288-4', 'Tomás Diego Cortés Vásquez', '3°A Medio'],
    ['22773495-7', 'Catalina Valentina Herrera Torres', '3°A Medio'],
    ['22739523-0', 'Pía Claudia Salazar Contreras', '3°A Medio'],
    ['22726522-1', 'Vicente Manuel Torres Morales', '3°A Medio'],
    ['22913078-1', 'Trinidad Martina Castro Díaz', '3°A Medio'],
    ['22786317-K', 'Sofía Fernanda Araya Herrera', '3°A Medio'],
    ['22849552-2', 'Daniela Francisca Salazar Sanhueza', '3°A Medio'],
    ['23076652-5', 'Constanza Emilia Espinoza Fuentes', '3°A Medio'],
    ['22730662-9', 'Juan Maximiliano Díaz Díaz', '3°A Medio'],
    ['23006277-3', 'Magdalena Claudia Bravo Morales', '3°A Medio'],
    ['22729821-9', 'José Cristóbal Pérez Aguilera', '3°A Medio'],
    ['22735631-6', 'Agustín Joaquín Riquelme Torres', '3°A Medio'],
    ['23003520-2', 'Andrés Vicente Vargas Sanhueza', '3°A Medio'],
    ['23006012-6', 'Roxana Javiera Fuentes Sanhueza', '3°A Medio'],
    ['23075490-K', 'Emilia Valentina Castro Martínez', '3°A Medio'],
    ['23052159-K', 'Camila Maite Henríquez Pérez', '3°A Medio'],
    ['22704883-2', 'María Paula Contreras Pérez', '3°A Medio'],
    ['22981875-9', 'Gabriel Felipe Martínez Ramírez', '3°A Medio'],
    ['22661826-0', 'Luis Diego Reyes Espinoza', '4°A Medio'],
    ['22282704-3', 'Carla Josefa Cárdenas Valenzuela', '4°A Medio'],
    ['22520695-3', 'Rodrigo José Salazar Valenzuela', '4°A Medio'],
    ['22688508-0', 'Luis Sebastián Araya Silva', '4°A Medio'],
    ['22666465-3', 'Juan Daniel Sepúlveda Flores', '4°A Medio'],
    ['22347721-6', 'Pedro Maximiliano Fuentes Lagos', '4°A Medio'],
    ['22532523-5', 'Magdalena Trinidad Araya Díaz', '4°A Medio'],
    ['22248390-5', 'Carla Javiera Rojas González', '4°A Medio'],
    ['22374879-1', 'Pablo Felipe Morales Salinas', '4°A Medio'],
    ['22431649-6', 'Josefa Sofía Silva Pérez', '4°A Medio'],
    ['22695478-3', 'Daniel Benjamín Reyes Figueroa', '4°A Medio'],
    ['22489682-4', 'Ignacio Sebastián Rojas Valenzuela', '4°A Medio'],
    ['22391182-K', 'Luis Bastián Fuentes Lagos', '4°A Medio'],
    ['22330825-2', 'Bastián Manuel Salazar Vargas', '4°A Medio'],
    ['22525405-2', 'Eduardo Diego Morales Rodríguez', '4°A Medio'],
    ['22662115-6', 'Sofía Martina Salinas Castillo', '4°A Medio'],
    ['22610195-0', 'Pía Andrea Salinas Torres', '4°A Medio'],
    ['22339883-9', 'Manuel Pedro Contreras Gutiérrez', '4°A Medio'],
    ['22657266-K', 'José Martín Hernández López', '4°A Medio'],
    ['22628126-6', 'Amanda Valentina Hernández Hernández', '4°A Medio'],
    ['22212406-9', 'Agustín Maximiliano Flores Pérez', '4°A Medio'],
    ['22605445-6', 'Amanda Andrea Carrasco Castro', '4°A Medio'],
  ];

  await prisma.estudiante.createMany({
    data: estudiantes.map(([run, nombre, curso]) => ({
      run: run as string,
      nombre: nombre as string,
      curso: curso as string,
      anioAcademico: 2026,
    })),
  });

  console.log(`${estudiantes.length} estudiantes creados.`);

  // -----------------------------------------------------------
  // 4. INCIDENTES
  // -----------------------------------------------------------
  // Campos: fecha, lugar, descripcion, gravedadId, tipoIncidenteId,
  //         estadoCasoId, registradoPorId, eliminadoEn
  // Los IDs de catálogo coinciden con el orden del seed:
  //   gravedad: 1=Leve, 2=Grave, 3=Muy grave
  //   tipo:     1..6 en el orden insertado arriba
  //   estado:   1=Abierto, 2=En seguimiento, 3=Cerrado

  const incidentes: [string, string, string, number, number, number, number, string | null][] = [
    ['2026-03-03T16:15:00', 'Baños del primer piso', 'Amenaza verbal hacia un compañero presenciada por otros estudiantes.', 2, 1, 3, 27, null],
    ['2026-03-03T16:45:00', 'Biblioteca', 'Discusión entre estudiantes durante el recreo por motivos menores.', 1, 4, 3, 15, null],
    ['2026-03-04T12:45:00', 'Escaleras del segundo piso', 'Hostigamiento sostenido en el tiempo hacia un estudiante de curso menor.', 3, 4, 1, 28, null],
    ['2026-03-05T12:00:00', 'Patio techado', 'Agresión verbal directa con insultos hacia un compañero durante el recreo.', 2, 1, 1, 29, null],
    ['2026-03-09T11:30:00', 'Patio central', 'Negativa rotunda y agresiva ante una indicación del inspector de patio.', 2, 6, 2, 23, null],
    ['2026-03-11T08:00:00', 'Comedor', 'Agresión verbal directa con insultos hacia un compañero durante el recreo.', 2, 3, 1, 20, null],
    ['2026-03-11T14:45:00', 'Sala 3°A Medio', 'Daño deliberado al mobiliario del establecimiento (rayado de muros y rotura de silla).', 3, 4, 1, 9, null],
    ['2026-03-12T12:15:00', 'Casino', 'Daño intencional al material escolar de un compañero.', 2, 3, 3, 24, null],
    ['2026-03-13T11:00:00', 'Biblioteca', 'Estudiante interrumpe reiteradamente la clase, dificultando el desarrollo de la asignatura.', 1, 5, 3, 10, null],
    ['2026-03-13T12:30:00', 'Sala 3°A Medio', 'Daño intencional al material escolar de un compañero.', 2, 4, 2, 21, null],
    ['2026-03-13T14:15:00', 'Sala de profesores (cercanías)', 'Amenazas de violencia con objeto contundente hacia un compañero.', 3, 5, 3, 19, '2026-03-15T15:15:00'],
    ['2026-03-16T08:30:00', 'Salida del establecimiento', 'Empujones y golpes leves entre estudiantes tras una discusión en el patio.', 2, 2, 3, 26, null],
    ['2026-03-16T12:45:00', 'Comedor', 'Amenaza verbal hacia un compañero presenciada por otros estudiantes.', 2, 3, 3, 28, null],
    ['2026-03-17T11:45:00', 'Casino', 'Daño intencional al material escolar de un compañero.', 2, 2, 2, 25, null],
    ['2026-03-18T10:45:00', 'Cancha de baby fútbol', 'Llegada reiteradamente atrasada a clases sin justificación.', 1, 1, 2, 7, null],
    ['2026-03-18T11:30:00', 'Sala 4°A Medio', 'Amenaza verbal hacia un compañero presenciada por otros estudiantes.', 2, 3, 2, 8, null],
    ['2026-03-19T12:00:00', 'Sala 2°A Medio', 'Amenaza verbal hacia un compañero presenciada por otros estudiantes.', 2, 1, 3, 8, null],
    ['2026-03-23T08:00:00', 'Comedor', 'Daño deliberado al mobiliario del establecimiento (rayado de muros y rotura de silla).', 3, 2, 2, 29, null],
    ['2026-03-24T12:30:00', 'Sala de profesores (cercanías)', 'Uso inadecuado del teléfono celular en clases pese a advertencias previas.', 1, 2, 1, 17, null],
    ['2026-03-27T09:15:00', 'Biblioteca', 'Amenaza verbal hacia un compañero presenciada por otros estudiantes.', 2, 5, 1, 29, null],
    ['2026-03-30T14:30:00', 'Sala de profesores (cercanías)', 'Agresión física con golpes que requirió intervención del inspector y derivación a enfermería.', 3, 3, 2, 28, null],
    ['2026-03-31T10:45:00', 'Sala 2°A Medio', 'Agresión física con golpes que requirió intervención del inspector y derivación a enfermería.', 3, 1, 3, 8, null],
    ['2026-04-01T14:15:00', 'Pasillo de salas', 'Empujones y golpes leves entre estudiantes tras una discusión en el patio.', 2, 2, 2, 16, null],
    ['2026-04-02T10:30:00', 'Sala 1°A Medio', 'Empujones y golpes leves entre estudiantes tras una discusión en el patio.', 2, 1, 3, 8, null],
    ['2026-04-03T09:30:00', 'Sala 4°A Medio', 'Lanzamiento de objetos pequeños (papeles, gomas) entre compañeros en sala.', 1, 6, 3, 9, null],
    ['2026-04-06T09:15:00', 'Comedor', 'Llegada reiteradamente atrasada a clases sin justificación.', 1, 2, 2, 19, null],
    ['2026-04-06T11:45:00', 'Sala 4°A Medio', 'Negativa rotunda y agresiva ante una indicación del inspector de patio.', 2, 1, 3, 8, null],
    ['2026-04-07T16:30:00', 'Sala 4°A Medio', 'Daño intencional al material escolar de un compañero.', 2, 2, 3, 20, null],
    ['2026-04-10T14:30:00', 'Sala 2°A Medio', 'Sustracción de pertenencias de un compañero sin autorización.', 2, 4, 3, 10, null],
    ['2026-04-10T16:30:00', 'Biblioteca', 'Estudiante difunde rumores ofensivos sobre una compañera en redes sociales.', 2, 3, 1, 24, null],
    ['2026-04-13T10:45:00', 'Pasillo de salas', 'Estudiante difunde rumores ofensivos sobre una compañera en redes sociales.', 2, 1, 2, 25, null],
    ['2026-04-20T12:45:00', 'Casino', 'Daño intencional al material escolar de un compañero.', 2, 4, 2, 16, null],
    ['2026-04-20T15:00:00', 'Baños del primer piso', 'Amenazas de violencia con objeto contundente hacia un compañero.', 3, 6, 1, 23, null],
    ['2026-04-23T10:45:00', 'Patio central', 'Uso inadecuado del teléfono celular en clases pese a advertencias previas.', 1, 6, 3, 10, null],
    ['2026-04-27T08:15:00', 'Biblioteca', 'Sustracción de pertenencias de un compañero sin autorización.', 2, 3, 3, 26, null],
    ['2026-04-27T10:30:00', 'Escaleras del segundo piso', 'Hostigamiento sostenido en el tiempo hacia un estudiante de curso menor.', 3, 4, 3, 28, null],
    ['2026-04-27T14:15:00', 'Cancha de baby fútbol', 'Daño deliberado al mobiliario del establecimiento (rayado de muros y rotura de silla).', 3, 2, 2, 26, null],
    ['2026-04-27T15:00:00', 'Escaleras del segundo piso', 'Amenaza verbal hacia un compañero presenciada por otros estudiantes.', 2, 2, 3, 25, null],
    ['2026-04-27T16:00:00', 'Salida del establecimiento', 'Discriminación grave hacia un compañero por su orientación sexual con humillación pública.', 3, 3, 2, 9, null],
    ['2026-04-29T08:00:00', 'Cancha de baby fútbol', 'Falta de respeto verbal hacia un compañero durante actividad grupal.', 1, 6, 3, 21, null],
    ['2026-04-29T12:15:00', 'Casino', 'Discriminación grave hacia un compañero por su orientación sexual con humillación pública.', 3, 2, 3, 7, null],
    ['2026-05-01T16:30:00', 'Sala de profesores (cercanías)', 'Empujones y golpes leves entre estudiantes tras una discusión en el patio.', 2, 4, 2, 10, null],
    ['2026-05-04T12:00:00', 'Comedor', 'Falta de respeto verbal hacia un compañero durante actividad grupal.', 1, 4, 3, 23, null],
    ['2026-05-05T12:45:00', 'Sala 2°A Medio', 'Empujones y golpes leves entre estudiantes tras una discusión en el patio.', 2, 2, 2, 28, null],
    ['2026-05-05T14:15:00', 'Patio central', 'Sustracción de pertenencias de un compañero sin autorización.', 2, 2, 3, 11, null],
    ['2026-05-05T15:00:00', 'Sala 2°A Medio', 'Sustracción de pertenencias de un compañero sin autorización.', 2, 3, 2, 27, null],
    ['2026-05-06T13:00:00', 'Biblioteca', 'Sustracción de pertenencias de un compañero sin autorización.', 2, 6, 2, 29, null],
    ['2026-05-11T11:45:00', 'Comedor', 'Discriminación grave hacia un compañero por su orientación sexual con humillación pública.', 3, 5, 3, 22, null],
    ['2026-05-12T10:45:00', 'Pasillo de salas', 'Negativa rotunda y agresiva ante una indicación del inspector de patio.', 2, 4, 1, 10, null],
    ['2026-05-12T16:30:00', 'Biblioteca', 'Estudiante se niega a seguir las indicaciones del docente.', 1, 5, 2, 8, null],
  ];

  await prisma.incidente.createMany({
    data: incidentes.map(([fecha, lugar, descripcion, gId, tId, eId, rId, elim]) => ({
      fecha: new Date(fecha),
      lugar,
      descripcion,
      gravedadId: BigInt(gId),
      tipoIncidenteId: BigInt(tId),
      estadoCasoId: BigInt(eId),
      registradoPorId: BigInt(rId),
      eliminadoEn: elim ? new Date(elim) : null,
    })),
  });

  console.log(`${incidentes.length} incidentes creados.`);

  // -----------------------------------------------------------
  // 5. PARTICIPACIONES (tabla intermedia)
  // -----------------------------------------------------------
  // [incidenteId, estudianteId, rolEnConflictoId]
  // rol: 1=Agresor, 2=Víctima, 3=Testigo

  const participaciones: [number, number, number][] = [
    [1, 87, 1], [1, 36, 2], [2, 54, 1], [2, 44, 2], [2, 1, 3], [2, 38, 3],
    [3, 76, 1], [3, 75, 2], [4, 63, 1], [4, 20, 2], [4, 71, 3], [4, 64, 3],
    [5, 71, 1], [5, 70, 2], [6, 42, 1], [6, 25, 2], [7, 31, 1], [7, 75, 2],
    [7, 30, 3], [7, 55, 3], [8, 4, 1], [8, 7, 2], [9, 61, 1], [9, 49, 2],
    [10, 69, 1], [10, 50, 2], [11, 84, 1], [11, 20, 2], [11, 5, 3], [11, 18, 3],
    [12, 76, 1], [12, 43, 2], [13, 57, 1], [13, 13, 2], [13, 2, 3], [13, 21, 3],
    [14, 84, 1], [14, 20, 2], [15, 34, 1], [16, 89, 1], [16, 51, 2], [17, 43, 1],
    [17, 88, 2], [18, 69, 1], [18, 70, 2], [19, 41, 1], [19, 82, 2], [20, 63, 1],
    [20, 71, 2], [21, 69, 1], [21, 5, 2], [22, 43, 1], [22, 81, 2], [23, 4, 1],
    [23, 10, 2], [24, 88, 1], [24, 37, 2], [25, 12, 1], [25, 57, 2], [25, 84, 3],
    [26, 13, 1], [26, 58, 2], [27, 39, 1], [27, 4, 2], [28, 8, 1], [29, 48, 1],
    [29, 57, 2], [30, 87, 1], [30, 19, 2], [31, 53, 1], [31, 74, 2], [32, 24, 1],
    [32, 22, 2], [33, 79, 1], [33, 49, 2], [34, 31, 1], [34, 65, 2], [35, 4, 1],
    [35, 76, 2], [36, 60, 1], [37, 69, 1], [37, 83, 2], [38, 33, 1], [38, 87, 2],
    [39, 87, 1], [39, 2, 2], [40, 60, 1], [40, 37, 2], [40, 10, 3], [41, 4, 1],
    [41, 58, 2], [42, 43, 1], [42, 46, 2], [43, 39, 1], [43, 83, 2], [43, 33, 3],
    [43, 61, 3], [44, 26, 1], [44, 51, 2], [44, 14, 3], [44, 33, 3], [45, 43, 1],
    [45, 50, 2], [46, 74, 1], [46, 38, 2], [47, 38, 1], [47, 3, 2], [47, 37, 3],
    [47, 2, 3], [48, 88, 1], [48, 7, 2], [49, 64, 1], [49, 37, 2], [49, 80, 3],
    [50, 29, 1], [50, 83, 2], [50, 81, 3],
  ];

  await prisma.participacionEnIncidente.createMany({
    data: participaciones.map(([incId, estId, rolId]) => ({
      incidenteId: BigInt(incId),
      estudianteId: BigInt(estId),
      rolEnConflictoId: BigInt(rolId),
    })),
  });

  console.log(`${participaciones.length} participaciones creadas.`);

  // -----------------------------------------------------------
  // 6. INTERVENCIONES
  // -----------------------------------------------------------
  // [incidenteId, realizadaPorId, fecha, tipo, descripcion]

  const intervenciones: [number, number, string, string, string][] = [
    [24, 5, '2026-04-07T15:00:00', 'Derivación a orientación', 'Se deriva al estudiante a entrevista con orientador para evaluar acompañamiento.'],
    [49, 5, '2026-05-16T11:00:00', 'Derivación a orientación', 'Se deriva al estudiante a entrevista con orientador para evaluar acompañamiento.'],
    [13, 6, '2026-03-25T11:30:00', 'Derivación a orientación', 'Se deriva al estudiante a entrevista con orientador para evaluar acompañamiento.'],
    [18, 6, '2026-04-02T13:00:00', 'Derivación a psicólogo externo', 'Se recomienda al apoderado contactar profesional externo para apoyo psicológico.'],
    [10, 6, '2026-03-22T12:00:00', 'Activación de protocolo de convivencia', 'Se activa el protocolo de convivencia escolar según reglamento interno.'],
    [49, 5, '2026-05-20T10:30:00', 'Derivación a orientación', 'Se deriva al estudiante a entrevista con orientador para evaluar acompañamiento.'],
    [18, 5, '2026-04-05T10:00:00', 'Derivación a psicólogo externo', 'Se recomienda al apoderado contactar profesional externo para apoyo psicológico.'],
    [14, 5, '2026-03-24T12:00:00', 'Activación de protocolo de convivencia', 'Se activa el protocolo de convivencia escolar según reglamento interno.'],
    [14, 5, '2026-03-31T10:30:00', 'Diálogo restaurativo', 'Se realiza diálogo restaurativo entre las partes, con acuerdo de reparación.'],
    [45, 5, '2026-05-08T15:00:00', 'Diálogo restaurativo', 'Se realiza diálogo restaurativo entre las partes, con acuerdo de reparación.'],
    [7, 5, '2026-03-25T14:00:00', 'Reunión con apoderados de ambas partes', 'Se cita a ambos apoderados para informar la situación y coordinar medidas.'],
    [41, 6, '2026-05-08T14:30:00', 'Derivación a orientación', 'Se deriva al estudiante a entrevista con orientador para evaluar acompañamiento.'],
    [35, 5, '2026-05-10T14:30:00', 'Citación a apoderado', 'Se cita al apoderado para informar sobre la situación y acordar medidas formativas en conjunto.'],
    [27, 5, '2026-04-12T14:30:00', 'Diálogo restaurativo', 'Se realiza diálogo restaurativo entre las partes, con acuerdo de reparación.'],
    [22, 6, '2026-04-08T15:00:00', 'Activación de protocolo de convivencia', 'Se activa el protocolo de convivencia escolar según reglamento interno.'],
    [47, 5, '2026-05-18T13:00:00', 'Reunión con apoderados de ambas partes', 'Se cita a ambos apoderados para informar la situación y coordinar medidas.'],
    [17, 6, '2026-04-02T12:00:00', 'Mediación entre pares', 'Se realiza mediación con presencia de orientador entre los estudiantes involucrados.'],
    [33, 6, '2026-04-22T12:30:00', 'Citación a apoderado', 'Se cita al apoderado para informar sobre la situación y acordar medidas formativas en conjunto.'],
    [20, 6, '2026-03-30T10:00:00', 'Activación de protocolo de convivencia', 'Se activa el protocolo de convivencia escolar según reglamento interno.'],
    [28, 6, '2026-04-09T10:30:00', 'Derivación a orientación', 'Se deriva al estudiante a entrevista con orientador para evaluar acompañamiento.'],
    [30, 6, '2026-04-19T14:00:00', 'Reunión con apoderados de ambas partes', 'Se cita a ambos apoderados para informar la situación y coordinar medidas.'],
    [23, 6, '2026-04-11T10:00:00', 'Conversación formativa', 'Conversación con el estudiante para reflexionar sobre el incidente y establecer compromisos.'],
    [27, 5, '2026-04-13T16:30:00', 'Reunión con apoderados de ambas partes', 'Se cita a ambos apoderados para informar la situación y coordinar medidas.'],
    [21, 6, '2026-04-01T12:00:00', 'Conversación formativa', 'Conversación con el estudiante para reflexionar sobre el incidente y establecer compromisos.'],
    [13, 5, '2026-03-26T13:00:00', 'Diálogo restaurativo', 'Se realiza diálogo restaurativo entre las partes, con acuerdo de reparación.'],
    [33, 6, '2026-04-23T12:00:00', 'Diálogo restaurativo', 'Se realiza diálogo restaurativo entre las partes, con acuerdo de reparación.'],
    [38, 5, '2026-05-02T10:00:00', 'Derivación a psicólogo externo', 'Se recomienda al apoderado contactar profesional externo para apoyo psicológico.'],
    [49, 6, '2026-05-19T10:30:00', 'Conversación formativa', 'Conversación con el estudiante para reflexionar sobre el incidente y establecer compromisos.'],
    [1, 6, '2026-03-04T11:00:00', 'Conversación formativa', 'Conversación con el estudiante para reflexionar sobre el incidente y establecer compromisos.'],
    [10, 5, '2026-03-24T10:00:00', 'Citación a apoderado', 'Se cita al apoderado para informar sobre la situación y acordar medidas formativas en conjunto.'],
    [14, 5, '2026-03-28T09:00:00', 'Diálogo restaurativo', 'Se realiza diálogo restaurativo entre las partes, con acuerdo de reparación.'],
    [20, 5, '2026-04-06T09:00:00', 'Conversación formativa', 'Conversación con el estudiante para reflexionar sobre el incidente y establecer compromisos.'],
    [44, 5, '2026-05-09T13:30:00', 'Diálogo restaurativo', 'Se realiza diálogo restaurativo entre las partes, con acuerdo de reparación.'],
    [37, 6, '2026-04-30T10:00:00', 'Reunión con apoderados de ambas partes', 'Se cita a ambos apoderados para informar la situación y coordinar medidas.'],
    [1, 6, '2026-03-16T10:00:00', 'Conversación formativa', 'Conversación con el estudiante para reflexionar sobre el incidente y establecer compromisos.'],
  ];

  await prisma.intervencion.createMany({
    data: intervenciones.map(([incId, userId, fecha, tipo, descripcion]) => ({
      incidenteId: BigInt(incId),
      realizadaPorId: BigInt(userId),
      fecha: new Date(fecha),
      tipo,
      descripcion,
    })),
  });

  console.log(`${intervenciones.length} intervenciones creadas.`);

  // -----------------------------------------------------------
  // 7. ANOTACIONES POSITIVAS
  // -----------------------------------------------------------
  // [estudianteId, registradaPorId, fecha, descripcion]

  const anotaciones: [number, number, string, string][] = [
    [16, 23, '2026-03-09T08:30:00', 'Destacada participación y liderazgo positivo en actividad grupal.'],
    [35, 24, '2026-03-09T13:00:00', 'Destacada participación y liderazgo positivo en actividad grupal.'],
    [24, 23, '2026-03-13T10:30:00', 'Participación destacada en actividad de convivencia escolar.'],
    [35, 19, '2026-03-16T13:00:00', 'Excelente disposición para ayudar a compañeros con dificultades durante la clase.'],
    [16, 28, '2026-03-16T16:45:00', 'Cumplimiento ejemplar de responsabilidades como delegado de curso.'],
    [24, 26, '2026-03-19T09:30:00', 'Iniciativa propia para mediar en un conflicto menor entre compañeros.'],
    [24, 27, '2026-03-19T16:00:00', 'Demostración de empatía y solidaridad frente a un compañero en dificultad.'],
    [78, 17, '2026-03-23T09:30:00', 'Demostración de empatía y solidaridad frente a un compañero en dificultad.'],
    [6, 27, '2026-03-24T15:00:00', 'Iniciativa propia para mediar en un conflicto menor entre compañeros.'],
    [8, 29, '2026-03-30T10:30:00', 'Iniciativa propia para mediar en un conflicto menor entre compañeros.'],
    [14, 24, '2026-03-31T08:30:00', 'Acto de honestidad: devolvió pertenencias encontradas a su dueño.'],
    [6, 28, '2026-04-02T15:30:00', 'Apoyo voluntario a compañero nuevo facilitando su integración al curso.'],
    [35, 19, '2026-04-03T15:45:00', 'Iniciativa propia para mediar en un conflicto menor entre compañeros.'],
    [60, 16, '2026-04-06T15:15:00', 'Apoyo voluntario a compañero nuevo facilitando su integración al curso.'],
    [78, 21, '2026-04-15T15:15:00', 'Acto de honestidad: devolvió pertenencias encontradas a su dueño.'],
    [24, 23, '2026-04-20T08:30:00', 'Acto de honestidad: devolvió pertenencias encontradas a su dueño.'],
    [6, 19, '2026-04-20T10:15:00', 'Cumplimiento ejemplar de responsabilidades como delegado de curso.'],
    [35, 27, '2026-04-20T12:45:00', 'Iniciativa propia para mediar en un conflicto menor entre compañeros.'],
    [24, 18, '2026-04-21T12:30:00', 'Iniciativa propia para mediar en un conflicto menor entre compañeros.'],
    [53, 27, '2026-04-28T15:30:00', 'Acto de honestidad: devolvió pertenencias encontradas a su dueño.'],
    [58, 15, '2026-04-29T13:00:00', 'Participación destacada en actividad de convivencia escolar.'],
    [35, 15, '2026-05-04T16:15:00', 'Excelente representación del establecimiento en actividad extraprogramática.'],
    [16, 28, '2026-05-06T09:30:00', 'Excelente representación del establecimiento en actividad extraprogramática.'],
    [54, 16, '2026-05-06T13:15:00', 'Iniciativa propia para mediar en un conflicto menor entre compañeros.'],
    [65, 20, '2026-05-11T11:30:00', 'Iniciativa propia para mediar en un conflicto menor entre compañeros.'],
    [78, 24, '2026-05-11T16:00:00', 'Cumplimiento ejemplar de responsabilidades como delegado de curso.'],
    [16, 20, '2026-05-12T08:45:00', 'Iniciativa propia para mediar en un conflicto menor entre compañeros.'],
    [41, 16, '2026-05-12T09:00:00', 'Acto de honestidad: devolvió pertenencias encontradas a su dueño.'],
  ];

  await prisma.anotacionPositiva.createMany({
    data: anotaciones.map(([estId, userId, fecha, descripcion]) => ({
      estudianteId: BigInt(estId),
      registradaPorId: BigInt(userId),
      fecha: new Date(fecha),
      descripcion,
    })),
  });

  console.log(`${anotaciones.length} anotaciones positivas creadas.`);
  console.log('Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
