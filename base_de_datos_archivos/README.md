# Base de datos

Scripts SQL para levantar la BD del proyecto (PC individual).

## Archivos

- `esquema_convivencia_escolar.sql` — crea las tablas y datos base.
- `dataset_liceo.sql` — dataset ficticio para el proyecto.

## Requisitos

- PostgreSQL 14+
- DBeaver (o cualquier cliente SQL)

## Setup

1. **Conectarse a PostgreSQL** desde DBeaver (host `localhost`, puerto `5432`, user `postgres`).

2. **Crear la base** desde la base `postgres`:

```sql
CREATE DATABASE "Convivencia_Escolar";
```

3. **Cambiarse a la nueva base** (doble click en `Convivencia_Escolar`).

4. **Ejecutar los scripts en orden**:
   - Primero `esquema_convivencia_escolar.sql`
   - Después `dataset_liceo.sql`

   En DBeaver: copiar el contenido al SQL Editor y ejecutar con `Alt + X`.

5. **Verificar**:

```sql
SELECT COUNT(*) FROM usuario;     -- 29
SELECT COUNT(*) FROM estudiante;  -- 90
SELECT COUNT(*) FROM incidente;   -- 50
```

## Conexión desde el código

```
postgresql://postgres:TU_CONTRASEÑA@localhost:5432/Convivencia_Escolar
```

## Credenciales del dataset

- Usuarios con formato `<rol>.<nombre>@liceosanlorenzo.cl` (ej: `docente.daniela@liceosanlorenzo.cl`).
- Contraseña de todos: `password123`.

## Resetear datos

Si quieren recargar el dataset sin tocar el esquema:

```sql
TRUNCATE TABLE 
  anotacion_positiva, intervencion, participacion_en_incidente,
  incidente, estudiante, usuario
RESTART IDENTITY CASCADE;
```

Y vuelven a correr `dataset_liceo.sql`.
