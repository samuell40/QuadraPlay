ALTER TABLE "Agendamento"
ADD COLUMN "encaixe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "limiteSemanalAtingido" BOOLEAN NOT NULL DEFAULT false;
