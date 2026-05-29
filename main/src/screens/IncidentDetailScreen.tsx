import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon.tsx'
import checkIcon from '../assets/img/check.png'
import minorIcon from '../assets/img/minor.png'
import seriousIcon from '../assets/img/serious.png'
import verySerious from '../assets/img/very_serious.png'
import editIcon from '../assets/img/edit.png'
import { getIncidentDetail, type IncidentAPI } from '../services/incidentService.ts'
import { INCIDENT_TYPE_OPTIONS, ROLE_DISPLAY } from '../constants/formMappings.ts'

type Props = {
  incidentId: string
  showSuccess?: boolean
  onClose: () => void
  onEdit: () => void
}

const SEVERITY_DISPLAY: Record<string, { label: string; badge: string; icon: string }> = {
  mild:        { label: 'Leve',      badge: 'badge-leve',      icon: minorIcon   },
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

export function IncidentDetailScreen({ incidentId, showSuccess = false, onClose, onEdit }: Props) {
  const [incident, setIncident] = useState<IncidentAPI | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    const numericId = incidentId.replace(/^I-0*/, '') || '0'
    setLoading(true)
    setError(false)
    getIncidentDetail(numericId)
      .then(data => setIncident(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [incidentId])

  if (loading) return (
    <div className="contenedor-principal">
      <p style={{ padding: '2rem', color: '#6b7280' }}>Cargando incidente...</p>
    </div>
  )

  if (error || !incident) return (
    <div className="contenedor-principal">
      <p style={{ padding: '2rem', color: '#ef4444' }}>No se pudo cargar el incidente.</p>
      <button className="btn-secundario" onClick={onClose}>Volver</button>
    </div>
  )

  const severity = SEVERITY_DISPLAY[incident.severity] ?? SEVERITY_DISPLAY['mild']

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

      <div className="acciones-formulario">
        <button type="button" className="btn-secundario" onClick={onClose}>Cerrar Vista</button>
        <button type="button" className="btn-primario outline" onClick={onEdit}>
          <Icon src={editIcon} alt="editar" size="action" /> Editar Incidente
        </button>
      </div>
    </div>
  )
}
