import express, { NextFunction, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';  

import { RouteError } from '@src/utils/route-errors';
import { authenticate, authenticateFromDB } from './auth/auth';
import HttpStatusCodes from './constants/httpStatusCodes';
import { Incident } from './types/types';
import { isValidRut } from './utils/formatUtils';
import { getStudentByRUN, getStudentsByName, StudentData } from './services/studentService';

const prisma = new PrismaClient();
/******************************************************************************
                                Setup
******************************************************************************/

type SigninData = {
  username: string,
  password: string,
}

// Datos en memoria
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

app.post("/auth/signin", async (req: Request, res: Response, next: NextFunction) => {
  const response: SigninData = req.body as SigninData;

  // Primero intenta con usuarios hardcodeados
  const role = authenticate(response.username, response.password);
  if (role) {
    return res.send(role);
  }

  // Si no, busca en la BD
  const roleFromDB = await authenticateFromDB(response.username, response.password);
  res.send(roleFromDB ?? "null");
})

/*   ESTUDIANTE     */

app.get("/students/search", async (req: Request, res: Response,  next: NextFunction) => {
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

app.put("/incident", (req: Request, res: Response, next: NextFunction) => {
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

app.delete("/incident", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

app.get("/incident", (req: Request, res: Response, next: NextFunction) => {
  res.send(JSON.stringify(incidents));
})

app.get("/incident/:id", (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const incidentId = parseInt(id as string);

  const incident = incidents.find(i => i.incidentId === incidentId);
  if (!incident) {
    return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Incidente no encontrado"));
  }

  res.status(HttpStatusCodes.OK).json(incident);
})


// Registro de incidentes con persistencia real en BD (T05, T07)
// Esta ruta crea el incidente y sus participaciones de forma atómica usando Prisma.
app.post("/incident/register", async (req: Request, res: Response, next: NextFunction) => {
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

app.put("/intervention", (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

//####################NUEVO T-15######################################
app.post("/intervention", async (req: Request, res: Response, next: NextFunction) => {
  // TODO (cuando T-03 esté listo): sacar realizadaPor de req.user.userId
  //                                 y agregar middleware requireRole(['orientador'])
  const { incidenteId, realizadaPor, tipo, fecha, descripcion } = req.body;

  // Validación de campos obligatorios (CA1)
  if (!incidenteId || !realizadaPor || !tipo || !fecha || !descripcion) {
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
        realizadaPorId: BigInt(realizadaPor),
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
    const bcrypt = await import('bcrypt');
    const contrasenaHash = await bcrypt.hash(password, 12);

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
    res.status(err.status).json({ error: err.message });
  }
  return next(err);
});

/******************************************************************************
                                Export default
******************************************************************************/

export default app;
