import { useEffect, useState } from 'react'
import type { StudentData } from '../services/incidentService.ts'

export function useStudentSearch(query: string, debounceMs = 500) {
  const [resolvedQuery, setResolvedQuery] = useState('')
  const [options, setOptions] = useState<StudentData[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  const isQueryValid = query.length >= 3 && !Number.isFinite(parseInt(query.charAt(0)))
  const isSearching = isQueryValid && query !== resolvedQuery
  const showDropdown = isQueryValid

  useEffect(() => {
    if (!isQueryValid) return

    const delayDebounceFn = setTimeout(async () => {
      try {
        // TODO: descomentar cuando Vicente suba T06 (GET /api/alumnos/buscar)
        // const data = await searchStudents(query);
        const mockData: StudentData[] = [
          { name: 'Juan Soto', rut: '20123456-7', class: '4A' },
          { name: 'María Pardo', rut: '21234567-8', class: '4B' },
          { name: 'Pedro Gómez', rut: '22345678-9', class: '4A' },
          { name: 'Luis Vera', rut: '23456789-0', class: '4C' },
        ]
        const data = mockData.filter(s =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.rut.includes(query)
        )
        setOptions(data)
        setSearchError(null)
      } catch {
        setOptions([])
        setSearchError('No se pudo conectar con el servidor. Intente nuevamente.')
      } finally {
        setResolvedQuery(query)
      }
    }, debounceMs)

    return () => clearTimeout(delayDebounceFn)
  }, [query, isQueryValid, debounceMs])

  return { resolvedQuery, options, searchError, isSearching, showDropdown }
}
