import { useDraggable } from "@dnd-kit/core";
import { assetUrl } from "../api/client";

interface PieceThumbProps {
  id: string;
  imageUrl: string;
  name: string;
}

export default function PieceThumb({ id, imageUrl, name }: PieceThumbProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      title={name}
      className={`w-full h-full rounded overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none ${
        isDragging ? "opacity-20" : ""
      }`}
    >
      <img src={assetUrl(imageUrl)} alt={name} className="w-full h-full object-cover pointer-events-none" />
    </button>
  );
}
