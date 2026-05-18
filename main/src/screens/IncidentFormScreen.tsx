import { useState } from 'react'
import { Icon } from '../components/Icon.tsx'
import minorIcon from '../assets/img/minor.png'
import seriousIcon from '../assets/img/serious.png'
import verySerious from '../assets/img/very_serious.png'
import deleteIcon from '../assets/img/delete.png'
import searchIcon from '../assets/img/search.png'

type Props = {
  onSave: () => void
  onCancel: () => void
}

const mockAlumnos = [
  { nombre: 'Juan Soto', curso: '4° Medio A', rut: '20.123.456-7' },
  { nombre: 'María Pardo', curso: '2° Medio B', rut: '21.654.321-K' },
  { nombre: 'Pedro Gómez', curso: '3° Medio A', rut: '19.876.543-2' },
]

type AlumnoAgregado = {
  nombre: string
  rut: string
  curso: string
  rol: string
}

export function IncidentFormScreen({ onSave, onCancel }: Props) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [agregados, setAgregados] = useState<AlumnoAgregado[]>([])
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const resultados = mockAlumnos.filter(a =>
    a.nombre.toLowerCase().includes(query.toLowerCase()) ||
    a.rut.includes(query)
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (val.length === 0) { setShowDropdown(false); setIsSearching(false); return }
    setShowDropdown(true)
    setIsSearching(true)
    if (searchTimer) clearTimeout(searchTimer)
    setSearchTimer(setTimeout(() => setIsSearching(false), 600))
  }

  const agregarAlumno = (alumno: typeof mockAlumnos[0]) => {
    if (agregados.find(a => a.rut === alumno.rut)) return
    setAgregados(prev => [...prev, { ...alumno, rol: '' }])
    setQuery('')
    setShowDropdown(false)
  }

  const cambiarRol = (rut: string, rol: string) => {
    setAgregados(prev => prev.map(a => a.rut === rut ? { ...a, rol } : a))
  }

  const quitarAlumno = (rut: string) => {
    setAgregados(prev => prev.filter(a => a.rut !== rut))
  }

  return (
    <div className="contenedor-principal">
      <form className="formulario-incidente">
        <h1 className="titulo-principal">Nuevo Registro de Incidente</h1>

        <div className="grid-dos-columnas">
          <section className="seccion-card">
            <h3 className="titulo-seccion">Paso 1: Detalle del Incidente</h3>

            <div className="fila-inputs">
              <div className="campo">
                <label className="label-base">Fecha <span className="requerido">*</span></label>
                <input type="date" className="input-base" required />
              </div>
              <div className="campo">
                <label className="label-base">Hora <span className="requerido">*</span></label>
                <input type="time" className="input-base" required />
              </div>
            </div>

            <div className="campo">
              <label className="label-base">Lugar <span className="requerido">*</span></label>
              <select className="select-base" required defaultValue="">
                <option value="" disabled>-- Seleccione un lugar --</option>
                <option value="Aula 3">Aula 3</option>
                <option value="Patio 1">Patio 1</option>
                <option value="Comedor">Comedor</option>
                <option value="Biblioteca">Biblioteca</option>
              </select>
            </div>

            <div className="campo">
              <label className="label-base">Descripción <span className="requerido">*</span></label>
              <textarea className="textarea-base" rows={5} placeholder="Describa el incidente detalladamente..." required />
            </div>
          </section>

          <section className="seccion-card">
            <h3 className="titulo-seccion">Paso 2: Alumnos Involucrados</h3>

            <fieldset className="campo-gravedad">
              <legend className="label-base">Clasificación de Gravedad <span className="requerido">*</span></legend>
              <div className="radio-grupo">
                <label className="radio-label">
                  <input type="radio" name="gravedad" value="Leve" required />
                  <Icon src={minorIcon} alt="leve" size="severity" />
                  Leve
                </label>
                <label className="radio-label">
                  <input type="radio" name="gravedad" value="Grave" />
                  <Icon src={seriousIcon} alt="grave" size="severity" />
                  Grave
                </label>
                <label className="radio-label">
                  <input type="radio" name="gravedad" value="Muy Grave" />
                  <Icon src={verySerious} alt="muy grave" size="severity" />
                  Muy Grave
                </label>
              </div>
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
                    ) : resultados.length === 0 ? (
                      <li className="item-resultado item-sin-resultados">
                        No se encontraron alumnos para "{query}"
                      </li>
                    ) : (
                      resultados.map(a => (
                        <li key={a.rut} className="item-resultado item-alumno">
                          <div className="item-alumno-info">
                            <strong>{a.nombre}</strong>
                            <span>{a.curso} — {a.rut}</span>
                          </div>
                          <button type="button" className="btn-agregar-alumno" onClick={() => agregarAlumno(a)}>
                            + Agregar
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {agregados.length > 0 && (
                <div className="lista-alumnos-agregados">
                  <h5 className="label-base mt-3">Alumnos Involucrados <span className="requerido">*</span></h5>
                  {agregados.map(a => (
                    <div key={a.rut} className="fila-alumno-agregado">
                      <div className="info-alumno">
                        <Icon src={minorIcon} alt="alumno" size="role" />
                        <div className="alumno-datos">
                          <span className="texto-alumno">{a.nombre}</span>
                          <span className="texto-alumno-sub">{a.rut} | {a.curso}</span>
                        </div>
                      </div>
                      <div className="controles-alumno">
                        <div className="rol-selector">
                          <label className="label-base">Rol <span className="requerido">*</span></label>
                          <select
                            className={`select-base select-sm ${a.rol === '' ? 'select-pendiente' : ''}`}
                            value={a.rol}
                            onChange={e => cambiarRol(a.rut, e.target.value)}
                            required
                          >
                            <option value="" disabled>-- Seleccione rol --</option>
                            <option value="Agresor">Agresor</option>
                            <option value="Víctima">Víctima</option>
                            <option value="Testigo">Testigo</option>
                          </select>
                        </div>
                        <button type="button" className="btn-quitar" onClick={() => quitarAlumno(a.rut)}>
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

        <div className="acciones-formulario">
          <button type="submit" className="btn-primario" onClick={(e) => { e.preventDefault(); onSave(); }}>
            Guardar Incidente
          </button>
          <button type="button" className="btn-secundario" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
