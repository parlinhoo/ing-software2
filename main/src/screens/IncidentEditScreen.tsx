import { useState, useEffect } from 'react'
import { useIncidentForm } from '../hooks/useIncidentForm.ts'
import { useStudentSearch } from '../hooks/useStudentSearch.ts'
import { editIncident, getIncidentDetail, type StudentData } from '../services/incidentService.ts'
import type { IncidentFormData } from '../hooks/useIncidentForm.ts'
import type { Severity, IncidentRole, IncidentActor } from '../types/index.ts'
import { SEVERITY_MAP, ROLE_MAP, ROLE_DISPLAY, PLACE_OPTIONS } from '../constants/formMappings.ts'
import { IncidentDetailFields } from '../components/IncidentDetailFields.tsx'
import { StudentSearchSection } from '../components/StudentSearchSection.tsx'
import { SuccessModal } from '../components/SuccessModal.tsx'
import type { AddedStudent } from './IncidentFormScreen.tsx'

type Props = {
  incidentId: string
  onSave: () => void
  onCancel: () => void
}

const SEVERITY_REVERSE: Record<string, 'Leve' | 'Grave' | 'Muy Grave'> = {
  mild:        'Leve',
  severe:      'Grave',
  very_severe: 'Muy Grave',
  verysevere:  'Muy Grave',
}


export function IncidentEditScreen({ incidentId, onSave, onCancel }: Props) {
  const [query, setQuery]               = useState('')
  const [added, setAdded]               = useState<AddedStudent[]>([])
  const [studentError, setStudentError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [showSuccess, setShowSuccess]   = useState(false)
  const [loading, setLoading]           = useState(true)
  const [loadError, setLoadError]       = useState(false)

  const { options, searchError, isSearching, showDropdown } = useStudentSearch(query)

  // El formulario siempre se monta para que register() registre los campos
  // antes de que llamemos a reset()
  const { register, handleSubmit, errors, reset, validateStudents } = useIncidentForm(added)

  const numericId = parseInt(incidentId.replace(/^I-0*/, '') || '0')

  useEffect(() => {
    getIncidentDetail(String(numericId))
      .then(inc => {
        if (!inc) { setLoadError(true); setLoading(false); return }

        const date  = new Date(inc.date)
        const fecha = date.toISOString().slice(0, 10)
        const hora  = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

        setAdded(inc.actors.map(a => ({
          name:  a.name,
          rut:   a.rut ?? '',
          class: '',
          role:  ROLE_DISPLAY[a.role] ?? a.role,
        })))

        // El formulario ya está montado aquí — reset() funciona correctamente
        reset({
          fecha,
          hora,
          lugar:         PLACE_OPTIONS.includes(inc.place) ? inc.place : '',
          tipoIncidente: inc.incidentType as IncidentFormData['tipoIncidente'],
          descripcion:   inc.description,
          gravedad:      SEVERITY_REVERSE[inc.severity] ?? 'Leve',
        })
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [numericId])

  const addStudent = (student: StudentData) => {
    if (added.find(a => a.name === student.name)) return
    setAdded(prev => [...prev, { ...student, role: '' }])
    setStudentError(null)
    setQuery('')
  }

  const changeRole = (identifier: string, role: string) => {
    setAdded(prev => prev.map(a => (a.rut || a.name) === identifier ? { ...a, role } : a))
  }

  const removeStudent = (identifier: string) => {
    setAdded(prev => prev.filter(a => (a.rut || a.name) !== identifier))
  }

  const onSubmit = async (data: IncidentFormData) => {
    const studentValidationError = validateStudents()
    if (studentValidationError) { setStudentError(studentValidationError); return }

    const actors: IncidentActor[] = added.map(a => ({
      name: a.name,
      rut: a.rut || undefined,
      role: ROLE_MAP[a.role] as IncidentRole,
    }))

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await editIncident(
        numericId,
        data.tipoIncidente,
        SEVERITY_MAP[data.gravedad] as Severity,
        actors,
        new Date(`${data.fecha}T${data.hora}`),
        data.lugar,
        data.descripcion,
      )
      setShowSuccess(true)
      setTimeout(onSave, 2000)
    } catch {
      setSubmitError('No se pudo guardar el incidente. Intente nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadError) return (
    <div className="contenedor-principal">
      <p style={{ padding: '2rem', color: '#ef4444' }}>No se pudo cargar el incidente.</p>
      <button className="btn-secundario" onClick={onCancel}>Volver</button>
    </div>
  )

  return (
    <div className="contenedor-principal">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1 className="titulo-principal">
          Editar Incidente: {incidentId}
          {loading && <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280', marginLeft: '12px' }}>Cargando...</span>}
        </h1>

        <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0 }}>
          <div className="grid-dos-columnas">
            <IncidentDetailFields register={register} errors={errors} />

            <section className="seccion-card">
              <h3 className="titulo-seccion">Alumnos Involucrados</h3>
              <p className="nota-pie" style={{ marginBottom: '8px' }}>
                * RUT y curso disponibles cuando la API los incluya (T06).
              </p>
              <StudentSearchSection
                query={query}
                onQueryChange={setQuery}
                isSearching={isSearching}
                showDropdown={showDropdown}
                searchError={searchError}
                options={options}
                added={added}
                studentError={studentError}
                onAddStudent={addStudent}
                onChangeRole={changeRole}
                onRemoveStudent={removeStudent}
              />
            </section>
          </div>

          {submitError && <span className="mensaje-error">{submitError}</span>}

          <div className="acciones-formulario">
            <button type="submit" className="btn-primario" disabled={isSubmitting || loading}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" className="btn-secundario" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
          </div>
        </fieldset>
      </form>

      <SuccessModal isOpen={showSuccess} title="Incidente Actualizado" onClose={onSave} />
    </div>
  )
}
