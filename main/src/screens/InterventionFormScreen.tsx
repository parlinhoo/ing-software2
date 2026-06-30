import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Toast } from '../components/Toast.tsx'
import { addIntervention, editIntervention, type InterventionAPI } from '../services/incidentService.ts'

type Props = {
  incidentId: string
  incidentDescription: string
  editingIntervention?: InterventionAPI
  onSave: () => void
  onCancel: () => void
}

// Fecha de hoy en formato YYYY-MM-DD usando la zona horaria LOCAL
// (toISOString() usa UTC y en zonas negativas devuelve el día siguiente por la noche)
function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const interventionSchema = z.object({
  tipo: z.string()
    .min(1, 'Debe seleccionar un tipo de acción')
    .refine(val => ['citacion', 'derivacion', 'tutoria', 'otra'].includes(val), {
      message: 'Tipo de acción no válido',
    }),
  descripcion: z.string()
    .min(1, 'La descripción es obligatoria')
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede superar los 500 caracteres'),
  fecha: z.string()
    .min(1, 'Debe ingresar una fecha')
    // Comparación lexicográfica de strings YYYY-MM-DD (robusta a zona horaria)
    .refine(date => date <= todayLocal(), 'La fecha no puede ser futura'),
})

type InterventionFormData = z.infer<typeof interventionSchema>

const TIPO_OPTIONS = [
  { value: 'citacion', label: '📞 Citación' },
  { value: 'derivacion', label: '➡️ Derivación' },
  { value: 'tutoria', label: '📚 Tutoría' },
  { value: 'otra', label: '📌 Otra' },
]

export function InterventionFormScreen({ incidentId, incidentDescription, editingIntervention, onSave, onCancel }: Props) {
  const isEditing = !!editingIntervention
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [charCount, setCharCount] = useState(editingIntervention?.descripcion.length ?? 0)

  const { register, handleSubmit, formState: { errors } } = useForm<InterventionFormData>({
    resolver: zodResolver(interventionSchema),
    mode: 'onSubmit',
    defaultValues: editingIntervention ? {
      tipo: editingIntervention.tipo,
      descripcion: editingIntervention.descripcion,
      fecha: editingIntervention.fecha.split('T')[0],
    } : undefined,
  })

  const onSubmit = async (data: InterventionFormData) => {
    setIsSubmitting(true)
    try {
      if (isEditing) {
        await editIntervention(editingIntervention.id, data.tipo, data.descripcion, data.fecha)
      } else {
        await addIntervention(
          parseInt(incidentId.replace(/^I-0*/, '')),
          data.tipo,
          data.descripcion,
          data.fecha
        )
      }
      setShowSuccess(true)
      setTimeout(() => {
        onSave()
      }, 1500)
    } catch (error) {
      alert('Error al guardar la acción. Intente nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="contenedor-principal">
      <header className="mb-8 pb-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
        <h1 className="titulo-principal">
          {isEditing ? 'Editar Acción de Seguimiento' : 'Registrar Acción de Seguimiento'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>Incidente #{incidentId}</span> - {incidentDescription}
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        <div className="campo">
          <label htmlFor="tipo" className="label-base">Tipo de Acción <span className="requerido">*</span></label>
          <select
            id="tipo"
            {...register('tipo')}
            className={`select-base w-100 ${errors.tipo ? 'input-error' : ''}`}
            disabled={isSubmitting}
          >
            <option value="">Seleccione el tipo de acción...</option>
            {TIPO_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.tipo && <span className="mensaje-error" style={{ color: '#ef4444' }}>❌ {errors.tipo.message}</span>}
        </div>

        <div className="campo">
          <label htmlFor="descripcion" className="label-base">Descripción <span className="requerido">*</span></label>
          <textarea
            id="descripcion"
            {...register('descripcion')}
            placeholder="Ej: Se citó al apoderado para explicar los hechos..."
            className={`textarea-base w-100 ${errors.descripcion ? 'input-error' : ''}`}
            style={{ minHeight: '150px', resize: 'vertical' }}
            disabled={isSubmitting}
            onChange={(e) => {
              register('descripcion').onChange(e)
              setCharCount(e.target.value.length)
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            {errors.descripcion && <span className="mensaje-error" style={{ color: '#ef4444' }}>❌ {errors.descripcion.message}</span>}
            <span style={{ fontSize: '0.75rem', color: charCount < 10 ? '#ef4444' : '#9ca3af', marginLeft: 'auto' }}>
              {charCount} / mín 10
            </span>
          </div>
        </div>

        <div className="campo">
          <label htmlFor="fecha" className="label-base">Fecha de la Acción <span className="requerido">*</span></label>
          <input
            type="date"
            id="fecha"
            {...register('fecha')}
            max={todayLocal()}
            className={`input-base w-100 ${errors.fecha ? 'input-error' : ''}`}
            disabled={isSubmitting}
          />
          {errors.fecha && <span className="mensaje-error" style={{ color: '#ef4444' }}>❌ {errors.fecha.message}</span>}
        </div>

        <div className="acciones-formulario">
          <button
            type="button"
            className="btn-secundario"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primario"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar Acción')}
          </button>
        </div>
      </form>

      <Toast
        message={isEditing ? 'Acción de seguimiento actualizada exitosamente' : 'Acción de seguimiento registrada exitosamente'}
        visible={showSuccess}
        onHide={() => setShowSuccess(false)}
      />
    </div>
  )
}