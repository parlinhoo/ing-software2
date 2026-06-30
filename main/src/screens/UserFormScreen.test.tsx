import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserFormScreen } from './UserFormScreen'
import * as userService from '../services/userService'

vi.mock('../services/userService', () => ({
  createUser: vi.fn(),
  getRoles: vi.fn(),
}))

const mockRoles = ['teacher', 'inspector', 'orientator', 'directive', 'admin']

describe('UserFormScreen - T-19: Registrar Usuario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(userService.getRoles as any).mockResolvedValue(mockRoles)
    ;(userService.createUser as any).mockResolvedValue({ id: 2, nombre: 'X', correo: 'x@x.cl', rol: 'teacher' })
  })

  it('debe renderizar el formulario con los cuatro campos', async () => {
    render(<UserFormScreen onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Rol/i)).toBeInTheDocument()
  })

  // Test 3: Dados los roles disponibles, al abrir la sección Rol aparecen todos los roles del sistema
  it('debe cargar todos los roles del sistema en el select', async () => {
    render(<UserFormScreen onSave={vi.fn()} onCancel={vi.fn()} />)

    await waitFor(() => {
      expect(userService.getRoles).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Profesor' })).toBeInTheDocument()
    })
    expect(screen.getByRole('option', { name: 'Inspector' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Orientador' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Directivo' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Administrador' })).toBeInTheDocument()
  })

  // Test 1: Datos correctos → Crear → POST + mensaje de confirmación
  it('debe llamar a createUser y mostrar confirmación con datos válidos', async () => {
    const user = userEvent.setup()
    render(<UserFormScreen onSave={vi.fn()} onCancel={vi.fn()} />)

    await waitFor(() => expect(screen.getByRole('option', { name: 'Orientador' })).toBeInTheDocument())

    await user.type(screen.getByLabelText(/Nombre/i), 'María González')
    await user.type(screen.getByLabelText(/Correo/i), 'maria@liceo.cl')
    await user.type(screen.getByLabelText(/Contraseña/i), 'secreta123')
    await user.selectOptions(screen.getByLabelText(/Rol/i), 'orientator')

    await user.click(screen.getByRole('button', { name: /Crear/i }))

    await waitFor(() => {
      expect(userService.createUser).toHaveBeenCalledWith({
        nombre: 'María González',
        correo: 'maria@liceo.cl',
        contrasena: 'secreta123',
        rol: 'orientator',
      })
    })
    await waitFor(() => {
      expect(screen.getByText('Usuario creado exitosamente')).toBeInTheDocument()
    })
  })

  // Test 1 (rama error): respuesta de error del sistema → muestra mensaje de error
  it('debe mostrar mensaje de error si la API rechaza (ej. correo duplicado)', async () => {
    const user = userEvent.setup()
    ;(userService.createUser as any).mockRejectedValue({
      response: { data: { error: 'El correo ya está registrado' } },
    })

    render(<UserFormScreen onSave={vi.fn()} onCancel={vi.fn()} />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Profesor' })).toBeInTheDocument())

    await user.type(screen.getByLabelText(/Nombre/i), 'Juan Pérez')
    await user.type(screen.getByLabelText(/Correo/i), 'repetido@liceo.cl')
    await user.type(screen.getByLabelText(/Contraseña/i), 'secreta123')
    await user.selectOptions(screen.getByLabelText(/Rol/i), 'teacher')

    await user.click(screen.getByRole('button', { name: /Crear/i }))

    await waitFor(() => {
      expect(screen.getByText('El correo ya está registrado')).toBeInTheDocument()
    })
  })

  // Test 2: Campo ausente → no envía, muestra el campo faltante
  it('NO debe enviar y debe marcar los campos faltantes si están vacíos', async () => {
    const user = userEvent.setup()
    render(<UserFormScreen onSave={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Crear/i }))

    await waitFor(() => {
      expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/El correo es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/La contraseña es obligatoria/i)).toBeInTheDocument()
    expect(screen.getByText(/Debe seleccionar un rol/i)).toBeInTheDocument()
    expect(userService.createUser).not.toHaveBeenCalled()
  })

  it('debe validar formato de correo inválido', async () => {
    const user = userEvent.setup()
    render(<UserFormScreen onSave={vi.fn()} onCancel={vi.fn()} />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Profesor' })).toBeInTheDocument())

    await user.type(screen.getByLabelText(/Nombre/i), 'Juan Pérez')
    await user.type(screen.getByLabelText(/Correo/i), 'correo-invalido')
    await user.type(screen.getByLabelText(/Contraseña/i), 'secreta123')
    await user.selectOptions(screen.getByLabelText(/Rol/i), 'teacher')

    await user.click(screen.getByRole('button', { name: /Crear/i }))

    await waitFor(() => {
      expect(screen.getByText(/Ingrese un correo válido/i)).toBeInTheDocument()
    })
    expect(userService.createUser).not.toHaveBeenCalled()
  })

  it('debe llamar a onCancel al hacer clic en Cancelar', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<UserFormScreen onSave={vi.fn()} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
