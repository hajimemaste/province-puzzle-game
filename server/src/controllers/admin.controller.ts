import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { prisma } from "../prisma/client";
import { AuthedRequest } from "../middleware/auth";
import {
  activatePuzzleImage,
  getActivePuzzleImage,
  originalsDir,
  saveAssignmentsAndCropPieces,
  updatePuzzleImageSettings,
} from "../services/puzzleImage.service";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function login(req: AuthedRequest, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { username, password } = parsed.data;
  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) {
    return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
  }

  const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET as string, {
    expiresIn: "12h",
  });

  res.json({ token, username: admin.username });
}

// ---- New Provinces ----

const newProvinceSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().optional(),
});

export async function listNewProvinces(_req: AuthedRequest, res: Response) {
  const items = await prisma.newProvince.findMany({
    orderBy: { order: "asc" },
    include: { oldProvinces: true },
  });
  res.json(items);
}

export async function createNewProvince(req: AuthedRequest, res: Response) {
  const parsed = newProvinceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const item = await prisma.newProvince.create({ data: parsed.data });
  res.status(201).json(item);
}

export async function updateNewProvince(req: AuthedRequest, res: Response) {
  const parsed = newProvinceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const item = await prisma.newProvince.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(item);
}

export async function deleteNewProvince(req: AuthedRequest, res: Response) {
  await prisma.newProvince.delete({ where: { id: req.params.id } });
  res.status(204).end();
}

// ---- Old Provinces ----

const oldProvinceSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().optional(),
  newProvinceId: z.string().min(1),
});

export async function listOldProvinces(_req: AuthedRequest, res: Response) {
  const items = await prisma.oldProvince.findMany({
    orderBy: { order: "asc" },
    include: { newProvince: true },
  });
  res.json(items);
}

export async function createOldProvince(req: AuthedRequest, res: Response) {
  const parsed = oldProvinceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const item = await prisma.oldProvince.create({ data: parsed.data });
  res.status(201).json(item);
}

export async function updateOldProvince(req: AuthedRequest, res: Response) {
  const parsed = oldProvinceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const item = await prisma.oldProvince.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(item);
}

export async function deleteOldProvince(req: AuthedRequest, res: Response) {
  await prisma.oldProvince.delete({ where: { id: req.params.id } });
  res.status(204).end();
}

// ---- Puzzle image ----

export async function getPuzzleImageConfig(_req: AuthedRequest, res: Response) {
  const active = await getActivePuzzleImage();
  res.json(active);
}

const uploadBodySchema = z.object({
  gridRows: z.coerce.number().int().min(1),
  gridCols: z.coerce.number().int().min(1),
  answerText: z.string().trim().min(1).optional(),
  completionMessage: z.string().trim().min(1).optional(),
});

export async function uploadPuzzleImage(req: AuthedRequest, res: Response) {
  const file = (req as unknown as { file?: Express.Multer.File }).file;
  if (!file) {
    return res.status(400).json({ error: "Thiếu file ảnh" });
  }

  const parsed = uploadBodySchema.safeParse(req.body);
  if (!parsed.success) {
    fs.unlink(path.join(originalsDir(), file.filename), () => undefined);
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { gridRows, gridCols, answerText, completionMessage } = parsed.data;

  const created = await prisma.puzzleImage.create({
    data: {
      imageUrl: `/originals/${file.filename}`,
      gridRows,
      gridCols,
      answerText,
      ...(completionMessage ? { completionMessage } : {}),
      isActive: false,
    },
  });

  await activatePuzzleImage(created.id);

  const full = await getActivePuzzleImage();
  res.status(201).json(full);
}

const settingsSchema = z.object({
  answerText: z.string().trim().min(1),
  completionMessage: z.string().trim().min(1),
});

export async function putPuzzleImageSettings(req: AuthedRequest, res: Response) {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  await updatePuzzleImageSettings(req.params.id, parsed.data);
  const full = await getActivePuzzleImage();
  res.json(full);
}

const assignmentsSchema = z.object({
  assignments: z
    .array(
      z.object({
        newProvinceId: z.string().min(1),
        row: z.number().int().min(0),
        col: z.number().int().min(0),
      })
    )
    .min(1),
});

export async function savePuzzleImageAssignments(req: AuthedRequest, res: Response) {
  const parsed = assignmentsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    await saveAssignmentsAndCropPieces(req.params.id, parsed.data.assignments);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }

  const full = await getActivePuzzleImage();
  res.json(full);
}

// ---- Scores ----

export async function listScores(_req: AuthedRequest, res: Response) {
  const scores = await prisma.scoreEntry.findMany({ orderBy: { totalTimeMs: "asc" } });
  res.json(scores);
}

export async function deleteScore(req: AuthedRequest, res: Response) {
  await prisma.scoreEntry.delete({ where: { id: req.params.id } });
  res.status(204).end();
}

export async function clearScores(_req: AuthedRequest, res: Response) {
  await prisma.scoreEntry.deleteMany({});
  res.status(204).end();
}
