# Sistema de Convivencia Escolar — Frontend

Aplicación web para la gestión y seguimiento de incidentes de convivencia escolar. Desarrollada con React + TypeScript + Vite como parte del proyecto semestral de Ingeniería de Software II — Universidad de Concepción.

## Stack

- **React 19** + **TypeScript**
- **Vite** como bundler
- **MUI (Material UI)** para componentes de formulario
- **SCSS** para estilos personalizados
- **Axios** para llamadas a la API

## Levantar el proyecto

```bash
npm install
cp .env.example .env   # crear archivo de entorno local
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:3000` |

Las variables deben tener el prefijo `VITE_` para que Vite las exponga al browser.

## Estructura del proyecto

```
src/
├── assets/img/       # Iconos e imágenes del sistema
├── components/       # Componentes reutilizables (Icon, Toast)
├── hooks/            # Custom hooks de React
├── screens/          # Pantallas completas de la app
│   └── css/          # Estilos por pantalla
├── services/         # Llamadas a la API REST
├── types/            # Tipos TypeScript globales
├── utils/            # Funciones de ayuda y lógica de roles
└── constants/        # Constantes y códigos HTTP
```

---

## Estado actual del desarrollo

### Pantallas

| Pantalla | Archivo | Estado |
|---|---|---|
| Login | `screens/LoginScreen.tsx` | UI lista, navega al listado al hacer clic |
| Listado de incidentes | `screens/IncidentListScreen.tsx` | UI lista, datos hardcodeados |
| Formulario de incidente | `screens/IncidentFormScreen.tsx` | UI lista con validaciones visuales y buscador mock |
| Detalle de incidente | `screens/IncidentDetailScreen.tsx` | UI lista, datos hardcodeados |

### Componentes actuales

| Componente | Archivo | Descripción |
|---|---|---|
| `Icon` | `components/Icon.tsx` | Renderiza imágenes PNG con tamaños estandarizados (`action` 20px, `sidebar` 28px, `role` 40px, `severity` 20px) |
| `Toast` | `components/Toast.tsx` | Notificación flotante de éxito, se auto-cierra a los 4 segundos |

### Navegación

Estado local en `App.tsx` (sin React Router aún). La app comienza en login y fluye así:

```
Login ──[Iniciar sesión]──→ Listado ──[+ Nuevo]──→ Formulario ──[Guardar]──→ Detalle
                               ↑                        ↑                        │
                               └────────────────[Cancelar]                       │
                               └────────────────────────────────────[Cerrar]─────┘
```

### Formulario — mejoras visuales implementadas

- Asterisco rojo (`*`) en campos obligatorios: Fecha, Hora, Lugar, Descripción, Gravedad, Buscador, Rol
- Selector de Lugar con placeholder neutro (`-- Seleccione un lugar --`)
- Gravedad con radio buttons sin selección por defecto
- Buscador typeahead con 3 estados visuales: cargando (spinner), sin resultados, resultados con botón `+ Agregar`
- Selector de rol obligatorio por alumno agregado, con borde rojo si está vacío
- Toast de confirmación al guardar (`"Incidente registrado correctamente"`)

### Configuración de API

- `services/axiosInstance.ts` — instancia de Axios apuntando a `VITE_API_URL`, con interceptor que adjunta automáticamente el token JWT desde `localStorage` en cada petición
- `services/paths.ts` — todos los endpoints del backend definidos como constantes tipadas
- Al conectar el login, guardar el token con `localStorage.setItem("token", ...)` en `authService.ts`

### Servicios listos (sin conectar)

| Archivo | Funciones |
|---|---|
| `services/authService.ts` | `signIn(username, password)` |
| `services/incidentService.ts` | `registerIncident`, `editIncident`, `deleteIncident`, `getIncidents`, `setIncidentState`, `addIncidentType`, etc. |
| `services/interventionService.ts` | `registerIntervention`, `editIntervention` |
| `services/reportGeneratorService.ts` | `getReport` |
| `services/userService.ts` | `createUser`, `editUser`, `deleteUser` |

### Tipos definidos (`types/index.ts`)

`UserRole`, `Action`, `User`, `IncidentTypes`, `Severity`, `IncidentRole`, `IncidentActor`, `IncidentStatus`, `InterventionType`

---

## Próximos pasos

### Pantallas pendientes

- [ ] Pantalla de historial de alumno (incidentes + intervenciones + anotaciones positivas)
- [ ] Pantalla de intervenciones
- [ ] Dashboard con estadísticas y gráficos (incidentes por curso, por gravedad)
- [ ] Módulo de anotaciones positivas
- [ ] Panel de administración (usuarios, tipos de incidente, estados de caso)

### Componentes a crear

- [ ] `Sidebar` — menú lateral con iconos de navegación y rol del usuario activo
- [ ] `Topbar` — cabecera con nombre del sistema, usuario logueado y botón de cierre de sesión
- [ ] `Badge` — etiqueta de gravedad reutilizable (Leve / Grave / Muy Grave) con ícono
- [ ] `StudentRow` — fila de alumno agregado en el formulario (actualmente inline en `IncidentFormScreen`)
- [ ] `StatCard` — tarjeta de resumen numérico del listado (actualmente inline)
- [ ] `EmptyState` — estado vacío reutilizable para tablas y búsquedas sin resultados
- [ ] `ConfirmDialog` — modal de confirmación para eliminar incidentes
- [ ] `Spinner` — componente de carga global

### Refactorización a hooks

Los siguientes bloques de lógica deben extraerse a hooks en `hooks/` cuando se conecte la API real:

| Hook | Extrae de | Responsabilidad |
|---|---|---|
| `useAuth` | `LoginScreen` / `App.tsx` | Manejo de sesión: login, logout, rol activo, token |
| `useIncidents` | `IncidentListScreen` | Fetch de incidentes, filtros, paginación |
| `useIncidentForm` | `IncidentFormScreen` | Estado del formulario, validación con Zod/React Hook Form |
| `useStudentSearch` | `IncidentFormScreen` | Búsqueda typeahead de alumnos contra `GET /api/alumnos/buscar?q=` |
| `useToast` | `App.tsx` | Estado y control del Toast (visible, mensaje, auto-cierre) |
| `useRoleGuard` | `App.tsx` | Control de acceso a pantallas según `UserRole` y `Action` |

### Integración con API

- [ ] Conectar `LoginScreen` con `authService.signIn()` y guardar sesión
- [ ] Implementar React Router y proteger rutas según rol
- [ ] Reemplazar datos mock de `IncidentListScreen` con `incidentService.getIncidents()`
- [ ] Conectar `IncidentFormScreen` con `incidentService.registerIncident()` (transacción atómica con involucrados)
- [ ] Reemplazar búsqueda mock de alumnos con endpoint real `GET /api/alumnos/buscar?q=`
- [ ] Mostrar/ocultar pantallas y acciones según `getRoleActions(role)` de `utils/roleController.ts`
