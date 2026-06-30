import type { Severity, IncidentRole } from '../types/index.ts'

// Mapeo de gravedad: frontend → API
export const SEVERITY_MAP: Record<string, Severity> = {
  'Leve': 'mild',
  'Grave': 'severe',
  'Muy Grave': 'verysevere',
}

// Mapeo de roles: frontend → API
export const ROLE_MAP: Record<string, IncidentRole> = {
  'Agresor': 'aggressor',
  'Víctima': 'victim',
  'Testigo': 'witness',
  'Participante': 'participant',
}

// Mapeo de roles: API → frontend (español), cubre typo histórico 'aggresor'
export const ROLE_DISPLAY: Record<string, string> = {
  aggressor:   'Agresor',
  aggresor:    'Agresor',
  victim:      'Víctima',
  witness:     'Testigo',
  participant: 'Participante',
}

// Roles de usuario del sistema (para gestión de funcionarios)
export const USER_ROLE_DISPLAY: Record<string, string> = {
  teacher:    'Profesor',
  inspector:  'Inspector',
  orientator: 'Orientador',
  directive:  'Directivo',
  admin:      'Administrador',
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
