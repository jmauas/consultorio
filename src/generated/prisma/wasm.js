
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime,
  createParam,
} = require('./runtime/wasm.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  password: 'password',
  enabled: 'enabled',
  token: 'token',
  tokenExpires: 'tokenExpires',
  perfil: 'perfil'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.ConfiguracionConsultorioScalarFieldEnum = {
  id: 'id',
  nombreConsultorio: 'nombreConsultorio',
  domicilio: 'domicilio',
  telefono: 'telefono',
  mail: 'mail',
  horarioAtencion: 'horarioAtencion',
  web: 'web',
  coberturas: 'coberturas',
  limite: 'limite',
  feriados: 'feriados',
  envio: 'envio',
  horaEnvio: 'horaEnvio',
  diasEnvio: 'diasEnvio',
  envioMail: 'envioMail',
  horaEnvioMail: 'horaEnvioMail',
  diasEnvioMail: 'diasEnvioMail',
  urlApp: 'urlApp',
  urlAppDev: 'urlAppDev',
  logoUrl: 'logoUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConsultorioScalarFieldEnum = {
  id: 'id',
  nombre: 'nombre',
  direccion: 'direccion',
  telefono: 'telefono',
  email: 'email',
  color: 'color',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DoctorScalarFieldEnum = {
  id: 'id',
  nombre: 'nombre',
  emoji: 'emoji',
  feriados: 'feriados',
  color: 'color',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AgendaDoctorScalarFieldEnum = {
  id: 'id',
  doctorId: 'doctorId',
  consultorioId: 'consultorioId',
  dia: 'dia',
  fecha: 'fecha',
  nombre: 'nombre',
  atencion: 'atencion',
  desde: 'desde',
  hasta: 'hasta',
  corteDesde: 'corteDesde',
  corteHasta: 'corteHasta',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TipoTurnoDoctorScalarFieldEnum = {
  id: 'id',
  doctorId: 'doctorId',
  nombre: 'nombre',
  duracion: 'duracion',
  habilitado: 'habilitado',
  publico: 'publico',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PacienteScalarFieldEnum = {
  id: 'id',
  nombre: 'nombre',
  apellido: 'apellido',
  dni: 'dni',
  celular: 'celular',
  email: 'email',
  cobertura: 'cobertura',
  coberturaMedicaId: 'coberturaMedicaId',
  observaciones: 'observaciones',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById',
  updatedById: 'updatedById'
};

exports.Prisma.TurnoScalarFieldEnum = {
  id: 'id',
  desde: 'desde',
  hasta: 'hasta',
  servicio: 'servicio',
  duracion: 'duracion',
  pacienteId: 'pacienteId',
  confirmado: 'confirmado',
  estado: 'estado',
  fhCambioEstado: 'fhCambioEstado',
  hsAviso: 'hsAviso',
  penal: 'penal',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdById: 'createdById',
  updatedById: 'updatedById',
  consultorioId: 'consultorioId',
  doctorId: 'doctorId',
  observaciones: 'observaciones',
  token: 'token',
  coberturaMedicaId: 'coberturaMedicaId',
  tipoDeTurnoId: 'tipoDeTurnoId'
};

exports.Prisma.EmailTokenScalarFieldEnum = {
  email: 'email',
  token: 'token',
  expires: 'expires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CoberturaMedicaScalarFieldEnum = {
  id: 'id',
  nombre: 'nombre',
  codigo: 'codigo',
  habilitado: 'habilitado',
  color: 'color',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CuentasWhatsappScalarFieldEnum = {
  id: 'id',
  nombre: 'nombre',
  url: 'url',
  token: 'token',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Account: 'Account',
  Session: 'Session',
  User: 'User',
  VerificationToken: 'VerificationToken',
  ConfiguracionConsultorio: 'ConfiguracionConsultorio',
  Consultorio: 'Consultorio',
  Doctor: 'Doctor',
  AgendaDoctor: 'AgendaDoctor',
  TipoTurnoDoctor: 'TipoTurnoDoctor',
  Paciente: 'Paciente',
  Turno: 'Turno',
  EmailToken: 'EmailToken',
  CoberturaMedica: 'CoberturaMedica',
  CuentasWhatsapp: 'CuentasWhatsapp'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Proyectos\\Actuales\\Consultorio-nextjs\\proyecto\\src\\generated\\prisma",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "binary"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      },
      {
        "fromEnvVar": null,
        "value": "rhel-openssl-1.0.x"
      },
      {
        "fromEnvVar": null,
        "value": "rhel-openssl-3.0.x"
      },
      {
        "fromEnvVar": null,
        "value": "linux-musl"
      },
      {
        "fromEnvVar": null,
        "value": "debian-openssl-1.1.x"
      },
      {
        "fromEnvVar": null,
        "value": "debian-openssl-3.0.x"
      },
      {
        "fromEnvVar": null,
        "value": "linux-musl-openssl-3.0.x"
      }
    ],
    "previewFeatures": [
      "driverAdapters"
    ],
    "sourceFilePath": "C:\\Proyectos\\Actuales\\Consultorio-nextjs\\proyecto\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../../../prisma",
  "clientVersion": "6.6.0",
  "engineVersion": "f676762280b54cd07c770017ed3711ddde35f37a",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider        = \"prisma-client-js\"\n  output          = \"../src/generated/prisma\"\n  binaryTargets   = [\"native\", \"rhel-openssl-1.0.x\", \"rhel-openssl-3.0.x\", \"linux-musl\", \"debian-openssl-1.1.x\", \"debian-openssl-3.0.x\", \"linux-musl-openssl-3.0.x\"]\n  previewFeatures = [\"driverAdapters\"]\n  engineType      = \"binary\"\n}\n\ndatasource db {\n  provider  = \"postgresql\"\n  url       = env(\"DATABASE_URL\")\n  directUrl = env(\"DIRECT_URL\")\n}\n\nmodel Account {\n  id                String  @id @default(cuid())\n  userId            String\n  type              String\n  provider          String\n  providerAccountId String\n  refresh_token     String?\n  access_token      String?\n  expires_at        Int?\n  token_type        String?\n  scope             String?\n  id_token          String?\n  session_state     String?\n  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([provider, providerAccountId])\n}\n\nmodel Session {\n  id           String   @id @default(cuid())\n  sessionToken String   @unique\n  userId       String\n  expires      DateTime\n  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n}\n\nmodel User {\n  id                String     @id @default(cuid())\n  name              String?\n  email             String?    @unique\n  emailVerified     DateTime?\n  image             String?\n  password          String?\n  enabled           Boolean    @default(true)\n  token             String?\n  tokenExpires      DateTime?\n  perfil            Int        @default(1)\n  accounts          Account[]\n  sessions          Session[]\n  pacientesCreados  Paciente[] @relation(\"PacienteCreatedBy\")\n  pacientesEditados Paciente[] @relation(\"PacienteUpdatedBy\")\n  turnosCreados     Turno[]    @relation(\"TurnoCreatedBy\")\n  turnosEditados    Turno[]    @relation(\"TurnoUpdatedBy\")\n  doctores          Doctor[]   @relation(\"UserDoctores\")\n\n  @@map(\"users\")\n}\n\nmodel VerificationToken {\n  identifier String\n  token      String   @unique\n  expires    DateTime\n\n  @@unique([identifier, token])\n}\n\nmodel ConfiguracionConsultorio {\n  id                String   @id @default(cuid())\n  nombreConsultorio String\n  domicilio         String\n  telefono          String\n  mail              String\n  horarioAtencion   String\n  web               String?\n  coberturas        String\n  limite            DateTime\n  feriados          String[]\n  envio             Boolean  @default(false)\n  horaEnvio         String?\n  diasEnvio         String?\n  envioMail         Boolean  @default(false)\n  horaEnvioMail     String?\n  diasEnvioMail     String?\n  urlApp            String\n  urlAppDev         String?\n  logoUrl           String?\n  createdAt         DateTime @default(now())\n  updatedAt         DateTime @updatedAt\n}\n\nmodel Consultorio {\n  id           String            @id @default(cuid())\n  nombre       String\n  direccion    String?\n  telefono     String?\n  email        String?\n  color        String?           @default(\"#CCCCCC\") // Nuevo campo color con valor predeterminado gris claro\n  createdAt    DateTime          @default(now())\n  updatedAt    DateTime          @default(now()) @updatedAt\n  turnos       Turno[]\n  agendaDoctor AgendaDoctor[]\n  tiposTurno   TipoTurnoDoctor[] @relation(\"TipoTurnoConsultorio\") // Relación inversa con TipoTurnoDoctor\n}\n\nmodel Doctor {\n  id              String            @id @default(cuid())\n  nombre          String\n  emoji           String\n  feriados        String[]\n  color           String?           @default(\"#CCCCCC\") // Campo de color para el doctor\n  createdAt       DateTime          @default(now())\n  updatedAt       DateTime          @updatedAt\n  AgendaDoctor    AgendaDoctor[]\n  TipoTurnoDoctor TipoTurnoDoctor[]\n  Turno           Turno[]\n  usuarios        User[]            @relation(\"UserDoctores\")\n\n  @@map(\"doctores\")\n}\n\nmodel AgendaDoctor {\n  id            String       @id @default(cuid())\n  doctorId      String\n  consultorioId String? // Added consultorioId field\n  dia           Int\n  fecha         DateTime? // Nueva columna fecha de tipo DateTime que puede ser nula\n  nombre        String\n  atencion      Boolean\n  desde         String\n  hasta         String\n  corteDesde    String?\n  corteHasta    String?\n  createdAt     DateTime     @default(now())\n  updatedAt     DateTime     @updatedAt\n  doctor        Doctor       @relation(fields: [doctorId], references: [id], onDelete: Cascade)\n  consultorio   Consultorio? @relation(fields: [consultorioId], references: [id])\n}\n\nmodel TipoTurnoDoctor {\n  id           String        @id @default(cuid())\n  doctorId     String\n  nombre       String\n  duracion     String\n  habilitado   Boolean       @default(true)\n  publico      Boolean       @default(true)\n  createdAt    DateTime      @default(now())\n  updatedAt    DateTime      @default(now()) @updatedAt\n  doctor       Doctor        @relation(fields: [doctorId], references: [id], onDelete: Cascade)\n  consultorios Consultorio[] @relation(\"TipoTurnoConsultorio\") // Nueva relación muchos a muchos con Consultorio\n  turnos       Turno[] // Relación inversa con Turno\n}\n\nmodel Paciente {\n  id                String           @id @default(cuid())\n  nombre            String\n  apellido          String?\n  dni               String?\n  celular           String\n  email             String?\n  cobertura         String? // Mantenemos este campo por compatibilidad\n  coberturaMedicaId String? // Nuevo campo para la relación\n  observaciones     String?\n  createdAt         DateTime         @default(now())\n  updatedAt         DateTime         @updatedAt\n  createdById       String? // ID del usuario que creó el registro\n  updatedById       String? // ID del usuario que actualizó el registro\n  turnos            Turno[]\n  coberturaMedica   CoberturaMedica? @relation(fields: [coberturaMedicaId], references: [id])\n  createdBy         User?            @relation(\"PacienteCreatedBy\", fields: [createdById], references: [id])\n  updatedBy         User?            @relation(\"PacienteUpdatedBy\", fields: [updatedById], references: [id])\n\n  @@unique([dni, celular])\n}\n\nmodel Turno {\n  id                String           @id @default(cuid())\n  desde             DateTime\n  hasta             DateTime\n  servicio          String\n  duracion          Int\n  pacienteId        String\n  confirmado        Boolean          @default(false)\n  estado            String?\n  fhCambioEstado    DateTime?\n  hsAviso           String?\n  penal             String?\n  createdAt         DateTime         @default(now())\n  updatedAt         DateTime         @updatedAt\n  createdById       String? // ID del usuario que creó el registro\n  updatedById       String? // ID del usuario que actualizó el registro\n  consultorioId     String\n  doctorId          String\n  observaciones     String?\n  token             String?          @unique\n  coberturaMedicaId String? // Nuevo campo para la relación\n  tipoDeTurnoId     String? // Nuevo campo para relacionar con TipoTurnoDoctor\n  consultorio       Consultorio      @relation(fields: [consultorioId], references: [id])\n  doctor            Doctor           @relation(fields: [doctorId], references: [id])\n  paciente          Paciente         @relation(fields: [pacienteId], references: [id], onDelete: Cascade)\n  coberturaMedica   CoberturaMedica? @relation(fields: [coberturaMedicaId], references: [id])\n  tipoDeTurno       TipoTurnoDoctor? @relation(fields: [tipoDeTurnoId], references: [id])\n  createdBy         User?            @relation(\"TurnoCreatedBy\", fields: [createdById], references: [id])\n  updatedBy         User?            @relation(\"TurnoUpdatedBy\", fields: [updatedById], references: [id])\n}\n\nmodel EmailToken {\n  email     String   @id @unique\n  token     String\n  expires   DateTime\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@map(\"email_tokens\")\n}\n\nmodel CoberturaMedica {\n  id         String     @id @default(cuid())\n  nombre     String\n  codigo     String? // Campo código añadido\n  habilitado Boolean    @default(true)\n  color      String?    @default(\"#CCCCCC\") // Nuevo campo color con valor predeterminado gris claro\n  createdAt  DateTime   @default(now())\n  updatedAt  DateTime   @updatedAt\n  pacientes  Paciente[] // Relación inversa con Paciente\n  turnos     Turno[] // Relación inversa con Turno\n}\n\nmodel CuentasWhatsapp {\n  id        String   @id @default(cuid())\n  nombre    String\n  url       String\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n",
  "inlineSchemaHash": "8ee4ebe7896f22f37bb0894791ace39b93688573854b26d045a9289967684365",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"Account\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"provider\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"providerAccountId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"refresh_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"access_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires_at\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"token_type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"scope\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"id_token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"session_state\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AccountToUser\"}],\"dbName\":null},\"Session\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sessionToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SessionToUser\"}],\"dbName\":null},\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"emailVerified\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"image\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"enabled\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tokenExpires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"perfil\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"accounts\",\"kind\":\"object\",\"type\":\"Account\",\"relationName\":\"AccountToUser\"},{\"name\":\"sessions\",\"kind\":\"object\",\"type\":\"Session\",\"relationName\":\"SessionToUser\"},{\"name\":\"pacientesCreados\",\"kind\":\"object\",\"type\":\"Paciente\",\"relationName\":\"PacienteCreatedBy\"},{\"name\":\"pacientesEditados\",\"kind\":\"object\",\"type\":\"Paciente\",\"relationName\":\"PacienteUpdatedBy\"},{\"name\":\"turnosCreados\",\"kind\":\"object\",\"type\":\"Turno\",\"relationName\":\"TurnoCreatedBy\"},{\"name\":\"turnosEditados\",\"kind\":\"object\",\"type\":\"Turno\",\"relationName\":\"TurnoUpdatedBy\"},{\"name\":\"doctores\",\"kind\":\"object\",\"type\":\"Doctor\",\"relationName\":\"UserDoctores\"}],\"dbName\":\"users\"},\"VerificationToken\":{\"fields\":[{\"name\":\"identifier\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"ConfiguracionConsultorio\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nombreConsultorio\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"domicilio\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"telefono\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"mail\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"horarioAtencion\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"web\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"coberturas\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"limite\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"feriados\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"envio\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"horaEnvio\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"diasEnvio\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"envioMail\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"horaEnvioMail\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"diasEnvioMail\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"urlApp\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"urlAppDev\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"logoUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"Consultorio\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nombre\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"direccion\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"telefono\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"color\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"turnos\",\"kind\":\"object\",\"type\":\"Turno\",\"relationName\":\"ConsultorioToTurno\"},{\"name\":\"agendaDoctor\",\"kind\":\"object\",\"type\":\"AgendaDoctor\",\"relationName\":\"AgendaDoctorToConsultorio\"},{\"name\":\"tiposTurno\",\"kind\":\"object\",\"type\":\"TipoTurnoDoctor\",\"relationName\":\"TipoTurnoConsultorio\"}],\"dbName\":null},\"Doctor\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nombre\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"emoji\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"feriados\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"color\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"AgendaDoctor\",\"kind\":\"object\",\"type\":\"AgendaDoctor\",\"relationName\":\"AgendaDoctorToDoctor\"},{\"name\":\"TipoTurnoDoctor\",\"kind\":\"object\",\"type\":\"TipoTurnoDoctor\",\"relationName\":\"DoctorToTipoTurnoDoctor\"},{\"name\":\"Turno\",\"kind\":\"object\",\"type\":\"Turno\",\"relationName\":\"DoctorToTurno\"},{\"name\":\"usuarios\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserDoctores\"}],\"dbName\":\"doctores\"},\"AgendaDoctor\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"doctorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"consultorioId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"dia\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"fecha\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"nombre\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"atencion\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"desde\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"hasta\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"corteDesde\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"corteHasta\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"doctor\",\"kind\":\"object\",\"type\":\"Doctor\",\"relationName\":\"AgendaDoctorToDoctor\"},{\"name\":\"consultorio\",\"kind\":\"object\",\"type\":\"Consultorio\",\"relationName\":\"AgendaDoctorToConsultorio\"}],\"dbName\":null},\"TipoTurnoDoctor\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"doctorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nombre\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"duracion\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"habilitado\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"publico\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"doctor\",\"kind\":\"object\",\"type\":\"Doctor\",\"relationName\":\"DoctorToTipoTurnoDoctor\"},{\"name\":\"consultorios\",\"kind\":\"object\",\"type\":\"Consultorio\",\"relationName\":\"TipoTurnoConsultorio\"},{\"name\":\"turnos\",\"kind\":\"object\",\"type\":\"Turno\",\"relationName\":\"TipoTurnoDoctorToTurno\"}],\"dbName\":null},\"Paciente\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nombre\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"apellido\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"dni\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"celular\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"cobertura\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"coberturaMedicaId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"observaciones\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"updatedById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"turnos\",\"kind\":\"object\",\"type\":\"Turno\",\"relationName\":\"PacienteToTurno\"},{\"name\":\"coberturaMedica\",\"kind\":\"object\",\"type\":\"CoberturaMedica\",\"relationName\":\"CoberturaMedicaToPaciente\"},{\"name\":\"createdBy\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"PacienteCreatedBy\"},{\"name\":\"updatedBy\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"PacienteUpdatedBy\"}],\"dbName\":null},\"Turno\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"desde\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"hasta\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"servicio\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"duracion\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"pacienteId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"confirmado\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"estado\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"fhCambioEstado\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"hsAviso\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"penal\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"updatedById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"consultorioId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"doctorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"observaciones\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"coberturaMedicaId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tipoDeTurnoId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"consultorio\",\"kind\":\"object\",\"type\":\"Consultorio\",\"relationName\":\"ConsultorioToTurno\"},{\"name\":\"doctor\",\"kind\":\"object\",\"type\":\"Doctor\",\"relationName\":\"DoctorToTurno\"},{\"name\":\"paciente\",\"kind\":\"object\",\"type\":\"Paciente\",\"relationName\":\"PacienteToTurno\"},{\"name\":\"coberturaMedica\",\"kind\":\"object\",\"type\":\"CoberturaMedica\",\"relationName\":\"CoberturaMedicaToTurno\"},{\"name\":\"tipoDeTurno\",\"kind\":\"object\",\"type\":\"TipoTurnoDoctor\",\"relationName\":\"TipoTurnoDoctorToTurno\"},{\"name\":\"createdBy\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"TurnoCreatedBy\"},{\"name\":\"updatedBy\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"TurnoUpdatedBy\"}],\"dbName\":null},\"EmailToken\":{\"fields\":[{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"email_tokens\"},\"CoberturaMedica\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nombre\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"codigo\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"habilitado\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"color\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"pacientes\",\"kind\":\"object\",\"type\":\"Paciente\",\"relationName\":\"CoberturaMedicaToPaciente\"},{\"name\":\"turnos\",\"kind\":\"object\",\"type\":\"Turno\",\"relationName\":\"CoberturaMedicaToTurno\"}],\"dbName\":null},\"CuentasWhatsapp\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nombre\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"url\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: async () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine
  }
}
config.compilerWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

