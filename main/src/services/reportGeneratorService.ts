import HttpStatusCodes from "../constants/httpStatusCodes.js";
import axiosInstance from "./axiosInstance.js";
import Paths from "./paths.js";

function print(input: any) {
    console.log("[Generador de Reportes]", input);
}

export async function getReport() {
    print(`Petición de reporte de incidentes enviada...`);
    const response = await axiosInstance.get(Paths.DASHBOARD_DATA);
    
    if (response.status === HttpStatusCodes.OK) {
        print("Reporte recibido con éxito.");
        return response.data;
    }
    else {
        print("Ha ocurrido un error al obtener el reporte.");
        throw new Error();
    }
}