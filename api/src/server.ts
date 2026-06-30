import express, { NextFunction, Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';  
import { isFechaFutura } from './utils/dateValidation';
import { RouteError } from '@src/utils/route-errors';
import { authenticate, CustomRequest, generateUserJWT, requireRoles, SignInData } from './auth/authService';
import HttpStatusCodes from './constants/httpStatusCodes';
import { searchStudents, StudentData } from './services/studentService';

const prisma = new PrismaClient();
/******************************************************************************
                                Setup
******************************************************************************/
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
    // Busca por nombre o RUT, con coincidencia parcial (autocompletado a medida que se escribe)
    const students: StudentData[] = await searchStudents(query);

    res.json(students);
  } catch (e) {
    console.error("Error al buscar estudiantes:", e);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).end(); 
  }
})

/*    INCIDENTE     */

// Edición de incidente sobre BD (US-07). Solo Docente/Inspector, igual que el registro.
app.put("/incident/:id", requireRoles("Docente", "Inspector"), async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { incidentType, severity, actors, date, place, description } = req.body;

  if (!incidentType || !severity || !date || !place || !description) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }
  if (isFechaFutura(date)) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
  }
  const incidentDate = new Date(date);

  const SEVERITY_NAMES: Record<string, string> = { mild: 'Leve', severe: 'Grave', verysevere: 'Muy grave', very_severe: 'Muy grave' };
  const TYPE_NAMES: Record<string, string> = { verbal: 'Agresión verbal', physical: 'Agresión física', harassment: 'Acoso escolar', discrimination: 'Discriminación', other: 'Otro' };
  const ROLE_NAMES: Record<string, string> = { aggressor: 'Agresor', victim: 'Víctima', witness: 'Testigo' };
  const severityName = SEVERITY_NAMES[severity] ?? severity;
  const typeName = TYPE_NAMES[incidentType] ?? incidentType;

  try {
    const incidenteExistente = await prisma.incidente.findUnique({ where: { id: BigInt(id as string) } });
    if (!incidenteExistente || incidenteExistente.anulado) {
      return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Incidente no encontrado"));
    }
    const gravedad = await prisma.gravedad.findFirstOrThrow({ where: { nombre: severityName } });
    const tipoIncidente = await prisma.tipoIncidente.findFirstOrThrow({ where: { nombre: typeName } });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.incidente.update({
        where: { id: BigInt(id as string) },
        data: { fecha: incidentDate, lugar: place, descripcion: description, gravedadId: gravedad.id, tipoIncidenteId: tipoIncidente.id },
      });
      await tx.participacionEnIncidente.deleteMany({ where: { incidenteId: BigInt(id as string) } });
      if (actors && actors.length > 0) {
        for (const actor of actors) {
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
          await tx.participacionEnIncidente.create({ data: { incidenteId: BigInt(id as string), estudianteId, rolEnConflictoId: rol.id } });
        }
      }
    });

    res.status(HttpStatusCodes.OK).json({ message: "Incidente actualizado correctamente" });
  } catch (error) {
    if (error instanceof RouteError) return next(error);
    console.error('Error editando incidente:', error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al editar el incidente"));
  }
});


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

