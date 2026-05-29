# Frontend — Sistema de Convivencia Escolar

Documentación del estado actual del frontend (rama `refactor/code-cleanup`, actualizado 2026-05-29).

---

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Zod** + **React Hook Form** para validación de formularios
- **Axios** para llamadas HTTP a la API
- **SCSS** para estilos
- **MUI** para inputs del login

---

## Levantar el proyecto

```bash
cd main
npm install
npm run dev   # http://localhost:5174
```

La API debe estar corriendo en `http://localhost:3000` (ver `api/`).

---

## Navegación

El enrutamiento es manual con un estado `screen` en `App.tsx`. No usa React Router.

```
login
  └── list (listado de incidentes)
        ├── form (crear incidente)
        │     └── list
        └── detail (detalle de incidente)
              ├── list
              └── edit (editar incidente)
                    └── detail
```

**Flujo principal:**
1. Usuario hace login → va a la lista
2. Desde la lista puede crear un incidente nuevo o ver el detalle de uno existente
3. Desde el detalle puede editar el incidente
4. Al guardar una edición, vuelve al detalle con alerta de éxito

---

## Pantallas

### `LoginScreen`
- Muestra formulario de usuario y contraseña
- **Estado actual:** el botón navega directo a la lista sin autenticar — la autenticación real es Sprint 2
- Credenciales hardcodeadas en la API: `teacher/1234`, `inspector/1234`, `directive/1234`

---

### `IncidentListScreen`
- Carga incidentes desde `GET /incident` al montar
- Muestra tabla con ID, fecha, lugar, alumnos involucrados, gravedad y estado

**Tarjetas de resumen (dinámicas):**
- Incidentes Hoy — filtra por fecha de hoy
- Abiertos — filtra por `estado === 'Abierto'`
- Grave/Muy Grave — filtra por gravedad

**Filtros:**
| Filtro | Comportamiento |
|--------|---------------|
| Buscador (alumno/RUT) | Dropdown con resultados de `GET /students/search?q=`. Al seleccionar un alumno, filtra la tabla |
| Fecha | Ordena la tabla: Recientes o Antiguos |
| Gravedad | Filtra por Leve, Grave o Muy Grave |
| Estado | Filtra por Abierto, Cerrado o En Seguimiento |

La lógica de filtrado está extraída en el hook `useIncidentFilters`.

---

### `IncidentFormScreen` — Solo crear
- Formulario en dos secciones: datos del incidente y alumnos involucrados
- Validación con **Zod** + **React Hook Form**
- Al guardar: `POST /incident` → navega a la lista con toast de confirmación

**Campos:**
- Fecha, Hora, Lugar (select), Tipo de Incidente (select), Descripción, Gravedad (radio)
- Búsqueda de alumnos por nombre o RUT con dropdown typeahead
- Tabla de alumnos agregados con selector de rol (Agresor, Víctima, Testigo, Participante)

---

### `IncidentDetailScreen`
- Carga el incidente por `GET /incident/:id` al montar
- Muestra: Fecha, Hora, Lugar, Tipo de Incidente, Gravedad, Descripción y tabla de alumnos con roles en español
- La alerta "Incidente guardado exitosamente" solo aparece al volver desde edición (no desde la lista)
- Botones: Cerrar Vista → lista | Editar Incidente → pantalla de edición

---

### `IncidentEditScreen` — Solo editar
- Carga el incidente con `GET /incident/:id` al montar
- Precarga todos los campos del formulario usando `reset()` de react-hook-form
- **Importante:** el formulario se monta antes de que lleguen los datos (con `<fieldset disabled>`) para que `reset()` funcione correctamente
- Al guardar: `PUT /incident` → vuelve al detalle con alerta de éxito
- Los actores se precargan con nombre y rol — RUT y curso quedan vacíos hasta que T06 (Vicente) implemente `GET /api/alumnos/buscar`

---

## Componentes Reutilizables

| Componente | Descripción |
|------------|-------------|
| `IncidentDetailFields` | Campos de fecha, hora, lugar, tipo, descripción y gravedad |
| `StudentSearchSection` | Buscador typeahead + lista de alumnos agregados |
| `SearchStudentComponent` | Input de búsqueda conectado a la API, maneja RUT y nombre |
| `AddedStudentsList` | Tabla de alumnos con selector de rol y botón quitar |
| `SuccessModal` | Modal con tick verde, se cierra automáticamente en 2 segundos |
| `Toast` | Notificación flotante de éxito/error |
| `Icon` | Wrapper de imagen con tamaños predefinidos (action, severity, role) |

---

## Hooks

### `useIncidentForm(alumnos)`
Encapsula la validación Zod del formulario de incidente.
- Expone `register`, `handleSubmit`, `errors`, `reset`, `validateStudents`
- `reset()` se usa en `IncidentEditScreen` para precargar los campos

**Schema Zod:**
```ts
fecha: string (requerido)
hora: string (requerido)
lugar: enum PLACE_OPTIONS
tipoIncidente: 'verbal'|'physical'|'harassment'|'discrimination'|'other'
descripcion: string (mínimo 10 caracteres)
gravedad: 'Leve'|'Grave'|'Muy Grave'
```

### `useStudentSearch(query)`
- Debounce de 500ms antes de llamar a la API
- Solo busca si el query tiene 3+ caracteres y no es solo numérico (RUT se valida aparte)
- Conectado a `GET /students/search?q=`
- Retorna: `{ options, searchError, isSearching, showDropdown }`

### `useIncidentFilters(incidents)`
- Recibe el array de incidentes y gestiona todos los filtros de la lista
- Estados: `query`, `options`, `showDropdown`, `filtroAlumno`, `filtroGravedad`, `filtroEstado`, `filtroFecha`
- Retorna `incidentesFiltrados` — array ya filtrado y ordenado

---

## Servicios (`incidentService.ts`)

| Función | Método | Endpoint |
|---------|--------|----------|
| `fetchIncidents()` | GET | `/incident` |
| `getIncidentDetail(id)` | GET | `/incident/:id` |
| `registerIncident(...)` | POST | `/incident` |
| `editIncident(...)` | PUT | `/incident` |
| `searchStudents(query)` | GET | `/students/search?q=` |

---

## Constantes (`formMappings.ts`)

```ts
SEVERITY_MAP   // 'Leve'|'Grave'|'Muy Grave' → 'mild'|'severe'|'verysevere'
ROLE_MAP       // 'Agresor'|'Víctima'|'Testigo'|'Participante' → API en inglés
ROLE_DISPLAY   // API en inglés → español (cubre typo histórico 'aggresor')
PLACE_OPTIONS  // ['Aula 3', 'Patio 1', 'Comedor', 'Biblioteca']
INCIDENT_TYPE_OPTIONS  // Tipos con value en inglés y label en español
```

---

## Pendientes

| Item | Bloqueado por |
|------|--------------|
| Autenticación real (login) | Sprint 2 |
| Búsqueda de alumnos con datos reales | T06 — Vicente: `GET /api/alumnos/buscar` |
| API con base de datos real | T01 — Mario: conectar BD PostgreSQL |
| RUT y curso en pantalla de edición | Depende de T06 |
