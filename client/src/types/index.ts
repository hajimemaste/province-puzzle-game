export interface OldProvinceDTO {
  id: string;
  name: string;
}

export interface NewProvinceDTO {
  id: string;
  name: string;
  order: number;
}

export interface AdminOldProvinceDTO {
  id: string;
  name: string;
  order: number;
  newProvinceId: string;
  newProvince: { id: string; name: string };
}

export interface AdminNewProvinceDTO {
  id: string;
  name: string;
  order: number;
  oldProvinces: { id: string; name: string }[];
}

export type MergeResult =
  | { status: "invalid" }
  | { status: "progress"; newProvinceId: string; matchedCount: number; totalCount: number }
  | {
      status: "locked";
      newProvinceId: string;
      newProvinceName: string;
      matchedCount: number;
      totalCount: number;
    };

export interface PuzzleCanvasCell {
  row: number;
  col: number;
}

export interface PuzzleCanvasDTO {
  gridRows: number;
  gridCols: number;
  filledCells: PuzzleCanvasCell[];
}

export interface PieceDTO {
  newProvinceId: string;
  name: string;
  pieceImageUrl: string;
}

export interface PuzzleImageConfigDTO {
  id: string;
  imageUrl: string;
  gridRows: number;
  gridCols: number;
  answerText: string | null;
  completionMessage: string;
  isActive: boolean;
  pieceAssignments: {
    id: string;
    newProvinceId: string;
    row: number;
    col: number;
    pieceImageUrl: string | null;
    newProvince: { id: string; name: string };
  }[];
}

export interface Level2CompleteResult {
  correct: boolean;
  fullImageUrl?: string;
}

export interface StationAnswerResult {
  configured: boolean;
  correct: boolean;
  message?: string;
}

export interface ScoreEntryDTO {
  id: string;
  playerName: string;
  level1TimeMs: number;
  level2TimeMs: number;
  totalTimeMs: number;
  createdAt: string;
}
