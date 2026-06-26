export const ROLES = ['Administrador', 'Docente', 'Inspector', 'Orientador', 'Equipo Directivo'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  crear_incidente:        ['Docente', 'Inspector'],
  ver_listado_incidentes: ['Docente', 'Orientador', 'Equipo Directivo'],
  ver_seguimientos:       ['Orientador'],
  agregar_seguimientos:   ['Orientador'],
  crear_cuentas:          ['Administrador'],
  editar_cuentas:         ['Administrador'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}