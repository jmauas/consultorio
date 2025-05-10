-- CreateTable
CREATE TABLE "_TipoTurnoConsultorio" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TipoTurnoConsultorio_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TipoTurnoConsultorio_B_index" ON "_TipoTurnoConsultorio"("B");

-- AddForeignKey
ALTER TABLE "_TipoTurnoConsultorio" ADD CONSTRAINT "_TipoTurnoConsultorio_A_fkey" FOREIGN KEY ("A") REFERENCES "Consultorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TipoTurnoConsultorio" ADD CONSTRAINT "_TipoTurnoConsultorio_B_fkey" FOREIGN KEY ("B") REFERENCES "TipoTurnoDoctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
