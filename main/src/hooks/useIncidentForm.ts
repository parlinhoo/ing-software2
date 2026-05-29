import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AddedStudent } from '../screens/IncidentFormScreen.tsx'

// Esquema de validación para el formulario de incidente

const schema = z.object({
  fecha:          z.string().min(1, 'La fecha es obligatoria'),
  hora:           z.string().min(1, 'La hora es obligatoria'),
  lugar:          z.string().min(1, 'Debe seleccionar un lugar'),
  tipoIncidente:  z.enum(['verbal', 'physical', 'harassment', 'discrimination', 'other'], {
    error: 'Debe seleccionar el tipo de incidente',
  }),
  descripcion:    z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  gravedad:       z.enum(['Leve', 'Grave', 'Muy Grave'], {
    error: 'Debe seleccionar la gravedad',
  }),
})

export type IncidentFormData = z.infer<typeof schema>

export function useIncidentForm(alumnos: AddedStudent[]) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<IncidentFormData>({
    resolver: zodResolver(schema),
  })

  const validateStudents = () => {
    if (alumnos.length === 0) return 'Debe agregar al menos un alumno involucrado'
    if (alumnos.some(a => a.role === '')) return 'Todos los alumnos deben tener un rol asignado'
    return null
  }

  return { register, handleSubmit, errors, reset, validateStudents }
}
