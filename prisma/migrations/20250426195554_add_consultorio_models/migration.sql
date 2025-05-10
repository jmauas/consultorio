-- CreateTable
CREATE TABLE "ConfiguracionConsultorio" (
    "id" TEXT NOT NULL,
    "nombreConsultorio" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "horarioAtencion" TEXT NOT NULL,
    "web" TEXT,
    "coberturas" TEXT NOT NULL,
    "limite" TIMESTAMP(3) NOT NULL,
    "feriados" TEXT[],
    "envio" BOOLEAN NOT NULL DEFAULT false,
    "horaEnvio" TEXT,
    "diasEnvio" TEXT,
    "calendario" TEXT NOT NULL DEFAULT 'primary',
    "redireccion" TEXT NOT NULL DEFAULT '/calendar/auth',
    "urlApp" TEXT NOT NULL,
    "resto" TEXT,
    "ia" TEXT NOT NULL DEFAULT 'openai',
    "iaModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "telHumano" TEXT,
    "modo" TEXT NOT NULL DEFAULT 'consultas',
    "puerto" TEXT NOT NULL DEFAULT '3003',
    "cuentas" TEXT NOT NULL DEFAULT 'json',
    "perfil" TEXT NOT NULL DEFAULT '4',
    "sucursal" TEXT NOT NULL DEFAULT '1',
    "sinPubli" BOOLEAN NOT NULL DEFAULT false,
    "base" TEXT NOT NULL DEFAULT 'nm',
    "ventasTN" BOOLEAN NOT NULL DEFAULT false,
    "tokenTN" TEXT,
    "storeTN" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionConsultorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" TEXT,
    "descripcion" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "feriados" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaDoctor" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dia" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "atencion" BOOLEAN NOT NULL,
    "desde" TEXT NOT NULL,
    "hasta" TEXT NOT NULL,
    "corteDesde" TEXT,
    "corteHasta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaDoctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTurnoDoctor" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoTurnoDoctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Validacion" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "base" TEXT,
    "token" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Validacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "dni" TEXT,
    "celular" TEXT NOT NULL,
    "email" TEXT,
    "cobertura" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" TEXT NOT NULL,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3) NOT NULL,
    "doctor" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "duracion" INTEGER NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT,
    "fhCambioEstado" TIMESTAMP(3),
    "hsAviso" TEXT,
    "penal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleAuth" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "tokens" JSONB,
    "refresh_token" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAuth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_dni_celular_key" ON "Paciente"("dni", "celular");

-- AddForeignKey
ALTER TABLE "AgendaDoctor" ADD CONSTRAINT "AgendaDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTurnoDoctor" ADD CONSTRAINT "TipoTurnoDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
