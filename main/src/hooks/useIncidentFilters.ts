import { useState } from 'react'
import type { StudentData } from '../services/incidentService.ts'

export type IncidentRow = {
  id: string
  rawId: string
  fecha: string
  lugar: string
  alumnos: string
  gravedad: string
  estado: string
}

export function useIncidentFilters(incidents: IncidentRow[]) {
  const [query, setQuery]               = useState('')
  const [options, setOptions]           = useState<StudentData[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [filtroAlumno, setFiltroAlumno] = useState('')
  const [filtroGravedad, setFiltroGravedad] = useState('')
  const [filtroEstado, setFiltroEstado]     = useState('')
  const [filtroFecha, setFiltroFecha]       = useState('')

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (!val) {
      setFiltroAlumno('')
      setShowDropdown(false)
      setOptions([])
    } else {
      setShowDropdown(true)
    }
  }

  const handleSelectStudent = (student: StudentData) => {
    setQuery(student.name)
    setFiltroAlumno(student.name.toLowerCase())
    setShowDropdown(false)
    setOptions([])
  }

  const handleSetOptions = (data: StudentData[]) => {
    setOptions(data)
    setShowDropdown(data.length > 0)
  }

  const parseFecha = (fecha: string) => {
    const [d, m, y] = fecha.split('/')
    return new Date(`${y}-${m}-${d}`).getTime()
  }

  const incidentesFiltrados = incidents
    .filter(inc => {
      const matchAlumno   = !filtroAlumno   || inc.alumnos.toLowerCase().includes(filtroAlumno)
      const matchGravedad = !filtroGravedad || inc.gravedad === filtroGravedad
      const matchEstado   = !filtroEstado   || inc.estado   === filtroEstado
      return matchAlumno && matchGravedad && matchEstado
    })
    .sort((a, b) => {
      if (!filtroFecha) return 0
      const diff = parseFecha(a.fecha) - parseFecha(b.fecha)
      return filtroFecha === 'asc' ? diff : -diff
    })

  return {
    query,
    options,
    showDropdown,
    filtroGravedad,
    filtroEstado,
    filtroFecha,
    handleQueryChange,
    handleSelectStudent,
    handleSetOptions,
    setFiltroGravedad,
    setFiltroEstado,
    setFiltroFecha,
    incidentesFiltrados,
  }
}
