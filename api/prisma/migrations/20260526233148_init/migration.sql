-- CreateTable
CREATE TABLE "rol" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_incidente" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipo_incidente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estado_caso" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estado_caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gravedad" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "nivel" INTEGER NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gravedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_en_conflicto" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rol_en_conflicto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" BIGSERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "correo" VARCHAR(255) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "rol_id" BIGINT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiante" (
    "id" BIGSERIAL NOT NULL,
    "run" VARCHAR(12) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "curso" VARCHAR(20) NOT NULL,
    "anio_academico" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidente" (
    "id" BIGSERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "gravedad_id" BIGINT NOT NULL,
    "tipo_incidente_id" BIGINT NOT NULL,
    "estado_caso_id" BIGINT NOT NULL,
    "registrado_por" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "incidente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participacion_en_incidente" (
    "id" BIGSERIAL NOT NULL,
    "incidente_id" BIGINT NOT NULL,
    "estudiante_id" BIGINT NOT NULL,
    "rol_en_conflicto_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participacion_en_incidente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervencion" (
    "id" BIGSERIAL NOT NULL,
    "incidente_id" BIGINT NOT NULL,
    "realizada_por" BIGINT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" VARCHAR(100) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "intervencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anotacion_positiva" (
    "id" BIGSERIAL NOT NULL,
    "estudiante_id" BIGINT NOT NULL,
    "registrada_por" BIGINT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "compensada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "anotacion_positiva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_incidente_nombre_key" ON "tipo_incidente"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_caso_nombre_key" ON "estado_caso"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "gravedad_nombre_key" ON "gravedad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "gravedad_nivel_key" ON "gravedad"("nivel");

-- CreateIndex
CREATE UNIQUE INDEX "rol_en_conflicto_nombre_key" ON "rol_en_conflicto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_sistema_clave_key" ON "configuracion_sistema"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE INDEX "usuario_correo_idx" ON "usuario"("correo");

-- CreateIndex
CREATE INDEX "usuario_rol_id_idx" ON "usuario"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "estudiante_run_key" ON "estudiante"("run");

-- CreateIndex
CREATE INDEX "estudiante_run_idx" ON "estudiante"("run");

-- CreateIndex
CREATE INDEX "estudiante_curso_anio_academico_idx" ON "estudiante"("curso", "anio_academico");

-- CreateIndex
CREATE INDEX "estudiante_nombre_idx" ON "estudiante"("nombre");

-- CreateIndex
CREATE INDEX "incidente_fecha_idx" ON "incidente"("fecha");

-- CreateIndex
CREATE INDEX "incidente_gravedad_id_idx" ON "incidente"("gravedad_id");

-- CreateIndex
CREATE INDEX "incidente_estado_caso_id_idx" ON "incidente"("estado_caso_id");

-- CreateIndex
CREATE INDEX "incidente_registrado_por_idx" ON "incidente"("registrado_por");

-- CreateIndex
CREATE INDEX "participacion_en_incidente_incidente_id_idx" ON "participacion_en_incidente"("incidente_id");

-- CreateIndex
CREATE INDEX "participacion_en_incidente_estudiante_id_idx" ON "participacion_en_incidente"("estudiante_id");

-- CreateIndex
CREATE UNIQUE INDEX "participacion_en_incidente_incidente_id_estudiante_id_rol_e_key" ON "participacion_en_incidente"("incidente_id", "estudiante_id", "rol_en_conflicto_id");

-- CreateIndex
CREATE INDEX "intervencion_incidente_id_idx" ON "intervencion"("incidente_id");

-- CreateIndex
CREATE INDEX "intervencion_fecha_idx" ON "intervencion"("fecha");

-- CreateIndex
CREATE INDEX "anotacion_positiva_estudiante_id_idx" ON "anotacion_positiva"("estudiante_id");

-- CreateIndex
CREATE INDEX "anotacion_positiva_fecha_idx" ON "anotacion_positiva"("fecha");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidente" ADD CONSTRAINT "incidente_gravedad_id_fkey" FOREIGN KEY ("gravedad_id") REFERENCES "gravedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidente" ADD CONSTRAINT "incidente_tipo_incidente_id_fkey" FOREIGN KEY ("tipo_incidente_id") REFERENCES "tipo_incidente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidente" ADD CONSTRAINT "incidente_estado_caso_id_fkey" FOREIGN KEY ("estado_caso_id") REFERENCES "estado_caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidente" ADD CONSTRAINT "incidente_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacion_en_incidente" ADD CONSTRAINT "participacion_en_incidente_incidente_id_fkey" FOREIGN KEY ("incidente_id") REFERENCES "incidente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacion_en_incidente" ADD CONSTRAINT "participacion_en_incidente_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacion_en_incidente" ADD CONSTRAINT "participacion_en_incidente_rol_en_conflicto_id_fkey" FOREIGN KEY ("rol_en_conflicto_id") REFERENCES "rol_en_conflicto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervencion" ADD CONSTRAINT "intervencion_incidente_id_fkey" FOREIGN KEY ("incidente_id") REFERENCES "incidente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervencion" ADD CONSTRAINT "intervencion_realizada_por_fkey" FOREIGN KEY ("realizada_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacion_positiva" ADD CONSTRAINT "anotacion_positiva_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacion_positiva" ADD CONSTRAINT "anotacion_positiva_registrada_por_fkey" FOREIGN KEY ("registrada_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
