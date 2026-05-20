CREATE TABLE rol (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL
);

CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) UNIQUE NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',
  rol_id INTEGER REFERENCES rol(id)
);

CREATE TABLE estudiante (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  curso VARCHAR(20) NOT NULL,
  run VARCHAR(12) UNIQUE NOT NULL
);

CREATE TABLE tipo_incidente (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT
);

CREATE TABLE estado_caso (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL
);

CREATE TABLE incidente (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  lugar VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  gravedad VARCHAR(20) NOT NULL CHECK (gravedad IN ('leve', 'grave', 'muy_grave')),
  tipo_incidente_id INTEGER REFERENCES tipo_incidente(id),
  estado_caso_id INTEGER REFERENCES estado_caso(id),
  registrado_por INTEGER REFERENCES usuario(id)
);

CREATE TABLE participacion_en_incidente (
  id SERIAL PRIMARY KEY,
  incidente_id INTEGER REFERENCES incidente(id),
  estudiante_id INTEGER REFERENCES estudiante(id),
  rol_en_conflicto VARCHAR(20) NOT NULL CHECK (rol_en_conflicto IN ('agresor', 'victima', 'testigo'))
);

CREATE TABLE intervencion (
  id SERIAL PRIMARY KEY,
  incidente_id INTEGER REFERENCES incidente(id),
  realizada_por INTEGER REFERENCES usuario(id),
  fecha DATE NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL
);

CREATE TABLE anotacion_positiva (
  id SERIAL PRIMARY KEY,
  estudiante_id INTEGER REFERENCES estudiante(id),
  registrada_por INTEGER REFERENCES usuario(id),
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL
);

-- Datos iniciales
INSERT INTO rol (nombre) VALUES ('teacher'), ('inspector'), ('orientator'), ('directive'), ('admin');
INSERT INTO estado_caso (nombre) VALUES ('Abierto'), ('En seguimiento'), ('Cerrado');
INSERT INTO tipo_incidente (nombre, descripcion) VALUES
  ('Agresión física', 'Contacto físico no consentido'),
  ('Agresión verbal', 'Insultos o amenazas'),
  ('Acoso', 'Conducta reiterada de hostigamiento'),
  ('Discriminación', 'Trato diferenciado injustificado');
