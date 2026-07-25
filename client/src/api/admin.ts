import { adminClient } from "./client";
import type { AdminNewProvinceDTO, AdminOldProvinceDTO, PuzzleImageConfigDTO, ScoreEntryDTO } from "../types";

export async function adminLogin(username: string, password: string) {
  const { data } = await adminClient.post<{ token: string; username: string }>("/login", { username, password });
  return data;
}

export async function listNewProvinces() {
  const { data } = await adminClient.get<AdminNewProvinceDTO[]>("/new-provinces");
  return data;
}

export async function createNewProvince(payload: { name: string; order?: number }) {
  const { data } = await adminClient.post<AdminNewProvinceDTO>("/new-provinces", payload);
  return data;
}

export async function updateNewProvince(id: string, payload: { name?: string; order?: number }) {
  const { data } = await adminClient.put<AdminNewProvinceDTO>(`/new-provinces/${id}`, payload);
  return data;
}

export async function deleteNewProvince(id: string) {
  await adminClient.delete(`/new-provinces/${id}`);
}

export async function listOldProvinces() {
  const { data } = await adminClient.get<AdminOldProvinceDTO[]>("/old-provinces");
  return data;
}

export async function createOldProvince(payload: { name: string; order?: number; newProvinceId: string }) {
  const { data } = await adminClient.post<AdminOldProvinceDTO>("/old-provinces", payload);
  return data;
}

export async function updateOldProvince(
  id: string,
  payload: { name?: string; order?: number; newProvinceId?: string }
) {
  const { data } = await adminClient.put<AdminOldProvinceDTO>(`/old-provinces/${id}`, payload);
  return data;
}

export async function deleteOldProvince(id: string) {
  await adminClient.delete(`/old-provinces/${id}`);
}

export async function getPuzzleImageConfig() {
  const { data } = await adminClient.get<PuzzleImageConfigDTO | null>("/puzzle-image");
  return data;
}

export async function uploadPuzzleImage(file: File, gridRows: number, gridCols: number) {
  const form = new FormData();
  form.append("image", file);
  form.append("gridRows", String(gridRows));
  form.append("gridCols", String(gridCols));
  const { data } = await adminClient.post<PuzzleImageConfigDTO>("/puzzle-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function savePuzzleImageAssignments(
  puzzleImageId: string,
  assignments: { newProvinceId: string; row: number; col: number }[]
) {
  const { data } = await adminClient.put<PuzzleImageConfigDTO>(
    `/puzzle-image/${puzzleImageId}/assignments`,
    { assignments }
  );
  return data;
}

export async function savePuzzleImageSettings(
  puzzleImageId: string,
  settings: { answerText: string; completionMessage: string }
) {
  const { data } = await adminClient.put<PuzzleImageConfigDTO>(`/puzzle-image/${puzzleImageId}/settings`, settings);
  return data;
}

export async function listScores() {
  const { data } = await adminClient.get<ScoreEntryDTO[]>("/scores");
  return data;
}

export async function deleteScore(id: string) {
  await adminClient.delete(`/scores/${id}`);
}

export async function clearScores() {
  await adminClient.delete("/scores");
}
