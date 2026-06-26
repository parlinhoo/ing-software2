import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Toast } from '../components/Toast.tsx'
import { createUser, updateUser, getRoles } from '../services/userService.ts'
import { USER_ROLE_DISPLAY } from '../constants/formMappings.ts'
import type { UserListItem } from '../services/userService.ts'

type Props = {
  onSave: (wasEditing: boolean) => void
  onCancel: () => void
  editingUser?: UserListItem
}

function buildSchema(isEdit: boolean) {
  return z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    correo: z.string().refine(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Ingrese un correo válido'),
    contrasena: isEdit
      ? z.string().refine(v => v === '' || v.length >= 6, 'La contraseña debe tener al menos 6 caracteres')
      : z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    rol: z.string().min(1, 'Debe seleccionar un rol'),
  })
}

type UserFormData = { nombre: string; correo: string; contrasena: string; rol: string }

export function UserFormScreen({ onSave, onCancel, editingUser }: Props) {
  const isEdit = !!editingUser
  const [roles, setRoles] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserFormData>({
    resolver: zodResolver(buildSchema(isEdit)),
    mode: 'onSubmit',
    defaultValues: editingUser
      ? { nombre: editingUser.nombre, correo: editingUser.correo, rol: editingUser.rol, contrasena: '' }
      : { nombre: '', correo: '', rol: '', contrasena: '' },
  })

  useEffect(() => {
    getRoles().then(setRoles).catch(() => setRoles([]))
  }, [])

  const onSubmit = async (data: UserFormData) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          nombre: data.nombre,
          correo: data.correo,
          rol: data.rol,
          contrasena: data.contrasena || undefined,
        })
      } else {
        await createUser({
          nombre: data.nombre,
          correo: data.correo,
          contrasena: data.contrasena,
          rol: data.rol,
        })
      }
      setShowSuccess(true)
      setTimeout(() => { reset(); onSave(!!editingUser) }, 2000)
    } catch (e: any) {
      const apiMessage = e?.response?.data?.error
      setSubmitError(apiMessage ?? `No se pudo ${isEdit ? 'editar' : 'crear'} el usuario. Intente nuevamente.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="contenedor-principal">
      <header className="mb-8 pb-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
        <span className="contexto-texto">
          Panel de Administración / Gestión de Usuarios / {isEdit ? 'Editar Funcionario' : 'Nuevo Funcionario'}
        </span>
        <h1 className="titulo-principal">{isEdit ? 'Editar Funcionario' : 'Registrar Nuevo Funcionario'}</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
          {isEdit
            ? 'Modifique los datos del funcionario. La contraseña solo se cambiará si completa ese campo.'
            : 'Complete los datos para crear una cuenta de acceso al sistema.'}
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {submitError && (
          <div style={{
            backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b',
            padding: '12px 16px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500,
          }}>
            {submitError}
          </div>
        )}

        <div className="campo">
          <label htmlFor="nombre" className="label-base">Nombre <span className="requerido">*</span></label>
          <input
            id="nombre" type="text" {...register('nombre')}
            placeholder="Ej: María González"
            className={`input-base w-100 ${errors.nombre ? 'input-error' : ''}`}
            disabled={isSubmitting}
          />
          {errors.nombre && <span className="mensaje-error" style={{ color: '#ef4444' }}>❌ {errors.nombre.message}</span>}
        </div>

        <div className="campo">
          <label htmlFor="correo" className="label-base">Correo <span className="requerido">*</span></label>
          <input
            id="correo" type="text" {...register('correo')}
            placeholder="Ej: maria.gonzalez@liceosanlorenzo.cl"
            className={`input-base w-100 ${errors.correo ? 'input-error' : ''}`}
            disabled={isSubmitting}
          />
          {errors.correo && <span className="mensaje-error" style={{ color: '#ef4444' }}>❌ {errors.correo.message}</span>}
        </div>

        <div className="campo">
          <label htmlFor="contrasena" className="label-base">
            Contraseña {!isEdit && <span className="requerido">*</span>}
            {isEdit && <span style={{ color: '#6b7280', fontWeight: 400 }}> (dejar vacío para no cambiar)</span>}
          </label>
          <input
            id="contrasena" type="password" {...register('contrasena')}
            placeholder={isEdit ? 'Nueva contraseña (opcional)' : 'Mínimo 6 caracteres'}
            className={`input-base w-100 ${errors.contrasena ? 'input-error' : ''}`}
            disabled={isSubmitting}
          />
          {errors.contrasena && <span className="mensaje-error" style={{ color: '#ef4444' }}>❌ {errors.contrasena.message}</span>}
        </div>

        <div className="campo">
          <label htmlFor="rol" className="label-base">Rol <span className="requerido">*</span></label>
          <select
            id="rol" {...register('rol')}
            className={`select-base w-100 ${errors.rol ? 'input-error' : ''}`}
            disabled={isSubmitting}
          >
            <option value="">Seleccione un rol...</option>
            {roles.map(r => (
              <option key={r} value={r}>{USER_ROLE_DISPLAY[r] ?? r}</option>
            ))}
          </select>
          {errors.rol && <span className="mensaje-error" style={{ color: '#ef4444' }}>❌ {errors.rol.message}</span>}
        </div>

        <div className="acciones-formulario">
          <button type="button" className="btn-secundario" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-primario" disabled={isSubmitting}>
            {isSubmitting ? (isEdit ? 'Guardando...' : 'Creando...') : (isEdit ? 'Guardar Cambios' : 'Crear')}
          </button>
        </div>
      </form>

      <Toast
        message={isEdit ? 'Funcionario actualizado exitosamente' : 'Usuario creado exitosamente'}
        visible={showSuccess}
        onHide={() => setShowSuccess(false)}
      />
    </div>
  )
}
