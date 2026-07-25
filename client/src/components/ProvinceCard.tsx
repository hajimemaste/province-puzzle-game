interface ProvinceCardProps {
  label: string;
  selected: boolean;
  sublabel?: string;
  onClick: () => void;
}

export default function ProvinceCard({ label, selected, sublabel, onClick }: ProvinceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-3 py-4 text-sm font-medium text-center transition-all shadow-sm h-20 flex flex-col items-center justify-center gap-1 ${
        selected
          ? "border-emerald-500 bg-emerald-100 text-emerald-800 scale-95"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
      }`}
    >
      <span className="leading-tight">{label}</span>
      {sublabel && <span className="text-[11px] text-slate-400">{sublabel}</span>}
    </button>
  );
}
