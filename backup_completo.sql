

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Account" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "type" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "providerAccountId" "text" NOT NULL,
    "refresh_token" "text",
    "access_token" "text",
    "expires_at" integer,
    "token_type" "text",
    "scope" "text",
    "id_token" "text",
    "session_state" "text"
);


ALTER TABLE "public"."Account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."AgendaDoctor" (
    "id" "text" NOT NULL,
    "doctorId" "text" NOT NULL,
    "consultorioId" "text",
    "dia" integer NOT NULL,
    "nombre" "text" NOT NULL,
    "atencion" boolean NOT NULL,
    "desde" "text" NOT NULL,
    "hasta" "text" NOT NULL,
    "corteDesde" "text",
    "corteHasta" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "fecha" timestamp(3) without time zone
);


ALTER TABLE "public"."AgendaDoctor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."CoberturaMedica" (
    "id" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "codigo" "text",
    "habilitado" boolean DEFAULT true NOT NULL,
    "color" "text" DEFAULT '#CCCCCC'::"text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."CoberturaMedica" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ConfiguracionConsultorio" (
    "id" "text" NOT NULL,
    "nombreConsultorio" "text" NOT NULL,
    "domicilio" "text" NOT NULL,
    "telefono" "text" NOT NULL,
    "mail" "text" NOT NULL,
    "horarioAtencion" "text" NOT NULL,
    "web" "text",
    "coberturas" "text" NOT NULL,
    "limite" timestamp(3) without time zone NOT NULL,
    "feriados" "text"[],
    "envio" boolean DEFAULT false NOT NULL,
    "horaEnvio" "text",
    "diasEnvio" "text",
    "envioMail" boolean DEFAULT false NOT NULL,
    "horaEnvioMail" "text",
    "diasEnvioMail" "text",
    "urlApp" "text" NOT NULL,
    "urlAppDev" "text",
    "logoUrl" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ConfiguracionConsultorio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Consultorio" (
    "id" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "direccion" "text",
    "telefono" "text",
    "email" "text",
    "color" "text" DEFAULT '#CCCCCC'::"text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."Consultorio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."CuentasWhatsapp" (
    "id" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "url" "text" NOT NULL,
    "token" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."CuentasWhatsapp" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Paciente" (
    "id" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "apellido" "text",
    "dni" "text",
    "celular" "text" NOT NULL,
    "email" "text",
    "cobertura" "text",
    "coberturaMedicaId" "text",
    "observaciones" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" "text",
    "updatedById" "text"
);


ALTER TABLE "public"."Paciente" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Session" (
    "id" "text" NOT NULL,
    "sessionToken" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "expires" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."TipoTurnoDoctor" (
    "id" "text" NOT NULL,
    "doctorId" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "duracion" "text" NOT NULL,
    "habilitado" boolean DEFAULT true NOT NULL,
    "publico" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."TipoTurnoDoctor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Turno" (
    "id" "text" NOT NULL,
    "desde" timestamp(3) without time zone NOT NULL,
    "hasta" timestamp(3) without time zone NOT NULL,
    "servicio" "text" NOT NULL,
    "duracion" integer NOT NULL,
    "pacienteId" "text" NOT NULL,
    "confirmado" boolean DEFAULT false NOT NULL,
    "estado" "text",
    "fhCambioEstado" timestamp(3) without time zone,
    "hsAviso" "text",
    "penal" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" "text",
    "updatedById" "text",
    "consultorioId" "text" NOT NULL,
    "doctorId" "text" NOT NULL,
    "observaciones" "text",
    "token" "text",
    "coberturaMedicaId" "text",
    "tipoDeTurnoId" "text"
);


ALTER TABLE "public"."Turno" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."VerificationToken" (
    "identifier" "text" NOT NULL,
    "token" "text" NOT NULL,
    "expires" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."VerificationToken" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_TipoTurnoConsultorio" (
    "A" "text" NOT NULL,
    "B" "text" NOT NULL
);


ALTER TABLE "public"."_TipoTurnoConsultorio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_UserDoctores" (
    "A" "text" NOT NULL,
    "B" "text" NOT NULL
);


ALTER TABLE "public"."_UserDoctores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doctores" (
    "id" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "feriados" "text"[],
    "color" "text" DEFAULT '#CCCCCC'::"text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."doctores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_tokens" (
    "email" "text" NOT NULL,
    "token" "text" NOT NULL,
    "expires" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."email_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text" NOT NULL,
    "name" "text",
    "email" "text",
    "emailVerified" timestamp(3) without time zone,
    "image" "text",
    "password" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "token" "text",
    "tokenExpires" timestamp(3) without time zone,
    "perfil" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."AgendaDoctor"
    ADD CONSTRAINT "AgendaDoctor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."CoberturaMedica"
    ADD CONSTRAINT "CoberturaMedica_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ConfiguracionConsultorio"
    ADD CONSTRAINT "ConfiguracionConsultorio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Consultorio"
    ADD CONSTRAINT "Consultorio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."CuentasWhatsapp"
    ADD CONSTRAINT "CuentasWhatsapp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Paciente"
    ADD CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."TipoTurnoDoctor"
    ADD CONSTRAINT "TipoTurnoDoctor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Turno"
    ADD CONSTRAINT "Turno_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_TipoTurnoConsultorio"
    ADD CONSTRAINT "_TipoTurnoConsultorio_AB_pkey" PRIMARY KEY ("A", "B");



ALTER TABLE ONLY "public"."_UserDoctores"
    ADD CONSTRAINT "_UserDoctores_AB_pkey" PRIMARY KEY ("A", "B");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."doctores"
    ADD CONSTRAINT "doctores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_tokens"
    ADD CONSTRAINT "email_tokens_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account" USING "btree" ("provider", "providerAccountId");



CREATE UNIQUE INDEX "Paciente_dni_celular_key" ON "public"."Paciente" USING "btree" ("dni", "celular");



CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session" USING "btree" ("sessionToken");



CREATE UNIQUE INDEX "Turno_token_key" ON "public"."Turno" USING "btree" ("token");



CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken" USING "btree" ("identifier", "token");



CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken" USING "btree" ("token");



CREATE INDEX "_TipoTurnoConsultorio_B_index" ON "public"."_TipoTurnoConsultorio" USING "btree" ("B");



CREATE INDEX "_UserDoctores_B_index" ON "public"."_UserDoctores" USING "btree" ("B");



CREATE UNIQUE INDEX "email_tokens_email_key" ON "public"."email_tokens" USING "btree" ("email");



CREATE UNIQUE INDEX "users_email_key" ON "public"."users" USING "btree" ("email");



ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."AgendaDoctor"
    ADD CONSTRAINT "AgendaDoctor_consultorioId_fkey" FOREIGN KEY ("consultorioId") REFERENCES "public"."Consultorio"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."AgendaDoctor"
    ADD CONSTRAINT "AgendaDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctores"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Paciente"
    ADD CONSTRAINT "Paciente_coberturaMedicaId_fkey" FOREIGN KEY ("coberturaMedicaId") REFERENCES "public"."CoberturaMedica"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Paciente"
    ADD CONSTRAINT "Paciente_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Paciente"
    ADD CONSTRAINT "Paciente_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."TipoTurnoDoctor"
    ADD CONSTRAINT "TipoTurnoDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctores"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Turno"
    ADD CONSTRAINT "Turno_coberturaMedicaId_fkey" FOREIGN KEY ("coberturaMedicaId") REFERENCES "public"."CoberturaMedica"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Turno"
    ADD CONSTRAINT "Turno_consultorioId_fkey" FOREIGN KEY ("consultorioId") REFERENCES "public"."Consultorio"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Turno"
    ADD CONSTRAINT "Turno_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Turno"
    ADD CONSTRAINT "Turno_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."doctores"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Turno"
    ADD CONSTRAINT "Turno_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "public"."Paciente"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Turno"
    ADD CONSTRAINT "Turno_tipoDeTurnoId_fkey" FOREIGN KEY ("tipoDeTurnoId") REFERENCES "public"."TipoTurnoDoctor"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Turno"
    ADD CONSTRAINT "Turno_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."_TipoTurnoConsultorio"
    ADD CONSTRAINT "_TipoTurnoConsultorio_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Consultorio"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_TipoTurnoConsultorio"
    ADD CONSTRAINT "_TipoTurnoConsultorio_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."TipoTurnoDoctor"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_UserDoctores"
    ADD CONSTRAINT "_UserDoctores_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."doctores"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."_UserDoctores"
    ADD CONSTRAINT "_UserDoctores_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;

RESET ALL;
