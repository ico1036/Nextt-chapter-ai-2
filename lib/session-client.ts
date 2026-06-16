"use client";

// Browser-remembered session. No login — we keep the most recent
// completed session id in localStorage so a returning user can jump
// straight back to her result and daily log.

const KEY = "mnc_session";

export interface LocalSession {
  sessionId: string;
  name?: string;
  at: number;
}

export function saveLocalSession(sessionId: string, name?: string): void {
  if (typeof window === "undefined") return;
  try {
    const prev = getLocalSession();
    const next: LocalSession = {
      sessionId,
      name: name ?? prev?.name,
      at: Date.now(),
    };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable (private mode) */
  }
}

export function getLocalSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSession;
    return parsed?.sessionId ? parsed : null;
  } catch {
    return null;
  }
}

export function clearLocalSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
