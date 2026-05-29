import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon.tsx'
import { useIncidentForm } from '../hooks/useIncidentForm.ts'
import minorIcon from '../assets/img/minor.png'
import seriousIcon from '../assets/img/serious.png'
import verySerious from '../assets/img/very_serious.png'
import deleteIcon from '../assets/img/delete.png'
import searchIcon from '../assets/img/search.png'
import { registerIncident, type StudentData } from '../services/incidentService.ts'
import type { IncidentFormData } from '../hooks/useIncidentForm.ts'
import type { Severity, IncidentRole, IncidentActor } from '../types/index.ts'
import { SEVERITY_MAP, ROLE_MAP, PLACE_OPTIONS, INCIDENT_TYPE_OPTIONS } from '../constants/formMappings.ts'

type Props = {
  onSave: () => void
  onCancel: () => void
}

export type AddedStudent = {
  name: string,
  rut: string,
  class: string,
  role: string,
}

export function IncidentFormScreen({ onSave, onCancel }: Props) {
  const [query, setQuery] = useState('')
  const [resolvedQuery, setResolvedQuery] = useState('')
  const [added, setAdded] = useState<AddedStudent[]>([])
  const [studentError, setStudentError] = useState<string | null>(null)
  const [options, setOptions] = useState<StudentData[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isQueryValid = query.length >= 3 && !Number.isFinite(parseInt(query.charAt(0)))
  const isSearching = isQueryValid && query !== resolvedQuery
  const showDropdown = isQueryValid

  const { register, handleSubmit, errors, validateStudents } = useIncidentForm(added)

  useEffect(() => {
    if (!isQueryValid) return

    const delayDebounceFn = setTimeout(async () => {
      try {
        // TODO: descomentar cuando Vicente suba T06 (GET /api/alumnos/buscar)
        // const data = await searchStudents(query);
        const data: StudentData[] = []
        setOptions(data)
        setSearchError(null)
      } catch {
        setOptions([])
        setSearchError('No se pudo conectar con el servidor. Intente nuevamente.')
      } finally {
        setResolvedQuery(query)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [query, isQueryValid])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const addStudent = (student: StudentData) => {
    if (added.find(a => a.rut === student.rut)) return
    setAdded(prev => [...prev, { ...student, role: '' }])
    setStudentError(null)
    setQuery('')
  }

  const changeRole = (rut: string, role: string) => {
    setAdded(prev => prev.map(a => a.rut === rut ? { ...a, role: role } : a))
  }

  const removeStudent = (rut: string) => {
    setAdded(prev => prev.filter(a => a.rut !== rut))
  }

  const onSubmit = async (data: IncidentFormData) => {
    const studentValidationError = validateStudents()
    if (studentValidationError) { setStudentError(studentValidationError); return }

    const actors: IncidentActor[] = added.map(a => ({ name: a.name, role: ROLE_MAP[a.role] as IncidentRole }))

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      // TODO: reemplazar 'usuario-actual' con el usuario autenticado cuando se conecte el login
      await registerIncident(
        'usuario-actual',
        data.tipoIncidente,
        SEVERITY_MAP[data.gravedad] as Severity,
        actors,
        `${data.fecha}T${data.hora}`,
        data.lugar,
        data.descripcion,
      )
      onSave()
    } catch {
      setSubmitError('No se pudo guardar el incidente. Intente nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="contenedor-principal">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1 className="titulo-principal">Nuevo Registro de Incidente</h1>

        <div className="grid-dos-columnas">
          <section className="seccion-card">
            <h3 className="titulo-seccion">Paso 1: Detalle del Incidente</h3>

            <div className="fila-inputs">
              <div className="campo">
                <label className="label-base">Fecha <span className="requerido">*</span></label>
                <input type="date" className={`input-base ${errors.fecha ? 'input-error' : ''}`} {...register('fecha')} />
                {errors.fecha && <span className="mensaje-error">{errors.fecha.message}</span>}
              </div>
              <div className="campo">
                <label className="label-base">Hora <span className="requerido">*</span></label>
                <input type="time" className={`input-base ${errors.hora ? 'input-error' : ''}`} {...register('hora')} />
                {errors.hora && <span className="mensaje-error">{errors.hora.message}</span>}
              </div>
            </div>

            <div className="campo">
              <label className="label-base">Lugar <span className="requerido">*</span></label>
              <select className={`select-base ${errors.lugar ? 'input-error' : ''}`} defaultValue="" {...register('lugar')}>
                <option value="" disabled>-- Seleccione un lugar --</option>
                {PLACE_OPTIONS.map(place => <option key={place} value={place}>{place}</option>)}
              </select>
              {errors.lugar && <span className="mensaje-error">{errors.lugar.message}</span>}
            </div>

            <div className="campo">
              <label className="label-base">Tipo de Incidente <span className="requerido">*</span></label>
              <select className={`select-base ${errors.tipoIncidente ? 'input-error' : ''}`} defaultValue="" {...register('tipoIncidente')}>
                <option value="" disabled>-- Seleccione un tipo --</option>
                {INCIDENT_TYPE_OPTIONS.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              {errors.tipoIncidente && <span className="mensaje-error">{errors.tipoIncidente.message}</span>}
            </div>

            <div className="campo">
              <label className="label-base">Descripción <span className="requerido">*</span></label>
              <textarea
                className={`textarea-base ${errors.descripcion ? 'input-error' : ''}`}
                rows={5}
                placeholder="Describa el incidente detalladamente..."
                {...register('descripcion')}
              />
              {errors.descripcion && <span className="mensaje-error">{errors.descripcion.message}</span>}
            </div>
          </section>

          <section className="seccion-card">
            <h3 className="titulo-seccion">Paso 2: Alumnos Involucrados</h3>

            <fieldset className="campo-gravedad">
              <legend className="label-base">Clasificación de Gravedad <span className="requerido">*</span></legend>
              <div className="radio-grupo">
                <label className="radio-label">
                  <input type="radio" value="Leve" {...register('gravedad')} />
                  <Icon src={minorIcon} alt="leve" size="severity" />
                  Leve
                </label>
                <label className="radio-label">
                  <input type="radio" value="Grave" {...register('gravedad')} />
                  <Icon src={seriousIcon} alt="grave" size="severity" />
                  Grave
                </label>
                <label className="radio-label">
                  <input type="radio" value="Muy Grave" {...register('gravedad')} />
                  <Icon src={verySerious} alt="muy grave" size="severity" />
                  Muy Grave
                </label>
              </div>
              {errors.gravedad && <span className="mensaje-error">{errors.gravedad.message}</span>}
            </fieldset>

            <div className="seccion-buscador">
              <h4 className="label-base">Buscador de Alumnos <span className="requerido">*</span></h4>

              <div className="typeahead-wrapper">
                <div className="typeahead-input-wrapper">
                  <Icon src={searchIcon} alt="buscar" size="action" />
                  <input
                    type="text"
                    className="input-base typeahead-input"
                    placeholder="Buscar alumno por RUT o nombre..."
                    value={query}
                    onChange={handleSearch}
                    autoComplete="off"
                  />
                  {isSearching && <span className="spinner" />}
                </div>

                {showDropdown && (
                  <ul className="dropdown-resultados">
                    {isSearching ? (
                      <li className="item-resultado item-estado">Buscando...</li>
                    ) : searchError ? (
                      <li className="item-resultado item-sin-resultados">{searchError}</li>
                    ) : options.length === 0 ? (
                      <li className="item-resultado item-sin-resultados">
                        No se encontraron alumnos para "{query}"
                      </li>
                    ) : (
                      options.map(a => (
                        <li key={a.rut} className="item-resultado item-alumno">
                          <div className="item-alumno-info">
                            <strong>{a.name}</strong>
                            <span>{a.class} — {a.rut}</span>
                          </div>
                          <button type="button" className="btn-agregar-alumno" onClick={() => addStudent(a)}>
                            + Agregar
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {studentError && <span className="mensaje-error">{studentError}</span>}

              {added.length > 0 && (
                <div className="lista-alumnos-agregados">
                  <h5 className="label-base mt-3">Alumnos Involucrados</h5>
                  {added.map(a => (
                    <div key={a.rut} className="fila-alumno-agregado">
                      <div className="info-alumno">
                        <Icon src={minorIcon} alt="alumno" size="role" />
                        <div className="alumno-datos">
                          <span className="texto-alumno">{a.name}</span>
                          <span className="texto-alumno-sub">{a.rut} | {a.class}</span>
                        </div>
                      </div>
                      <div className="controles-alumno">
                        <div className="rol-selector">
                          <label className="label-base">Rol <span className="requerido">*</span></label>
                          <select
                            className={`select-base select-sm ${a.role === '' ? 'select-pendiente' : ''}`}
                            value={a.role}
                            onChange={e => changeRole(a.rut, e.target.value)}
                          >
                            <option value="" disabled>-- Seleccione rol --</option>
                            <option value="Agresor">Agresor</option>
                            <option value="Víctima">Víctima</option>
                            <option value="Testigo">Testigo</option>
                          </select>
                        </div>
                        <button type="button" className="btn-quitar" onClick={() => removeStudent(a.rut)}>
                          <Icon src={deleteIcon} alt="quitar" size="action" /> Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {submitError && <span className="mensaje-error">{submitError}</span>}
        <div className="acciones-formulario">
          <button type="submit" className="btn-primario" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Incidente'}
          </button>
          <button type="button" className="btn-secundario" onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
