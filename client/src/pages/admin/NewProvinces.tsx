import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createNewProvince, deleteNewProvince, listNewProvinces, updateNewProvince } from "../../api/admin";
import type { AdminNewProvinceDTO } from "../../types";

export default function NewProvinces() {
  const [items, setItems] = useState<AdminNewProvinceDTO[]>([]);
  const [name, setName] = useState("");
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function refresh() {
    const data = await listNewProvinces();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createNewProvince({ name: name.trim(), order });
    setName("");
    setOrder(0);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xoá tỉnh mới này? Các tỉnh cũ đang gán vào đây cũng sẽ bị xoá.")) return;
    await deleteNewProvince(id);
    refresh();
  }

  function startEdit(item: AdminNewProvinceDTO) {
    setEditingId(item.id);
    setEditName(item.name);
  }

  async function saveEdit(id: string) {
    await updateNewProvince(id, { name: editName.trim() });
    setEditingId(null);
    refresh();
  }

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">Danh sách tỉnh mới ({items.length})</h2>

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <input
          className="flex-1 min-w-40 border border-slate-300 rounded px-3 py-2"
          placeholder="Tên tỉnh mới"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          className="w-24 border border-slate-300 rounded px-3 py-2"
          placeholder="Thứ tự"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded font-medium">Thêm</button>
      </form>

      <div className="bg-white rounded-lg shadow-sm divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 px-4 py-3 flex-wrap">
            {editingId === item.id ? (
              <input
                className="flex-1 min-w-40 border border-slate-300 rounded px-2 py-1 mr-2"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            ) : (
              <div className="min-w-0">
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="text-xs text-slate-400 ml-2">
                  {item.oldProvinces.length} tỉnh cũ: {item.oldProvinces.map((p) => p.name).join(", ") || "—"}
                </span>
              </div>
            )}
            <div className="flex gap-2 text-sm shrink-0">
              {editingId === item.id ? (
                <button onClick={() => saveEdit(item.id)} className="text-emerald-600 font-medium">
                  Lưu
                </button>
              ) : (
                <button onClick={() => startEdit(item)} className="text-slate-500 hover:text-slate-800">
                  Sửa
                </button>
              )}
              <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                Xoá
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="px-4 py-6 text-center text-slate-400">Chưa có tỉnh mới nào.</p>}
      </div>
    </div>
  );
}
