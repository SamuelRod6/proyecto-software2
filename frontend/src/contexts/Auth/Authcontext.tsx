import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { authReducer, initAuthState } from "./reducer";
import type { User } from "./reducer";
import { login as loginAction, logout as logoutAction } from "./actions";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "auth-token";
const USER_KEY = "auth-user";
const LAST_ACTIVITY_KEY = "auth-last-activity";
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [state, dispatch] = useReducer(authReducer, undefined, initAuthState);
  const inactivityTimerRef = useRef<number | null>(null);

  // Sync auth state with localStorage
  useEffect(() => {
    if (!state.isAuthenticated) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }

    if (state.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    }
  }, [state.isAuthenticated, state.user]);

  useEffect(() => {
    if (!state.isAuthenticated) return;

    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      resetTimer();
    };

    const checkInactivity = () => {
      const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
      const last = raw ? Number(raw) : 0;
      if (!last || Date.now() - last >= INACTIVITY_LIMIT_MS) {
        dispatch(logoutAction());
        return;
      }
      resetTimer();
    };

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(
        checkInactivity,
        INACTIVITY_LIMIT_MS,
      );
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => window.addEventListener(event, updateActivity));

    const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!stored) {
      updateActivity();
    } else {
      checkInactivity();
    }

    return () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      events.forEach((event) =>
        window.removeEventListener(event, updateActivity),
      );
    };
  }, [state.isAuthenticated]);

  // Memoize context value
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      login: (user: User) => {
        if (user) {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        dispatch(loginAction(user));
      },
      logout: () => dispatch(logoutAction()),
    }),
    [state.isAuthenticated, state.user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
