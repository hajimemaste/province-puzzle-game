import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { validateLevel1Complete, validateMerge } from "../services/merge.service";
import { getActivePuzzleImage, validateLevel2Placements, verifyStationAnswer } from "../services/puzzleImage.service";

export async function listOldProvinces(_req: Request, res: Response) {
  const items = await prisma.oldProvince.findMany({
    select: { id: true, name: true },
    orderBy: { order: "asc" },
  });
  res.json(items);
}

const mergeSchema = z.object({
  provinceIds: z.array(z.string().min(1)).min(1),
});

export async function postValidateMerge(req: Request, res: Response) {
  const parsed = mergeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const result = await validateMerge(parsed.data.provinceIds);
  res.json(result);
}

const level1CompleteSchema = z.object({
  lockedNewProvinceIds: z.array(z.string().min(1)),
});

export async function postLevel1Complete(req: Request, res: Response) {
  const parsed = level1CompleteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const result = await validateLevel1Complete(parsed.data.lockedNewProvinceIds);
  res.json(result);
}

export async function getPuzzleCanvas(_req: Request, res: Response) {
  const active = await getActivePuzzleImage();
  if (!active) {
    return res.status(404).json({ error: "Chưa có ảnh ghép nào được thiết lập" });
  }

  // Only the outline shape is public — which piece belongs in which cell is
  // the answer, and must never be exposed before the player solves it.
  res.json({
    gridRows: active.gridRows,
    gridCols: active.gridCols,
    filledCells: active.pieceAssignments.map((a) => ({ row: a.row, col: a.col })),
  });
}

export async function listPieces(_req: Request, res: Response) {
  const active = await getActivePuzzleImage();
  if (!active) {
    return res.status(404).json({ error: "Chưa có ảnh ghép nào được thiết lập" });
  }

  res.json(
    active.pieceAssignments.map((a) => ({
      newProvinceId: a.newProvinceId,
      name: a.newProvince.name,
      pieceImageUrl: a.pieceImageUrl,
    }))
  );
}

const level2CompleteSchema = z.object({
  placements: z
    .array(
      z.object({
        newProvinceId: z.string().min(1),
        row: z.number().int().min(0),
        col: z.number().int().min(0),
      })
    )
    .min(1),
});

export async function postLevel2Complete(req: Request, res: Response) {
  const parsed = level2CompleteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const result = await validateLevel2Placements(parsed.data.placements);
  res.json(result);
}

const stationAnswerSchema = z.object({
  answer: z.string().min(1),
  playerName: z.string().min(1).max(60),
  level1TimeMs: z.number().int().min(0),
  level2TimeMs: z.number().int().min(0),
});

export async function postVerifyStationAnswer(req: Request, res: Response) {
  const parsed = stationAnswerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { answer, playerName, level1TimeMs, level2TimeMs } = parsed.data;
  const result = await verifyStationAnswer(answer, { playerName, level1TimeMs, level2TimeMs });
  res.json(result);
}

const scoreSchema = z.object({
  playerName: z.string().min(1).max(60),
  level1TimeMs: z.number().int().min(0),
  level2TimeMs: z.number().int().min(0),
});

export async function postScore(req: Request, res: Response) {
  const parsed = scoreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const active = await getActivePuzzleImage();
  const { playerName, level1TimeMs, level2TimeMs } = parsed.data;

  const entry = await prisma.scoreEntry.create({
    data: {
      playerName,
      level1TimeMs,
      level2TimeMs,
      totalTimeMs: level1TimeMs + level2TimeMs,
      puzzleImageId: active?.id,
    },
  });

  res.status(201).json(entry);
}

export async function getLeaderboard(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const items = await prisma.scoreEntry.findMany({
    orderBy: { totalTimeMs: "asc" },
    take: limit,
  });
  res.json(items);
}
