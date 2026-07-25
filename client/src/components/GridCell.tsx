import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

interface GridCellProps {
  id: string;
  children?: ReactNode;
}

export default function GridCell({ id, children }: GridCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`aspect-square bg-white border rounded overflow-hidden flex items-center justify-center transition-colors ${
        isOver ? "border-emerald-500 ring-2 ring-emerald-300" : "border-slate-300"
      }`}
    >
      {children ?? <span className="text-slate-300 text-xs pointer-events-none">+</span>}
    </div>
  );
}
