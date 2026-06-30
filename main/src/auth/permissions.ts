// Single source of truth para reglas de acceso por rol. Cada permiso es una acción o region de UI. 
// Cuando agreguemos un nuevo permiso, agregarlo aca con la lista de roles que pueden ejercerlo. 
// NO dispersar listas de roles por componentes individuales.

export const ROLES = ['Administrador', 'Docente', 'Inspector', 'Orientador', 'Equipo Directivo'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  // Los 4 puntos del control de acceso del frontend (Sprint 2):

  // Punto 1: boton crear incidente (US-06)
  crear_incidente:        ['Docente', 'Inspector'],

  // Edición y anulación de incidentes (US-07 / US-10)
  editar_incidente:       ['Docente', 'Inspector'],
  anular_incidente:       ['Equipo Directivo'],

  // Punto 2: listado de incidentes (mi punto asignado)
  ver_listado_incidentes: ['Docente', 'Inspector', 'Orientador', 'Equipo Directivo'],

  // Punto 3: seguimientos / intervenciones (US-12, US-13)
  // VER: Orientador (gestiona) + Equipo Directivo (revisa para decidir cierre, US-12).
  // AGREGAR/EDITAR: solo Orientador (no se solapa con el rol directivo).
  ver_seguimientos:       ['Orientador', 'Equipo Directivo'],
  agregar_seguimientos:   ['Orientador'],

  // Gestión de estado del incidente (US-12 / CU-11). Orientador y Equipo Directivo
  // (un directivo puede ejercer también como orientador; criterio de aceptación US-12).
  cambiar_estado_incidente: ['Orientador', 'Equipo Directivo'],

  // Punto 4: gestión de cuentas (US-03, US-04)
  crear_cuentas:          ['Administrador'],
  editar_cuentas:         ['Administrador'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

// Helper puro: usar cuando NO estemos dentro de un React component.
// Dentro de componentes, prefiere el hook usePermissions().
export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}