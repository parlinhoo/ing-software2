# Pruebas de validación de datos

Para preview en Visual Studio usar "Ctrl + Shift + V" o "Open Preview".

## Prueba 1: Conteo general

```sql
SELECT 'Usuarios' AS tabla, COUNT(*) AS total FROM usuario
UNION ALL SELECT 'Estudiantes', COUNT(*) FROM estudiante
UNION ALL SELECT 'Incidentes', COUNT(*) FROM incidente
UNION ALL SELECT 'Participaciones', COUNT(*) FROM participacion_en_incidente
UNION ALL SELECT 'Intervenciones', COUNT(*) FROM intervencion
UNION ALL SELECT 'Anotaciones positivas', COUNT(*) FROM anotacion_positiva;
```

**Esperado:** `29, 90, 50, 117, 35, 28`

---

## Prueba 2: Usuarios por rol

```sql
SELECT 
    r.nombre AS rol,
    COUNT(u.id) AS cantidad
FROM rol r
LEFT JOIN usuario u ON u.rol_id = r.id
GROUP BY r.id, r.nombre
ORDER BY cantidad DESC;
```

**Esperado:**

| Rol | Cantidad |
|---|---:|
| Docente | 16 |
| Inspector | 7 |
| Equipo Directivo | 3 |
| Orientador | 2 |
| Administrador | 1 |

---

## Prueba 3: Estudiantes por curso

```sql
SELECT 
    curso,
    COUNT(*) AS estudiantes
FROM estudiante
GROUP BY curso
ORDER BY curso;
```

**Esperado:**

| Curso | Estudiantes |
|---|---:|
| 1°A | 22 |
| 2°A | 23 |
| 3°A | 23 |
| 4°A | 22 |

---

## Prueba 4: Verificar nombres coherentes

```sql
SELECT nombre, curso, run 
FROM estudiante 
ORDER BY id 
LIMIT 25;
```

**Esperado:**  
Todos los nombres deben tener primer y segundo nombre del mismo género. 

---

## Prueba 5: Soft delete

```sql
SELECT 
    'Activos' AS estado,
    COUNT(*) AS cantidad
FROM incidente WHERE eliminado_en IS NULL
UNION ALL
SELECT 
    'Eliminados (soft)',
    COUNT(*)
FROM incidente WHERE eliminado_en IS NOT NULL;
```

**Esperado:**  
La suma debe ser `50`, con entre `1` y `4` incidentes eliminados.

---

## Prueba 6: Alerta de reincidencia — RF-19

```sql
SELECT 
    e.nombre AS estudiante,
    e.curso,
    e.run,
    COUNT(*) AS incidentes_graves
FROM estudiante e
JOIN participacion_en_incidente p ON p.estudiante_id = e.id
JOIN incidente i ON i.id = p.incidente_id
JOIN gravedad g ON g.id = i.gravedad_id
JOIN rol_en_conflicto rc ON rc.id = p.rol_en_conflicto_id
WHERE g.nombre IN ('Grave', 'Muy grave')
  AND rc.nombre = 'Agresor'
  AND i.eliminado_en IS NULL
  AND i.fecha >= '2026-01-01'
GROUP BY e.id, e.nombre, e.curso, e.run
HAVING COUNT(*) >= 3
ORDER BY incidentes_graves DESC;
```

**Esperado:**  
Deben aparecer `4` estudiantes reincidentes.

---

## Prueba 7: Compensación de anotaciones — RF-16

```sql
SELECT 
    e.nombre AS estudiante,
    e.curso,
    COUNT(*) AS anotaciones_positivas
FROM estudiante e
JOIN anotacion_positiva a ON a.estudiante_id = e.id
WHERE a.eliminado_en IS NULL
GROUP BY e.id, e.nombre, e.curso
HAVING COUNT(*) >= 3
ORDER BY anotaciones_positivas DESC;
```

**Esperado:**  
Deben aparecer al menos `5` estudiantes destacados.

---

## Prueba 8: Panel de convivencia — RF-18

```sql
SELECT 
    e.curso,
    g.nombre AS gravedad,
    COUNT(DISTINCT i.id) AS total_incidentes
FROM incidente i
JOIN participacion_en_incidente p ON p.incidente_id = i.id
JOIN estudiante e ON e.id = p.estudiante_id
JOIN gravedad g ON g.id = i.gravedad_id
WHERE p.rol_en_conflicto_id IN (1, 2)
  AND i.eliminado_en IS NULL
GROUP BY e.curso, g.id, g.nombre
ORDER BY e.curso, g.nivel;
```

**Esperado:**  
Debe generarse una tabla con cursos × gravedades, mostrando dónde se concentran los incidentes.