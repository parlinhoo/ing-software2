import HttpStatusCodes from "../constants/httpStatusCodes.js";
import axiosInstance from "./axiosInstance.js";
import Paths from "./paths.js";

function print(input: any) {
    console.log("[Servicio de Usuarios]", input);
}

export type RoleData = { id: string; nombre: string };
export type UserData = { id: string; nombre: string; correo: string; rol: string; activo: boolean };

export async function getRoles(): Promise<RoleData[]> {
    const response = await axiosInstance.get<RoleData[]>(Paths.ROLES);
    return response.data;
}

export async function getUsers(): Promise<UserData[]> {
    const response = await axiosInstance.get<UserData[]>(Paths.ADMIN.USERS);
    return response.data;
}

export async function createUser(nombre: string, correo: string, contrasena: string, rol: string) {
    print("Petición de creación de usuario enviada...");
    const response = await axiosInstance.post(Paths.ADMIN.USER, { nombre, correo, contrasena, rol });
    if (response.status === HttpStatusCodes.CREATED || response.status === HttpStatusCodes.OK) {
        print("Usuario creado con éxito.");
        return;
    }
    throw new Error();
}

export async function editUser(id: string, nombre: string, correo: string, rol: string, contrasena?: string) {
    print("Petición de edición de usuario enviada...");
    const response = await axiosInstance.put(`${Paths.ADMIN.USER}/${id}`, { nombre, correo, contrasena, rol });
    if (response.status === HttpStatusCodes.OK) {
        print("Usuario editado con éxito.");
        return;
    }
    throw new Error();
}

// Tier 2 (RF-04 / US-04): activar o desactivar una cuenta sin reescribir el resto de sus datos.
export async function toggleUserActive(id: string, activo: boolean) {
    print(`Petición de ${activo ? 'activación' : 'desactivación'} de usuario enviada...`);
    const response = await axiosInstance.patch(`${Paths.ADMIN.USER}/${id}/activo`, { activo });
    if (response.status === HttpStatusCodes.OK) {
        print(`Usuario ${activo ? 'activado' : 'desactivado'} con éxito.`);
        return;
    }
    throw new Error();
}