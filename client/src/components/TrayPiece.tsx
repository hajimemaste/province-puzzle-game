import { motion } from "framer-motion";
import { assetUrl } from "../api/client";

interface TrayPieceProps {
  id: string;
  name: string;
  pieceImageUrl?: string;
}

export default function TrayPiece({ id, name, pieceImageUrl }: TrayPieceProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      title={name}
      className={`shrink-0 w-20 h-16 rounded-lg shadow-md overflow-hidden relative ${
        pieceImageUrl ? "" : "bg-gradient-to-br from-emerald-400 to-emerald-600"
      }`}
    >
      {pieceImageUrl ? (
        <img src={assetUrl(pieceImageUrl)} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-center leading-tight text-white px-1 line-clamp-2">
          {name}
        </span>
      )}
    </motion.div>
  );
}
