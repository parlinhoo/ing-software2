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

// Opciones de lugares disponibles (alineadas con los lugares del seed)
export const PLACE_OPTIONS = [
  'Sala 1°A Medio',
  'Sala 2°A Medio',
  'Sala 3°A Medio',
  'Sala 4°A Medio',
  'Patio central',
  'Patio techado',
  'Pasillo de salas',
  'Comedor',
  'Casino',
  'Biblioteca',
  'Baños del primer piso',
  'Escaleras del segundo piso',
  'Sala de profesores (cercanías)',
  'Cancha de baby fútbol',
  'Salida del establecimiento',
]

// Opciones de tipos de incidente
export const INCIDENT_TYPE_OPTIONS = [
  { value: 'verbal', label: 'Agresión verbal' },
  { value: 'physical', label: 'Agresión física' },
  { value: 'harassment', label: 'Acoso escolar' },
  { value: 'discrimination', label: 'Discriminación' },
  { value: 'other', label: 'Otro' },
]
