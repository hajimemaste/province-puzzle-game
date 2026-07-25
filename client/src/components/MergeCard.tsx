import { useEffect, useRef } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";

interface MergeCardProps {
  id: string;
  label: string;
  sublabel?: string;
  variant: "single" | "cluster";
  shake: boolean;
  draggable?: boolean;
  onNodeReady?: (id: string, el: HTMLElement | null) => void;
  onSoloClick?: (id: string) => void;
}

export default function MergeCard({
  id,
  label,
  sublabel,
  variant,
  shake,
  draggable = true,
  onNodeReady,
  onSoloClick,
}: MergeCardProps) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id, disabled: !draggable });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });
  const nodeRef = useRef<HTMLElement | null>(null);

  function setRefs(el: HTMLElement | null) {
    nodeRef.current = el;
    setDragRef(el);
    setDropRef(el);
    onNodeReady?.(id, el);
  }

  useEffect(() => {
    return () => onNodeReady?.(id, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <motion.button
      ref={setRefs}
      layout
      layoutId={id}
      {...listeners}
      {...attributes}
      type="button"
      onClick={() => {
        if (variant === "single" && !isDragging) onSoloClick?.(id);
      }}
      animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0, opacity: isDragging ? 0.25 : 1 }}
      transition={shake ? { duration: 0.4 } : { type: "spring", stiffness: 400, damping: 28 }}
      className={`rounded-xl border-2 px-1.5 sm:px-2 py-2 sm:py-3 text-[11px] sm:text-xs font-medium text-center shadow-sm h-16 sm:h-20 w-full flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing touch-none select-none ${
        variant === "cluster"
          ? "border-sky-400 bg-sky-100 text-sky-800"
          : "border-slate-200 bg-white text-slate-700"
      } ${isOver ? "ring-4 ring-emerald-300" : ""}`}
    >
      <span className="leading-tight line-clamp-2">{label}</span>
      {sublabel && <span className="text-[10px] opacity-70">{sublabel}</span>}
    </motion.button>
  );
}
