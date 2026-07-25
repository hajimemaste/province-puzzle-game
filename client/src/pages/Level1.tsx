import { useEffect, useRef, useState } from "react";
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
import { AnimatePresence } from "framer-motion";
import { completeLevel1, fetchOldProvinces, fetchPieces, validateMerge } from "../api/game";
import MergeCard from "../components/MergeCard";
import MergeFlightOverlay, { type FlightSource } from "../components/MergeFlightOverlay";
import TrayPiece from "../components/TrayPiece";
import { useGameSession } from "../context/GameSessionContext";
import { shuffle } from "../utils";

type BoardItem =
  | { kind: "single"; uiKey: string; oldProvinceId: string; name: string }
  | {
      kind: "cluster";
      uiKey: string;
      newProvinceId: string;
      memberIds: string[];
      names: string[];
      matchedCount: number;
      totalCount: number;
    };

interface TrayEntry {
  uiKey: string;
  newProvinceId: string;
  newProvinceName: string;
  pieceImageUrl?: string;
}

interface PendingFlight {
  sources: FlightSource[];
  resultName: string;
  resultPieceImageUrl?: string;
  pendingEntry: TrayEntry;
}

function memberIdsOf(item: BoardItem): string[] {
  return item.kind === "single" ? [item.oldProvinceId] : item.memberIds;
}

function namesOf(item: BoardItem): string[] {
  return item.kind === "single" ? [item.name] : item.names;
}

