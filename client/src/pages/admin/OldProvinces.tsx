import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createOldProvince,
  deleteOldProvince,
  listNewProvinces,
  listOldProvinces,
  updateOldProvince,
} from "../../api/admin";
import type { AdminNewProvinceDTO, AdminOldProvinceDTO } from "../../types";

export default function OldProvinces() {
  const [items, setItems] = useState<AdminOldProvinceDTO[]>([]);
  const [newProvinces, setNewProvinces] = useState<AdminNewProvinceDTO[]>([]);
  const [name, setName] = useState("");
  const [newProvinceId, setNewProvinceId] = useState("");
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNewProvinceId, setEditNewProvinceId] = useState("");

  async function refresh() {
    const [old, np] = await Promise.all([listOldProvinces(), listNewProvinces()]);
    setItems(old);
    setNewProvinces(np);
    if (!newProvinceId && np.length > 0) setNewProvinceId(np[0].id);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !newProvinceId) return;
    await createOldProvince({ name: name.trim(), order, newProvinceId });
    setName("");
    setOrder(0);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xoá tỉnh cũ này?")) return;
    await deleteOldProvince(id);
    refresh();
  }

  function startEdit(item: AdminOldProvinceDTO) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditNewProvinceId(item.newProvinceId);
  }

  async function saveEdit(id: string) {
    await updateOldProvince(id, { name: editName.trim(), newProvinceId: editNewProvinceId });
    setEditingId(null);
    refresh();
  }

  if (loading) return <p>Đang tải...</p>;

  if (newProvinces.length === 0) {
    return <p className="text-slate-500">Hãy tạo ít nhất 1 tỉnh mới trước ở tab "Tỉnh mới".</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">Danh sách tỉnh cũ ({items.length})</h2>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6 bg-white p-4 rounded-lg shadow-sm flex-wrap">
        <input
          className="flex-1 min-w-40 border border-slate-300 rounded px-3 py-2"
          placeholder="Tên tỉnh cũ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="border border-slate-300 rounded px-3 py-2"
          value={newProvinceId}
          onChange={(e) => setNewProvinceId(e.target.value)}
        >
          {newProvinces.map((np) => (
            <option key={np.id} value={np.id}>
              {np.name}
            </option>
          ))}
        </select>
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
              <div className="flex-1 flex gap-2 mr-2">
                <input
                  className="flex-1 border border-slate-300 rounded px-2 py-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <select
                  className="border border-slate-300 rounded px-2 py-1"
                  value={editNewProvinceId}
                  onChange={(e) => setEditNewProvinceId(e.target.value)}
                >
                  {newProvinces.map((np) => (
                    <option key={np.id} value={np.id}>
                      {np.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="min-w-0">
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="text-xs text-slate-400 ml-2">→ {item.newProvince.name}</span>
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
        {items.length === 0 && <p className="px-4 py-6 text-center text-slate-400">Chưa có tỉnh cũ nào.</p>}
      </div>
    </div>
  );
}
