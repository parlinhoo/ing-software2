import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InterventionFormScreen } from './InterventionFormScreen'
import * as incidentService from '../services/incidentService'

vi.mock('../services/incidentService', () => ({
  addIntervention: vi.fn(),
  editIntervention: vi.fn(),
}))

// Fecha de hoy en local (YYYY-MM-DD), coherente con la validación del componente
function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('InterventionFormScreen - T-16: Registrar Seguimiento', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(incidentService.addIntervention as any).mockResolvedValue({ id: 1 })
    ;(incidentService.editIntervention as any).mockResolvedValue({ id: 1 })
  })

  it('debe renderizar el formulario con los tres campos', () => {
    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test incident"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Registrar Acción de Seguimiento')).toBeInTheDocument()
    expect(screen.getByLabelText(/Tipo de Acción/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Fecha de la Acción/i)).toBeInTheDocument()
  })

  it('debe mostrar el contexto del incidente', () => {
    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Agresión física entre estudiantes"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText(/Incidente #I-001/)).toBeInTheDocument()
    expect(screen.getByText(/Agresión física entre estudiantes/)).toBeInTheDocument()
  })

  it('debe mostrar errores al guardar sin datos válidos', async () => {
    const user = userEvent.setup()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const btnGuardar = screen.getByRole('button', { name: /Guardar Acción/i })
    await user.click(btnGuardar)

    await waitFor(() => {
      expect(screen.getByText(/Debe seleccionar un tipo de acción/i)).toBeInTheDocument()
    })
    expect(incidentService.addIntervention).not.toHaveBeenCalled()
  })

  it('debe validar descripción con mínimo 10 caracteres', async () => {
    const user = userEvent.setup()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const selectTipo = screen.getByLabelText(/Tipo de Acción/i)
    const textareaDesc = screen.getByLabelText(/Descripción/i)
    const inputFecha = screen.getByLabelText(/Fecha de la Acción/i)

    // Llenar con datos insuficientes
    await user.selectOptions(selectTipo, 'citacion')
    await user.type(textareaDesc, 'Corto')
    fireEvent.change(inputFecha, { target: { value: todayLocal() } })

    const btnGuardar = screen.getByRole('button', { name: /Guardar Acción/i })
    await user.click(btnGuardar)

    await waitFor(() => {
      expect(screen.getByText(/al menos 10 caracteres/i)).toBeInTheDocument()
    })
    expect(incidentService.addIntervention).not.toHaveBeenCalled()
  })

  it('debe habilitar botón guardar con datos válidos', async () => {
    const user = userEvent.setup()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const selectTipo = screen.getByLabelText(/Tipo de Acción/i)
    const textareaDesc = screen.getByLabelText(/Descripción/i)
    const inputFecha = screen.getByLabelText(/Fecha de la Acción/i)

    // Llenar con datos válidos
    await user.selectOptions(selectTipo, 'citacion')
    await user.type(textareaDesc, 'Se citó al apoderado para hablar del incidente')
    fireEvent.change(inputFecha, { target: { value: todayLocal() } })

    const btnGuardar = screen.getByRole('button', { name: /Guardar Acción/i }) as HTMLButtonElement
    expect(btnGuardar.disabled).toBe(false)
  })

  it('debe rechazar fechas futuras', async () => {
    const user = userEvent.setup()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const selectTipo = screen.getByLabelText(/Tipo de Acción/i)
    const textareaDesc = screen.getByLabelText(/Descripción/i)
    const inputFecha = screen.getByLabelText(/Fecha de la Acción/i)

    // Intentar una fecha futura
    const mañana = new Date()
    mañana.setDate(mañana.getDate() + 1)

    await user.selectOptions(selectTipo, 'citacion')
    await user.type(textareaDesc, 'Se citó al apoderado para hablar del incidente')

    // Establecer fecha máxima a hoy
    const hoy = todayLocal()
    expect((inputFecha as HTMLInputElement).getAttribute('max')).toBe(hoy)
  })

  it('debe llamar a addIntervention con datos correctos', async () => {
    const user = userEvent.setup()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const selectTipo = screen.getByLabelText(/Tipo de Acción/i)
    const textareaDesc = screen.getByLabelText(/Descripción/i)
    const inputFecha = screen.getByLabelText(/Fecha de la Acción/i)

    const hoy = todayLocal()

    await user.selectOptions(selectTipo, 'derivacion')
    await user.type(textareaDesc, 'Se derivó a psicología para evaluación')
    fireEvent.change(inputFecha, { target: { value: hoy } })

    const btnGuardar = screen.getByRole('button', { name: /Guardar Acción/i })
    await user.click(btnGuardar)

    await waitFor(() => {
      expect(incidentService.addIntervention).toHaveBeenCalledWith(
        1,
        'derivacion',
        'Se derivó a psicología para evaluación',
        hoy
      )
    })
  })

  it('debe mostrar Toast de éxito después de guardar', async () => {
    const user = userEvent.setup()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const selectTipo = screen.getByLabelText(/Tipo de Acción/i)
    const textareaDesc = screen.getByLabelText(/Descripción/i)
    const inputFecha = screen.getByLabelText(/Fecha de la Acción/i)
    const hoy = todayLocal()

    await user.selectOptions(selectTipo, 'tutoria')
    await user.type(textareaDesc, 'Se realizó sesión de tutoría con el alumno')
    fireEvent.change(inputFecha, { target: { value: hoy } })

    const btnGuardar = screen.getByRole('button', { name: /Guardar Acción/i })
    await user.click(btnGuardar)

    await waitFor(() => {
      expect(screen.getByText(/Acción de seguimiento registrada exitosamente/)).toBeInTheDocument()
    })
  })

  it('debe llamar a onSave después de guardar exitosamente', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        onSave={onSave}
        onCancel={vi.fn()}
      />
    )

    const selectTipo = screen.getByLabelText(/Tipo de Acción/i)
    const textareaDesc = screen.getByLabelText(/Descripción/i)
    const inputFecha = screen.getByLabelText(/Fecha de la Acción/i)
    const hoy = todayLocal()

    await user.selectOptions(selectTipo, 'citacion')
    await user.type(textareaDesc, 'Se citó al apoderado para reunión')
    fireEvent.change(inputFecha, { target: { value: hoy } })

    const btnGuardar = screen.getByRole('button', { name: /Guardar Acción/i })
    await user.click(btnGuardar)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('debe cerrar modal al hacer clic en Cancelar', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        onSave={vi.fn()}
        onCancel={onCancel}
      />
    )

    const btnCancelar = screen.getByRole('button', { name: /Cancelar/i })
    await user.click(btnCancelar)

    expect(onCancel).toHaveBeenCalled()
  })

  it('debe mostrar contador de caracteres en descripción', async () => {
    const user = userEvent.setup()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const textareaDesc = screen.getByLabelText(/Descripción/i)
    const texto = 'Se citó al apoderado'

    await user.type(textareaDesc, texto)

    expect(screen.getByText(`${texto.length} / mín 10`)).toBeInTheDocument()
  })
})

