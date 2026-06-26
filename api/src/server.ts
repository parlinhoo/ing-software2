import express, { NextFunction, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';  

import { RouteError } from '@src/utils/route-errors';
import { authenticate, CustomRequest, generateUserJWT, requireRoles, SignInData } from './auth/authService';
import HttpStatusCodes from './constants/httpStatusCodes';
import { Incident } from './types/types';
import { isValidRut } from './utils/formatUtils';
import { getStudentByRUN, getStudentsByName, StudentData } from './services/studentService';
import jwt from 'jsonwebtoken';
import environment from './constants/environment';

const prisma = new PrismaClient();

// Extrae el userId del JWT (si viene); fallback al primer usuario para la demo.
async function getUserIdFromRequest(req: Request): Promise<bigint> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, environment.JWT_SECRET) as { userId: string };
      if (payload?.userId) return BigInt(payload.userId);
    } catch { /* token inválido: cae al fallback */ }
  }
  const anyUser = await prisma.usuario.findFirstOrThrow({ select: { id: true } });
  return anyUser.id;
}

// Serializa una intervención de Prisma al formato que espera el frontend
function serializeIntervention(i: { id: bigint; incidenteId: bigint; tipo: string; descripcion: string; fecha: Date }) {
  return {
    id: i.id.toString(),
    incidenteId: Number(i.incidenteId),
    tipo: i.tipo,
    descripcion: i.descripcion,
    fecha: i.fecha.toISOString().split('T')[0],
  };
}
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


/*         INTERVENCIONES (persistencia en BD vía Prisma)        */

// Listar intervenciones de un incidente (orden cronológico inverso)
app.get("/intervention", async (req: Request, res: Response, next: NextFunction) => {
  const { incidentId } = req.query;
  if (!incidentId) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Falta incidentId"));
  }
  try {
    const result = await prisma.intervencion.findMany({
      where: { incidenteId: BigInt(incidentId as string), eliminadoEn: null },
      orderBy: { fecha: 'desc' },
    });
    res.json(result.map(serializeIntervention));
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al consultar intervenciones"));
  }
})

// Crear intervención
app.post("/intervention", async (req: Request, res: Response, next: NextFunction) => {
  const { incidenteId, tipo, descripcion, fecha } = req.body;

  if (!incidenteId || !tipo || !descripcion || !fecha) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  const fechaIngresada = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  if (fechaIngresada > hoy) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
  }

  try {
    const realizadaPorId = await getUserIdFromRequest(req);
    const creada = await prisma.intervencion.create({
      data: {
        incidenteId: BigInt(incidenteId),
        realizadaPorId,
        tipo,
        descripcion,
        fecha: fechaIngresada,
      },
    });
    res.status(HttpStatusCodes.CREATED).json(serializeIntervention(creada));
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al crear la intervención"));
  }
})

// Editar intervención
app.put("/intervention", async (req: Request, res: Response, next: NextFunction) => {
  const { id, tipo, descripcion, fecha } = req.body;
  if (!id) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "ID de la intervención requerido"));
  }

  if (fecha) {
    const fechaIngresada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    if (fechaIngresada > hoy) {
      return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
    }
  }

  try {
    const actualizada = await prisma.intervencion.update({
      where: { id: BigInt(id) },
      data: {
        ...(tipo ? { tipo } : {}),
        ...(descripcion ? { descripcion } : {}),
        ...(fecha ? { fecha: new Date(fecha) } : {}),
      },
    });
    res.status(HttpStatusCodes.OK).json(serializeIntervention(actualizada));
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Intervención no encontrada"));
  }
})

// Eliminar intervención (soft delete)
app.delete("/intervention", async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.query;
  if (!id) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "ID de la intervención requerido"));
  }
  try {
    await prisma.intervencion.update({
      where: { id: BigInt(id as string) },
      data: { eliminadoEn: new Date() },
    });
    res.status(HttpStatusCodes.OK).json({ message: "Intervención eliminada" });
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Intervención no encontrada"));
  }
})

// Cambiar estado del incidente (T-18): Abierto -> En seguimiento -> Cerrado, con reapertura
app.put("/incident/:id/estado", async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body;

  const NOMBRE_ESTADO: Record<string, string> = {
    abierto: 'Abierto',
    en_seguimiento: 'En seguimiento',
    cerrado: 'Cerrado',
  };
  const nombre = NOMBRE_ESTADO[nuevoEstado];
  if (!nombre) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Estado no válido"));
  }

  try {
    const incidenteId = BigInt(id as string);

    // No cerrar sin al menos una intervención registrada
    if (nuevoEstado === 'cerrado') {
      const count = await prisma.intervencion.count({ where: { incidenteId, eliminadoEn: null } });
      if (count === 0) {
        return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "No se puede cerrar sin intervenciones registradas"));
      }
    }

    const estadoCaso = await prisma.estadoCaso.findFirstOrThrow({ where: { nombre } });
    await prisma.incidente.update({
      where: { id: incidenteId },
      data: { estadoCasoId: estadoCaso.id },
    });
    res.status(HttpStatusCodes.OK).json({ estado: nuevoEstado });
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al cambiar el estado"));
  }
})

// Roles del sistema (para el formulario de creación de usuario)
app.get("/roles", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.rol.findMany({ select: { nombre: true } });
    res.json(roles.map(r => r.nombre));
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al consultar roles"));
  }
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
