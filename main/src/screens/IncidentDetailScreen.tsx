import { Icon } from '../components/Icon.tsx'
import checkIcon from '../assets/img/check.png'
import minorIcon from '../assets/img/minor.png'
import editIcon from '../assets/img/edit.png'

type Props = {
  onClose: () => void
  onEdit: () => void
}

export function IncidentDetailScreen({ onClose, onEdit }: Props) {
  return (
    <div className="contenedor-principal">
      <div className="alerta-exito">
        <Icon src={checkIcon} alt="éxito" size="severity" />
        Incidente guardado exitosamente
      </div>

      <header className="cabecera-vista mt-2">
        <h1 className="titulo-principal">Vista de Detalle de Incidente: I-004</h1>
      </header>

      <div className="grid-dos-columnas">
        <section className="seccion-card">
          <h2 className="titulo-seccion">Datos del Incidente</h2>
          <div className="grid-datos-detalle">
            <div className="dato-item"><span className="label-base">Fecha</span><p>10/10/2026</p></div>
            <div className="dato-item"><span className="label-base">Hora</span><p>10:30</p></div>
            <div className="dato-item"><span className="label-base">Lugar</span><p>Aula 3</p></div>
            <div className="dato-item">
              <span className="label-base">Gravedad</span>
              <p><span className="badge badge-leve"><Icon src={minorIcon} alt="leve" size="severity" /> Leve</span></p>
            </div>
          </div>
          <div className="dato-descripcion mt-3">
            <span className="label-base">Descripción</span>
            <div className="caja-texto-lectura">
              <p>Se reportó un conflicto en el Aula 3. Juan Soto insultó a María Pardo durante el recreo. María Pardo se sintió afectada por el comentario. El profesor Pedro fue testigo del incidente y calmó la situación...</p>
            </div>
          </div>
        </section>

        <section className="seccion-card">
          <h2 className="titulo-seccion">Alumnos Involucrados</h2>
          <table className="tabla-datos tabla-sm">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>RUT</th>
                <th>Curso</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Juan Soto</td>
                <td>20.123.456-7</td>
                <td>4° M-A</td>
                <td><span className="badge-rol">Agresor</span></td>
              </tr>
              <tr>
                <td>María Pardo</td>
                <td>21.654.321-K</td>
                <td>2° M-B</td>
                <td><span className="badge-rol">Víctima</span></td>
              </tr>
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
