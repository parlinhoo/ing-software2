import { PrismaClient } from '@prisma/client';
import { RouteError } from "@src/utils/route-errors";
import HttpStatusCodes from "@src/constants/httpStatusCodes";
import { bcryptCompare } from "@src/crypto/cryptoService";
import environment from '@src/constants/environment';
import { NextFunction, Request, Response } from 'express';
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface JwtPayload {
    userId: string;
    roleId: string;
}

export const ValidRoles = ["Docente", "Inspector", "Administrador", "Equipo Directivo", "Orientador"] as const;

export type Roles = (typeof ValidRoles)[number];

export interface CustomRequest extends Request {
    user?: JwtPayload;
}

export type SignInData = {
    email: string,
    password: string,
}

export type User = {
    id: number,
    name: string,
    role: {
        id: number,
        name: string,
    }
}

export async function authenticate(email: string, password: string): Promise<User>  {
    const fetchedUser = await prisma.usuario.findUnique({
        where: { correo: email },
        select: {
            id: true,
            nombre: true,
            contrasenaHash: true,
            activo: true,
            rol: {
                select: { nombre: true, id: true },
            },
        }
    });

    if (!fetchedUser) throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Credenciales Inválidas.");

    const success = await bcryptCompare(password, fetchedUser.contrasenaHash);

    if (!success) throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Credenciales Inválidas.");

    // Cuenta desactivada (US-04): se valida tras la contraseña para no revelar
    // qué correos existen. Mensaje distinto para que el usuario sepa el motivo real.
    if (!fetchedUser.activo) throw new RouteError(HttpStatusCodes.FORBIDDEN, "Esta cuenta está desactivada. Contacta al administrador.");

    const user: User = {
        id: Number(fetchedUser.id),
        name: fetchedUser.nombre,
        role: {
            id: Number(fetchedUser.rol.id),
            name: fetchedUser.rol.nombre,
        }
    }

    return user;
}

const JWT_SECRET = environment.JWT_SECRET;

export function generateUserJWT(userId: number, roleId: number): string {
  const payload = {
    userId: userId.toString(),
    roleId: roleId.toString(),
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '2h',
  });

  return token;
}

// Helper privado: valida el JWT y popula req.user. Throws RouteError si algo falla.
// Lo usan tanto requireAuth (export directo) como requireRoles (con validación de rol encima).
function validateTokenAndPopulate(req: CustomRequest): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Acceso denegado. Token no proporcionado.");
    }

    const token = authHeader.split(' ')[1];

    try {
        const payloadDecodificado = jwt.verify(token, environment.JWT_SECRET) as JwtPayload;
        req.user = payloadDecodificado;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "La sesión ha expirado. Vuelve a iniciar sesión.");
        }
        throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Token inválido o corrupto.");
    }
}

// Middleware standalone que solo valida el token (sin chequeo de rol).
// Sincrono: throws en error, llama next() en éxito.
// Nota: si se usa directo como middleware Express, envolver en wrapper con try/catch.
export function requireAuth(req: CustomRequest, _: Response, next: NextFunction): void {
    validateTokenAndPopulate(req);
    next();
}

// Middleware con validacion de roles. Async porque consulta BD.
// Captura errores y los pasa a next() (compatible con Express).
export function requireRoles(...roles: Roles[]) {
    return async function (req: CustomRequest, _: Response, next: NextFunction) {
        try {
            validateTokenAndPopulate(req);

            const fetchedRole = await prisma.rol.findUnique({
                where: { id: Number(req.user!.roleId) },
                select: { nombre: true }
            });

            if (!fetchedRole) {
                throw new RouteError(HttpStatusCodes.NOT_FOUND, "El rol especificado no existe en la base de datos.");
            }

            console.log("nombre:", fetchedRole.nombre);

            if (!roles.includes(fetchedRole.nombre as Roles)) {
                throw new RouteError(HttpStatusCodes.FORBIDDEN, "Acceso denegado. No tienes los permisos necesarios.");
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}