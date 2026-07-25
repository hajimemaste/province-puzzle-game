import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface GameSessionState {
  playerName: string;
  level1TimeMs: number | null;
  level2TimeMs: number | null;
  lockedNewProvinceIds: string[];
}

interface GameSessionContextValue extends GameSessionState {
  setPlayerName: (name: string) => void;
  setLevel1TimeMs: (ms: number) => void;
  setLevel2TimeMs: (ms: number) => void;
  setLockedNewProvinceIds: (ids: string[]) => void;
  resetSession: () => void;
}

const STORAGE_KEY = "province_game_session";

const defaultState: GameSessionState = {
  playerName: "",
  level1TimeMs: null,
  level2TimeMs: null,
  lockedNewProvinceIds: [],
};

function loadState(): GameSessionState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameSessionState>(loadState);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value: GameSessionContextValue = {
    ...state,
    setPlayerName: (playerName) => setState((s) => ({ ...s, playerName })),
    setLevel1TimeMs: (level1TimeMs) => setState((s) => ({ ...s, level1TimeMs })),
    setLevel2TimeMs: (level2TimeMs) => setState((s) => ({ ...s, level2TimeMs })),
    setLockedNewProvinceIds: (lockedNewProvinceIds) => setState((s) => ({ ...s, lockedNewProvinceIds })),
    resetSession: () => {
      sessionStorage.removeItem(STORAGE_KEY);
      setState(defaultState);
    },
  };

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession() {
  const ctx = useContext(GameSessionContext);
  if (!ctx) throw new Error("useGameSession must be used within GameSessionProvider");
  return ctx;
}
