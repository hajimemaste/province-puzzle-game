import path from "path";
import sharp from "sharp";
import { prisma } from "../prisma/client";

const PIECES_DIR = path.join(__dirname, "..", "..", "uploads", "pieces");
const ORIGINALS_DIR = path.join(__dirname, "..", "..", "uploads", "originals");

export function originalsDir() {
  return ORIGINALS_DIR;
}

export function piecesDir() {
  return PIECES_DIR;
}

export async function getActivePuzzleImage() {
  return prisma.puzzleImage.findFirst({
    where: { isActive: true },
    include: { pieceAssignments: { include: { newProvince: true } } },
  });
}

export async function activatePuzzleImage(puzzleImageId: string) {
  await prisma.$transaction([
    prisma.puzzleImage.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.puzzleImage.update({ where: { id: puzzleImageId }, data: { isActive: true } }),
  ]);
}

interface AssignmentInput {
  newProvinceId: string;
  row: number;
  col: number;
}

export async function saveAssignmentsAndCropPieces(puzzleImageId: string, assignments: AssignmentInput[]) {
  const puzzleImage = await prisma.puzzleImage.findUniqueOrThrow({ where: { id: puzzleImageId } });
  const originalPath = path.join(ORIGINALS_DIR, path.basename(puzzleImage.imageUrl));
  const metadata = await sharp(originalPath).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    throw new Error("Unable to read source image dimensions");
  }

  const pieceWidth = Math.floor(width / puzzleImage.gridCols);
  const pieceHeight = Math.floor(height / puzzleImage.gridRows);

  await prisma.puzzleImagePieceAssignment.deleteMany({ where: { puzzleImageId } });

  for (const assignment of assignments) {
    const left = assignment.col * pieceWidth;
    const top = assignment.row * pieceHeight;
    const fileName = `piece_${assignment.newProvinceId}.webp`;
    const outputPath = path.join(PIECES_DIR, fileName);

    await sharp(originalPath)
      .extract({ left, top, width: pieceWidth, height: pieceHeight })
      .webp({ quality: 90 })
      .toFile(outputPath);

    await prisma.puzzleImagePieceAssignment.create({
      data: {
        puzzleImageId,
        newProvinceId: assignment.newProvinceId,
        row: assignment.row,
        col: assignment.col,
        pieceImageUrl: `/pieces/${fileName}`,
      },
    });
  }
}

export async function updatePuzzleImageSettings(
  puzzleImageId: string,
  data: { answerText?: string; completionMessage?: string }
) {
  return prisma.puzzleImage.update({ where: { id: puzzleImageId }, data });
}

function normalizeAnswer(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

interface StationAnswerResult {
  configured: boolean;
  correct: boolean;
  message?: string;
}

export async function verifyStationAnswer(
  answer: string,
  team: { playerName: string; level1TimeMs: number; level2TimeMs: number }
): Promise<StationAnswerResult> {
  const active = await getActivePuzzleImage();
  if (!active || !active.answerText) {
    return { configured: false, correct: false };
  }

  const correct = normalizeAnswer(answer) === normalizeAnswer(active.answerText);
  if (!correct) {
    return { configured: true, correct: false };
  }

  // Idempotent — a retry/double-click on an already-recorded team shouldn't
  // create a second completion entry on the live monitor.
  const existing = await prisma.scoreEntry.findFirst({
    where: { playerName: team.playerName, puzzleImageId: active.id },
  });

  if (!existing) {
    await prisma.scoreEntry.create({
      data: {
        playerName: team.playerName,
        level1TimeMs: team.level1TimeMs,
        level2TimeMs: team.level2TimeMs,
        totalTimeMs: team.level1TimeMs + team.level2TimeMs,
        puzzleImageId: active.id,
      },
    });
  }

  return { configured: true, correct: true, message: active.completionMessage };
}

export async function validateLevel2Placements(placements: { newProvinceId: string; row: number; col: number }[]) {
  const active = await getActivePuzzleImage();
  if (!active) {
    return { correct: false as const };
  }

  const assignments = active.pieceAssignments;
  if (placements.length !== assignments.length) {
    return { correct: false as const };
  }

  const byProvince = new Map(assignments.map((a) => [a.newProvinceId, a]));

  for (const placement of placements) {
    const expected = byProvince.get(placement.newProvinceId);
    if (!expected || expected.row !== placement.row || expected.col !== placement.col) {
      return { correct: false as const };
    }
  }

  return {
    correct: true as const,
    fullImageUrl: active.imageUrl,
  };
}
