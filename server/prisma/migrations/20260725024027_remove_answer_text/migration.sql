-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PuzzleImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "gridRows" INTEGER NOT NULL,
    "gridCols" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PuzzleImage" ("createdAt", "gridCols", "gridRows", "id", "imageUrl", "isActive") SELECT "createdAt", "gridCols", "gridRows", "id", "imageUrl", "isActive" FROM "PuzzleImage";
DROP TABLE "PuzzleImage";
ALTER TABLE "new_PuzzleImage" RENAME TO "PuzzleImage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

