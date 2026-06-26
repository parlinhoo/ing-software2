import express, { NextFunction, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';  
import { isFechaFutura } from './utils/dateValidation';
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
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
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

// Mapas frontend → nombres en BD
const SEVERITY_TO_BD: Record<string, string> = {
  mild: 'Leve', severe: 'Grave', verysevere: 'Muy grave', very_severe: 'Muy grave',
}
const TYPE_TO_BD: Record<string, string> = {
  verbal: 'Agresión verbal', physical: 'Agresión física', harassment: 'Acoso escolar',
  discrimination: 'Discriminación', other: 'Otro',
}
const ROLE_TO_BD: Record<string, string> = {
  aggressor: 'Agresor', victim: 'Víctima', witness: 'Testigo', participant: 'Testigo',
}

app.post("/incident", requireRoles("Docente", "Inspector"), async (req: Request, res: Response, next: NextFunction) => {
  const { registerer, incidentType, severity, actors, date, place, description } = req.body;

  if (!incidentType || !severity || !date || !place || !description) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  const incidentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (incidentDate > today) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
  }

  try {
    const registradoPorId = registerer
      ? BigInt(registerer)
      : await getUserIdFromRequest(req);

    const [gravedad, tipoIncidente, estadoCaso] = await Promise.all([
      prisma.gravedad.findFirstOrThrow({ where: { nombre: SEVERITY_TO_BD[severity] ?? 'Leve' } }),
      prisma.tipoIncidente.findFirstOrThrow({ where: { nombre: TYPE_TO_BD[incidentType] ?? 'Otro' } }),
      prisma.estadoCaso.findFirstOrThrow({ where: { nombre: 'Abierto' } }),
    ]);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const incidente = await tx.incidente.create({
        data: {
          fecha: incidentDate,
          lugar: place,
          descripcion: description,
          gravedadId: gravedad.id,
          tipoIncidenteId: tipoIncidente.id,
          estadoCasoId: estadoCaso.id,
          registradoPorId,
        },
      });

      if (actors && actors.length > 0) {
        for (const actor of actors) {
          if (!actor.rut) continue;
          const estudiante = await tx.estudiante.findUnique({ where: { run: actor.rut } });
          if (!estudiante) continue;
          const rolBD = ROLE_TO_BD[actor.role];
          if (!rolBD) continue;
          const rol = await tx.rolEnConflicto.findFirst({ where: { nombre: rolBD } });
          if (!rol) continue;
          await tx.participacionEnIncidente.create({
            data: { incidenteId: incidente.id, estudianteId: estudiante.id, rolEnConflictoId: rol.id },
          });
        }
      }

      return incidente;
    });

    res.status(HttpStatusCodes.CREATED).json({ incidentId: result.id.toString() });
  } catch (error) {
    console.error("[POST /incident] Error:", error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al crear el incidente"));
  }
})