export default function Level1() {
  const navigate = useNavigate();
  const { playerName, setLevel1TimeMs, setLockedNewProvinceIds } = useGameSession();
  const [board, setBoard] = useState<BoardItem[]>([]);
  const [tray, setTray] = useState<TrayEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [shakeIds, setShakeIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ text: string; kind: "error" | "success" | "info" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flight, setFlight] = useState<PendingFlight | null>(null);
  const [pieceImages, setPieceImages] = useState<Map<string, string>>(new Map());
  const startedAt = useRef<number>(Date.now());
  const cardNodesRef = useRef<Map<string, HTMLElement>>(new Map());
  const trayRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!playerName) {
      navigate("/");
      return;
    }
    fetchOldProvinces().then((provinces) => {
      const items: BoardItem[] = shuffle(provinces).map((p) => ({
        kind: "single",
        uiKey: p.id,
        oldProvinceId: p.id,
        name: p.name,
      }));
      setBoard(items);
      setLoading(false);
      startedAt.current = Date.now();
    });

    // Reveal the real cropped piece artwork as each group is solved. Safe to
    // fetch this early — piece *images* aren't the Level 2 secret, only
    // their grid *position* is, and that's never exposed here.
    fetchPieces()
      .then((pieces) => setPieceImages(new Map(pieces.map((p) => [p.newProvinceId, p.pieceImageUrl]))))
      .catch(() => setPieceImages(new Map()));
  }, [playerName, navigate]);

  function handleNodeReady(id: string, el: HTMLElement | null) {
    if (el) cardNodesRef.current.set(id, el);
    else cardNodesRef.current.delete(id);
  }

  /** Kick off the fly-to-center -> merge -> flip -> fly-to-tray animation for
   * a newly completed piece, sourced from 1 (solo click) or 2 (drag merge)
   * board cards. The dragged/secondary card must be first in `sourceItems`
   * so its clone is the one that fades away during the merge phase. */
  function triggerLockAnimation(sourceItems: BoardItem[], resultUiKey: string, newProvinceId: string, newProvinceName: string) {
    const sources: FlightSource[] = sourceItems.flatMap((item) => {
      const node = cardNodesRef.current.get(item.uiKey);
      if (!node) return [];
      return [{ rect: node.getBoundingClientRect(), label: namesOf(item).join(" + ") }];
    });

    const removeKeys = new Set(sourceItems.map((i) => i.uiKey));
    setBoard((prev) => prev.filter((i) => !removeKeys.has(i.uiKey)));

    const pieceImageUrl = pieceImages.get(newProvinceId);
    const pendingEntry: TrayEntry = { uiKey: resultUiKey, newProvinceId, newProvinceName, pieceImageUrl };

    if (sources.length === 0) {
      // Refs weren't ready (shouldn't normally happen) — commit instantly.
      commitTrayEntry(pendingEntry);
      setBusy(false);
      return;
    }

    setFlight({ sources, resultName: newProvinceName, resultPieceImageUrl: pieceImageUrl, pendingEntry });
  }

  function commitTrayEntry(entry: TrayEntry) {
    const next = [...tray, entry];
    setTray(next);
    setLockedNewProvinceIds(next.map((g) => g.newProvinceId));
  }

  function handleFlightComplete() {
    if (!flight) return;
    commitTrayEntry(flight.pendingEntry);
    setFlight(null);
    // Only now is it safe to accept the next merge — see the "locked" branches
    // below, which deliberately leave `busy` true for the animation's
    // duration so a second merge can't start mid-flight and overwrite
    // `flight` before the first one's tray entry gets committed.
    setBusy(false);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (busy || !over || over.id === active.id) return;

    const activeItem = board.find((i) => i.uiKey === active.id);
    const targetItem = board.find((i) => i.uiKey === over.id);
    if (!activeItem || !targetItem) return;

    const combinedIds = [...memberIdsOf(activeItem), ...memberIdsOf(targetItem)];

    setBusy(true);
    setMessage(null);
    const result = await validateMerge(combinedIds);

    if (result.status === "invalid") {
      setShakeIds(new Set([activeItem.uiKey, targetItem.uiKey]));
      setTimeout(() => setShakeIds(new Set()), 450);
      setMessage({ text: "Ghép không đúng, thử lại nhé!", kind: "error" });
      setBusy(false);
      return;
    }

    if (result.status === "locked") {
      // Left busy — cleared by handleFlightComplete once the fly/flip/fly-to-tray
      // animation finishes, so a second merge can't start mid-flight.
      triggerLockAnimation([activeItem, targetItem], targetItem.uiKey, result.newProvinceId, result.newProvinceName);
      setMessage({ text: `Chính xác! Đã tạo thành ${result.newProvinceName}.`, kind: "success" });
      return;
    }

    const clusterItem: BoardItem = {
      kind: "cluster",
      uiKey: targetItem.uiKey,
      newProvinceId: result.newProvinceId,
      memberIds: combinedIds,
      names: [...namesOf(activeItem), ...namesOf(targetItem)],
      matchedCount: result.matchedCount,
      totalCount: result.totalCount,
    };
    setBoard((prev) => prev.flatMap((i) => {
      if (i.uiKey === activeItem.uiKey) return [];
      if (i.uiKey === targetItem.uiKey) return [clusterItem];
      return [i];
    }));
    setMessage({ text: `Đúng hướng! Đã ghép ${result.matchedCount}/${result.totalCount} phần.`, kind: "success" });
    setBusy(false);
  }

  async function handleSoloClick(uiKey: string) {
    if (busy) return;
    const item = board.find((i) => i.uiKey === uiKey);
    if (!item || item.kind !== "single") return;

    setBusy(true);
    setMessage(null);
    const result = await validateMerge([item.oldProvinceId]);

    if (result.status === "locked") {
      // Left busy — cleared by handleFlightComplete, same reasoning as above.
      triggerLockAnimation([item], item.uiKey, result.newProvinceId, result.newProvinceName);
      setMessage({ text: `Chính xác! Đã tạo thành ${result.newProvinceName}.`, kind: "success" });
      return;
    }

    // result.status === "progress" means this province needs a partner —
    // stay silent so a click can't be used to probe which cards are solo.
    setBusy(false);
  }

  async function handleLevelComplete() {
    setBusy(true);
    try {
      const ids = tray.map((g) => g.newProvinceId);
      const check = await completeLevel1(ids);
      if (!check.complete) {
        setMessage({ text: "Hình như vẫn còn thiếu vài tỉnh, kiểm tra lại nhé.", kind: "error" });
        return;
      }
      setLevel1TimeMs(Date.now() - startedAt.current);
      navigate("/play/level2");
    } finally {
      setBusy(false);
    }
  }

  const activeItem = board.find((i) => i.uiKey === activeId);
  const isBoardEmpty = board.length === 0 && !loading && !flight;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-800">Màn 1</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-sm text-slate-500">Đã ghép: {tray.length}</span>
          </div>
        </header>

        <div
          ref={trayRef}
          className="mb-4 min-h-[4.5rem] bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex gap-2 items-center overflow-x-auto"
        >
          {tray.length === 0 && (
            <span className="text-xs text-slate-300 px-2">Các mảnh ghép hoàn thành sẽ xuất hiện ở đây...</span>
          )}
          <AnimatePresence>
            {tray.map((entry) => (
              <TrayPiece
                key={entry.uiKey}
                id={entry.uiKey}
                name={entry.newProvinceName}
                pieceImageUrl={entry.pieceImageUrl}
              />
            ))}
          </AnimatePresence>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 text-sm font-medium ${
              message.kind === "error"
                ? "bg-red-100 text-red-700"
                : message.kind === "success"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-sky-100 text-sky-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Đang tải dữ liệu...</p>
        ) : isBoardEmpty ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-lg font-semibold text-emerald-600 mb-4">
              Tuyệt vời! Bạn đã ghép xong tất cả {tray.length} tỉnh mới.
            </p>
            <button
              onClick={handleLevelComplete}
              disabled={busy}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-lg"
            >
              Sang màn 2
            </button>
          </div>
        ) : null}

        {!loading && board.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 sm:gap-2">
              {board.map((item) => (
                <MergeCard
                  key={item.uiKey}
                  id={item.uiKey}
                  label={item.kind === "single" ? item.name : item.names.join(" + ")}
                  sublabel={item.kind === "cluster" ? `${item.matchedCount}/${item.totalCount}` : undefined}
                  variant={item.kind}
                  shake={shakeIds.has(item.uiKey)}
                  onNodeReady={handleNodeReady}
                  onSoloClick={handleSoloClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeItem ? (
                <div
                  className={`rounded-xl border-2 px-2 py-3 text-xs font-medium text-center shadow-lg h-16 sm:h-20 w-full flex items-center justify-center ${
                    activeItem.kind === "cluster"
                      ? "border-sky-400 bg-sky-100 text-sky-800"
                      : "border-emerald-400 bg-white text-slate-700"
                  }`}
                >
                  {activeItem.kind === "single" ? activeItem.name : activeItem.names.join(" + ")}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {flight && (
        <MergeFlightOverlay
          sources={flight.sources}
          resultName={flight.resultName}
          resultPieceImageUrl={flight.resultPieceImageUrl}
          trayRect={trayRef.current?.getBoundingClientRect() ?? null}
          onComplete={handleFlightComplete}
        />
      )}
    </div>
  );
}
