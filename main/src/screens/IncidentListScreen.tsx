import { Icon } from '../components/Icon.tsx'
import searchIcon from '../assets/img/search.png'
import filterIcon from '../assets/img/filter.png'
import minorIcon from '../assets/img/minor.png'
import seriousIcon from '../assets/img/serious.png'
import verySerious from '../assets/img/very_serious.png'
import { SearchStudentComponent } from '../components/SearchStudentComponent.tsx'
import { useIncidentFilters, type IncidentRow } from '../hooks/useIncidentFilters.ts'
import { fetchIncidents, type IncidentAPI } from '../services/incidentService.ts'
import { useEffect, useState } from 'react'
import { usePermissions } from '../hooks/usePermissions.ts'
import { useAuth } from '../context/authContext.tsx'

type Props = {
  onNew: () => void
  onDetail: (incidentId: string) => void
}

const ROLE_LABEL: Record<string, string> = {
  aggressor: 'A', victim: 'V', witness: 'T', participant: 'P',
}

const SEVERITY_LABEL: Record<string, string> = {
  mild: 'leve', severe: 'grave', very_severe: 'muy-grave', verysevere: 'muy-grave',
}

function mapApiToRow(inc: IncidentAPI): IncidentRow {
  const date = new Date(inc.date)
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  const fecha = `${d}/${m}/${y}`
  const alumnos = inc.actors
    .map(a => `${a.name} (${ROLE_LABEL[a.role] ?? a.role})`)
    .join(', ')
  return {
    id: `I-${String(inc.incidentId).padStart(3, '0')}`,
    fecha,
    lugar: inc.place,
    alumnos,
    gravedad: SEVERITY_LABEL[inc.severity] ?? 'leve',
    estado: 'Abierto',
  }
}

const GRAVEDAD_BADGE: Record<string, { src: string; label: string }> = {
  'leve':      { src: minorIcon,   label: 'Leve'      },
  'grave':     { src: seriousIcon, label: 'Grave'     },
  'muy-grave': { src: verySerious, label: 'Muy Grave' },
}

export function IncidentListScreen({ onNew, onDetail }: Props) {
  const { can } = usePermissions()
  const [incidents, setIncidents] = useState<IncidentRow[]>([])  
  const { user } = useAuth()
  const puedeCrear = user?.role.name === 'Docente' || user?.role.name === 'Inspector'

  useEffect(() => {
    fetchIncidents()
      .then(data => setIncidents(data.map(mapApiToRow)))
      .catch(() => setIncidents([]))
  }, [])

  const _now = new Date()
  const hoy = `${String(_now.getDate()).padStart(2, '0')}/${String(_now.getMonth() + 1).padStart(2, '0')}/${_now.getFullYear()}`
  const totalHoy       = incidents.filter(i => i.fecha === hoy).length
  const totalAbiertos  = incidents.filter(i => i.estado === 'Abierto').length
  const totalGraves    = incidents.filter(i => i.gravedad === 'grave' || i.gravedad === 'muy-grave').length

  const {
    query, options, showDropdown,
    filtroGravedad, filtroEstado, filtroFecha,
    handleQueryChange, handleSelectStudent, handleSetOptions,
    setFiltroGravedad, setFiltroEstado, setFiltroFecha,
    incidentesFiltrados,
  } = useIncidentFilters(incidents)

  return (
    <div className="contenedor-principal">
      <header className="cabecera-vista">
        <div className="titulos-cabecera">
          <span className="contexto-texto">Pantalla Principal / Listado de Incidentes</span>
          <h1 className="titulo-principal">Panel de Gestión de Incidentes</h1>
        </div>
        {puedeCrear && (
          <button className="btn-primario" onClick={onNew}>+ Nuevo Registro de Incidente</button>
        )}
      </header>

      <section className="tarjetas-resumen">
        <div className="tarjeta">Incidentes Hoy: <strong>{totalHoy}</strong></div>
        <div className="tarjeta">Abiertos: <strong>{totalAbiertos}</strong></div>
        <div className="tarjeta">Grave/Muy Grave: <strong>{totalGraves}</strong></div>
      </section>

      <section className="seccion-tabla">
        <h2 className="subtitulo">Resumen y Listado de Incidentes</h2>

        <div className="filtros-tabla">

          <div className="typeahead-wrapper" style={{ flex: 1 }}>
            <div className="input-con-icono typeahead-input-wrapper">
              <Icon src={searchIcon} alt="buscar" size="action" />
              <SearchStudentComponent
                query={query}
                onQueryChange={handleQueryChange}
                setOptions={handleSetOptions}
                className="typeahead-input"
                placeholder="Buscar por alumno o RUT..."
                onInputInvalid={() => handleSetOptions([])}
                onSearchStart={() => {}}
                onSearchComplete={() => {}}
                onSearchError={() => handleSetOptions([])}
              />
            </div>
            {showDropdown && options.length > 0 && (
              <ul className="dropdown-resultados">
                {options.map(s => (
                  <li key={s.rut} className="item-resultado item-alumno" onClick={() => handleSelectStudent(s)}>
                    <div className="item-alumno-info">
                      <strong>{s.name}</strong>
                      <span>{s.class} — {s.rut}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="input-con-icono">
            <Icon src={filterIcon} alt="filtrar" size="action" />
            <select className="select-base" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}>
              <option value="">Fecha</option>
              <option value="desc">Recientes</option>
              <option value="asc">Antiguos</option>
            </select>
          </div>

          <select className="select-base" value={filtroGravedad} onChange={e => setFiltroGravedad(e.target.value)}>
            <option value="">Gravedad</option>
            <option value="leve">Leve</option>
            <option value="grave">Grave</option>
            <option value="muy-grave">Muy Grave</option>
          </select>

          <select className="select-base" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Estado</option>
            <option value="Abierto">Abierto</option>
            <option value="Cerrado">Cerrado</option>
            <option value="En Seguimiento">En Seguimiento</option>
          </select>

        </div>

        <table className="tabla-datos">
          <thead>
            <tr>
              <th>ID</th><th>Fecha</th><th>Lugar</th>
              <th>Alumno Clave (Roles)</th><th>Gravedad</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {incidentesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  No se encontraron incidentes
                </td>
              </tr>
            ) : (
              incidentesFiltrados.map(inc => {
                const badge = GRAVEDAD_BADGE[inc.gravedad]
                return (
                  <tr key={inc.id} onClick={() => onDetail(inc.id)} style={{ cursor: 'pointer' }}>
                    <td>{inc.id}</td>
                    <td>{inc.fecha}</td>
                    <td>{inc.lugar}</td>
                    <td>{inc.alumnos}</td>
                    <td>
                      {badge && (
                        <span className={`badge badge-${inc.gravedad}`}>
                          <Icon src={badge.src} alt={inc.gravedad} size="severity" /> {badge.label}
                        </span>
                      )}
                    </td>
                    <td>{inc.estado}</td>
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
