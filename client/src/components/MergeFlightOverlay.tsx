import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { assetUrl } from "../api/client";

export interface FlightSource {
  rect: DOMRect;
  label: string;
}

interface MergeFlightOverlayProps {
  /** Ordered [secondary?, primary] — primary is the card whose visual
   * persists through the merge/flip/fly-out; secondary (if present, for a
   * 2-card drag merge) just flies in and fades away. */
  sources: FlightSource[];
  resultName: string;
  resultPieceImageUrl?: string;
  trayRect: DOMRect | null;
  onComplete: () => void;
}

type Phase = "flyIn" | "merge" | "flip" | "flyOut";

const DURATIONS: Record<Phase, number> = { flyIn: 450, merge: 300, flip: 400, flyOut: 450 };

export default function MergeFlightOverlay({
  sources,
  resultName,
  resultPieceImageUrl,
  trayRect,
  onComplete,
}: MergeFlightOverlayProps) {
  const [phase, setPhase] = useState<Phase>("flyIn");

  useEffect(() => {
    const order: Phase[] = ["flyIn", "merge", "flip", "flyOut"];
    let elapsed = 0;
    const timers = order.slice(1).map((p) => {
      elapsed += DURATIONS[order[order.indexOf(p) - 1]];
      return setTimeout(() => setPhase(p), elapsed);
    });
    const totalDuration = Object.values(DURATIONS).reduce((a, b) => a + b, 0);
    const doneTimer = setTimeout(onComplete, totalDuration);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primary = sources[sources.length - 1];
  const secondary = sources.length > 1 ? sources[0] : null;

  const centerX = window.innerWidth / 2 - primary.rect.width / 2;
  const centerY = window.innerHeight / 2 - primary.rect.height / 2;

  const trayTarget = trayRect
    ? { left: trayRect.left + trayRect.width / 2 - primary.rect.width / 2, top: trayRect.top + trayRect.height / 2 - primary.rect.height / 2 }
    : { left: centerX, top: centerY - 60 };

  const primaryTarget =
    phase === "flyOut"
      ? { left: trayTarget.left, top: trayTarget.top, opacity: 0.85, scale: 0.35 }
      : { left: centerX, top: centerY, opacity: 1, scale: phase === "merge" ? 1.08 : 1 };

  const secondaryTarget =
    phase === "flyIn"
      ? { left: centerX, top: centerY, opacity: 1, scale: 1 }
      : { left: centerX, top: centerY, opacity: 0, scale: 0.6 };

  const frontLabel = phase === "flyIn" ? primary.label : resultName;
  const flipped = phase === "flip" || phase === "flyOut";

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {secondary && (
        <motion.div
          initial={{ left: secondary.rect.left, top: secondary.rect.top, opacity: 1, scale: 1 }}
          animate={secondaryTarget}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          style={{ position: "fixed", width: secondary.rect.width, height: secondary.rect.height }}
          className="rounded-xl border-2 border-emerald-400 bg-white shadow-lg flex items-center justify-center text-xs font-medium text-center px-2"
        >
          {secondary.label}
        </motion.div>
      )}

      <motion.div
        initial={{ left: primary.rect.left, top: primary.rect.top, opacity: 1, scale: 1 }}
        animate={primaryTarget}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        style={{ position: "fixed", width: primary.rect.width, height: primary.rect.height }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", position: "relative" }}
        >
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 rounded-xl border-2 border-emerald-400 bg-white shadow-xl flex items-center justify-center text-xs font-semibold text-center px-2 text-slate-800"
          >
            {frontLabel}
          </div>
          <div
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            className={`absolute inset-0 rounded-xl shadow-xl overflow-hidden ${
              resultPieceImageUrl
                ? ""
                : "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-xs font-semibold text-center px-2"
            }`}
          >
            {resultPieceImageUrl ? (
              <img src={assetUrl(resultPieceImageUrl)} alt={resultName} className="w-full h-full object-cover" />
            ) : (
              resultName
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
