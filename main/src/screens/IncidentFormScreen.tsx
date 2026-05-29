import { useState, useEffect } from 'react'
import { useIncidentForm } from '../hooks/useIncidentForm.ts'
import { useStudentSearch } from '../hooks/useStudentSearch.ts'
import { registerIncident, editIncident, getIncidentDetail, type StudentData } from '../services/incidentService.ts'
import type { IncidentFormData } from '../hooks/useIncidentForm.ts'
import type { Severity, IncidentRole, IncidentActor } from '../types/index.ts'
import { SEVERITY_MAP, ROLE_MAP } from '../constants/formMappings.ts'
import { IncidentDetailFields } from '../components/IncidentDetailFields.tsx'
import { StudentSearchSection } from '../components/StudentSearchSection.tsx'
import { SuccessModal } from '../components/SuccessModal.tsx'

type Props = {
  incidentId?: string
  onSave: () => void
  onCancel: () => void
}

export type AddedStudent = {
  name: string,
  rut: string,
  class: string,
  role: string,
}

export function IncidentFormScreen({ incidentId, onSave, onCancel }: Props) {
  const [query, setQuery] = useState('')
  const [added, setAdded] = useState<AddedStudent[]>([])
  const [studentError, setStudentError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(!!incidentId && incidentId.length > 0)

  const { options, searchError, isSearching, showDropdown } = useStudentSearch(query)
  const { register, handleSubmit, errors, validateStudents } = useIncidentForm(added)

  const isEditing = !!incidentId && incidentId.length > 0

  useEffect(() => {
    if (!incidentId || incidentId.length === 0) return

    const loadIncident = async () => {
      try {
        // TODO: descomentar cuando Mario implemente T01
        // const detail = await getIncidentDetail(incidentId)
        const detail = {
          id: incidentId,
          fecha: '10/10/2026',
          hora: '10:30',
          lugar: 'Aula 3',
          tipoIncidente: 'verbal' as const,
          descripcion: 'Se reportó un conflicto en el Aula 3. Juan Soto insultó a María Pardo durante el recreo.',
          gravedad: 'mild' as const,
          actores: [
            { name: 'Juan Soto', role: 'aggresor' as const },
            { name: 'María Pardo', role: 'victim' as const },
          ],
        }
        // TODO: cargar datos del incidente en el formulario
        setIsLoading(false)
      } catch {
        setIsLoading(false)
      }
    }

    loadIncident()
  }, [incidentId])

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
      if (isEditing) {
        // TODO: reemplazar 'usuario-actual' con el usuario autenticado cuando se conecte el login
        const id: string = (incidentId || '') as string
        const numericId = parseInt(id.split('-')[1] ?? '0')
        await editIncident(
          numericId,
          data.tipoIncidente,
          SEVERITY_MAP[data.gravedad] as Severity,
          actors,
          new Date(`${data.fecha}T${data.hora}`),
          data.lugar,
          data.descripcion,
        )
      } else {
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
      }
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
          <button type="button" className="btn-secundario" onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
        </div>
      </form>

      <SuccessModal
        isOpen={showSuccess}
        title="Incidente Creado"
        onClose={onSave}
      />
    </div>
  )
}
