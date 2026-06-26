import type { UserRole } from "../types/index.js";
import HttpStatusCodes from "../constants/httpStatusCodes.js";
import axiosInstance from "./axiosInstance.js";
import Paths from "./paths.js";

function print(input: any) {
    console.log("[Servicio de Usuarios]", input);
}

export type NewUser = {
  nombre: string,
  correo: string,
  contrasena: string,
  rol: string,
}

export type UserAPI = {
  id: number,
  nombre: string,
  correo: string,
  rol: string,
}

export type UserListItem = {
  id: string
  nombre: string
  correo: string
  rol: string
  activo: boolean
  creadoEn: string
}

export async function getUsers(): Promise<UserListItem[]> {
  const response = await axiosInstance.get<UserListItem[]>(Paths.ADMIN.USERS)
  return response.data
}

export async function getRoles(): Promise<string[]> {
    print("Petición de roles del sistema enviada...");
    const response = await axiosInstance.get<string[]>(Paths.ROLES);
    print("Roles obtenidos con éxito.");
    return response.data;
}

export async function createUser(user: NewUser): Promise<UserAPI> {
    print(`Petición de creación de usuario ${user.correo} enviada...`);
    const response = await axiosInstance.post<UserAPI>(Paths.ADMIN.USER, user);

    if (response.status === HttpStatusCodes.CREATED || response.status === HttpStatusCodes.OK) {
        print("Usuario creado con éxito.");
        return response.data;
    }
    else {
        print("Ha ocurrido un error al crear el usuario.");
        throw new Error();
    }
}

export type EditUser = {
  nombre: string
  correo: string
  rol: string
  contrasena?: string
}

export async function updateUser(id: string, data: EditUser): Promise<void> {
  await axiosInstance.put(`${Paths.ADMIN.USER}/${id}`, data)
}

export async function toggleUserActive(id: string, activo: boolean): Promise<void> {
  await axiosInstance.patch(`${Paths.ADMIN.USER}/${id}/activo`, { activo })
}