app.get("/incident", requireRoles("Docente", "Inspector", "Orientador", "Equipo Directivo"), async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    // Inspector: solo ve los incidentes que él registró.
    // Docente: ve todos por defecto; con ?mine=true se restringe a los suyos (toggle UI).
    // Orientador y Equipo Directivo: ven todos (sin filtro por dueño).
    const userId = req.user?.userId;
    const roleId = req.user?.roleId;
    let roleName: string | undefined;
    if (roleId) {
      const rol = await prisma.rol.findUnique({ where: { id: BigInt(roleId) } });
      roleName = rol?.nombre;
    }
    const onlyMine = (req.query.mine === 'true' || req.query.mine === '1');
    const restrictToOwner =
      roleName === 'Inspector' ||
      (roleName === 'Docente' && onlyMine);

    const where: any = { anulado: false };
    if (restrictToOwner && userId) {
      where.registradoPorId = BigInt(userId as string);
    }

    const incidentes = await prisma.incidente.findMany({
      where,
      orderBy: { fecha: 'desc' },
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

    // Estado del caso BD -> clave frontend (abierto/en_seguimiento/cerrado)
    const ESTADO_CODES: Record<string, string> = {
      'Abierto': 'abierto', 'En seguimiento': 'en_seguimiento', 'Cerrado': 'cerrado',
    };

    // Reformatear al shape que espera el frontend (IncidentAPI)
    const result = incidentes.map(i => ({
      // mantengo `id` para compatibilidad con tests existentes
      id: i.id.toString(),
      incidentId: Number(i.id),
      incidentType: TYPE_CODES[i.tipoIncidente.nombre] ?? i.tipoIncidente.nombre,
      severity: SEVERITY_CODES[i.gravedad.nombre] ?? i.gravedad.nombre,
      estado: ESTADO_CODES[i.estadoCaso.nombre] ?? 'abierto',
      date: i.fecha.toISOString(),
      place: i.lugar,
      description: i.descripcion,
      actors: i.participaciones.map(p => ({
        name: p.estudiante.nombre,
        rut: p.estudiante.run,
        role: ROLE_CODES[p.rolEnConflicto.nombre] ?? p.rolEnConflicto.nombre,
      })),
    }));

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    console.error('Error en GET /incident:', error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al consultar incidentes"));
  }
})

app.get("/incident/:id", requireRoles("Docente", "Inspector", "Orientador", "Equipo Directivo"), async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const incidente = await prisma.incidente.findUnique({
      where: { id: BigInt(id as string) },
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

    if (!incidente || incidente.anulado) {
      return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Incidente no encontrado"));
    }

    // Mapas BD → frontend (mismos que en GET /incident)
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

    // Estado del caso BD -> clave frontend (para la máquina de estados del detalle)
    const ESTADO_CODES: Record<string, string> = {
      'Abierto': 'abierto', 'En seguimiento': 'en_seguimiento', 'Cerrado': 'cerrado',
    };

    // Reformatear al shape IncidentAPI que espera el frontend
    const result = {
      id: incidente.id.toString(),
      incidentId: Number(incidente.id),
      incidentType: TYPE_CODES[incidente.tipoIncidente.nombre] ?? incidente.tipoIncidente.nombre,
      severity: SEVERITY_CODES[incidente.gravedad.nombre] ?? incidente.gravedad.nombre,
      estado: ESTADO_CODES[incidente.estadoCaso.nombre] ?? 'abierto',
      date: incidente.fecha.toISOString(),
      place: incidente.lugar,
      description: incidente.descripcion,
      actors: incidente.participaciones.map(p => ({
        name: p.estudiante.nombre,
        rut: p.estudiante.run,
        role: ROLE_CODES[p.rolEnConflicto.nombre] ?? p.rolEnConflicto.nombre,
      })),
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


/*         INTERVENCIONES / SEGUIMIENTO (persistencia en BD vía Prisma)         */

// Serializa una intervención de Prisma al shape que espera el frontend (BigInt -> string/number).
function serializeIntervention(i: { id: bigint; incidenteId: bigint; tipo: string; descripcion: string; fecha: Date }) {
  return {
    id: Number(i.id),
    incidenteId: Number(i.incidenteId),
    tipo: i.tipo,
    descripcion: i.descripcion,
    fecha: i.fecha.toISOString(),
  };
}

// US-12 (CU-12): registrar acción de seguimiento. El orientador se toma del JWT.
app.post("/intervention", requireRoles("Orientador"), async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { incidenteId, tipo, fecha, descripcion } = req.body;

  const realizadaPor = req.user?.userId;
  if (!realizadaPor) {
    return next(new RouteError(HttpStatusCodes.UNAUTHORIZED, "Usuario no identificado en el token"));
  }

  // Validación de campos obligatorios (CA1)
  if (!incidenteId || !tipo || !fecha || !descripcion) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }

  const interventionDate = new Date(fecha);
  if (isNaN(interventionDate.getTime())) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Fecha inválida"));
  }
  if (isFechaFutura(fecha)) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
  }

  try {
    const incidente = await prisma.incidente.findUnique({ where: { id: BigInt(incidenteId) } });
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

    res.status(HttpStatusCodes.CREATED).json(serializeIntervention(intervencion));
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al crear la intervención"));
  }
});

// Listar acciones de seguimiento de un incidente (orden cronológico inverso, omite soft-deleted).
app.get("/intervention", requireRoles("Orientador", "Equipo Directivo"), async (req: CustomRequest, res: Response, next: NextFunction) => {
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
});

// US-13 (CU-13): editar acción de seguimiento.
app.put("/intervention", requireRoles("Orientador"), async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { id, tipo, descripcion, fecha } = req.body;
  if (!id) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "ID de la intervención requerido"));
  }
  if (fecha && isFechaFutura(fecha)) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "La fecha no puede ser futura"));
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
});

// Eliminar acción de seguimiento (soft delete).
app.delete("/intervention", requireRoles("Orientador"), async (req: CustomRequest, res: Response, next: NextFunction) => {
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
});

