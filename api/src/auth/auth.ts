import { User, UserRole } from "../types/types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users: User[] = [
    { username: "teacher", password: "1234", role: "teacher" },
    { username: "inspector", password: "1234", role: "inspector" },
    { username: "orientator", password: "1234", role: "orientator" },
    { username: "directive", password: "1234", role: "directive" },
    { username: "admin", password: "1234", role: "admin" },
]

export function authenticate(username: string, password: string): UserRole|undefined {
    const found = users.find((value: User) => {
        return value.username === username && value.password === password;
    })
    return found?.role
}

export async function authenticateFromDB(correo: string, password: string): Promise<UserRole|undefined> {
    const bcrypt = await import('bcrypt');
    
    const usuario = await prisma.usuario.findUnique({
        where: { correo },
        include: { rol: true },
    });

    if (!usuario || !usuario.activo) return undefined;

    const coincide = await bcrypt.compare(password, usuario.contrasenaHash);
    if (!coincide) return undefined;

    return usuario.rol.nombre.toLowerCase() as UserRole;
}