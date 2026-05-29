import { Icon } from './Icon.tsx'
import minorIcon from '../assets/img/minor.png'
import seriousIcon from '../assets/img/serious.png'
import verySerious from '../assets/img/very_serious.png'
import { PLACE_OPTIONS, INCIDENT_TYPE_OPTIONS } from '../constants/formMappings.ts'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { IncidentFormData } from '../hooks/useIncidentForm.ts'

type Props = {
  register: UseFormRegister<IncidentFormData>
  errors: FieldErrors<IncidentFormData>
}

export function IncidentDetailFields({ register, errors }: Props) {
  return (
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
    </section>
  )
}
