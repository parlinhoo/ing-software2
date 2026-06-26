import express, { NextFunction, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';  
import { isFechaFutura } from './utils/dateValidation';
import { RouteError } from '@src/utils/route-errors';
import { authenticate, CustomRequest, generateUserJWT, requireRoles, SignInData } from './auth/authService';
import HttpStatusCodes from './constants/httpStatusCodes';
import { Incident } from './types/types';
import { isValidRut } from './utils/formatUtils';
import { getStudentByRUN, getStudentsByName, StudentData } from './services/studentService';

type Intervention = {
  id: number,
  incidentId: number,
  registerer: string,
  date: string,
  interventionType: string,
  description: string,
}

const interventions: Intervention[] = [];
let nextInterventionId = 1;

const prisma = new PrismaClient();
/******************************************************************************
                                Setup
******************************************************************************/

// Datos en memoria (legado Sprint 1 - pendiente consolidar con BD)
const incidents: Incident[] = [];
let nextId = 4;

const app = express();

// **** Middleware **** //

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*    AUTH     */

app.post("/auth/signin",async (req: Request, res: Response,  next: NextFunction) => {
  const data = req.body as Partial<SignInData>;
 
  if (!data.email || !data.password) {
    throw new RouteError(
        HttpStatusCodes.BAD_REQUEST, 
        "Faltan credenciales: email y password son requeridos."
    );
  }

  const loginData: SignInData = {
    email: data.email,
    password: data.password,
  };

  try {
    const user = await authenticate(loginData.email, loginData.password);
    const token = generateUserJWT(user.id, user.role.id);
    const payload = { user, token }
    res.status(HttpStatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
})

/*   ESTUDIANTE     */

app.get("/students/search", requireRoles("Docente", "Inspector", "Orientador", "Equipo Directivo"), async (req: CustomRequest, res: Response,  next: NextFunction) => {
  const response = req.query as {q?: string};

  if (!response.q) {
    res.json([]);
    return;
  }

  const query: string = response.q;
  try {
    let students: StudentData[] = [];

    if (isValidRut(query)) {
      const student = await getStudentByRUN(query);
      if (student) {
        students = [student];
      }
    } else {
      students = await getStudentsByName(query);
    }

    res.json(students);
    
  } catch (e) {
    console.error("Error al buscar estudiantes:", e);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).end(); 
  }
})

/*    INCIDENTE     */

// DEPRECATED — operación contra el array en memoria.
// Pendiente: migrar a UPDATE en Prisma y proteger con requireRoles segUN US-07.
app.put("/incident", requireRoles("Docente", "Inspector"), (req, res, next) => {
  const { incidentId, incidentType, severity, actors, date, place, description } = req.body;

  // Validar campos obligatorios
  if (!incidentId || !incidentType || !severity || !date || !place || !description) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  // Encontrar y actualizar el incidente
  const index = incidents.findIndex(i => i.incidentId === incidentId);
  if (index === -1) {
    return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Incidente no encontrado"));
  }

  incidents[index] = {
    incidentId,
    incidentType,
    severity,
    actors: actors ?? [],
    date,
    place,
    description,
  };

  res.status(HttpStatusCodes.OK).json({ incidentId });
})

// DEPRECATED — usa POST /incident/register (persistencia en BD).
// Esta ruta solo guarda en el array en memoria; lo que cree no aparecerá en GET /incident.
app.post("/incident", (req: Request, res: Response, next: NextFunction) => {
  const { incidentType, severity, actors, date, place, description } = req.body;

  // Validar campos obligatorios
  if (!incidentType || !severity || !date || !place || !description) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  // Validar que la fecha no sea futura
  if (isFechaFutura(date)) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura")); 
  }
  const incidentDate = new Date(date);   // queda para uso más abajo en /incident/register

  // Crear y guardar el incidente
  const newIncident: Incident = {
    incidentId: nextId++,
    incidentType,
    severity,
    actors: actors ?? [],
    date,
    place,
    description,
  };
  incidents.push(newIncident);

  res.status(HttpStatusCodes.CREATED).json({ incidentId: newIncident.incidentId });
})
// Anulacion logica de incidentes (T-12). Solo Equipo Directivo según US-10.
app.delete("/incident/:id", requireRoles("Equipo Directivo"), async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { motivo } = req.body;

  if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "El motivo de anulación es obligatorio"));
  }

  try {
    const incidente = await prisma.incidente.findUnique({
      where: { id: BigInt(id as string) },
    });
    if (!incidente) {
      return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Incidente no encontrado"));
    }

    await prisma.incidente.update({
      where: { id: BigInt(id as string) },
      data: {
        anulado: true,
        motivoAnulacion: motivo,
      },
    });

    res.status(HttpStatusCodes.OK).json({ message: "Incidente anulado correctamente" });
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al anular el incidente"));
  }
})

