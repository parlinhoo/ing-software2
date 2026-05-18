import { Icon } from '../components/Icon.tsx'
import searchIcon from '../assets/img/search.png'
import filterIcon from '../assets/img/filter.png'
import minorIcon from '../assets/img/minor.png'
import seriousIcon from '../assets/img/serious.png'
import verySerious from '../assets/img/very_serious.png'

type Props = {
  onNew: () => void
  onDetail: () => void
}

export function IncidentListScreen({ onNew, onDetail }: Props) {
  return (
    <div className="contenedor-principal">
      <header className="cabecera-vista">
        <div className="titulos-cabecera">
          <span className="contexto-texto">Pantalla Principal / Listado de Incidentes</span>
          <h1 className="titulo-principal">Panel de Gestión de Incidentes</h1>
        </div>
        <button className="btn-primario" onClick={onNew}>+ Nuevo Registro de Incidente</button>
      </header>

      <section className="tarjetas-resumen">
        <div className="tarjeta">Incidentes Hoy: <strong>3</strong></div>
        <div className="tarjeta">Abiertos: <strong>5</strong></div>
        <div className="tarjeta">Grave/Muy Grave: <strong>2</strong></div>
      </section>

      <section className="seccion-tabla">
        <h2 className="subtitulo">Resumen y Listado de Incidentes</h2>

        <div className="filtros-tabla">
          <div className="input-con-icono">
            <Icon src={searchIcon} alt="buscar" size="action" />
            <input type="text" className="input-base" placeholder="Buscar por ID, Alumno, RUT..." />
          </div>
          <div className="input-con-icono">
            <Icon src={filterIcon} alt="filtrar" size="action" />
            <select className="select-base"><option>Fecha</option></select>
          </div>
          <select className="select-base"><option>Gravedad</option></select>
          <select className="select-base"><option>Estado</option></select>
        </div>

        <table className="tabla-datos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Lugar</th>
              <th>Alumno Clave (Roles)</th>
              <th>Gravedad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr onClick={onDetail} style={{ cursor: 'pointer' }}>
              <td>I-003</td>
              <td>10/10/2026</td>
              <td>Patio 1</td>
              <td>Juan Soto (A), María Pardo (V)</td>
              <td><span className="badge badge-leve"><Icon src={minorIcon} alt="leve" size="severity" /> Leve</span></td>
              <td>Abierto</td>
            </tr>
            <tr onClick={onDetail} style={{ cursor: 'pointer' }}>
              <td>I-002</td>
              <td>09/10/2026</td>
              <td>Aula 3</td>
              <td>Pedro Gómez (A)</td>
              <td><span className="badge badge-grave"><Icon src={seriousIcon} alt="grave" size="severity" /> Grave</span></td>
              <td>Cerrado</td>
            </tr>
            <tr onClick={onDetail} style={{ cursor: 'pointer' }}>
              <td>I-001</td>
              <td>08/10/2026</td>
              <td>Comedor</td>
              <td>Luis Vera (A)</td>
              <td><span className="badge badge-muy-grave"><Icon src={verySerious} alt="muy grave" size="severity" /> Muy Grave</span></td>
              <td>En Seguimiento</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
