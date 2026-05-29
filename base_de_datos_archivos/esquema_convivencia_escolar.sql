-- Esquema base de datos - Sistema de Convivencia Escolar
-- PostgreSQL

-- Catálogos (configurables por admin)

CREATE TABLE rol (
    id          BIGSERIAL    PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE tipo_incidente (
    id          BIGSERIAL    PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE estado_caso (
    id          BIGSERIAL    PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE gravedad (
    id          BIGSERIAL    PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    nivel       INT          NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE rol_en_conflicto (
    id          BIGSERIAL    PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Parámetros del sistema (ej: positivas_para_compensar, incidentes_graves_para_alerta)
CREATE TABLE configuracion_sistema (
    id          BIGSERIAL    PRIMARY KEY,
    clave       VARCHAR(100) NOT NULL UNIQUE,
    valor       TEXT         NOT NULL,
    descripcion TEXT,
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);


CREATE TABLE usuario (
    id                BIGSERIAL    PRIMARY KEY,
    nombre            VARCHAR(150) NOT NULL,
    correo            VARCHAR(255) NOT NULL UNIQUE,
    contrasena_hash   VARCHAR(255) NOT NULL,
    rol_id            BIGINT       NOT NULL,
    activo            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (rol_id)
        REFERENCES rol(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_usuario_correo ON usuario(correo);
CREATE INDEX idx_usuario_rol    ON usuario(rol_id);


-- Los estudiantes no son usuarios del sistema, solo sujetos de registro
CREATE TABLE estudiante (
    id              BIGSERIAL    PRIMARY KEY,
    run             VARCHAR(12)  NOT NULL UNIQUE,
    nombre          VARCHAR(150) NOT NULL,
    curso           VARCHAR(20)  NOT NULL,
    anio_academico  INT          NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estudiante_run    ON estudiante(run);
CREATE INDEX idx_estudiante_curso  ON estudiante(curso, anio_academico);
CREATE INDEX idx_estudiante_nombre ON estudiante(nombre);


CREATE TABLE incidente (
    id                  BIGSERIAL    PRIMARY KEY,
    fecha               TIMESTAMP    NOT NULL,
    lugar               VARCHAR(200) NOT NULL,
    descripcion         TEXT         NOT NULL,
    gravedad_id         BIGINT       NOT NULL,
    tipo_incidente_id   BIGINT       NOT NULL,
    estado_caso_id      BIGINT       NOT NULL,
    registrado_por      BIGINT       NOT NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    eliminado_en        TIMESTAMP,

    CONSTRAINT fk_incidente_gravedad
        FOREIGN KEY (gravedad_id) REFERENCES gravedad(id) ON DELETE RESTRICT,
    CONSTRAINT fk_incidente_tipo
        FOREIGN KEY (tipo_incidente_id) REFERENCES tipo_incidente(id) ON DELETE RESTRICT,
    CONSTRAINT fk_incidente_estado
        FOREIGN KEY (estado_caso_id) REFERENCES estado_caso(id) ON DELETE RESTRICT,
    CONSTRAINT fk_incidente_usuario
        FOREIGN KEY (registrado_por) REFERENCES usuario(id) ON DELETE RESTRICT
);

CREATE INDEX idx_incidente_fecha       ON incidente(fecha);
CREATE INDEX idx_incidente_gravedad    ON incidente(gravedad_id);
CREATE INDEX idx_incidente_estado      ON incidente(estado_caso_id);
CREATE INDEX idx_incidente_registrado  ON incidente(registrado_por);
CREATE INDEX idx_incidente_no_borrado  ON incidente(eliminado_en) WHERE eliminado_en IS NULL;


-- Tabla asociativa: vincula estudiantes con incidentes según su rol
CREATE TABLE participacion_en_incidente (
    id                    BIGSERIAL  PRIMARY KEY,
    incidente_id          BIGINT     NOT NULL,
    estudiante_id         BIGINT     NOT NULL,
    rol_en_conflicto_id   BIGINT     NOT NULL,
    created_at            TIMESTAMP  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_participacion_incidente
        FOREIGN KEY (incidente_id) REFERENCES incidente(id) ON DELETE CASCADE,
    CONSTRAINT fk_participacion_estudiante
        FOREIGN KEY (estudiante_id) REFERENCES estudiante(id) ON DELETE RESTRICT,
    CONSTRAINT fk_participacion_rol_conflicto
        FOREIGN KEY (rol_en_conflicto_id) REFERENCES rol_en_conflicto(id) ON DELETE RESTRICT,

    CONSTRAINT uq_participacion_unica
        UNIQUE (incidente_id, estudiante_id, rol_en_conflicto_id)
);

CREATE INDEX idx_participacion_incidente   ON participacion_en_incidente(incidente_id);
CREATE INDEX idx_participacion_estudiante  ON participacion_en_incidente(estudiante_id);


CREATE TABLE intervencion (
    id              BIGSERIAL    PRIMARY KEY,
    incidente_id    BIGINT       NOT NULL,
    realizada_por   BIGINT       NOT NULL,
    fecha           TIMESTAMP    NOT NULL,
    tipo            VARCHAR(100) NOT NULL,
    descripcion     TEXT         NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    eliminado_en    TIMESTAMP,

    CONSTRAINT fk_intervencion_incidente
        FOREIGN KEY (incidente_id) REFERENCES incidente(id) ON DELETE CASCADE,
    CONSTRAINT fk_intervencion_usuario
        FOREIGN KEY (realizada_por) REFERENCES usuario(id) ON DELETE RESTRICT
);

CREATE INDEX idx_intervencion_incidente ON intervencion(incidente_id);
CREATE INDEX idx_intervencion_fecha     ON intervencion(fecha);


CREATE TABLE anotacion_positiva (
    id              BIGSERIAL  PRIMARY KEY,
    estudiante_id   BIGINT     NOT NULL,
    registrada_por  BIGINT     NOT NULL,
    fecha           TIMESTAMP  NOT NULL,
    descripcion     TEXT       NOT NULL,
    compensada      BOOLEAN    NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP  NOT NULL DEFAULT NOW(),
    eliminado_en    TIMESTAMP,

    CONSTRAINT fk_anotacion_estudiante
        FOREIGN KEY (estudiante_id) REFERENCES estudiante(id) ON DELETE RESTRICT,
    CONSTRAINT fk_anotacion_usuario
        FOREIGN KEY (registrada_por) REFERENCES usuario(id) ON DELETE RESTRICT
);

CREATE INDEX idx_anotacion_estudiante ON anotacion_positiva(estudiante_id);
CREATE INDEX idx_anotacion_fecha      ON anotacion_positiva(fecha);


-- Datos iniciales

INSERT INTO rol (nombre, descripcion) VALUES
    ('Administrador',   'Gestiona usuarios, roles y configuración del sistema'),
    ('Docente',         'Registra incidentes y anotaciones positivas'),
    ('Inspector',       'Registra y deriva incidentes'),
    ('Orientador',      'Gestiona casos e intervenciones'),
    ('Equipo Directivo','Supervisa y consulta reportes');

INSERT INTO gravedad (nombre, nivel, descripcion) VALUES
    ('Leve',      1, 'Falta menor que no afecta gravemente la convivencia'),
    ('Grave',     2, 'Falta que afecta significativamente la convivencia'),
    ('Muy grave', 3, 'Falta que vulnera derechos o requiere protocolo formal');

INSERT INTO estado_caso (nombre, descripcion) VALUES
    ('Abierto',        'Incidente recién registrado, sin intervención'),
    ('En seguimiento', 'Incidente con intervenciones en curso'),
    ('Cerrado',        'Incidente resuelto y sin acciones pendientes');

INSERT INTO rol_en_conflicto (nombre, descripcion) VALUES
    ('Agresor', 'Estudiante que ejerce la conducta agresiva'),
    ('Víctima', 'Estudiante que recibe la conducta agresiva'),
    ('Testigo', 'Estudiante presente que presencia el hecho');

INSERT INTO tipo_incidente (nombre, descripcion) VALUES
    ('Agresión verbal',     'Insultos, burlas, amenazas verbales'),
    ('Agresión física',     'Golpes, empujones, contacto físico violento'),
    ('Acoso escolar',       'Hostigamiento sistemático a un compañero'),
    ('Discriminación',      'Trato desigual por características personales'),
    ('Daño a la propiedad', 'Destrucción intencional de bienes ajenos o del colegio'),
    ('Otro',                'Incidente no clasificado en las categorías anteriores');

INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
    ('positivas_para_compensar', '3', 'Cantidad de anotaciones positivas necesarias para compensar una anotación negativa'),
    ('incidentes_graves_para_alerta','3','Cantidad de incidentes graves acumulados que dispara la alerta de reincidencia');