app.get("/incident", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidentes = await prisma.incidente.findMany({
      where: { anulado: false },
      include: {
        gravedad: true,
        tipoIncidente: true,
        estadoCaso: true,
        participaciones: {
          include: {
            estudiante: true,
            rolEnConflicto: true,
          },
        },
      },
    });

    // Mapas BD → frontend (códigos cortos)
    const SEVERITY_CODES: Record<string, string> = {
      'Leve': 'mild', 'Grave': 'severe', 'Muy grave': 'verysevere',
    };
    const TYPE_CODES: Record<string, string> = {
      'Agresión verbal': 'verbal',
      'Agresión física': 'physical',
      'Acoso escolar': 'harassment',
      'Discriminación': 'discrimination',
      'Otro': 'other',
    };
    const ROLE_CODES: Record<string, string> = {
      'Agresor': 'aggressor', 'Víctima': 'victim', 'Testigo': 'witness',
    };

    // Reformatear al shape que espera el frontend (IncidentAPI)
    const result = incidentes.map(i => ({
      // mantengo `id` para compatibilidad con tests existentes
      id: i.id.toString(),
      incidentId: Number(i.id),
      incidentType: TYPE_CODES[i.tipoIncidente.nombre] ?? i.tipoIncidente.nombre,
      severity: SEVERITY_CODES[i.gravedad.nombre] ?? i.gravedad.nombre,
      date: i.fecha.toISOString(),
      place: i.lugar,
      description: i.descripcion,
      actors: i.participaciones.map(p => ({
        name: p.estudiante.nombre,
        role: ROLE_CODES[p.rolEnConflicto.nombre] ?? p.rolEnConflicto.nombre,
      })),
    }));

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    console.error('Error en GET /incident:', error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al consultar incidentes"));
  }
})

app.get("/incident/:id", requireRoles("Docente", "Orientador", "Equipo Directivo"), async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const incidente = await prisma.incidente.findUnique({
      where: { id: BigInt(id as string) },
    });

    if (!incidente || incidente.anulado) {
      return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Incidente no encontrado"));
    }

    // Serializar BigInt a string para el JSON
    const result = {
      ...incidente,
      id: incidente.id.toString(),
      gravedadId: incidente.gravedadId.toString(),
      tipoIncidenteId: incidente.tipoIncidenteId.toString(),
      estadoCasoId: incidente.estadoCasoId.toString(),
      registradoPorId: incidente.registradoPorId.toString(),
    };

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al consultar el incidente"));
  }
})

