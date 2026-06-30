import { useEffect } from "react";
import { searchStudents, type StudentData } from "../services/incidentService.ts";
import { getStudentClassOptionsRegex } from "../utils/formatUtils.ts";

export function SearchStudentComponent({ query, onQueryChange, setOptions, className, placeholder, onInputInvalid, onSearchStart, onSearchError, onSearchComplete }: {
    query: string,
    onQueryChange: (query: string) => void,
    setOptions: (value: StudentData[]) => any,
    className?: string,
    placeholder?: string,
    onInputInvalid?: () => void,
    onSearchStart?: () => void,
    onSearchError?: () => void,
    onSearchComplete?: () => void,
}) {

  useEffect(() => {
    if (!query) {
      if (onInputInvalid) onInputInvalid();
      return;
    }

    if (onSearchStart) onSearchStart();

    // Mínimo de caracteres para disparar la búsqueda (evita buscar con 1 solo dígito/letra).
    // El backend ya busca por nombre O por RUT (coincidencia parcial), así que no validamos el RUT acá.
    if (query.trim().length < 2) {
      setOptions([]);
      if (onSearchComplete) onSearchComplete();
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await searchStudents(query);
        if (onSearchComplete) onSearchComplete();
        setOptions(data);
      } catch (error) {
        console.error("Error buscando alumno:", error);
        if (onSearchError) onSearchError();
        setOptions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onQueryChange(val);
  }

  return <input
    type="text"
    className={className}
    placeholder={placeholder}
    value={query}
    onChange={handleSearch}
    autoComplete="off"
  />
}