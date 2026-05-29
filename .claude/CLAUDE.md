# Configuración - Sistema de Convivencia Escolar

## Stack y Arquitectura

- **Frontend:** React 19 + TypeScript + Vite (monorepo en `/main`)
- **Backend:** Express.js + TypeScript (monorepo en `/api`)
- **Validación:** Zod + React Hook Form
- **HTTP Client:** Axios con JWT interceptor
- **Styling:** SCSS

## Ramas Activas

- `main` - Rama principal
- `feature/frontend` - Desarrollo frontend (usa refactor/code-cleanup como base)
- `feature/api` / `base-de-datos` - Ramas backend (API básica con datos en memoria)
- `refactor/code-cleanup` - Rama de refactoring del formulario de incidentes

## Refactoring Completado (refactor/code-cleanup)

### Componentes Extraídos
- `IncidentDetailFields.tsx` - Campo fecha, hora, lugar, tipo, descripción, gravedad
- `StudentSearchSection.tsx` - Buscador con typeahead, lista de alumnos agregados
- `AddedStudentsList.tsx` - Tabla de alumnos con selector de rol
- `SuccessModal.tsx` - Modal con tick ✓ después de guardar

### Custom Hooks
- `useStudentSearch.ts` - Debounce de búsqueda (500ms), validación de query (>=3 chars, no numérico)

### Constantes Centralizadas
- `constants/formMappings.ts`:
  - `SEVERITY_MAP` - Leve/Grave/Muy Grave → mild/severe/verysevere
  - `ROLE_MAP` - Agresor/Víctima/Testigo/Participante → aggresor/victim/witness/participant
  - `PLACE_OPTIONS` - Aula 3, Patio 1, Comedor, Biblioteca
  - `INCIDENT_TYPE_OPTIONS` - Tipos de incidente con labels

### Funcionalidades Implementadas
✅ Crear incidente con validación Zod
✅ Editar incidente (estructura completa)
✅ Rol "Participante" agregado (request del profesor)
✅ Modal de éxito con cierre automático (2s)
✅ Flujo de navegación: lista → detalle → editar
✅ Datos ficticios de alumnos para testing
✅ CORS habilitado en backend

## Problemas Conocidos / TODO

⏳ **Pre-poblar campos al editar** - Requiere `setValue` de react-hook-form
⏳ **API conectada** - Endpoints de crear/editar/obtener incidentes existen pero usan datos en memoria
⏳ **Búsqueda de alumnos** - Usa mock data, requiere T06 (GET `/api/alumnos/buscar`) de Vicente
⏳ **IncidentDetailScreen** - Carga datos ficticios, debe cargar por ID real

## Integraciones Pendientes

- **T01 (Mario):** POST/PUT `/api/incidentes` - Crear y editar incidentes (estructura pronta)
- **T06 (Vicente):** GET `/api/alumnos/buscar` - Búsqueda de estudiantes

## Convenciones

- **Componentes:** En `src/components/`, nombrados en PascalCase
- **Screens:** En `src/screens/`, son vistas completas
- **Hooks:** En `src/hooks/`, nombrados con `use` prefix
- **Tipos:** En `src/types/index.ts`, exportar desde aquí
- **Constantes:** En `src/constants/`, agrupadas por tema

## Testing Local

Backend en `http://localhost:3000`:
```bash
cd api
npm install
npm run dev
```

Frontend en `http://localhost:5174`:
```bash
cd main
npm run dev
```

Datos de prueba en memoria (backend):
- Incidente ID 1: Physical aggression (Pedro vs Julio)
- Incidente ID 3: Verbal aggression (Horacio vs Pedro)

## Commits en refactor/code-cleanup

1. f016e52 - Eliminar mockStudents
2. 2096182 - Extraer constantes a formMappings.ts
3. 4eb2556 - Componentes + useStudentSearch hook
4. 3cf80ee - Rol Participante + datos ficticios alumnos
5. 231ba72 - Modal de éxito con tick
6. 960a361 - Estructura editar incidente
7. f12db23 - Pasar ID incidente entre pantallas
8. 66d8a13 - Datos ficticios para testing edición
