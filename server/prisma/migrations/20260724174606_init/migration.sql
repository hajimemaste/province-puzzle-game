-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NewProvince" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OldProvince" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newProvinceId" TEXT NOT NULL,
    CONSTRAINT "OldProvince_newProvinceId_fkey" FOREIGN KEY ("newProvinceId") REFERENCES "NewProvince" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PuzzleImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "gridRows" INTEGER NOT NULL,
    "gridCols" INTEGER NOT NULL,
    "answerText" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PuzzleImagePieceAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puzzleImageId" TEXT NOT NULL,
    "newProvinceId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "pieceImageUrl" TEXT,
    CONSTRAINT "PuzzleImagePieceAssignment_puzzleImageId_fkey" FOREIGN KEY ("puzzleImageId") REFERENCES "PuzzleImage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PuzzleImagePieceAssignment_newProvinceId_fkey" FOREIGN KEY ("newProvinceId") REFERENCES "NewProvince" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerName" TEXT NOT NULL,
    "level1TimeMs" INTEGER NOT NULL,
    "level2TimeMs" INTEGER NOT NULL,
    "totalTimeMs" INTEGER NOT NULL,
    "puzzleImageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreEntry_puzzleImageId_fkey" FOREIGN KEY ("puzzleImageId") REFERENCES "PuzzleImage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleImagePieceAssignment_puzzleImageId_newProvinceId_key" ON "PuzzleImagePieceAssignment"("puzzleImageId", "newProvinceId");
