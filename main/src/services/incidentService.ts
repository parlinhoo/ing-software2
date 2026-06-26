import HttpStatusCodes from "../constants/httpStatusCodes.js";
import axiosInstance from "./axiosInstance.js";
import Paths from "./paths.js";
import type { IncidentTypes, Severity, IncidentActor } from "../types/index.js";

function print(input: any) {
    console.log("[Servicio de Incidentes]", input);
}

export type StudentData = {
  name: string,
  class: string,
  rut: string,
}

export type IncidentState = 'abierto' | 'en_seguimiento' | 'cerrado'

export type IncidentAPI = {
  incidentId: number
  incidentType: string
  severity: string
  actors: Array<{ name: string; role: string }>
  date: string
  place: string
  description: string
  estado?: IncidentState
}

// ── Adaptador formato BD (backend main) → formato frontend ──────────────
// El backend devuelve el modelo crudo de Prisma (IDs de catálogo en español).
// Estos mapas traducen los IDs del seed a las claves que usa el frontend.
const GRAVEDAD_ID_TO_SEVERITY: Record<string, string> = {
  '1': 'mild',         // Leve
  '2': 'severe',       // Grave
  '3': 'very_severe',  // Muy grave
}
const TIPO_ID_TO_TYPE: Record<string, string> = {
  '1': 'verbal',          // Agresión verbal
  '2': 'physical',        // Agresión física
  '3': 'harassment',      // Acoso escolar
  '4': 'discrimination',  // Discriminación
  '5': 'other',           // Daño a la propiedad
  '6': 'other',           // Otro
}
const ESTADO_ID_TO_STATE: Record<string, IncidentState> = {
  '1': 'abierto',
  '2': 'en_seguimiento',
  '3': 'cerrado',
}

type IncidentRaw = {
  id: string | number
  fecha: string
  lugar: string
  descripcion: string
  gravedadId: string | number
  tipoIncidenteId: string | number
  estadoCasoId: string | number
  actores?: Array<{ name: string; role: string }>
  actors?: Array<{ name: string; role: string }>
}

function adaptIncident(raw: IncidentRaw): IncidentAPI {
  return {
    incidentId: Number(raw.id),
    incidentType: TIPO_ID_TO_TYPE[String(raw.tipoIncidenteId)] ?? 'other',
    severity: GRAVEDAD_ID_TO_SEVERITY[String(raw.gravedadId)] ?? 'mild',
    actors: raw.actors ?? raw.actores ?? [],
    date: raw.fecha,
    place: raw.lugar,
    description: raw.descripcion,
    estado: ESTADO_ID_TO_STATE[String(raw.estadoCasoId)] ?? 'abierto',
  }
}

export async function fetchIncidents(): Promise<IncidentAPI[]> {
  const response = await axiosInstance.get<IncidentRaw[]>(Paths.INCIDENT)
  return response.data.map(adaptIncident)
}

export type IncidentDetail = {
  id: string,
  fecha: string,
  hora: string,
  lugar: string,
  tipoIncidente: IncidentTypes,
  descripcion: string,
  gravedad: Severity,
  actores: Array<{ name: string, role: IncidentActor['role'] }>,
}

export async function searchStudents(query: string): Promise<StudentData[]> {
    // NOTA: hay dos posibles valores que se mandan
    // RUT: formato XXXXXXXX-X
    // ALUMNO: query para que la bbdd busque y devuelva todos los alumnos cuyo nombre contenga este string
    let data: StudentData[] = [];
    try {
        const response = await axiosInstance.get<StudentData[]>(`students/search?q=${query}`);
        data = response.data;
        console.log(response);
    }
    catch (e) {
        console.log(e);
    }
    return data;
}

export async function getIncidentDetail(incidentId: string): Promise<IncidentAPI> {
    print(`Petición de detalle de incidente ${incidentId} enviada...`);
    const response = await axiosInstance.get<IncidentRaw>(`incident/${incidentId}`);
    print(`Detalle de incidente ${incidentId} obtenido con éxito.`);
    return adaptIncident(response.data);
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
    const response = await axiosInstance.post(Paths.INCIDENT, data);

    if (response.status === HttpStatusCodes.CREATED) {
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
    const response = await axiosInstance.put(Paths.INCIDENT, data);

    if (response.status === HttpStatusCodes.OK) {
        print("Incidente editado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al editar el incidente.");
        throw new Error();
    }
}

export async function deleteIncident(incidentId: number, motivoAnulacion?: string) {
    print(`Petición de eliminado de incidente ${incidentId} enviada...`);
    const response = await axiosInstance.delete(Paths.INCIDENT+`?id=${incidentId}`, {
        data: motivoAnulacion ? { motivo_anulacion: motivoAnulacion } : undefined,
    });

    if (response.status === HttpStatusCodes.OK) {
        print("Incidente anulado con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al anular el incidente.");
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

export async function setIncidentState(incidentId: number, nuevoEstado: IncidentState) {
    print(`Petición de cambio de estado de incidente ${incidentId} a ${nuevoEstado} enviada...`);
    const response = await axiosInstance.put(`/incident/${incidentId}/estado`, { nuevoEstado });

    if (response.status === HttpStatusCodes.OK) {
        print("Estado del incidente actualizado con éxito.");
        return response.data;
    }
    else {
        print("Ha ocurrido un error al cambiar el estado del incidente.");
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

export async function addIntervention(incidenteId: number, tipo: string, descripcion: string, fecha: string) {
    print(`Petición de registro de intervención para incidente ${incidenteId} enviada...`);
    const response = await axiosInstance.post('/intervention', {
        incidenteId,
        tipo,
        descripcion,
        fecha,
    });

    if (response.status === HttpStatusCodes.CREATED || response.status === HttpStatusCodes.OK) {
        print("Intervención registrada con éxito.");
        return response.data;
    }
    else {
        print("Ha ocurrido un error al registrar la intervención.");
        throw new Error();
    }
}

export type InterventionAPI = {
  id: number,
  incidenteId: number,
  tipo: 'citacion' | 'derivacion' | 'tutoria' | 'otra',
  descripcion: string,
  fecha: string,
}

export async function getInterventions(incidentId: number): Promise<InterventionAPI[]> {
    print(`Petición de intervenciones del incidente ${incidentId} enviada...`);
    const response = await axiosInstance.get<InterventionAPI[]>(`/intervention?incidentId=${incidentId}`);
    print(`Intervenciones del incidente ${incidentId} obtenidas con éxito.`);
    return response.data;
}

export async function editIntervention(id: number, tipo: string, descripcion: string, fecha: string) {
    print(`Petición de edición de intervención ${id} enviada...`);
    const response = await axiosInstance.put('/intervention', { id, tipo, descripcion, fecha });

    if (response.status === HttpStatusCodes.OK) {
        print("Intervención editada con éxito.");
        return response.data;
    }
    else {
        print("Ha ocurrido un error al editar la intervención.");
        throw new Error();
    }
}

export async function deleteIntervention(id: number) {
    print(`Petición de eliminación de intervención ${id} enviada...`);
    const response = await axiosInstance.delete(`/intervention?id=${id}`);

    if (response.status === HttpStatusCodes.OK) {
        print("Intervención eliminada con éxito.");
        return;
    }
    else {
        print("Ha ocurrido un error al eliminar la intervención.");
        throw new Error();
    }
}