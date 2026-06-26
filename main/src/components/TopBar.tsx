import { useAuth } from '../hooks/useAuth.ts'
import { USER_ROLE_DISPLAY } from '../constants/formMappings.ts'

export function TopBar() {
  const { role } = useAuth()
  const label = USER_ROLE_DISPLAY[role] ?? 'Usuario'
  const inicial = label.charAt(0).toUpperCase()

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
      </div>
    </header>
  )
}
