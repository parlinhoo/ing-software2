import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IncidentDetailScreen } from './IncidentDetailScreen'
import * as incidentService from '../services/incidentService'

vi.mock('../services/incidentService', () => ({
  getIncidentDetail: vi.fn(),
  deleteIncident: vi.fn(),
  getInterventions: vi.fn(),
  deleteIntervention: vi.fn(),
  setIncidentState: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ role: 'directive', isDirective: true, isOrientator: false })),
}))

import { useAuth } from '../hooks/useAuth'

function setRole(role: { isDirective?: boolean; isOrientator?: boolean }) {
  ;(useAuth as any).mockReturnValue({ role: 'x', isDirective: false, isOrientator: false, ...role })
}

const mockIncident = {
  incidentId: 1,
  incidentType: 'physical',
  severity: 'severe',
  actors: [{ name: 'Pedro', role: 'aggressor' }],
  date: '2026-06-01T10:30:00',
  place: 'Patio 1',
  description: 'Test incident',
}

const mockInterventions = [
  { id: 1, incidenteId: 1, tipo: 'citacion', descripcion: 'Reunión con apoderados del estudiante', fecha: '2026-06-16' },
  { id: 2, incidenteId: 1, tipo: 'tutoria', descripcion: 'Sesión de tutoría individual con el alumno', fecha: '2026-06-17' },
]

describe('IncidentDetailScreen - T-13: Anular Incidente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole({ isDirective: true })
    ;(incidentService.getIncidentDetail as any).mockResolvedValue(mockIncident)
    ;(incidentService.deleteIncident as any).mockResolvedValue(undefined)
    ;(incidentService.getInterventions as any).mockResolvedValue([])
    ;(incidentService.deleteIntervention as any).mockResolvedValue(undefined)
  })

  it('debe mostrar el botón Anular Incidente si es directivo', async () => {
    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Anular Incidente')).toBeInTheDocument()
    })
  })

  it('debe abrir el modal al hacer clic en Anular Incidente', async () => {
    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Anular Incidente')).toBeInTheDocument()
    })

    const button = screen.getByText('Anular Incidente')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ej: Ingresado por error/)).toBeInTheDocument()
    })
  })

  it('debe deshabilitar botón de confirmación sin justificación', async () => {
    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Anular Incidente')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Anular Incidente'))

    const confirmButtons = screen.getAllByText(/Confirmar Anulación/)
    const confirmButton = confirmButtons[0] as HTMLButtonElement
    expect(confirmButton.disabled).toBe(true)
  })

  it('debe habilitar botón de confirmación con justificación', async () => {
    const user = userEvent.setup()

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Anular Incidente')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Anular Incidente'))

    const textarea = screen.getByPlaceholderText(/Ej: Ingresado por error/) as HTMLTextAreaElement
    await user.type(textarea, 'Ingresado por error')

    const confirmButtons = screen.getAllByText(/Confirmar Anulación/)
    const confirmButton = confirmButtons[0] as HTMLButtonElement
    expect(confirmButton.disabled).toBe(false)
  })

  it('debe llamar a deleteIncident con motivo', async () => {
    const user = userEvent.setup()

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Anular Incidente')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Anular Incidente'))

    const textarea = screen.getByPlaceholderText(/Ej: Ingresado por error/)
    await user.type(textarea, 'Test reason')

    const confirmButtons = screen.getAllByText(/Confirmar Anulación/)
    fireEvent.click(confirmButtons[0])

    await waitFor(() => {
      expect(incidentService.deleteIncident).toHaveBeenCalledWith(1, 'Test reason')
    })
  })

  it('debe mostrar Toast de éxito', async () => {
    const user = userEvent.setup()

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Anular Incidente')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Anular Incidente'))

    const textarea = screen.getByPlaceholderText(/Ej: Ingresado por error/)
    await user.type(textarea, 'Test reason')

    const confirmButtons = screen.getAllByText(/Confirmar Anulación/)
    fireEvent.click(confirmButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Incidente anulado exitosamente')).toBeInTheDocument()
    })
  })

  it('debe cerrar modal al hacer clic en Cancelar', async () => {
    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Anular Incidente')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Anular Incidente'))

    const cancelButtons = screen.getAllByText('Cancelar')
    fireEvent.click(cancelButtons[cancelButtons.length - 1])

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Ej: Ingresado por error/)).not.toBeInTheDocument()
    })
  })

  it('debe llamar a onClose después de anular', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={onClose}
        onEdit={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Anular Incidente')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Anular Incidente'))

    const textarea = screen.getByPlaceholderText(/Ej: Ingresado por error/)
    await user.type(textarea, 'Test reason')

    const confirmButtons = screen.getAllByText(/Confirmar Anulación/)
    fireEvent.click(confirmButtons[0])

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    }, { timeout: 3000 })
  })
})

