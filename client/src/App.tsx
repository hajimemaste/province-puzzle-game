import { Route, Routes } from "react-router-dom";
import { GameSessionProvider } from "./context/GameSessionContext";
import MusicPlayer from "./components/MusicPlayer";
import Home from "./pages/Home";
import Level1 from "./pages/Level1";
import Level2 from "./pages/Level2";
import Result from "./pages/Result";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import NewProvinces from "./pages/admin/NewProvinces";
import OldProvinces from "./pages/admin/OldProvinces";
import PuzzleImageConfig from "./pages/admin/PuzzleImageConfig";
import Leaderboard from "./pages/admin/Leaderboard";
import LiveMonitor from "./pages/admin/LiveMonitor";

export default function App() {
  return (
    <GameSessionProvider>
      <MusicPlayer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/level1" element={<Level1 />} />
        <Route path="/play/level2" element={<Level2 />} />
        <Route path="/play/result" element={<Result />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="old-provinces" element={<OldProvinces />} />
          <Route path="new-provinces" element={<NewProvinces />} />
          <Route path="puzzle-image" element={<PuzzleImageConfig />} />
          <Route path="live" element={<LiveMonitor />} />
          <Route path="leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </GameSessionProvider>
  );
}
