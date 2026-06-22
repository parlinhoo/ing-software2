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

// en la practica siempre seran number
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
        where: {
            correo: email,
        },
        select: {
            id: true,
            nombre: true,
            contrasenaHash: true,
            rol: {
                select: {
                    nombre: true,
                    id: true,
                },
            },
        }
    });
    
    if (!fetchedUser) throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Credenciales Inválidas.");
    
    const success = await bcryptCompare(password, fetchedUser.contrasenaHash);
    
    if (!success) throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Credenciales Inválidas.");
    
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

// wrapper para que quede mejor y mas limpio
export function requireRoles(...roles: Roles[]) {
    async function requireAuth(req: CustomRequest, _: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new RouteError(HttpStatusCodes.UNAUTHORIZED, "Acceso denegado. Token no proporcionado.");
        }

        const token = authHeader.split(' ')[1];

        try {
            const payloadDecodificado = jwt.verify(token, environment.JWT_SECRET) as JwtPayload;
            req.user = payloadDecodificado;

            const fetchedRole = await prisma.rol.findUnique({
                where: {
                    id: Number(req.user.roleId),
                },
                select: {
                    nombre: true,
                }
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
            if (error instanceof jwt.TokenExpiredError) {
                error = new RouteError(HttpStatusCodes.UNAUTHORIZED, "La sesión ha expirado. Vuelve a iniciar sesión.");
            }
            next(error);
            return;
        }
    }
    
    return requireAuth;
}