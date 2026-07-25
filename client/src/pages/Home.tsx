import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSession } from "../context/GameSessionContext";

export default function Home() {
  const navigate = useNavigate();
  const { setPlayerName, resetSession } = useGameSession();
  const [name, setName] = useState("");

  // Landing on the home page always means "start over" — clear any leftover
  // session (e.g. from a previous playthrough, or the Skip-testing button)
  // immediately, not just when the form is submitted. Otherwise navigating
  // straight to /play/level2 by URL right after can silently reuse stale
  // "level 1 already done" state from earlier in the same browser tab.
  useEffect(() => {
    resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPlayerName(name.trim());
    navigate("/play/level1");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-sky-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Mật thư trạm 3</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="Nhập tên đội của bạn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Bắt đầu chơi
          </button>
        </form>
      </div>
    </div>
  );
}
