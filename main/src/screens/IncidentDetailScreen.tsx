import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon.tsx'
import { Toast } from '../components/Toast.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { Skeleton, SkeletonCard } from '../components/Skeleton.tsx'
import checkIcon from '../assets/img/check.png'
import minorIcon from '../assets/img/minor.png'
import seriousIcon from '../assets/img/serious.png'
import verySerious from '../assets/img/very_serious.png'
import editIcon from '../assets/img/edit.png'
import { getIncidentDetail, deleteIncident, getInterventions, deleteIntervention, setIncidentState, type IncidentAPI, type InterventionAPI, type IncidentState } from '../services/incidentService.ts'
import { INCIDENT_TYPE_OPTIONS, ROLE_DISPLAY } from '../constants/formMappings.ts'
import { usePermissions } from '../hooks/usePermissions.ts'

const STATE_FALLBACK = { label: 'Abierto', bg: '#dcfce7', color: '#166534' }

const STATE_DISPLAY: Record<string, { label: string; bg: string; color: string }> = {
  abierto:        STATE_FALLBACK,
  en_seguimiento: { label: 'En Seguimiento', bg: '#fef9c3', color: '#854d0e' },
  cerrado:        { label: 'Cerrado',        bg: '#e5e7eb', color: '#374151' },
}

// Transiciones permitidas (lineal con reapertura)
const STATE_TRANSITIONS: Record<string, IncidentState[]> = {
  abierto:        ['en_seguimiento'],
  en_seguimiento: ['cerrado'],
  cerrado:        ['en_seguimiento'],
}

const INTERVENTION_FALLBACK = { label: 'Otra', color: '#374151' }

const INTERVENTION_LABELS: Record<string, { label: string; color: string }> = {
  citacion:   { label: 'Citación',   color: '#1d4ed8' },
  derivacion: { label: 'Derivación', color: '#c2410c' },
  tutoria:    { label: 'Tutoría',    color: '#7e22ce' },
  otra:       INTERVENTION_FALLBACK,
}

// Resuelve el badge para cualquier `tipo`: las claves del formulario
// (citacion/derivacion/tutoria/otra) o las frases descriptivas del seed/texto libre.
// Para estas últimas muestra el texto real y asigna color por palabra clave.
function resolveTipo(tipo: string): { label: string; color: string } {
  const exact = INTERVENTION_LABELS[tipo]
  if (exact) return exact
  const t = tipo.toLowerCase()
  if (t.includes('deriv'))                                          return { label: tipo, color: '#c2410c' }
  if (t.includes('citaci') || t.includes('reuni') || t.includes('apoderado')) return { label: tipo, color: '#1d4ed8' }
  if (t.includes('diálogo') || t.includes('dialogo') || t.includes('mediaci') || t.includes('restaurativ') || t.includes('tutor')) return { label: tipo, color: '#7e22ce' }
  if (t.includes('protocolo'))                                      return { label: tipo, color: '#b91c1c' }
  if (t.includes('reparaci') || t.includes('acuerdo'))             return { label: tipo, color: '#15803d' }
  if (t.includes('conversaci') || t.includes('formativa'))         return { label: tipo, color: '#0f766e' }
  return { label: tipo, color: '#374151' }
}

function formatInterventionDate(dateStr: string) {
  const date = new Date(dateStr)
  const d = String(date.getUTCDate()).padStart(2, '0')
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const y = date.getUTCFullYear()
  return `${d}/${m}/${y}`
}

type Props = {
  incidentId: string
  showSuccess?: boolean
  onClose: () => void
  onEdit: () => void
  onIntervention?: (description: string) => void
  onEditIntervention?: (description: string, intervention: InterventionAPI) => void
}

const SEVERITY_FALLBACK = { label: 'Leve', badge: 'badge-leve', icon: minorIcon }

const SEVERITY_DISPLAY: Record<string, { label: string; badge: string; icon: string }> = {
  mild:        SEVERITY_FALLBACK,
  severe:      { label: 'Grave',     badge: 'badge-grave',     icon: seriousIcon },
  very_severe: { label: 'Muy Grave', badge: 'badge-muy-grave', icon: verySerious },
  verysevere:  { label: 'Muy Grave', badge: 'badge-muy-grave', icon: verySerious },
}

