-- CreateTable
CREATE TABLE "Empresa" (
    "EmpCod" INTEGER NOT NULL PRIMARY KEY,
    "EmpRaz" TEXT
);

-- CreateTable
CREATE TABLE "Modulo" (
    "ModCod" TEXT NOT NULL PRIMARY KEY,
    "ModNom" TEXT,
    "ModCaption" TEXT,
    "ModLin" TEXT,
    "ModOrd" INTEGER
);

-- CreateTable
CREATE TABLE "Pessoa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "EmpCod" INTEGER NOT NULL,
    "PesCod" INTEGER NOT NULL,
    "PesUsr" TEXT NOT NULL,
    "PesPassHash" TEXT NOT NULL,
    "PesNom" TEXT,
    "PesEml1" TEXT,
    "PesGAMGUID" TEXT
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "EmpCod" INTEGER NOT NULL,
    "RefTokCod" INTEGER NOT NULL,
    "PesCod" INTEGER NOT NULL,
    "TokenId" TEXT NOT NULL,
    "TokenHash" TEXT NOT NULL,
    "ExpiresAt" DATETIME NOT NULL,
    "RevokedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Pessoa_EmpCod_PesCod_key" ON "Pessoa"("EmpCod", "PesCod");