// CU-11 / US-12: cambiar estado del incidente. Abierto -> En seguimiento -> Cerrado, con reapertura.
app.put("/incident/:id/estado", requireRoles("Orientador", "Equipo Directivo"), async (req: CustomRequest, res: Response, next: NextFunction) => {
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

    // No se puede cerrar sin al menos una intervención registrada.
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

app.put("/admin/incident_type", requireRoles("Administrador"), (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.post("/admin/incident_type", requireRoles("Administrador"), (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.delete("/admin/incident_type", requireRoles("Administrador"), (req: Request, res: Response, next: NextFunction) => {
  res.send();
})

app.put("/admin/case_state", requireRoles("Administrador"), (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.post("/admin/case_state", requireRoles("Administrador"), (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
app.delete("/admin/case_state", requireRoles("Administrador"), (req: Request, res: Response, next: NextFunction) => {
  res.send();
})
// ===== Gestión de usuarios (Administrador) — US-03 / US-04 =====

// Listar roles disponibles (para el selector del formulario)
app.get("/roles", requireRoles("Administrador"), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.rol.findMany({ select: { id: true, nombre: true }, orderBy: { id: 'asc' } });
    res.json(roles.map((r: { id: bigint; nombre: string }) => ({ id: r.id.toString(), nombre: r.nombre })));
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al obtener los roles"));
  }
});

// Listar usuarios
app.get("/admin/users", requireRoles("Administrador"), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, correo: true, activo: true, rol: { select: { nombre: true } } },
      orderBy: { id: 'asc' },
    });
    res.json(usuarios.map((u: { id: bigint; nombre: string; correo: string; activo: boolean; rol: { nombre: string } | null }) => ({
      id: u.id.toString(),
      nombre: u.nombre,
      correo: u.correo,
      activo: u.activo,
      rol: u.rol?.nombre ?? '',
    })));
  } catch (error) {
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al obtener los usuarios"));
  }
});

// Crear usuario
app.post("/admin/user", requireRoles("Administrador"), async (req: Request, res: Response, next: NextFunction) => {
  const { nombre, correo, contrasena, rol } = req.body;
  if (!nombre || !correo || !contrasena || !rol) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }
  try {
    const rolBD = await prisma.rol.findFirst({ where: { nombre: rol } });
    if (!rolBD) return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Rol no válido"));

    const existente = await prisma.usuario.findUnique({ where: { correo } });
    if (existente) return next(new RouteError(HttpStatusCodes.CONFLICT, "El correo ya está registrado"));

    const { bcryptHash } = await import('@src/crypto/cryptoService');
    const contrasenaHash = await bcryptHash(contrasena);

    const nuevo = await prisma.usuario.create({
      data: { nombre, correo, contrasenaHash, rolId: rolBD.id },
    });
    res.status(HttpStatusCodes.CREATED).json({ id: nuevo.id.toString() });
  } catch (error) {
    console.error("Error creando usuario:", error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al crear usuario"));
  }
});

// Editar usuario
app.put("/admin/user/:id", requireRoles("Administrador"), async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { nombre, correo, contrasena, rol } = req.body;
  if (!nombre || !correo || !rol) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Faltan campos obligatorios"));
  }
  try {
    const rolBD = await prisma.rol.findFirst({ where: { nombre: rol } });
    if (!rolBD) return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "Rol no válido"));

    const duplicado = await prisma.usuario.findFirst({ where: { correo, NOT: { id: BigInt(id as string) } } });
    if (duplicado) return next(new RouteError(HttpStatusCodes.CONFLICT, "El correo ya está en uso por otro usuario"));

    const data: { nombre: string; correo: string; rolId: bigint; contrasenaHash?: string } = {
      nombre, correo, rolId: rolBD.id,
    };
    if (contrasena) {
      const { bcryptHash } = await import('@src/crypto/cryptoService');
      data.contrasenaHash = await bcryptHash(contrasena);
    }
    await prisma.usuario.update({ where: { id: BigInt(id as string) }, data });
    res.status(HttpStatusCodes.OK).json({ id });
  } catch (error) {
    console.error("Error editando usuario:", error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al editar usuario"));
  }
});

// Activar / desactivar usuario (Tier 2, RF-04 / US-04). Endpoint chico para no
// reescribir nombre/correo/rol al solo cambiar el estado.
app.patch("/admin/user/:id/activo", requireRoles("Administrador"), async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { activo } = req.body;
  if (typeof activo !== 'boolean') {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "El campo 'activo' debe ser booleano"));
  }
  // Un administrador no puede desactivarse a sí mismo (evita auto-bloqueo).
  if (activo === false && req.user?.userId === id) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, "No puedes desactivar tu propia cuenta"));
  }
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: BigInt(id as string) } });
    if (!usuario) return next(new RouteError(HttpStatusCodes.NOT_FOUND, "Usuario no encontrado"));

    await prisma.usuario.update({ where: { id: BigInt(id as string) }, data: { activo } });
    res.status(HttpStatusCodes.OK).json({ id, activo });
  } catch (error) {
    console.error("Error cambiando estado de usuario:", error);
    return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, "Error al cambiar el estado del usuario"));
  }
});

// Add error handler
app.use((err: Error, _: Request, res: Response, _next: NextFunction) => {
  if (err instanceof RouteError) {
    console.log(`error ${err.status}:`, err.message);
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error('[error no controlado]', err);
  res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Error interno del servidor' });
});



/******************************************************************************
                                Export default
******************************************************************************/

export default app;