describe('IncidentDetailScreen - Ver/Eliminar Seguimientos (bonus US-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole({ isOrientator: true })
    ;(incidentService.getIncidentDetail as any).mockResolvedValue(mockIncident)
    ;(incidentService.deleteIncident as any).mockResolvedValue(undefined)
    ;(incidentService.getInterventions as any).mockResolvedValue(mockInterventions)
    ;(incidentService.deleteIntervention as any).mockResolvedValue(undefined)
  })

  it('debe mostrar la sección Seguimiento', async () => {
    render(
      <IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />
    )

    await waitFor(() => {
      expect(screen.getByText('Seguimiento')).toBeInTheDocument()
    })
  })

  it('debe mostrar las intervenciones registradas', async () => {
    render(
      <IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />
    )

    await waitFor(() => {
      expect(screen.getByText('Reunión con apoderados del estudiante')).toBeInTheDocument()
      expect(screen.getByText('Sesión de tutoría individual con el alumno')).toBeInTheDocument()
    })
  })

  it('debe mostrar mensaje cuando no hay seguimientos', async () => {
    ;(incidentService.getInterventions as any).mockResolvedValue([])

    render(
      <IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />
    )

    await waitFor(() => {
      expect(screen.getByText(/No hay acciones de seguimiento registradas/i)).toBeInTheDocument()
    })
  })

  it('debe mostrar botón Editar solo si se pasa onEditIntervention', async () => {
    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onEditIntervention={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByText('Editar').length).toBeGreaterThan(0)
    })
  })

  it('debe llamar a onEditIntervention con la intervención correcta', async () => {
    const onEditIntervention = vi.fn()

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onEditIntervention={onEditIntervention}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByText('Editar').length).toBeGreaterThan(0)
    })

    const editButtons = screen.getAllByText('Editar')
    fireEvent.click(editButtons[0])

    expect(onEditIntervention).toHaveBeenCalledWith('Test incident', mockInterventions[0])
  })

  it('debe llamar a deleteIntervention al confirmar eliminación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />
    )

    await waitFor(() => {
      expect(screen.getAllByText('Eliminar').length).toBeGreaterThan(0)
    })

    const deleteButtons = screen.getAllByText('Eliminar')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(incidentService.deleteIntervention).toHaveBeenCalledWith(1)
    })
  })

  it('no debe eliminar si el usuario cancela la confirmación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />
    )

    await waitFor(() => {
      expect(screen.getAllByText('Eliminar').length).toBeGreaterThan(0)
    })

    const deleteButtons = screen.getAllByText('Eliminar')
    fireEvent.click(deleteButtons[0])

    expect(incidentService.deleteIntervention).not.toHaveBeenCalled()
  })
})

describe('IncidentDetailScreen - Gestión de seguimientos por rol (bonus US-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(incidentService.getIncidentDetail as any).mockResolvedValue(mockIncident)
    ;(incidentService.deleteIncident as any).mockResolvedValue(undefined)
    ;(incidentService.getInterventions as any).mockResolvedValue(mockInterventions)
    ;(incidentService.deleteIntervention as any).mockResolvedValue(undefined)
  })

  it('un profesor VE los seguimientos pero NO los botones Editar/Eliminar', async () => {
    setRole({ isOrientator: false, isDirective: false })

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onEditIntervention={vi.fn()}
      />
    )

    // Ve las tarjetas de seguimiento (solo lectura)
    await waitFor(() => {
      expect(screen.getByText('Reunión con apoderados del estudiante')).toBeInTheDocument()
    })

    // Pero NO ve los botones de gestión
    expect(screen.queryByText('Editar')).not.toBeInTheDocument()
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument()
  })

  it('un orientador SÍ ve los botones Editar/Eliminar', async () => {
    setRole({ isOrientator: true })

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onEditIntervention={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByText('Editar').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Eliminar').length).toBeGreaterThan(0)
    })
  })

  it('un directivo SÍ ve los botones Editar/Eliminar', async () => {
    setRole({ isDirective: true })

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onEditIntervention={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByText('Editar').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Eliminar').length).toBeGreaterThan(0)
    })
  })
})

describe('IncidentDetailScreen - Visibilidad botón Seguimiento por rol (T-16)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(incidentService.getIncidentDetail as any).mockResolvedValue(mockIncident)
    ;(incidentService.deleteIncident as any).mockResolvedValue(undefined)
    ;(incidentService.getInterventions as any).mockResolvedValue([])
    ;(incidentService.deleteIntervention as any).mockResolvedValue(undefined)
  })

  it('debe mostrar el botón "Registrar Acción de Seguimiento" si es orientador', async () => {
    setRole({ isOrientator: true })

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onIntervention={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Registrar Acción de Seguimiento')).toBeInTheDocument()
    })
  })

  it('NO debe mostrar el botón "Registrar Acción de Seguimiento" si es funcionario (no orientador)', async () => {
    setRole({ isOrientator: false })

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onIntervention={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Datos del Incidente')).toBeInTheDocument()
    })
    expect(screen.queryByText('Registrar Acción de Seguimiento')).not.toBeInTheDocument()
  })

  it('NO debe mostrar el botón a un directivo (solo orientadores registran seguimiento)', async () => {
    setRole({ isDirective: true, isOrientator: false })

    render(
      <IncidentDetailScreen
        incidentId="I-001"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onIntervention={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Datos del Incidente')).toBeInTheDocument()
    })
    expect(screen.queryByText('Registrar Acción de Seguimiento')).not.toBeInTheDocument()
  })
})