function formatFecha(dateStr: string) {
  const date = new Date(dateStr)
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function formatHora(dateStr: string) {
  const date = new Date(dateStr)
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

export function IncidentDetailScreen({ incidentId, showSuccess = false, onClose, onEdit, onIntervention, onEditIntervention }: Props) {
  const { can } = usePermissions()
  // Mapeo de permisos: el detalle de Nico usaba useAuth(); aquí usamos el modelo centralizado.
  const canViewInterventions   = can('ver_seguimientos')
  const canManageInterventions = can('agregar_seguimientos')
  const canChangeState         = can('cambiar_estado_incidente')
  const canAnnulIncident       = can('anular_incidente')
  const canEditIncident        = can('editar_incidente')

  const [incident, setIncident] = useState<IncidentAPI | null>(null)
  const [interventions, setInterventions] = useState<InterventionAPI[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelSuccess, setShowCancelSuccess] = useState(false)
  const [estado, setEstado] = useState<IncidentState>('abierto')
  const [stateError, setStateError] = useState<string | null>(null)
  const [stateMessage, setStateMessage] = useState('Estado del incidente actualizado')
  const [showStateSuccess, setShowStateSuccess] = useState(false)

  useEffect(() => {
    const numericId = incidentId.replace(/^I-0*/, '') || '0'
    setLoading(true)
    setError(false)
    getIncidentDetail(numericId)
      .then(data => {
        setIncident(data)
        setEstado(data.estado ?? 'abierto')
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    getInterventions(Number(numericId))
      .then(data => setInterventions(data))
      .catch(() => setInterventions([]))
  }, [incidentId])

  const handleChangeState = async (nuevoEstado: IncidentState) => {
    if (nuevoEstado === estado) return
    setStateError(null)
    const anterior = estado
    setEstado(nuevoEstado)
    try {
      const numericId = incidentId.replace(/^I-0*/, '') || '0'
      await setIncidentState(Number(numericId), nuevoEstado)
      setStateMessage(`Estado cambiado a "${(STATE_DISPLAY[nuevoEstado] ?? STATE_FALLBACK).label}"`)
      setShowStateSuccess(true)
    } catch {
      setEstado(anterior)
      setStateError(
        nuevoEstado === 'cerrado'
          ? 'No se puede cerrar sin acciones de seguimiento registradas'
          : 'No se pudo cambiar el estado. Intente nuevamente.'
      )
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) return

    setIsCancelling(true)
    try {
      const numericId = incidentId.replace(/^I-0*/, '') || '0'
      await deleteIncident(Number(numericId), cancelReason)
      setShowCancelSuccess(true)
      setTimeout(() => {
        setCancelReason('')
        setShowCancelModal(false)
        onClose()
      }, 2000)
    } catch {
      alert('Error al anular el incidente. Intente nuevamente.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDeleteIntervention = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta acción de seguimiento?')) return

    try {
      await deleteIntervention(id)
      setInterventions(prev => prev.filter(i => i.id !== id))
    } catch {
      alert('Error al eliminar la acción. Intente nuevamente.')
    }
  }

  if (loading) return (
    <div className="contenedor-principal">
      <div style={{ marginBottom: 24 }}><Skeleton width="55%" height="1.6rem" /></div>
      <div className="grid-dos-columnas">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )

  if (error || !incident) return (
    <div className="contenedor-principal">
      <EmptyState
        icon="⚠️"
        title="No se pudo cargar el incidente"
        description="Hubo un problema al obtener la información. Intenta volver al listado."
        action={<button className="btn-secundario" onClick={onClose}>Volver</button>}
      />
    </div>
  )

  const severity = SEVERITY_DISPLAY[incident.severity] ?? SEVERITY_FALLBACK

  return (
    <div className="contenedor-principal">
      {showSuccess && (
        <div className="alerta-exito">
          <Icon src={checkIcon} alt="éxito" size="severity" />
          Incidente guardado exitosamente
        </div>
      )}

      <header className="cabecera-vista mt-2">
        <h1 className="titulo-principal">Vista de Detalle de Incidente: {incidentId}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span className="label-base">Estado del Caso</span>
          {canChangeState ? (
            <>
              <select
                aria-label="Estado del Caso"
                value={estado}
                onChange={e => handleChangeState(e.target.value as IncidentState)}
                className="select-base"
                style={{
                  background: (STATE_DISPLAY[estado] ?? STATE_FALLBACK).bg,
                  color: (STATE_DISPLAY[estado] ?? STATE_FALLBACK).color,
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                {/* Estado actual + solo transiciones permitidas */}
                <option value={estado}>{(STATE_DISPLAY[estado] ?? STATE_FALLBACK).label}</option>
                {(STATE_TRANSITIONS[estado] ?? []).map(s => (
                  <option key={s} value={s}>{(STATE_DISPLAY[s] ?? STATE_FALLBACK).label}</option>
                ))}
              </select>
              {stateError && <span className="mensaje-error" style={{ color: '#ef4444', maxWidth: '240px', textAlign: 'right' }}>{stateError}</span>}
            </>
          ) : (
            <span
              className="badge"
              style={{
                background: (STATE_DISPLAY[estado] ?? STATE_FALLBACK).bg,
                color: (STATE_DISPLAY[estado] ?? STATE_FALLBACK).color,
              }}
            >
              {(STATE_DISPLAY[estado] ?? STATE_FALLBACK).label}
            </span>
          )}
        </div>
      </header>

      <div className="grid-dos-columnas">
        <section className="seccion-card">
          <h2 className="titulo-seccion">Datos del Incidente</h2>
          <div className="grid-datos-detalle">
            <div className="dato-item">
              <span className="label-base">Fecha</span>
              <p>{formatFecha(incident.date)}</p>
            </div>
            <div className="dato-item">
              <span className="label-base">Hora</span>
              <p>{formatHora(incident.date)}</p>
            </div>
            <div className="dato-item">
              <span className="label-base">Lugar</span>
              <p>{incident.place}</p>
            </div>
            <div className="dato-item">
              <span className="label-base">Tipo de Incidente</span>
              <p>{INCIDENT_TYPE_OPTIONS.find(t => t.value === incident.incidentType)?.label ?? incident.incidentType}</p>
            </div>
            <div className="dato-item">
              <span className="label-base">Gravedad</span>
              <p>
                <span className={`badge ${severity.badge}`}>
                  <Icon src={severity.icon} alt={severity.label} size="severity" /> {severity.label}
                </span>
              </p>
            </div>
          </div>
          <div className="dato-descripcion mt-3">
            <span className="label-base">Descripción</span>
            <div className="caja-texto-lectura">
              <p>{incident.description}</p>
            </div>
          </div>
        </section>

        <section className="seccion-card">
          <h2 className="titulo-seccion">Alumnos Involucrados</h2>
          <table className="tabla-datos tabla-sm">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {incident.actors.map((actor, i) => (
                <tr key={i}>
                  <td>{actor.name}</td>
                  <td><span className="badge-rol">{ROLE_DISPLAY[actor.role] ?? actor.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="nota-pie">*Para agregar/quitar alumnos, edite el incidente.</p>
        </section>
      </div>

      {canViewInterventions && <section className="seccion-card mt-3">
        <h2 className="titulo-seccion">Seguimiento</h2>
        {interventions.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No hay acciones de seguimiento registradas"
            description="Aún no se ha registrado seguimiento para este incidente."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {interventions.map(intv => {
              const tipo = resolveTipo(intv.tipo)
              return (
                <div key={intv.id} style={{
                  border: '1px solid var(--color-borde)',
                  borderRadius: 'var(--radio-borde)',
                  padding: '12px',
                  background: '#fafafa',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: tipo.color,
                      background: `${tipo.color}1a`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}>
                      {tipo.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 'auto' }}>
                      {formatInterventionDate(intv.fecha)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                    {intv.descripcion}
                  </p>
                  {canManageInterventions && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                      {onEditIntervention && (
                        <button
                          type="button"
                          onClick={() => onEditIntervention(incident.description, intv)}
                          style={{
                            fontSize: '0.75rem',
                            color: '#2563eb',
                            background: 'transparent',
                            border: '1px solid #2563eb',
                            padding: '3px 10px',
                          }}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteIntervention(intv.id)}
                        style={{
                          fontSize: '0.75rem',
                          color: '#ef4444',
                          background: 'transparent',
                          border: '1px solid #ef4444',
                          padding: '3px 10px',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>}

      <div className="acciones-formulario">
        <button type="button" className="btn-secundario" onClick={onClose}>Cerrar Vista</button>
        {canEditIncident && (
          <button type="button" className="btn-primario outline" onClick={onEdit}>
            <Icon src={editIcon} alt="editar" size="action" /> Editar Incidente
          </button>
        )}
        {onIntervention && canManageInterventions && (
          <button
            type="button"
            className="btn-primario"
            onClick={() => onIntervention(incident.description)}
            style={{ backgroundColor: '#10b981' }}
          >
            Registrar Acción de Seguimiento
          </button>
        )}
        {canAnnulIncident && (
          <button
            type="button"
            className="btn-primario"
            onClick={() => setShowCancelModal(true)}
            style={{ backgroundColor: '#ef4444' }}
          >
            Anular Incidente
          </button>
        )}
      </div>

      {showCancelModal && (
        <div className="modal-overlay" onClick={() => !isCancelling && setShowCancelModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="titulo-seccion">Anular Incidente</h2>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              Por favor, ingrese una justificación para anular este incidente.
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Ej: Ingresado por error, datos incompletos, etc."
              className="campo-textarea"
              disabled={isCancelling}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            />
            <div className="acciones-formulario" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primario"
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim() || isCancelling}
                style={{ backgroundColor: '#ef4444' }}
              >
                {isCancelling ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        message="Incidente anulado exitosamente"
        visible={showCancelSuccess}
        onHide={() => setShowCancelSuccess(false)}
      />

      <Toast
        message={stateMessage}
        visible={showStateSuccess}
        onHide={() => setShowStateSuccess(false)}
      />
    </div>
  )
}