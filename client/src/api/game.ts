import { apiClient } from "./client";
import type {
  Level2CompleteResult,
  MergeResult,
  OldProvinceDTO,
  PieceDTO,
  PuzzleCanvasDTO,
  ScoreEntryDTO,
  StationAnswerResult,
} from "../types";

export async function fetchOldProvinces(): Promise<OldProvinceDTO[]> {
  const { data } = await apiClient.get<OldProvinceDTO[]>("/api/game/old-provinces");
  return data;
}

export async function validateMerge(provinceIds: string[]): Promise<MergeResult> {
  const { data } = await apiClient.post<MergeResult>("/api/game/validate-merge", { provinceIds });
  return data;
}

export async function completeLevel1(lockedNewProvinceIds: string[]) {
  const { data } = await apiClient.post<{ complete: boolean; missingCount: number; totalCount: number }>(
    "/api/game/level1/complete",
    { lockedNewProvinceIds }
  );
  return data;
}

export async function fetchPuzzleCanvas(): Promise<PuzzleCanvasDTO> {
  const { data } = await apiClient.get<PuzzleCanvasDTO>("/api/game/puzzle-canvas");
  return data;
}

export async function fetchPieces(): Promise<PieceDTO[]> {
  const { data } = await apiClient.get<PieceDTO[]>("/api/game/pieces");
  return data;
}

export async function completeLevel2(
  placements: { newProvinceId: string; row: number; col: number }[]
): Promise<Level2CompleteResult> {
  const { data } = await apiClient.post<Level2CompleteResult>("/api/game/level2/complete", { placements });
  return data;
}

export async function verifyStationAnswer(
  answer: string,
  playerName: string,
  level1TimeMs: number,
  level2TimeMs: number
): Promise<StationAnswerResult> {
  const { data } = await apiClient.post<StationAnswerResult>("/api/game/verify-station-answer", {
    answer,
    playerName,
    level1TimeMs,
    level2TimeMs,
  });
  return data;
}

export async function submitScore(playerName: string, level1TimeMs: number, level2TimeMs: number) {
  const { data } = await apiClient.post<ScoreEntryDTO>("/api/game/score", {
    playerName,
    level1TimeMs,
    level2TimeMs,
  });
  return data;
}

export async function fetchLeaderboard(limit = 10): Promise<ScoreEntryDTO[]> {
  const { data } = await apiClient.get<ScoreEntryDTO[]>("/api/game/leaderboard", { params: { limit } });
  return data;
}

// TEMPORARY dev helper — remove along with the server route before sharing this build.
export async function debugAllNewProvinceIds(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>("/api/game/debug/all-new-province-ids");
  return data;
}
