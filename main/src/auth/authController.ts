import axiosInstance from "../paths/axiosInstance.js";
import Paths from "../paths/paths.js";
import type { UserRole } from "./types.js";

function print(input: any) {
    console.log("[Controlador de Autenticación]", input)
}

export async function signIn(username: string, password: string) {
    print("Iniciando sesión...");
    const response = await axiosInstance.post(Paths.AUTH.SIGN_IN, {username, password});
    const role: UserRole|null = response.data;
    if (role) {
        print("Sesión iniciada con éxito.");
    }
    else {
        print("Credenciales inválidas.");
    }
    
    return role;
}