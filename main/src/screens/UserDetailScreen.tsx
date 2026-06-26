import type { UserListItem } from '../services/userService.ts'

type Props = {
  user: UserListItem
  onEdit: () => void
  onBack: () => void
}

const ROL_STYLE: Record<string, { bg: string; color: string }> = {
  'Administrador':    { bg: '#dbeafe', color: '#1e40af' },
  'Equipo Directivo': { bg: '#dbeafe', color: '#1e40af' },
  'Orientador':       { bg: '#f3e8ff', color: '#7e22ce' },
  'Inspector':        { bg: '#fef9c3', color: '#854d0e' },
  'Docente':          { bg: '#dcfce7', color: '#166534' },
}

export function UserDetailScreen({ user, onEdit, onBack }: Props) {
  const rolStyle = ROL_STYLE[user.rol] ?? { bg: '#f3f4f6', color: '#374151' }

  return (
    <div className="contenedor-principal">
      <header className="cabecera-vista">
        <div className="titulos-cabecera">
          <span className="contexto-texto">Panel de Administración / Gestión de Usuarios / Detalle</span>
          <h1 className="titulo-principal">Detalle de Funcionario</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secundario" onClick={onBack}>← Volver</button>
          <button className="btn-primario" onClick={onEdit}>Editar</button>
        </div>
      </header>

      <div className="seccion-card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: rolStyle.bg, color: rolStyle.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700,
          }}>
            {user.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{user.nombre}</h2>
            <span className="badge" style={{ background: rolStyle.bg, color: rolStyle.color, marginTop: 4, display: 'inline-block' }}>
              {user.rol}
            </span>
          </div>
        </div>

        <dl style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
            <dt style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>Correo</dt>
            <dd style={{ margin: 0 }}>{user.correo}</dd>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
            <dt style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>Rol</dt>
            <dd style={{ margin: 0 }}>{user.rol}</dd>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
            <dt style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>Estado</dt>
            <dd style={{ margin: 0 }}>
              <span className="badge" style={{
                background: user.activo ? '#dcfce7' : '#fee2e2',
                color: user.activo ? '#166534' : '#991b1b',
              }}>
                {user.activo ? 'Activo' : 'Inactivo'}
              </span>
            </dd>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8 }}>
            <dt style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>Fecha de ingreso</dt>
            <dd style={{ margin: 0 }}>{user.creadoEn}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