describe('IncidentDetailScreen - T-18: Cambiar estado del incidente', () => {
  const incidentEnSeguimiento = { ...mockIncident, estado: 'en_seguimiento' }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(incidentService.getIncidentDetail as any).mockResolvedValue(incidentEnSeguimiento)
    ;(incidentService.deleteIncident as any).mockResolvedValue(undefined)
    ;(incidentService.getInterventions as any).mockResolvedValue(mockInterventions)
    ;(incidentService.deleteIntervention as any).mockResolvedValue(undefined)
    ;(incidentService.setIncidentState as any).mockResolvedValue(incidentEnSeguimiento)
  })

  it('un orientador ve el selector de estado (dropdown)', async () => {
    setRole({ isOrientator: true })

    render(<IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />)

    await waitFor(() => {
      const select = screen.getByLabelText('Estado del Caso') as HTMLSelectElement
      expect(select).toBeInTheDocument()
      expect(select.value).toBe('en_seguimiento')
    })
  })

  it('un profesor ve el estado como texto, no como dropdown', async () => {
    setRole({ isOrientator: false, isDirective: false })

    render(<IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Datos del Incidente')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('Estado del Caso')).not.toBeInTheDocument()
    // Ve el badge de estado como texto
    expect(screen.getByText('En Seguimiento')).toBeInTheDocument()
  })

  it('debe llamar a setIncidentState al cambiar el estado', async () => {
    setRole({ isOrientator: true })

    render(<IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />)

    const select = await screen.findByLabelText('Estado del Caso')
    fireEvent.change(select, { target: { value: 'cerrado' } })

    await waitFor(() => {
      expect(incidentService.setIncidentState).toHaveBeenCalledWith(1, 'cerrado')
    })
  })

  it('debe mostrar Toast con el estado destino al cambiar el estado', async () => {
    setRole({ isOrientator: true })

    render(<IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />)

    const select = await screen.findByLabelText('Estado del Caso')
    // Desde 'en_seguimiento' la única transición válida es 'cerrado'
    fireEvent.change(select, { target: { value: 'cerrado' } })

    await waitFor(() => {
      expect(screen.getByText(/Estado cambiado a "Cerrado"/i)).toBeInTheDocument()
    })
  })

  it('debe mostrar error y revertir si no se puede cerrar sin intervenciones', async () => {
    setRole({ isOrientator: true })
    ;(incidentService.setIncidentState as any).mockRejectedValue(new Error('400'))

    render(<IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />)

    const select = await screen.findByLabelText('Estado del Caso') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'cerrado' } })

    await waitFor(() => {
      expect(screen.getByText(/No se puede cerrar sin acciones de seguimiento/i)).toBeInTheDocument()
    })
    // Revierte al estado anterior
    expect(select.value).toBe('en_seguimiento')
  })

  it('el dropdown solo ofrece transiciones válidas (en_seguimiento → cerrado)', async () => {
    setRole({ isOrientator: true })

    render(<IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />)

    const select = await screen.findByLabelText('Estado del Caso') as HTMLSelectElement
    const opciones = Array.from(select.options).map(o => o.value)

    // Desde 'en_seguimiento': solo el actual + 'cerrado' (no 'abierto')
    expect(opciones).toContain('en_seguimiento')
    expect(opciones).toContain('cerrado')
    expect(opciones).not.toContain('abierto')
  })

  it('desde "abierto" solo ofrece pasar a "en_seguimiento" (no saltar a cerrado)', async () => {
    setRole({ isOrientator: true })
    ;(incidentService.getIncidentDetail as any).mockResolvedValue({ ...mockIncident, estado: 'abierto' })

    render(<IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />)

    const select = await screen.findByLabelText('Estado del Caso') as HTMLSelectElement
    const opciones = Array.from(select.options).map(o => o.value)

    expect(opciones).toContain('abierto')
    expect(opciones).toContain('en_seguimiento')
    expect(opciones).not.toContain('cerrado')
  })

  it('desde "cerrado" permite reabrir (cerrado → en_seguimiento)', async () => {
    setRole({ isDirective: true })
    ;(incidentService.getIncidentDetail as any).mockResolvedValue({ ...mockIncident, estado: 'cerrado' })

    render(<IncidentDetailScreen incidentId="I-001" onClose={vi.fn()} onEdit={vi.fn()} />)

    const select = await screen.findByLabelText('Estado del Caso') as HTMLSelectElement
    const opciones = Array.from(select.options).map(o => o.value)

    expect(opciones).toContain('cerrado')
    expect(opciones).toContain('en_seguimiento')
    expect(opciones).not.toContain('abierto')
  })
})