// Esta ruta crea el incidente y sus participaciones de forma atómica usando Prisma.
app.post("/incident/register", requireRoles("Docente", "Inspector"), async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { incidentType, severity, actors, date, place, description } = req.body;

  // El registrador se toma del JWT, no del body
  const registererId = req.user?.userId;
  if (!registererId) {
    return next(new RouteError(HttpStatusCodes.UNAUTHORIZED, "Usuario no identificado en el token"));
  }

  if (!incidentType || !severity || !date || !place || !description) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  if (isFechaFutura(date)) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
  }
  const incidentDate = new Date(date);

  // Mapas frontend → BD (códigos cortos a nombres reales)
  const SEVERITY_NAMES: Record<string, string> = {
    mild: 'Leve', severe: 'Grave', verysevere: 'Muy grave',
  };
  const TYPE_NAMES: Record<string, string> = {
    verbal: 'Agresión verbal',
    physical: 'Agresión física',
    harassment: 'Acoso escolar',
    discrimination: 'Discriminación',
    other: 'Otro',
  };
  const ROLE_NAMES: Record<string, string> = {
    aggressor: 'Agresor', victim: 'Víctima', witness: 'Testigo',
  };

  // Acepta tanto el código corto como el nombre completo (compatibilidad con tests)
  const severityName = SEVERITY_NAMES[severity] ?? severity;
  const typeName = TYPE_NAMES[incidentType] ?? incidentType;

  try {
    const gravedad = await prisma.gravedad.findFirstOrThrow({ where: { nombre: severityName } });
    const tipoIncidente = await prisma.tipoIncidente.findFirstOrThrow({ where: { nombre: typeName } });
    const estadoCaso = await prisma.estadoCaso.findFirstOrThrow({ where: { nombre: 'Abierto' } });

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const incidente = await tx.incidente.create({
        data: {
          fecha: incidentDate,
          lugar: place,
          descripcion: description,
          gravedadId: gravedad.id,
          tipoIncidenteId: tipoIncidente.id,
          estadoCasoId: estadoCaso.id,
          registradoPorId: BigInt(registererId),
        },
      });

      if (actors && actors.length > 0) {
        for (const actor of actors) {
          // Acepta rut (del frontend) o estudianteId directo (de los tests)
          let estudianteId: bigint;
          if (actor.rut) {
            const est = await tx.estudiante.findUnique({ where: { run: actor.rut } });
            if (!est) throw new RouteError(HttpStatusCodes.BAD_REQUEST, `Estudiante con RUT ${actor.rut} no existe`);
            estudianteId = est.id;
          } else if (actor.estudianteId) {
            estudianteId = BigInt(actor.estudianteId);
          } else {
            throw new RouteError(HttpStatusCodes.BAD_REQUEST, "Cada actor debe tener rut o estudianteId");
          }

          const roleName = ROLE_NAMES[actor.role] ?? actor.role;
          const rol = await tx.rolEnConflicto.findFirstOrThrow({ where: { nombre: roleName } });
          await tx.participacionEnIncidente.create({
            data: {
              incidenteId: incidente.id,
              estudianteId,
              rolEnConflictoId: rol.id,
            },
          });
        }
      }

      return incidente;
    });

    res.status(HttpStatusCodes.CREATED).json({ incidentId: result.id.toString() });
  } catch (error) {
    if (error instanceof RouteError) return next(error);
    console.error('Error creando incidente:', error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al crear el incidente"));
  }
});


/*         INTERVENCIONES         */ 

// DEPRECATED — usa POST /intervention (persistencia en BD, valida rol).
// Esta ruta opera sobre el array en memoria de intervenciones.
app.put("/intervention", async (req: Request, res: Response, next: NextFunction) => {
  const { registerer, incidentId, date, interventionType, description } = req.body;

  // Validar campos obligatorios
  if (!registerer || !incidentId || !date || !interventionType || !description) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  // Validar que la fecha no sea futura
  const interventionDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (interventionDate > today) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
  }

  // Buscar el incidente
  const incident = incidents.find(i => i.incidentId === Number(incidentId));
  if (!incident) {
    return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Incidente no encontrado"));
  }

  // Crear intervención
  const newIntervention: Intervention = {
    id: nextInterventionId++,
    incidentId: Number(incidentId),
    registerer,
    date,
    interventionType,
    description,
  };
  interventions.push(newIntervention);

  res.status(HttpStatusCodes.CREATED).json({ id: newIntervention.id });
})

