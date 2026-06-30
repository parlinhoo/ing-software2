import { usePermissions } from '../hooks/usePermissions.ts'
import { useAuth } from '../context/authContext.tsx'

type Props = {
  onLogout: () => void
}

// Mapea el nombre del rol de la BD (español) al slug que usan los estilos
// de color del badge (.topbar-rol--*). Los roles sin modificador usan el base.
const ROLE_SLUG: Record<string, string> = {
  'Administrador': 'admin',
  'Equipo Directivo': 'directive',
  'Orientador': 'orientator',
  'Docente': 'teacher',
  'Inspector': 'inspector',
}

export function TopBar({ onLogout }: Props) {
  const { role } = usePermissions()
  const { logout, user } = useAuth()

  const label = role ?? 'Usuario'
  const slug = role ? (ROLE_SLUG[role] ?? 'teacher') : 'teacher'
  const inicial = (user?.name ?? label).charAt(0).toUpperCase()

  function handleLogout() {
    logout()
    onLogout()
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo" aria-hidden="true">🏫</span>
        <div className="topbar-titles">
          <span className="topbar-name">Convivencia Escolar</span>
          <span className="topbar-sub">Sistema de Gestión</span>
        </div>
      </div>

      <div className="topbar-user">
        <span className={`badge topbar-rol topbar-rol--${slug}`}>{label}</span>
        <span className="topbar-avatar" aria-hidden="true">{inicial}</span>
        <button className="topbar-logout" onClick={handleLogout} title="Cerrar sesión">
          Salir
        </button>
      </div>
    </header>
  )
}
