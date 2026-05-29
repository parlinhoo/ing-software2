import { Icon } from './Icon.tsx'
import searchIcon from '../assets/img/search.png'
import type { StudentData } from '../services/incidentService.ts'
import { AddedStudentsList } from './AddedStudentsList.tsx'
import type { AddedStudent } from '../screens/IncidentFormScreen.tsx'

type Props = {
  query: string
  onQueryChange: (value: string) => void
  isSearching: boolean
  showDropdown: boolean
  searchError: string | null
  options: StudentData[]
  added: AddedStudent[]
  studentError: string | null
  onAddStudent: (student: StudentData) => void
  onChangeRole: (rut: string, role: string) => void
  onRemoveStudent: (rut: string) => void
}

export function StudentSearchSection({
  query,
  onQueryChange,
  isSearching,
  showDropdown,
  searchError,
  options,
  added,
  studentError,
  onAddStudent,
  onChangeRole,
  onRemoveStudent,
}: Props) {
  return (
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
            onChange={e => onQueryChange(e.target.value)}
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
                  <button type="button" className="btn-agregar-alumno" onClick={() => onAddStudent(a)}>
                    + Agregar
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {studentError && <span className="mensaje-error">{studentError}</span>}

      <AddedStudentsList
        students={added}
        onChangeRole={onChangeRole}
        onRemove={onRemoveStudent}
      />
    </div>
  )
}
