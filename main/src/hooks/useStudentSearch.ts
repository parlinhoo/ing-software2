import { useEffect, useState } from 'react'
import { searchStudents, type StudentData } from '../services/incidentService.ts'

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
        const data = await searchStudents(query)
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
