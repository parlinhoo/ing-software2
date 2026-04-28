import HttpStatusCodes from "../constants/httpStatusCodes.js";
import axiosInstance from "../paths/axiosInstance.js";
import Paths from "../paths/paths.js";
import type { InterventionType } from "./types.js";

function print(input: any) {
    console.log("[Servicio de Intervenciones]", input);
}

export async function registerIntervention(
    registerer: string, 
    incidentId: number, 
    date: string, 
    interventionType: InterventionType,
    description: string,
) {
    const data = {
        registerer,
        incidentId,
        date,
        interventionType,
        description,
    }

    print("Petición de registro de intervención enviada...");
    const response = await axiosInstance.put(Paths.INTERVENTION, data);

    if (response.status === HttpStatusCodes.OK) {
        print("Intervención registrada con éxito.");
        return response.data.id;
    }
    else {
        print("Ha ocurrido un error al registrar intervención.");
        return -1;
    }
}

export async function editIntervention(
    incidentId: number,
    interventionId: number,
    date?: Date,
    interventionType?: InterventionType,
    description?: string,
) {
    const data = {
        incidentId,
        interventionId,
        date,
        interventionType,
        description,
    }
    print(`Petición de editado de intervención ${interventionId} de incidente ${incidentId} enviada...`);
    const response = await axiosInstance.post(Paths.INTERVENTION, data);

    if (response.status === HttpStatusCodes.OK) {
        print("Intervención editada con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al editar intervención.");
        throw new Error();
    }
}