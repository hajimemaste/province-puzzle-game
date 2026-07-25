import { useEffect, useState } from "react";
import { clearScores, deleteScore, listScores } from "../../api/admin";
import type { ScoreEntryDTO } from "../../types";
import { formatMs } from "../../utils";

export default function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await listScores();
    setScores(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: string) {
    await deleteScore(id);
    refresh();
  }

  async function handleClear() {
    if (!confirm("Xoá toàn bộ bảng xếp hạng?")) return;
    await clearScores();
    refresh();
  }

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Bảng xếp hạng ({scores.length})</h2>
        {scores.length > 0 && (
          <button onClick={handleClear} className="text-sm text-red-500 hover:text-red-700">
            Xoá tất cả
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm divide-y divide-slate-100">
        {scores.map((s, idx) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm">
            <span className="min-w-0">
              {idx + 1}. <span className="font-medium text-slate-800">{s.playerName}</span>
            </span>
            <span className="text-slate-500 text-xs sm:text-sm">
              Màn 1: {formatMs(s.level1TimeMs)} · Màn 2: {formatMs(s.level2TimeMs)} · Tổng:{" "}
              {formatMs(s.totalTimeMs)}
            </span>
            <button onClick={() => handleDelete(s.id)} className="shrink-0 text-red-500 hover:text-red-700">
              Xoá
            </button>
          </div>
        ))}
        {scores.length === 0 && <p className="px-4 py-6 text-center text-slate-400">Chưa có điểm nào.</p>}
      </div>
    </div>
  );
}
