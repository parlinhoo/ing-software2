import HttpStatusCodes from "../constants/httpStatusCodes.js";
import axiosInstance from "../paths/axiosInstance.js";
import Paths from "../paths/paths.js";
import type { IncidentTypes, Severity, IncidentActor, IncidentStatus } from "./types.js";

function print(input: any) {
    console.log("[Servicio de Incidentes]", input);
}

export async function registerIncident(
    registerer: string, 
    incidentType: IncidentTypes, 
    severity: Severity,
    actors: IncidentActor[],
    date: string,
    place: string,
    description: string,
) {
    const data = {
        registerer,
        incidentType,
        severity,
        actors,
        date,
        place,
        description,
    }

    print("Petición de creado de incidente enviada...");
    const response = await axiosInstance.put(Paths.INCIDENT, data);

    if (response.status === HttpStatusCodes.OK) {
        print("Incidente creado con éxito.");
        return response.data.incidentId;
    }
    else {
        print("Ha ocurrido un error al crear el incidente.");
        throw new Error();
    }
}

export async function editIncident(
    incidentId: number,
    incidentType?: IncidentTypes, 
    severity?: Severity,
    actors?: IncidentActor[],
    date?: Date,
    place?: string,
    description?: string,
) {
    const data = {
        incidentId,
        incidentType,
        severity,
        actors,
        date,
        place,
        description,
    }

    print(`Petición de editado de incidente ${incidentId} enviada...`);
    const response = await axiosInstance.post(Paths.INCIDENT, data);

    if (response.status === HttpStatusCodes.OK) {
        print("Incidente editado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al editar el incidente.");
        throw new Error();
    }
}

export async function deleteIncident(incidentId: number) {
    print(`Petición de eliminado de incidente ${incidentId} enviada...`);
    const response = await axiosInstance.delete(Paths.INCIDENT+`?id=${incidentId}`);
    
    if (response.status === HttpStatusCodes.OK) {
        print("Incidente eliminado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al eliminar el incidente.");
        throw new Error();
    }
}

export async function getIncidents(studentId: number) {
    print(`Petición de historial de incidentes de ${studentId} enviada...`);
    const response = await axiosInstance.get(Paths.INCIDENT+`?id=${studentId}`);
    
    if (response.status === HttpStatusCodes.OK) {
        print("Incidentes obtenidos con éxito.");
        return response.data;
    }
    else {
        print("Ha ocurrido un error al eliminar el incidente.");
        throw new Error();
    }
}

export async function addPositiveRemarks(studentId: number) {
    print(`Petición de registro de anotación positiva del alumno ${studentId} enviada...`);
    const response = await axiosInstance.put(Paths.POSITIVE_REMARKS);
    
    if (response.status === HttpStatusCodes.OK) {
        print("Anotación positiva registrada con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al anotar la anotación positiva.");
        throw new Error();
    }
}

export async function setIncidentState(incidentId: number, state: IncidentStatus) {
    print(`Petición de cambio de estado de incidente ${incidentId} a ${state} enviada...`);    
    const response = await axiosInstance.post(Paths.INCIDENT, {incidentId, state});
    
    if (response.status === HttpStatusCodes.OK) {
        print("Incidente editado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al editar el incidente.");
        throw new Error();
    }
}

export async function addIncidentType(incidentType: string) {
    print(`Petición de nuevo tipo de incidente ${incidentType} enviada...`);    
    const response = await axiosInstance.put(Paths.ADMIN.INCIDENT_TYPE, {incidentType});
    
    if (response.status === HttpStatusCodes.OK) {
        print("Tipo de incidente creado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al crear el tipo de incidente.");
        throw new Error();
    }
}

export async function editIncidentType(prevType: string, newType: string) {
    print(`Petición de cambio de nombre de ${prevType} a ${newType} enviada...`);    
    const response = await axiosInstance.post(Paths.ADMIN.INCIDENT_TYPE, {prev: prevType, new: newType});
    
    if (response.status === HttpStatusCodes.OK) {
        print("Tipo de incidente modificado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al modificar el tipo de incidente.");
        throw new Error();
    }
}

export async function deleteIncidentType(incidentType: string) {
    print(`Petición de eliminación de ${incidentType} enviada...`);    
    const response = await axiosInstance.delete(Paths.ADMIN.INCIDENT_TYPE+`?type=${incidentType}`)
    
    if (response.status === HttpStatusCodes.OK) {
        print("Tipo de incidente eliminado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al eliminar el tipo de incidente.");
        throw new Error();
    }
}

export async function addCaseState(caseState: string) {
    print(`Petición de nuevo estado de caso ${caseState} enviada...`);    
    const response = await axiosInstance.put(Paths.ADMIN.CASE_STATE, {caseState});
    
    if (response.status === HttpStatusCodes.OK) {
        print("Nuevo estado de caso creado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al crear el estado de caso.");
        throw new Error();
    }
}

export async function editCaseState(prevState: string, newState: string) {
    print(`Petición de cambio de nombre de estado de caso ${prevState} a ${newState} enviada...`);    
    const response = await axiosInstance.post(Paths.ADMIN.CASE_STATE, {prev: prevState, new: newState});
    
    if (response.status === HttpStatusCodes.OK) {
        print("Nuevo estado de caso modificado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al modificar el estado de caso.");
        throw new Error();
    }
}

export async function deleteCaseState(caseState: string) {
    print(`Petición de eliminación estado de caso ${caseState} enviada...`);    
    const response = await axiosInstance.delete(Paths.ADMIN.CASE_STATE+`?state=${caseState}`);
    
    if (response.status === HttpStatusCodes.OK) {
        print("Estado de caso eliminado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al eliminar el estado de caso.");
        throw new Error();
    }
}