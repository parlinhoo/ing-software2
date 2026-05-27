import { useEffect, useState } from "react";
import type { StudentData } from "../services/incidentService.ts";
import { getStudentClassOptionsRegex, isValidRut } from "../utils/formatUtils.ts";

const mockStudents: StudentData[] = [
  { name: 'Juan Soto', class: '4° Medio A', rut: '20.123.456-7' },
  { name: 'María Pardo', class: '2° Medio B', rut: '21.654.321-K' },
  { name: 'Pedro Gómez', class: '3° Medio A', rut: '15.000.005-K' },
]

const mockClasses = [
  "1° Medio A",
  "1° Medio B",
  "1° Medio C",
  "2° Medio A",
  "2° Medio B",
  "2° Medio C",
  "3° Medio A",
  "3° Medio B",
  "3° Medio C",
  "4° Medio A",
  "4° Medio B",
  "4° Medio C",
];

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

    // si esta buscando curso o rut tiene un número al inicio
    if (isFinite(Number(query.charAt(0)))) {
      const classSuggestions = getStudentClassOptionsRegex(query);

      if (classSuggestions.length !== 0) {
        const classStudents: StudentData[] = [];

        for (let i = 0; i < classSuggestions.length; i++) {

          // TODO: cambiar mock classes por valores obtenidos de bbdd de antemano
          const found = mockClasses.find((value: string) => value === classSuggestions[i]);
          if (found) {
            classStudents.push(...mockStudents.filter((student) => student.class === found));
          }
        }
        
        if (onSearchComplete) onSearchComplete();
        setOptions(classStudents);
        return;
      };
      // luego, solo puede ser un rut
      // si no es válido, entonces no busca.
      if (!isValidRut(query)) {
        setOptions([]);
        if (onSearchComplete) onSearchComplete();
        return;
      };
    }
    else if (query.length < 3) {
      if (onSearchComplete) onSearchComplete();
      setOptions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        // llamada real:
        // const response = await searchStudents(query);
        // const data = response.data();
        
        // Mock de datos para el ejemplo
        const data = mockStudents.filter((student) => student.name.toLowerCase().includes(query.toLowerCase()));
        const data2 = mockStudents.filter((student) => student.rut === query);
        if (onSearchComplete) onSearchComplete();
        setOptions(data.concat(data2));
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