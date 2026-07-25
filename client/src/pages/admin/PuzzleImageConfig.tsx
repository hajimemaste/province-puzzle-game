import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { assetUrl } from "../../api/client";
import {
  getPuzzleImageConfig,
  listNewProvinces,
  savePuzzleImageAssignments,
  savePuzzleImageSettings,
  uploadPuzzleImage,
} from "../../api/admin";
import type { AdminNewProvinceDTO, PuzzleImageConfigDTO } from "../../types";

type AssignmentMap = Record<string, { row: number; col: number }>;

export default function PuzzleImageConfig() {
  const [config, setConfig] = useState<PuzzleImageConfigDTO | null>(null);
  const [newProvinces, setNewProvinces] = useState<AdminNewProvinceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [gridRows, setGridRows] = useState(6);
  const [gridCols, setGridCols] = useState(6);
  const [uploading, setUploading] = useState(false);

  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [answerText, setAnswerText] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  async function refresh() {
    const [cfg, np] = await Promise.all([getPuzzleImageConfig(), listNewProvinces()]);
    setConfig(cfg);
    setNewProvinces(np);
    if (cfg) {
      setGridRows(cfg.gridRows);
      setGridCols(cfg.gridCols);
      setAnswerText(cfg.answerText ?? "");
      setCompletionMessage(cfg.completionMessage ?? "");
      const map: AssignmentMap = {};
      for (const a of cfg.pieceAssignments) {
        map[a.newProvinceId] = { row: a.row, col: a.col };
      }
      setAssignments(map);
    }
    setLoading(false);
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    if (!config || !answerText.trim() || !completionMessage.trim()) return;
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      const updated = await savePuzzleImageSettings(config.id, {
        answerText: answerText.trim(),
        completionMessage: completionMessage.trim(),
      });
      setConfig(updated);
      setSettingsMessage("Đã lưu đáp án trạm!");
    } finally {
      setSavingSettings(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const cfg = await uploadPuzzleImage(file, gridRows, gridCols);
      setConfig(cfg);
      setAssignments({});
      setFile(null);
      setMessage("Đã tải ảnh lên. Giờ hãy gán vị trí ô lưới cho từng tỉnh mới bên dưới.");
    } finally {
      setUploading(false);
    }
  }

  function updateAssignment(newProvinceId: string, field: "row" | "col", value: number) {
    setAssignments((prev) => ({
      ...prev,
      [newProvinceId]: {
        row: field === "row" ? value : prev[newProvinceId]?.row ?? 0,
        col: field === "col" ? value : prev[newProvinceId]?.col ?? 0,
      },
    }));
  }

  const cellOccupants = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [npId, pos] of Object.entries(assignments)) {
      const key = `${pos.row}-${pos.col}`;
      const province = newProvinces.find((p) => p.id === npId);
      if (!province) continue;
      map.set(key, [...(map.get(key) ?? []), province.name]);
    }
    return map;
  }, [assignments, newProvinces]);

  const hasDuplicates = [...cellOccupants.values()].some((names) => names.length > 1);
  const allAssigned = newProvinces.length > 0 && newProvinces.every((np) => assignments[np.id]);

  async function handleSaveAssignments() {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = newProvinces.map((np) => ({
        newProvinceId: np.id,
        row: assignments[np.id].row,
        col: assignments[np.id].col,
      }));
      const updated = await savePuzzleImageAssignments(config.id, payload);
      setConfig(updated);
      setMessage("Đã lưu cấu hình và cắt ảnh thành công!");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Ảnh ghép hiện tại</h2>
        {config ? (
          <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-start">
            <img src={assetUrl(config.imageUrl)} alt="" className="w-full sm:w-48 rounded border border-slate-200" />
            <div className="text-sm text-slate-600 space-y-1">
              <p>
                Lưới: {config.gridRows} x {config.gridCols}
              </p>
              <p>Số mảnh đã gán: {config.pieceAssignments.length}</p>
              <p>
                Đáp án trạm:{" "}
                {config.answerText ? (
                  <span className="text-emerald-600 font-medium">đã thiết lập</span>
                ) : (
                  <span className="text-red-500 font-medium">chưa thiết lập</span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-slate-400">Chưa có ảnh ghép nào được tải lên.</p>
        )}
      </div>

      {config && (
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Đáp án trạm</h2>
          <form onSubmit={handleSaveSettings} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            <label className="block text-sm text-slate-500">
              Đáp án đúng (đội chơi phải nhập đúng để hoàn thành trạm)
              <input
                className="block w-full border border-slate-300 rounded px-3 py-2 mt-1"
                placeholder="Ví dụ: BÁT NHÃ"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
              />
            </label>
            <label className="block text-sm text-slate-500">
              Thông báo khi hoàn thành
              <textarea
                className="block w-full border border-slate-300 rounded px-3 py-2 mt-1"
                rows={2}
                value={completionMessage}
                onChange={(e) => setCompletionMessage(e.target.value)}
              />
            </label>
            {settingsMessage && <p className="text-sm text-emerald-600">{settingsMessage}</p>}
            <button
              disabled={savingSettings || !answerText.trim() || !completionMessage.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-4 py-2 rounded font-medium"
            >
              {savingSettings ? "Đang lưu..." : "Lưu đáp án trạm"}
            </button>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Tải ảnh mới</h2>
        <form onSubmit={handleUpload} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex gap-3">
            <label className="text-sm text-slate-500">
              Số hàng
              <input
                type="number"
                min={1}
                className="block border border-slate-300 rounded px-2 py-1 w-24"
                value={gridRows}
                onChange={(e) => setGridRows(Number(e.target.value))}
              />
            </label>
            <label className="text-sm text-slate-500">
              Số cột
              <input
                type="number"
                min={1}
                className="block border border-slate-300 rounded px-2 py-1 w-24"
                value={gridCols}
                onChange={(e) => setGridCols(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="text-xs text-slate-400">
            Ảnh sẽ được cắt thành các mảnh theo lưới hàng/cột bên trên, mỗi mảnh gán cho 1 tỉnh mới ở bước tiếp theo.
          </p>
          <button
            disabled={uploading || !file}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-4 py-2 rounded font-medium"
          >
            {uploading ? "Đang tải..." : "Tải lên & kích hoạt"}
          </button>
        </form>
      </div>

      {config && newProvinces.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Gán vị trí ô lưới cho từng tỉnh mới</h2>
          <p className="text-sm text-slate-500 mb-4">
            Hàng: 0-{config.gridRows - 1}, Cột: 0-{config.gridCols - 1}. Mỗi tỉnh phải nằm ở 1 ô riêng biệt.
          </p>

          {message && <p className="text-sm text-emerald-600 mb-3">{message}</p>}
          {hasDuplicates && <p className="text-sm text-red-600 mb-3">Có ô lưới bị trùng vị trí, kiểm tra lại!</p>}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-2 max-h-96 overflow-auto">
              {newProvinces.map((np) => (
                <div key={np.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-700">{np.name}</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={config.gridRows - 1}
                      className="w-16 border border-slate-300 rounded px-2 py-1"
                      value={assignments[np.id]?.row ?? ""}
                      onChange={(e) => updateAssignment(np.id, "row", Number(e.target.value))}
                    />
                    <input
                      type="number"
                      min={0}
                      max={config.gridCols - 1}
                      className="w-16 border border-slate-300 rounded px-2 py-1"
                      value={assignments[np.id]?.col ?? ""}
                      onChange={(e) => updateAssignment(np.id, "col", Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              className="grid gap-1 bg-slate-200 p-1 rounded-lg"
              style={{ gridTemplateColumns: `repeat(${config.gridCols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: config.gridRows }).map((_, row) =>
                Array.from({ length: config.gridCols }).map((_, col) => {
                  const names = cellOccupants.get(`${row}-${col}`) ?? [];
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`aspect-square text-[10px] flex items-center justify-center text-center p-1 rounded ${
                        names.length > 1 ? "bg-red-200 text-red-800" : names.length === 1 ? "bg-emerald-200 text-emerald-800" : "bg-white text-slate-300"
                      }`}
                    >
                      {names.join(", ") || `${row},${col}`}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={handleSaveAssignments}
            disabled={saving || !allAssigned || hasDuplicates}
            className="mt-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-lg font-semibold"
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình & cắt ảnh"}
          </button>
        </div>
      )}
    </div>
  );
}
