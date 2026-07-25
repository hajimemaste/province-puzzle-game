import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { assetUrl } from "../api/client";
import { verifyStationAnswer } from "../api/game";
import FireworksOverlay from "../components/FireworksOverlay";
import { useGameSession } from "../context/GameSessionContext";
import { formatMs } from "../utils";

interface LocationState {
  fullImageUrl?: string;
}

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { playerName, level1TimeMs, level2TimeMs, resetSession } = useGameSession();
  const state = (location.state as LocationState) ?? {};

  const [answer, setAnswer] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");

  useEffect(() => {
    if (!playerName || level1TimeMs === null || level2TimeMs === null) {
      navigate("/");
    }
  }, [playerName, level1TimeMs, level2TimeMs, navigate]);

  async function handleSubmitAnswer(e: FormEvent) {
    e.preventDefault();
    if (!answer.trim() || level1TimeMs === null || level2TimeMs === null) return;
    setVerifying(true);
    setAnswerError(null);
    try {
      const result = await verifyStationAnswer(answer.trim(), playerName, level1TimeMs, level2TimeMs);
      if (!result.configured) {
        setAnswerError("Trạm chưa được thiết lập đáp án. Vui lòng báo quản trò.");
        return;
      }
      if (!result.correct) {
        setAnswerError("Đáp án chưa đúng, thử lại nhé!");
        return;
      }
      setCompletionMessage(result.message ?? "Chúc mừng đội của bạn đã hoàn thành!");
      setCompleted(true);
    } finally {
      setVerifying(false);
    }
  }

  function handlePlayAgain() {
    resetSession();
    navigate("/");
  }

  if (level1TimeMs === null || level2TimeMs === null) return null;

  const totalMs = level1TimeMs + level2TimeMs;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-sky-100 px-4 py-8">
      <FireworksOverlay active={completed} />
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-5 sm:p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {completed ? `Chúc mừng, ${playerName}!` : `Đội ${playerName}, sắp xong rồi!`}
        </h1>
        <p className="text-slate-500 mb-6">
          Màn 1: {formatMs(level1TimeMs)} · Màn 2: {formatMs(level2TimeMs)} · Tổng: {formatMs(totalMs)}
        </p>

        {state.fullImageUrl && (
          <img
            src={assetUrl(state.fullImageUrl)}
            alt="Kết quả"
            className="w-full rounded-xl border border-slate-200 mb-4"
          />
        )}

        {completed ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-4 mb-6">
            <p className="font-semibold">{completionMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitAnswer} className="mb-6 space-y-3">
            <p className="text-sm text-slate-500">
              Nhìn kỹ bức tranh và nhập đáp án mật thư để hoàn thành trạm nhé!
            </p>
            <input
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Nhập đáp án"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              autoFocus
            />
            {answerError && <p className="text-sm text-red-600">{answerError}</p>}
            <button
              type="submit"
              disabled={verifying || !answer.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg"
            >
              {verifying ? "Đang kiểm tra..." : "Xác nhận đáp án"}
            </button>
          </form>
        )}

        <button onClick={handlePlayAgain} className="text-slate-500 hover:text-slate-700 text-sm underline">
          Chơi lại
        </button>
      </div>
    </div>
  );
}
