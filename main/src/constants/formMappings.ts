import type { Severity, IncidentRole } from '../types/index.ts'

// Mapeo de gravedad: frontend → API
export const SEVERITY_MAP: Record<string, Severity> = {
  'Leve': 'mild',
  'Grave': 'severe',
  'Muy Grave': 'verysevere',
}

// Mapeo de roles: frontend → API
export const ROLE_MAP: Record<string, IncidentRole> = {
  'Agresor': 'aggresor',
  'Víctima': 'victim',
  'Testigo': 'witness',
  'Participante': 'participant',
}

// Opciones de lugares disponibles
export const PLACE_OPTIONS = ['Aula 3', 'Patio 1', 'Comedor', 'Biblioteca']

// Opciones de tipos de incidente
export const INCIDENT_TYPE_OPTIONS = [
  { value: 'verbal', label: 'Agresión verbal' },
  { value: 'physical', label: 'Agresión física' },
  { value: 'harassment', label: 'Acoso escolar' },
  { value: 'discrimination', label: 'Discriminación' },
  { value: 'other', label: 'Otro' },
]
