import { useState } from 'react'
import { useIncidentForm } from '../hooks/useIncidentForm.ts'
import { useStudentSearch } from '../hooks/useStudentSearch.ts'
import { registerIncident, type StudentData } from '../services/incidentService.ts'
import type { IncidentFormData } from '../hooks/useIncidentForm.ts'
import type { Severity, IncidentRole, IncidentActor } from '../types/index.ts'
import { SEVERITY_MAP, ROLE_MAP } from '../constants/formMappings.ts'
import { IncidentDetailFields } from '../components/IncidentDetailFields.tsx'
import { StudentSearchSection } from '../components/StudentSearchSection.tsx'
import { SuccessModal } from '../components/SuccessModal.tsx'

type Props = {
  onSave: () => void
  onCancel: () => void
}

export type AddedStudent = {
  name: string
  rut: string
  class: string
  role: string
}

export function IncidentFormScreen({ onSave, onCancel }: Props) {
  const [query, setQuery]               = useState('')
  const [added, setAdded]               = useState<AddedStudent[]>([])
  const [studentError, setStudentError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [showSuccess, setShowSuccess]   = useState(false)

  const { options, searchError, isSearching, showDropdown } = useStudentSearch(query)
  const { register, handleSubmit, errors, validateStudents } = useIncidentForm(added)

  const addStudent = (student: StudentData) => {
    if (added.find(a => a.rut === student.rut)) return
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
    rut: a.rut,                                          // nuevo
    role: ROLE_MAP[a.role] as IncidentRole 
  }))

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await registerIncident(
        'usuario-actual',
        data.tipoIncidente,
        SEVERITY_MAP[data.gravedad] as Severity,
        actors,
        `${data.fecha}T${data.hora}`,
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

  return (
    <div className="contenedor-principal">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1 className="titulo-principal">Nuevo Registro de Incidente</h1>

        <div className="grid-dos-columnas">
          <IncidentDetailFields register={register} errors={errors} />

          <section className="seccion-card">
            <h3 className="titulo-seccion">Paso 2: Alumnos Involucrados</h3>
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
          <button type="submit" className="btn-primario" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Incidente'}
          </button>
          <button type="button" className="btn-secundario" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </button>
        </div>
      </form>

      <SuccessModal isOpen={showSuccess} title="Incidente Creado" onClose={onSave} />
    </div>
  )
}