app.put("/incident", requireRoles("Docente", "Inspector"), async (req: Request, res: Response, next: NextFunction) => {
  const { incidentId, incidentType, severity, date, place, description } = req.body;

  if (!incidentId || !incidentType || !severity || !date || !place || !description) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  try {
    const [gravedad, tipoIncidente] = await Promise.all([
      prisma.gravedad.findFirstOrThrow({ where: { nombre: SEVERITY_TO_BD[severity] ?? 'Leve' } }),
      prisma.tipoIncidente.findFirstOrThrow({ where: { nombre: TYPE_TO_BD[incidentType] ?? 'Otro' } }),
    ]);

    await prisma.incidente.update({
      where: { id: BigInt(incidentId) },
      data: {
        fecha: new Date(date),
        lugar: place,
        descripcion: description,
        gravedadId: gravedad.id,
        tipoIncidenteId: tipoIncidente.id,
      },
    });

    res.status(HttpStatusCodes.OK).json({ incidentId });
  } catch (error) {
    console.error("[PUT /incident] Error:", error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al editar el incidente"));
  }
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

const ROL_BD_TO_FRONTEND: Record<string, string> = {
  'Agresor': 'aggressor',
  'Víctima': 'victim',
  'Testigo': 'witness',
  'Participante': 'participant',
}

const PARTICIPACIONES_INCLUDE = {
  participaciones: {
    include: {
      estudiante: { select: { nombre: true } },
      rolEnConflicto: { select: { nombre: true } },
    },
  },
} as const

function serializeActores(participaciones: Array<{ estudiante: { nombre: string }; rolEnConflicto: { nombre: string } }>) {
  return participaciones.map(p => ({
    name: p.estudiante.nombre,
    role: ROL_BD_TO_FRONTEND[p.rolEnConflicto.nombre] ?? p.rolEnConflicto.nombre,
  }))
}

app.get("/incident", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidentes = await prisma.incidente.findMany({
      where: { anulado: false },
      include: PARTICIPACIONES_INCLUDE,
    });
    const result = incidentes.map(i => ({
      // mantengo `id` para compatibilidad con tests existentes
      id: i.id.toString(),
      gravedadId: i.gravedadId.toString(),
      tipoIncidenteId: i.tipoIncidenteId.toString(),
      estadoCasoId: i.estadoCasoId.toString(),
      registradoPorId: i.registradoPorId.toString(),
      actors: serializeActores(i.participaciones),
      participaciones: undefined,
    }));

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    console.error("[GET /incident] Error:", error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al consultar incidentes"));
  }
})

app.get("/incident/:id", requireRoles("Docente", "Orientador", "Equipo Directivo"), async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const incidente = await prisma.incidente.findUnique({
      where: { id: BigInt(id as string) },
      include: PARTICIPACIONES_INCLUDE,
    });

    if (!incidente || incidente.anulado) {
      return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Incidente no encontrado"));
    }

    const result = {
      ...incidente,
      id: incidente.id.toString(),
      gravedadId: incidente.gravedadId.toString(),
      tipoIncidenteId: incidente.tipoIncidenteId.toString(),
      estadoCasoId: incidente.estadoCasoId.toString(),
      registradoPorId: incidente.registradoPorId.toString(),
      actors: serializeActores(incidente.participaciones),
      participaciones: undefined,
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

app.get("/admin/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, correo: true, activo: true, createdAt: true, rol: { select: { nombre: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(usuarios.map(u => ({
      id: u.id.toString(),
      nombre: u.nombre,
      correo: u.correo,
      rol: u.rol.nombre,
      activo: u.activo,
      creadoEn: u.createdAt.toISOString().split('T')[0],
    })));
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al consultar usuarios"));
  }
})

app.post("/admin/user", async (req: Request, res: Response, next: NextFunction) => {
  const { nombre, correo, contrasena, rol: rolNombre } = req.body;

  if (!nombre || !correo || !contrasena || !rolNombre) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  try {
    const rol = await prisma.rol.findFirst({ where: { nombre: rolNombre } });
    if (!rol) {
      return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Rol no válido"));
    }

    const existente = await prisma.usuario.findUnique({ where: { correo } });
    if (existente) {
      return next(new RouteError(HttpStatusCodes.CONFLICT, "El correo ya está registrado"));
    }

    const { bcryptHash } = await import('@src/crypto/cryptoService');
    const contrasenaHash = await bcryptHash(contrasena);

    const nuevo = await prisma.usuario.create({
      data: { nombre, correo, contrasenaHash, rolId: rol.id },
    });

    res.status(HttpStatusCodes.CREATED).json({ id: nuevo.id.toString() });

  } catch (error) {
    console.error("Error al crear usuario:", error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al crear usuario"));
  }
})

app.put("/admin/user/:id", async (req: Request, res: Response, next: NextFunction) => {
  const id = BigInt(req.params.id);
  const { nombre, correo, contrasena, rol: rolNombre } = req.body;

  if (!nombre || !correo || !rolNombre) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  try {
    const rol = await prisma.rol.findFirst({ where: { nombre: rolNombre } });
    if (!rol) {
      return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Rol no válido"));
    }

    const duplicado = await prisma.usuario.findFirst({ where: { correo, NOT: { id } } });
    if (duplicado) {
      return next(new RouteError(HttpStatusCodes.CONFLICT, "El correo ya está en uso por otro usuario"));
    }

    const data: any = { nombre, correo, rolId: rol.id };
    if (contrasena) {
      const { bcryptHash } = await import('@src/crypto/cryptoService');
      data.contrasenaHash = await bcryptHash(contrasena);
    }

    await prisma.usuario.update({ where: { id }, data });
    res.json({ id: id.toString() });

  } catch (error) {
    console.error("Error al editar usuario:", error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al editar usuario"));
  }
})

app.patch("/admin/user/:id/activo", async (req: Request, res: Response, next: NextFunction) => {
  const id = BigInt(req.params.id);
  const { activo } = req.body;
  if (typeof activo !== 'boolean') {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "El campo 'activo' es obligatorio y debe ser booleano"));
  }
  try {
    await prisma.usuario.update({ where: { id }, data: { activo } });
    res.json({ id: id.toString(), activo });
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al actualizar estado del usuario"));
  }
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
