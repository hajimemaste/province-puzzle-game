import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { assetUrl } from "../api/client";
import { completeLevel2, fetchPieces, fetchPuzzleCanvas } from "../api/game";
import GridCell from "../components/GridCell";
import PieceThumb from "../components/PieceThumb";
import TrayDropZone from "../components/TrayDropZone";
import { useGameSession } from "../context/GameSessionContext";
import type { PieceDTO, PuzzleCanvasDTO } from "../types";
import { shuffle } from "../utils";

interface BoardState {
  placements: Record<string, string>; // cellKey ("row-col") -> pieceId
  tray: string[];
}

const TRAY_DROP_ID = "tray";
const cellDropId = (key: string) => `cell-${key}`;

export default function Level2() {
  const navigate = useNavigate();
  const { playerName, level1TimeMs, setLevel2TimeMs } = useGameSession();
  const [canvas, setCanvas] = useState<PuzzleCanvasDTO | null>(null);
  const [pieces, setPieces] = useState<PieceDTO[]>([]);
  const [board, setBoard] = useState<BoardState>({ placements: {}, tray: [] });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const startedAt = useRef<number>(Date.now());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // The single source of truth for "is level 1 actually done" — only ever
  // set once Level1's board is empty AND the server has confirmed all 34
  // groups are correct (see Level1.tsx handleLevelComplete), or via the
  // temporary Skip button. Anything else means this team hasn't earned
  // access to Level 2 yet.
  const level1Completed = level1TimeMs !== null;

  useEffect(() => {
    if (!playerName) {
      navigate("/");
      return;
    }
    if (!level1Completed) {
      navigate("/play/level1");
      return;
    }
    Promise.all([fetchPuzzleCanvas(), fetchPieces()])
      .then(([canvasData, pieceData]) => {
        setCanvas(canvasData);
        setPieces(pieceData);
        setBoard({ placements: {}, tray: shuffle(pieceData.map((p) => p.newProvinceId)) });
        startedAt.current = Date.now();
      })
      .catch(() => setError("Chưa có ảnh ghép nào được thiết lập. Vui lòng liên hệ quản trị viên."))
      .finally(() => setLoading(false));
  }, [playerName, level1TimeMs, navigate]);

  const pieceById = useMemo(() => new Map(pieces.map((p) => [p.newProvinceId, p])), [pieces]);
  const filledKeys = useMemo(() => new Set((canvas?.filledCells ?? []).map((c) => `${c.row}-${c.col}`)), [canvas]);

  function movePiece(pieceId: string, dest: { type: "tray" } | { type: "cell"; key: string }) {
    setBoard((prev) => {
      const sourceCellKey = Object.entries(prev.placements).find(([, v]) => v === pieceId)?.[0] ?? null;
      const nextPlacements = { ...prev.placements };
      let nextTray = prev.tray.filter((id) => id !== pieceId);
      if (sourceCellKey) delete nextPlacements[sourceCellKey];

      if (dest.type === "tray") {
        nextTray = [...nextTray, pieceId];
      } else {
        const occupant = nextPlacements[dest.key] ?? null;
        nextPlacements[dest.key] = pieceId;
        if (occupant && occupant !== pieceId) {
          if (sourceCellKey) nextPlacements[sourceCellKey] = occupant;
          else nextTray = [...nextTray, occupant];
        }
      }

      return { placements: nextPlacements, tray: nextTray };
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const pieceId = String(active.id);
    const overId = String(over.id);

    if (overId === TRAY_DROP_ID) {
      movePiece(pieceId, { type: "tray" });
      return;
    }

    if (overId.startsWith("cell-")) {
      const cellKey = overId.slice("cell-".length);
      if (!filledKeys.has(cellKey)) return;
      movePiece(pieceId, { type: "cell", key: cellKey });
    }
  }

  const allPlaced = canvas ? canvas.filledCells.every((c) => board.placements[`${c.row}-${c.col}`]) : false;
  const activePiece = activeId ? pieceById.get(activeId) : undefined;

  async function handleCheck() {
    if (!canvas) return;
    setChecking(true);
    setError(null);
    try {
      const placementList = canvas.filledCells.map((c) => ({
        newProvinceId: board.placements[`${c.row}-${c.col}`],
        row: c.row,
        col: c.col,
      }));
      const result = await completeLevel2(placementList);
      if (result.correct) {
        setLevel2TimeMs(Date.now() - startedAt.current);
        navigate("/play/result", { state: { fullImageUrl: result.fullImageUrl } });
      } else {
        setError("Chưa đúng hết, thử sắp xếp lại nhé!");
      }
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-slate-500">Đang tải dữ liệu...</p>;
  }

  if (error && !canvas) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  if (!canvas) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Màn 2: Ghép các mảnh thành bức tranh</h1>
          <p className="text-sm text-slate-500 mb-4">Kéo một mảnh rồi thả vào ô trống để đặt vào đúng vị trí.</p>

          {error && (
            <div className="mb-4 rounded-lg px-4 py-2 text-sm font-medium bg-red-100 text-red-700">{error}</div>
          )}

          <div
            className="grid gap-1 bg-slate-200 p-1 rounded-lg mb-6 mx-auto w-full"
            style={{
              gridTemplateColumns: `repeat(${canvas.gridCols}, minmax(0, 1fr))`,
              maxWidth: canvas.gridCols * 72,
            }}
          >
            {Array.from({ length: canvas.gridRows }).map((_, row) =>
              Array.from({ length: canvas.gridCols }).map((_, col) => {
                const key = `${row}-${col}`;
                const filled = filledKeys.has(key);

                if (!filled) return <div key={key} className="aspect-square" />;

                const placedId = board.placements[key];
                const placedPiece = placedId ? pieceById.get(placedId) : undefined;

                return (
                  <GridCell key={key} id={cellDropId(key)}>
                    {placedPiece && (
                      <PieceThumb id={placedPiece.newProvinceId} imageUrl={placedPiece.pieceImageUrl} name={placedPiece.name} />
                    )}
                  </GridCell>
                );
              })
            )}
          </div>

          <h2 className="text-sm font-semibold text-slate-500 mb-2">Các mảnh ghép ({board.tray.length} còn lại)</h2>
          <TrayDropZone id={TRAY_DROP_ID}>
            {board.tray.map((pieceId) => {
              const piece = pieceById.get(pieceId);
              if (!piece) return null;
              return (
                <div key={pieceId} className="aspect-square">
                  <PieceThumb id={pieceId} imageUrl={piece.pieceImageUrl} name={piece.name} />
                </div>
              );
            })}
          </TrayDropZone>

          <button
            onClick={handleCheck}
            disabled={!allPlaced || checking}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold px-6 py-2.5 rounded-lg"
          >
            Kiểm tra
          </button>
        </div>
      </div>

      <DragOverlay>
        {activePiece ? (
          <div className="w-16 h-16 rounded overflow-hidden shadow-lg ring-2 ring-emerald-400">
            <img src={assetUrl(activePiece.pieceImageUrl)} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
