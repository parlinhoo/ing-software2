import { Icon } from './Icon.tsx'
import minorIcon from '../assets/img/minor.png'
import deleteIcon from '../assets/img/delete.png'
import type { AddedStudent } from '../screens/IncidentFormScreen.tsx'

type Props = {
  students: AddedStudent[]
  onChangeRole: (rut: string, role: string) => void
  onRemove: (rut: string) => void
}

export function AddedStudentsList({ students, onChangeRole, onRemove }: Props) {
  if (students.length === 0) return null

  return (
    <div className="lista-alumnos-agregados">
      <h5 className="label-base mt-3">Alumnos Involucrados</h5>
      {students.map(a => (
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
                onChange={e => onChangeRole(a.rut, e.target.value)}
              >
                <option value="" disabled>-- Seleccione rol --</option>
                <option value="Agresor">Agresor</option>
                <option value="Víctima">Víctima</option>
                <option value="Testigo">Testigo</option>
                <option value="Participante">Participante</option>
              </select>
            </div>
            <button type="button" className="btn-quitar" onClick={() => onRemove(a.rut)}>
              <Icon src={deleteIcon} alt="quitar" size="action" /> Quitar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
