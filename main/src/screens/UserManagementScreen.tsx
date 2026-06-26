import { useEffect, useState, useCallback } from 'react'
import { getUsers, toggleUserActive, type UserListItem } from '../services/userService.ts'
import { SkeletonRow } from '../components/Skeleton.tsx'
import { EmptyState } from '../components/EmptyState.tsx'

type Props = {
  onNewUser: () => void
  onViewUser: (user: UserListItem) => void
  onEditUser: (user: UserListItem) => void
  refreshKey?: number
}

const ROL_STYLE: Record<string, { bg: string; color: string }> = {
  'Administrador':    { bg: '#dbeafe', color: '#1e40af' },
  'Equipo Directivo': { bg: '#dbeafe', color: '#1e40af' },
  'Orientador':       { bg: '#f3e8ff', color: '#7e22ce' },
  'Inspector':        { bg: '#fef9c3', color: '#854d0e' },
  'Docente':          { bg: '#dcfce7', color: '#166534' },
}

export function UserManagementScreen({ onNewUser, onViewUser, onEditUser, refreshKey }: Props) {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<'' | 'true' | 'false'>('')
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const handleToggleActivo = async (u: UserListItem) => {
    setToggling(u.id)
    try {
      await toggleUserActive(u.id, !u.activo)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, activo: !u.activo } : x))
    } catch {
      load()
    } finally {
      setToggling(null)
    }
  }

  const roles = [...new Set(users.map(u => u.rol))].sort()

  const filtered = users.filter(u => {
    const q = query.toLowerCase()
    const matchQuery = !q || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)
    const matchRol = !filtroRol || u.rol === filtroRol
    const matchActivo = !filtroActivo || String(u.activo) === filtroActivo
    return matchQuery && matchRol && matchActivo
  })

  const totalActivos = users.filter(u => u.activo).length
  const totalDirectivos = users.filter(u => u.activo && (u.rol === 'Equipo Directivo' || u.rol === 'Administrador')).length
  const totalDocentes = users.filter(u => u.activo && (u.rol === 'Docente' || u.rol === 'Inspector')).length

  return (
    <div className="contenedor-principal">
      <header className="cabecera-vista">
        <div className="titulos-cabecera">
          <span className="contexto-texto">Panel de Administración / Gestión de Usuarios</span>
          <h1 className="titulo-principal">Gestión de Funcionarios</h1>
        </div>
        <button className="btn-primario" onClick={onNewUser}>+ Nuevo Funcionario</button>
      </header>

      <section className="tarjetas-resumen">
        <div className="tarjeta">Total activos: <strong>{totalActivos}</strong></div>
        <div className="tarjeta">Directivos / Admin: <strong>{totalDirectivos}</strong></div>
        <div className="tarjeta">Docentes / Inspectores: <strong>{totalDocentes}</strong></div>
      </section>

      <section className="seccion-tabla">
        <h2 className="subtitulo">Listado de Funcionarios</h2>

        <div className="filtros-tabla">
          <input
            type="text"
            className="input-base"
            placeholder="Buscar por nombre o correo..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <select className="select-base" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
            <option value="">Todos los roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select-base" value={filtroActivo} onChange={e => setFiltroActivo(e.target.value as any)}>
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <table className="tabla-datos">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 0 }}>
                  <EmptyState icon="👤" title="No se encontraron funcionarios" description="Ajusta los filtros o registra un nuevo funcionario." />
                </td>
              </tr>
            ) : (
              filtered.map(u => {
                const rolStyle = ROL_STYLE[u.rol] ?? { bg: '#f3f4f6', color: '#374151' }
                return (
                  <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.55 }}>
                    <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                    <td style={{ color: '#6b7280', fontSize: '0.875rem' }}>{u.correo}</td>
                    <td>
                      <span className="badge" style={{ background: rolStyle.bg, color: rolStyle.color }}>
                        {u.rol}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: u.activo ? '#dcfce7' : '#fee2e2',
                        color: u.activo ? '#166534' : '#991b1b',
                      }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          className="btn-secundario"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          onClick={() => onViewUser(u)}
                        >
                          Ver
                        </button>
                        <button
                          className="btn-secundario"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          onClick={() => onEditUser(u)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-secundario"
                          style={{
                            padding: '4px 10px', fontSize: '0.8rem',
                            color: u.activo ? '#dc2626' : '#166534',
                            borderColor: u.activo ? '#fca5a5' : '#86efac',
                          }}
                          onClick={() => handleToggleActivo(u)}
                          disabled={toggling === u.id}
                        >
                          {toggling === u.id ? '...' : u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
