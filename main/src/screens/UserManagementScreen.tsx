import { useEffect, useState } from 'react'
import {
  getUsers, getRoles, createUser, editUser, toggleUserActive,
  type UserData, type RoleData,
} from '../services/userService.ts'

export function UserManagementScreen() {
  const [users, setUsers]   = useState<UserData[]>([])
  const [roles, setRoles]   = useState<RoleData[]>([])
  const [loading, setLoading] = useState(true)

  // Modo edición: id del usuario que se está editando en el modal (null = crear).
  const [editingId, setEditingId] = useState<string | null>(null)

  const [nombre, setNombre]         = useState('')
  const [correo, setCorreo]         = useState('')
  const [contrasena, setContrasena] = useState('')
  const [rol, setRol]               = useState('')

  const [submitting, setSubmitting]   = useState(false)
  const [formError, setFormError]     = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [togglingId, setTogglingId]   = useState<string | null>(null)

  // Estado del formulario de CREACIÓN (panel izquierdo).
  const [nuevoNombre, setNuevoNombre]         = useState('')
  const [nuevoCorreo, setNuevoCorreo]         = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [nuevoRol, setNuevoRol]               = useState('')
  const [creando, setCreando]                 = useState(false)
  const [crearError, setCrearError]           = useState<string | null>(null)
  const [crearSuccess, setCrearSuccess]       = useState<string | null>(null)

  const enEdicion = editingId !== null

  // `inicial` controla el spinner "Cargando...": solo en la primera carga.
  // Las recargas tras editar/desactivar refrescan los datos SIN colapsar la
  // tabla, para no perder la posición de scroll (evita el salto hacia arriba).
  async function cargarDatos(inicial = false) {
    if (inicial) setLoading(true)
    try {
      const [u, r] = await Promise.all([getUsers(), getRoles()])
      setUsers(u)
      setRoles(r)
      setNuevoRol(prev => prev || (r[0]?.nombre ?? ''))
    } catch {
      setCrearError('No se pudieron cargar los datos.')
    } finally {
      if (inicial) setLoading(false)
    }
  }

  useEffect(() => { cargarDatos(true) }, [])

  // ---------- Edición (modal) ----------
  function abrirEdicion(u: UserData) {
    setEditingId(u.id)
    setNombre(u.nombre)
    setCorreo(u.correo)
    setContrasena('')          // vacío = no cambiar contraseña
    setRol(u.rol)
    setFormError(null)
    setFormSuccess(null)
  }

  function cerrarEdicion() {
    setEditingId(null)
    setFormError(null)
    setFormSuccess(null)
  }

  async function handleGuardarEdicion(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!nombre.trim() || !correo.trim() || !rol) {
      setFormError('Nombre, correo y rol son obligatorios.')
      return
    }

    setSubmitting(true)
    try {
      await editUser(editingId!, nombre.trim(), correo.trim(), rol, contrasena || undefined)
      await cargarDatos()
      cerrarEdicion()
    } catch (err: any) {
      setFormError(err?.response?.data?.error ?? 'No se pudo guardar el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- Creación (panel izquierdo) ----------
  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    setCrearError(null)
    setCrearSuccess(null)

    if (!nuevoNombre.trim() || !nuevoCorreo.trim() || !nuevaContrasena.trim() || !nuevoRol) {
      setCrearError('Todos los campos son obligatorios.')
      return
    }

    setCreando(true)
    try {
      await createUser(nuevoNombre.trim(), nuevoCorreo.trim(), nuevaContrasena, nuevoRol)
      setCrearSuccess('Usuario creado correctamente.')
      setNuevoNombre(''); setNuevoCorreo(''); setNuevaContrasena('')
      setNuevoRol(roles[0]?.nombre ?? '')
      await cargarDatos()
    } catch (err: any) {
      setCrearError(err?.response?.data?.error ?? 'No se pudo crear el usuario.')
    } finally {
      setCreando(false)
    }
  }

  // ---------- Activar / desactivar ----------
  async function handleToggleActivo(u: UserData) {
    setTogglingId(u.id)
    setFormSuccess(null)
    try {
      await toggleUserActive(u.id, !u.activo)
      await cargarDatos()
    } catch (err: any) {
      setCrearError(err?.response?.data?.error ?? 'No se pudo cambiar el estado del usuario.')
    } finally {
      setTogglingId(null)
    }
  }

  const campoStyle = { marginBottom: '14px' }

  const usuarioEditando = users.find(u => u.id === editingId)

  return (
    <div className="contenedor-principal">
      <header className="cabecera-vista">
        <div className="titulos-cabecera">
          <span className="contexto-texto">Administración / Gestión de Usuarios</span>
          <h1 className="titulo-principal">Gestión de Usuarios</h1>
        </div>
      </header>

      <div className="grid-dos-columnas">
        <section className="seccion-card">
          <h2 className="titulo-seccion">Crear nuevo usuario</h2>
          <form onSubmit={handleCrear}>
            <div style={campoStyle}>
              <label className="label-base">Nombre <span className="requerido">*</span></label>
              <input className="input-base" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre completo" />
            </div>
            <div style={campoStyle}>
              <label className="label-base">Correo <span className="requerido">*</span></label>
              <input className="input-base" type="email" value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} placeholder="correo@colegio.cl" />
            </div>
            <div style={campoStyle}>
              <label className="label-base">Contraseña <span className="requerido">*</span></label>
              <input className="input-base" type="password" value={nuevaContrasena} onChange={e => setNuevaContrasena(e.target.value)} placeholder="Contraseña" />
            </div>
            <div style={campoStyle}>
              <label className="label-base">Rol <span className="requerido">*</span></label>
              <select className="select-base" value={nuevoRol} onChange={e => setNuevoRol(e.target.value)}>
                {roles.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
              </select>
            </div>

            {crearError && <span className="mensaje-error">{crearError}</span>}
            {crearSuccess && <div className="alerta-exito" style={{ marginTop: 8 }}>{crearSuccess}</div>}

            <div className="acciones-formulario" style={{ marginTop: 16 }}>
              <button type="submit" className="btn-primario" disabled={creando}>
                {creando ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </section>

        <section className="seccion-card">
          <h2 className="titulo-seccion">Usuarios registrados ({users.length})</h2>
          {loading ? (
            <p style={{ color: '#6b7280' }}>Cargando usuarios...</p>
          ) : (
            <table className="tabla-datos tabla-sm">
              <thead>
                <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.55 }}>
                    <td>{u.nombre}</td>
                    <td>{u.correo}</td>
                    <td><span className="badge-rol">{u.rol}</span></td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: u.activo ? '#dcfce7' : '#fee2e2',
                          color: u.activo ? '#166534' : '#991b1b',
                          fontWeight: 700,
                        }}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => abrirEdicion(u)}
                          style={{
                            fontSize: '0.75rem', color: '#2563eb', background: 'transparent',
                            border: '1px solid #2563eb', padding: '3px 10px', cursor: 'pointer',
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(u)}
                          disabled={togglingId === u.id}
                          style={{
                            fontSize: '0.75rem',
                            color: u.activo ? '#ef4444' : '#16a34a',
                            background: 'transparent',
                            border: `1px solid ${u.activo ? '#ef4444' : '#16a34a'}`,
                            padding: '3px 10px', cursor: 'pointer',
                          }}
                        >
                          {togglingId === u.id ? '...' : (u.activo ? 'Desactivar' : 'Activar')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Modal de edición: se abre centrado, sin importar la fila pulsada. */}
      {enEdicion && (
        <div className="modal-overlay" onClick={() => !submitting && cerrarEdicion()}>
          <div className="modal-content" style={{ textAlign: 'left', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <h2 className="titulo-seccion" style={{ marginTop: 0 }}>
              Editar usuario{usuarioEditando ? `: ${usuarioEditando.nombre}` : ''}
            </h2>
            <form onSubmit={handleGuardarEdicion}>
              <div style={campoStyle}>
                <label className="label-base">Nombre <span className="requerido">*</span></label>
                <input className="input-base" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" />
              </div>
              <div style={campoStyle}>
                <label className="label-base">Correo <span className="requerido">*</span></label>
                <input className="input-base" type="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="correo@colegio.cl" />
              </div>
              <div style={campoStyle}>
                <label className="label-base">
                  Contraseña <span style={{ color: '#6b7280', fontWeight: 400 }}>(dejar en blanco para no cambiarla)</span>
                </label>
                <input className="input-base" type="password" value={contrasena} onChange={e => setContrasena(e.target.value)} placeholder="••••••••" />
              </div>
              <div style={campoStyle}>
                <label className="label-base">Rol <span className="requerido">*</span></label>
                <select className="select-base" value={rol} onChange={e => setRol(e.target.value)}>
                  {roles.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                </select>
              </div>

              {formError && <span className="mensaje-error">{formError}</span>}
              {formSuccess && <div className="alerta-exito" style={{ marginTop: 8 }}>{formSuccess}</div>}

              <div className="acciones-formulario" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secundario" onClick={cerrarEdicion} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primario" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}