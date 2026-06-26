import { useAuth } from '../hooks/useAuth.ts'
import { useAuth as useAuthContext } from '../context/authContext.tsx'
import { USER_ROLE_DISPLAY } from '../constants/formMappings.ts'

type Props = {
  onLogout: () => void
}

export function TopBar({ onLogout }: Props) {
  const { role } = useAuth()
  const { logout, user } = useAuthContext()
  const label = USER_ROLE_DISPLAY[role] ?? 'Usuario'
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
        <span className={`badge topbar-rol topbar-rol--${role}`}>{label}</span>
        <span className="topbar-avatar" aria-hidden="true">{inicial}</span>
        <button className="topbar-logout" onClick={handleLogout} title="Cerrar sesión">
          Salir
        </button>
      </div>
    </header>
  )
}
