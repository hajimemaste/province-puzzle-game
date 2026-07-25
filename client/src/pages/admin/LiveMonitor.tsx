import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { listScores } from "../../api/admin";
import type { ScoreEntryDTO } from "../../types";
import { formatMs } from "../../utils";

const POLL_INTERVAL_MS = 4000;

export default function LiveMonitor() {
  const [entries, setEntries] = useState<ScoreEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await listScores();
        if (cancelled) return;
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setEntries(sorted);
        setLastUpdated(new Date());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          Theo dõi trực tiếp ({entries.length} đội đã hoàn thành)
        </h2>
        {lastUpdated && (
          <span className="text-xs text-slate-400">Cập nhật lúc {lastUpdated.toLocaleTimeString("vi-VN")}</span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-slate-400 bg-white rounded-lg shadow-sm p-6 text-center">
          Chưa có đội nào hoàn thành. Danh sách sẽ tự cập nhật khi có đội báo cáo xong.
        </p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {entries.map((entry, idx) => (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -12, backgroundColor: "#d1fae5" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "#ffffff" }}
                transition={{ duration: 0.6 }}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-white rounded-lg shadow-sm px-4 py-3 border border-slate-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-slate-400 text-sm w-6 text-right shrink-0">{idx + 1}</span>
                  <span className="font-semibold text-slate-800 truncate">{entry.playerName}</span>
                </div>
                <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
                  <span>Tổng: {formatMs(entry.totalTimeMs)}</span>
                  <span>{new Date(entry.createdAt).toLocaleTimeString("vi-VN")}</span>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