// Volver a agregar la Task 15, que se perdio con el merge

app.post("/intervention", requireRoles("Orientador"), async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { incidenteId, tipo, fecha, descripcion } = req.body;

  // El orientador se obtiene del JWT, ya no del body (T-03 disponible)
  const realizadaPor = req.user?.userId;

  // Validación de campos obligatorios (CA1)
  if (!incidenteId || !tipo || !fecha || !descripcion) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  const interventionDate = new Date(fecha);
  if (isNaN(interventionDate.getTime())) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Fecha inválida"));
  }

  try {
    const incidente = await prisma.incidente.findUnique({
      where: { id: BigInt(incidenteId) },
    });
    if (!incidente) {
      return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Incidente no encontrado"));
    }

    const intervencion = await prisma.intervencion.create({
      data: {
        incidenteId: BigInt(incidenteId),
        realizadaPorId: BigInt(realizadaPor as string),
        fecha: interventionDate,
        tipo,
        descripcion,
      },
    });

    res.status(HttpStatusCodes.CREATED).json({ interventionId: intervencion.id.toString() });
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al crear la intervención"));
  }
});


// DEPRECATED — debería leer de Prisma (tabla `intervencion`).
// El listado real para el detalle del incidente debe consultar BD.
app.get("/intervention", (req: Request, res: Response, next: NextFunction) => {
  const { incidentId } = req.query;

  if (!incidentId) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Falta incidentId"));
  }

  const result = interventions
    .filter(i => i.incidentId === Number(incidentId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json(result);
})
/*        ANOTACIONES POSITIVAS      */

app.put("/positive_remark", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

/*        DATAVIS            */

app.get("/data", (req: Request, res: Response, next: NextFunction) => {
  res.send("Reporte:\nJuan ya tiene 2 incidentes severos este año.\nFernanda ha sido foco de 5 incidentes leves el último año, hacer seguimiento.\nJorge liberó un incidente severo con 3 anotaciones positivas el último mes.\n");
})

/*        ADMIN          */

app.put("/admin/incident_type", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.post("/admin/incident_type", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.delete("/admin/incident_type", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

app.put("/admin/case_state", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.post("/admin/case_state", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.delete("/admin/case_state", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

app.put("/admin/user", async (req: Request, res: Response, next: NextFunction) => {
  const { username, password, role } = req.body;

  // CA1 - validar campos obligatorios
  if (!username || !password || !role) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  // Validar que el rol existe en la BD
  try {
    const rol = await prisma.rol.findFirst({
      where: { nombre: role },
    });
    if (!rol) {
      return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Rol no válido"));
    }

    // Verificar que el correo no esté duplicado (CA3)
    const existente = await prisma.usuario.findUnique({
      where: { correo: username },
    });
    if (existente) {
      return next(new RouteError(HttpStatusCodes.CONFLICT, "El correo ya está registrado"));
    }

    // Hashear contraseña
    const { bcryptHash } = await import('@src/crypto/cryptoService');
    const contrasenaHash = await bcryptHash(password);

    // Guardar en BD
    const nuevo = await prisma.usuario.create({
      data: {
        nombre: username,
        correo: username,
        contrasenaHash,
        rolId: rol.id,
      },
    });

    res.status(HttpStatusCodes.OK).json({ id: nuevo.id.toString() });

  } catch (error) {
    console.error("Error detallado:", error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al crear usuario"));
  }
})

app.post("/admin/user", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.delete("/admin/user", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

// Add error handler
app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (err instanceof RouteError) {
    console.log(`error ${err.status}:`, err.message);
    res.status(err.status).json({ error: err.message });
    return;
  }
  return next(err);
});

/******************************************************************************
                                Export default
******************************************************************************/

export default app;
