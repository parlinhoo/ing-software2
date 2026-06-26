import { useAuth as useAuthContext } from '../context/authContext.tsx'

type RoleKey = 'teacher' | 'inspector' | 'orientator' | 'directive' | 'admin'

// Mapea el nombre del rol de la BD (español) a la clave interna del frontend
const BD_ROLE_TO_KEY: Record<string, RoleKey> = {
  'Administrador': 'admin',
  'Docente': 'teacher',
  'Inspector': 'inspector',
  'Orientador': 'orientator',
  'Equipo Directivo': 'directive',
}

/**
 * Hook de roles del frontend. Deriva el rol y los permisos a partir del
 * usuario autenticado (authContext / login real contra la BD).
 */
export function useAuth() {
  const { user } = useAuthContext()
  const role: RoleKey = (user ? BD_ROLE_TO_KEY[user.role.name] : undefined) ?? 'teacher'

  return {
    role,
    isDirective: role === 'directive' || role === 'admin',
    isOrientator: role === 'orientator',
  }
}
