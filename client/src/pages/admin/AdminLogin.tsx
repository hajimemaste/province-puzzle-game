import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../api/admin";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await adminLogin(username, password);
      localStorage.setItem("admin_token", token);
      navigate("/admin/old-provinces");
    } catch {
      setError("Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form onSubmit={handleSubmit} className="max-w-sm w-full bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-lg font-bold text-slate-800 text-center">Đăng nhập quản trị</h1>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          placeholder="Tài khoản"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold py-2 rounded-lg"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
