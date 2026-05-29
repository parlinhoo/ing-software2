import { useEffect } from "react";
import { searchStudents, type StudentData } from "../services/incidentService.ts";
import { getStudentClassOptionsRegex, isValidRut } from "../utils/formatUtils.ts";

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

    // si empieza con número puede ser RUT — validar antes de buscar
    if (isFinite(Number(query.charAt(0)))) {
      if (!isValidRut(query)) {
        setOptions([]);
        if (onSearchComplete) onSearchComplete();
        return;
      }
    } else if (query.length < 3) {
      if (onSearchComplete) onSearchComplete();
      setOptions([]);
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