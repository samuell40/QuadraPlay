ALTER TABLE "Usuario"
ADD COLUMN "emailPendente" TEXT,
ADD COLUMN "emailPendenteTokenHash" TEXT,
ADD COLUMN "emailPendenteCodigoHash" VARCHAR(128),
ADD COLUMN "emailPendenteExpiraEm" TIMESTAMP(3);

CREATE UNIQUE INDEX "Usuario_emailPendente_key" ON "Usuario"("emailPendente");
CREATE UNIQUE INDEX "Usuario_emailPendenteTokenHash_key" ON "Usuario"("emailPendenteTokenHash");
