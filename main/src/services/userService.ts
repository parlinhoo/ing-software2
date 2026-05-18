import type { UserRole } from "../types/index.js";
import HttpStatusCodes from "../constants/httpStatusCodes.js";
import axiosInstance from "./axiosInstance.js";
import Paths from "./paths.js";

function print(input: any) {
    console.log("[Servicio de Usuarios]", input);
}

export async function createUser(username: string, password: string, role: UserRole) {
    print("Petición de creación de usuario enviada...");
    const response = await axiosInstance.put(Paths.ADMIN.USER, {username, password, role});

    if (response.status === HttpStatusCodes.OK) {
        print("Usuario creado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al crear usuario.");
        throw new Error();
    }
}

export async function editUser(username: string, password?: string, role?: UserRole) {
    print("Petición de editado de usuario enviada...");
    const response = await axiosInstance.post(Paths.ADMIN.USER, {username, password, role});

    if (response.status === HttpStatusCodes.OK) {
        print("Usuario editado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al editar usuario.");
        throw new Error();
    }
}

export async function deleteUser(username: string) {
    print("Petición de eliminado de usuario enviada...");
    const response = await axiosInstance.delete(Paths.ADMIN.USER+`?username=${username}`);

    if (response.status === HttpStatusCodes.OK) {
        print("Usuario eliminado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al eliminar usuario.");
        throw new Error();
    }
}