import express, { NextFunction, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';  

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

app.get("/students/search", requireRoles("Docente", "Inspector"), async (req: CustomRequest, res: Response,  next: NextFunction) => {
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

app.put("/incident", requireRoles("Docente", "Inspector"), (req: Request, res: Response, next: NextFunction) => {
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

app.post("/incident", (req: Request, res: Response, next: NextFunction) => {
  const { incidentType, severity, actors, date, place, description } = req.body;

  // Validar campos obligatorios
  if (!incidentType || !severity || !date || !place || !description) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  // Validar que la fecha no sea futura
  const incidentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (incidentDate > today) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
  }

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
// Anulacion logica de incidentes (T-12)
app.delete("/incident/:id", requireRoles("Docente", "Inspector"), async (req: Request, res: Response, next: NextFunction) => {
  // TODO (cuando T-03 esté listo): agregar middleware requireRole(['directivo'])
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
    });
    // Serializar BigInt a string para el JSON
    const result = incidentes.map(i => ({
      ...i,
      id: i.id.toString(),
      gravedadId: i.gravedadId.toString(),
      tipoIncidenteId: i.tipoIncidenteId.toString(),
      estadoCasoId: i.estadoCasoId.toString(),
      registradoPorId: i.registradoPorId.toString(),
    }));
    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
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

// Registro de incidentes con persistencia real en BD (T05, T07)
// Esta ruta crea el incidente y sus participaciones de forma atómica usando Prisma.
app.post("/incident/register", requireRoles("Docente", "Inspector"), async (req: Request, res: Response, next: NextFunction) => {
  const { registerer, incidentType, severity, actors, date, place, description } = req.body;

  // T05 - Test 2: severity (y los demás campos obligatorios) son requeridos
  if (!registerer || !incidentType || !severity || !date || !place || !description) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  const incidentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (incidentDate > today) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
  }

  try {
    // Buscar gravedadId por nombre ("Leve", "Grave", "Muy grave")
    const gravedad = await prisma.gravedad.findFirstOrThrow({
      where: { nombre: severity },
    });
    const tipoIncidente = await prisma.tipoIncidente.findFirstOrThrow({
      where: { nombre: incidentType },
    });
    const estadoCaso = await prisma.estadoCaso.findFirstOrThrow({
      where: { nombre: 'Abierto' },
    });

    // T07 - transacción atómica: incidente + participaciones
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const incidente = await tx.incidente.create({
        data: {
          fecha: incidentDate,
          lugar: place,
          descripcion: description,
          gravedadId: gravedad.id,
          tipoIncidenteId: tipoIncidente.id,
          estadoCasoId: estadoCaso.id,
          registradoPorId: BigInt(registerer),
        },
      });

      if (actors && actors.length > 0) {
        for (const actor of actors) {
          const rol = await tx.rolEnConflicto.findFirstOrThrow({
            where: { nombre: actor.role },
          });
          await tx.participacionEnIncidente.create({
            data: {
              incidenteId: incidente.id,
              estudianteId: BigInt(actor.estudianteId),
              rolEnConflictoId: rol.id,
            },
          });
        }
      }

      return incidente;
    });

    res.status(HttpStatusCodes.CREATED).json({ incidentId: result.id.toString() });

  } catch (error) {
    // T07 - Test 2: si falla algo dentro de $transaction, Prisma hace rollback automático
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al crear el incidente"));
  }
});


/*         INTERVENCIONES         */ 

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

app.post("/intervention", async (req: Request, res: Response, next: NextFunction) => {
  const { incidentId, interventionId, date, interventionType, description } = req.body;

  if (!incidentId || !interventionId) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  const intervention = interventions.find(
    i => i.id === Number(interventionId) && i.incidentId === Number(incidentId)
  );
  if (!intervention) {
    return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Intervención no encontrada"));
  }

  if (date) {
    const interventionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (interventionDate > today) {
      return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
    }
    intervention.date = date;
  }
  if (interventionType) intervention.interventionType = interventionType;
  if (description) intervention.description = description;

  res.status(HttpStatusCodes.OK).json({ id: intervention.id });
})

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

app.put("/admin/user", (req: Request, res: Response, next: NextFunction) => {
  res.send();
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