describe('InterventionFormScreen - Editar Seguimiento (bonus US-11)', () => {
  const intervencionExistente = {
    id: 5,
    incidenteId: 1,
    tipo: 'citacion' as const,
    descripcion: 'Reunión inicial con apoderados de ambos estudiantes',
    fecha: '2026-06-16',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(incidentService.addIntervention as any).mockResolvedValue({ id: 1 })
    ;(incidentService.editIntervention as any).mockResolvedValue({ id: 5 })
  })

  it('debe mostrar título "Editar Acción de Seguimiento" en modo edición', () => {
    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        editingIntervention={intervencionExistente}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Editar Acción de Seguimiento')).toBeInTheDocument()
  })

  it('debe precargar los datos de la intervención a editar', () => {
    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        editingIntervention={intervencionExistente}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const selectTipo = screen.getByLabelText(/Tipo de Acción/i) as HTMLSelectElement
    const textareaDesc = screen.getByLabelText(/Descripción/i) as HTMLTextAreaElement
    const inputFecha = screen.getByLabelText(/Fecha de la Acción/i) as HTMLInputElement

    expect(selectTipo.value).toBe('citacion')
    expect(textareaDesc.value).toBe('Reunión inicial con apoderados de ambos estudiantes')
    expect(inputFecha.value).toBe('2026-06-16')
  })

  it('debe mostrar botón "Guardar Cambios" en modo edición', () => {
    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        editingIntervention={intervencionExistente}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Guardar Cambios/i })).toBeInTheDocument()
  })

  it('debe llamar a editIntervention al guardar cambios', async () => {
    const user = userEvent.setup()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        editingIntervention={intervencionExistente}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const textareaDesc = screen.getByLabelText(/Descripción/i)
    await user.clear(textareaDesc)
    await user.type(textareaDesc, 'Descripción actualizada de la reunión')

    const btnGuardar = screen.getByRole('button', { name: /Guardar Cambios/i })
    await user.click(btnGuardar)

    await waitFor(() => {
      expect(incidentService.editIntervention).toHaveBeenCalledWith(
        5,
        'citacion',
        'Descripción actualizada de la reunión',
        '2026-06-16'
      )
    })
    expect(incidentService.addIntervention).not.toHaveBeenCalled()
  })

  it('debe mostrar Toast de actualización en modo edición', async () => {
    const user = userEvent.setup()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        editingIntervention={intervencionExistente}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const btnGuardar = screen.getByRole('button', { name: /Guardar Cambios/i })
    await user.click(btnGuardar)

    await waitFor(() => {
      expect(screen.getByText(/actualizada exitosamente/i)).toBeInTheDocument()
    })
  })

  it('debe llamar a onSave después de editar', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <InterventionFormScreen
        incidentId="I-001"
        incidentDescription="Test"
        editingIntervention={intervencionExistente}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    )

    const btnGuardar = screen.getByRole('button', { name: /Guardar Cambios/i })
    await user.click(btnGuardar)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    }, { timeout: 3000 })
  })
})
