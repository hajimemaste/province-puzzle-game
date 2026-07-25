import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

interface TrayDropZoneProps {
  id: string;
  children: ReactNode;
}

export default function TrayDropZone({ id, children }: TrayDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6 p-2 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? "border-emerald-400 bg-emerald-50" : "border-transparent"
      }`}
    >
      {children}
    </div>
  );
}
