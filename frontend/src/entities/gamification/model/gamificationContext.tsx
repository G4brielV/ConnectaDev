import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { fetchGamificationSummary } from "@/shared/api/gamificationApi";
import { syncPendingLessonScores } from "@/shared/api/pendingLessonScoresSync";
import { useAuth } from "@/entities/session";
import type { GamificationState } from "./types";

const REFRESH_WINDOW_MS = 10_000;

interface GamificationContextData extends GamificationState {
  refresh: (force?: boolean) => Promise<void>;
  applySummary: (summary: { totalXp: number; currentLevel: number }) => void;
}

const GamificationContext = createContext<GamificationContextData | null>(null);

interface GamificationProviderProps {
  children: React.ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const { token } = useAuth();
  const [state, setState] = useState<GamificationState>({
    totalXp: 0,
    currentLevel: 1,
    isLoading: false,
  });
  const lastLoadedAt = useRef(0);

  const refresh = useCallback(async (force = false): Promise<void> => {
    if (
      !force &&
      lastLoadedAt.current > 0 &&
      Date.now() - lastLoadedAt.current < REFRESH_WINDOW_MS
    ) {
      return;
    }

    if (!token) {
      setState({ totalXp: 0, currentLevel: 1, isLoading: false });
      lastLoadedAt.current = 0;
      return;
    }

    setState((current) => ({ ...current, isLoading: true }));
    try {
      const summary = await fetchGamificationSummary(token);
      setState({ ...summary, isLoading: false });
      lastLoadedAt.current = Date.now();
    } catch {
      setState((current) => ({ ...current, isLoading: false }));
    }
  }, [token]);

  useEffect(() => {
    lastLoadedAt.current = 0;
    void refresh(true);
  }, [refresh]);

  useEffect(() => {
    if (!token) return undefined;

    let isSyncing = false;
    const sync = async (): Promise<void> => {
      if (isSyncing) return;
      isSyncing = true;
      try {
        const results = await syncPendingLessonScores(token);
        const latest = results.at(-1);
        if (latest) {
          setState({
            totalXp: latest.totalXp,
            currentLevel: latest.currentLevel,
            isLoading: false,
          });
          lastLoadedAt.current = Date.now();
        }
      } finally {
        isSyncing = false;
      }
    };

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected) void sync();
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync();
    });
    void sync();

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, [token]);

  const applySummary = useCallback(
    (summary: { totalXp: number; currentLevel: number }): void => {
      setState({ ...summary, isLoading: false });
      lastLoadedAt.current = Date.now();
    },
    [],
  );

  const value = useMemo<GamificationContextData>(
    () => ({ ...state, refresh, applySummary }),
    [applySummary, refresh, state],
  );

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextData {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification deve ser utilizado dentro de um GamificationProvider");
  }
  return context;
}
