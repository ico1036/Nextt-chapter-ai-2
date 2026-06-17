// ─────────────────────────────────────────────────────────────
// Compass seed (방향 선명도) + gentle gamification (XP·레벨·스트릭).
// Deterministic, derived from session + notes (never stored).
//
// Philosophy (reconciled with the meeting docs):
//  • clarity = "입력할수록 방향이 또렷해짐" — a heuristic seed of v3's
//    compass, NOT a re-computed direction vector.
//  • XP/level are tied to *meaningful* signal (고객의 말 기록·선명도 마일스톤),
//    not mere attendance — and the tone stays no-guilt ("다시 돌아오면 괜찮아").
// ─────────────────────────────────────────────────────────────

import { computeMomentum } from "./momentum";
import type { DailyNote, DiagnosticSession, Progress } from "./types";

const LEVELS = [
  { name: "씨앗", emoji: "🌱", min: 0 },
  { name: "새싹", emoji: "🌿", min: 50 },
  { name: "가지", emoji: "🌳", min: 120 },
  { name: "꽃", emoji: "🌸", min: 220 },
  { name: "열매", emoji: "🍎", min: 350 },
];

// Clarity bands that grant a bonus (ties XP progression to meaning).
const CLARITY_BANDS = [50, 65, 80, 90];
const CLARITY_CAP = 95;

function clean(s?: string): boolean {
  return Boolean((s ?? "").trim());
}

function distinctDays(notes: DailyNote[]): number {
  return new Set(notes.map((n) => n.date).filter(Boolean)).size;
}

// Core computation for a given note set (used twice to get the last delta).
function core(session: DiagnosticSession, notes: DailyNote[]) {
  // ── Clarity ──────────────────────────────────────────────
  let clarity = session.status === "completed" ? 40 : 0;
  clarity += distinctDays(notes) * 4; // 꾸준함
  for (const n of notes) {
    if (clean(n.customerVoice)) clarity += 6; // 실제 증거 — 큰 가산
    if (clean(n.insight)) clarity += 3;
    if (clean(n.todayAction)) clarity += 2;
  }
  const m = computeMomentum(notes);
  clarity += m.returnCount * 3; // 다시 돌아온 힘
  clarity = Math.min(CLARITY_CAP, Math.round(clarity));

  // ── XP (meaningful actions + clarity-band bonus) ─────────
  let xp = 0;
  for (const n of notes) {
    xp += 10; // 기록 자체
    if (clean(n.customerVoice)) xp += 8; // 실제 증거
    if (clean(n.insight)) xp += 4;
    if (clean(n.todayAction)) xp += 4;
  }
  const bandsReached = CLARITY_BANDS.filter((b) => clarity >= b).length;
  xp += bandsReached * 15; // 선명도 마일스톤

  // ── Level from XP ────────────────────────────────────────
  let li = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) li = i;
  const cur = LEVELS[li];
  const nextMin = LEVELS[li + 1]?.min ?? cur.min + 150;
  const xpIntoLevel = xp - cur.min;
  const xpForLevel = nextMin - cur.min;

  return { clarity, xp, m, level: li + 1, cur, xpIntoLevel, xpForLevel };
}

function buildGains(notes: DailyNote[], returnCount: number): string[] {
  const gains: string[] = [];
  if (notes.some((n) => clean(n.customerVoice)))
    gains.push("고객의 말을 기록할수록 방향이 또렷해져요");
  if (returnCount > 0) gains.push("끊겨도 다시 돌아온 힘이 더해졌어요");
  if (gains.length < 2 && notes.length > 0)
    gains.push("작은 기록이 차곡차곡 쌓이고 있어요");
  if (gains.length === 0) gains.push("진단으로 첫 방향을 잡았어요");
  return gains.slice(0, 2);
}

export function computeProgress(
  session: DiagnosticSession,
  notes: DailyNote[],
): Progress {
  const now = core(session, notes);

  let lastGainXp: number | undefined;
  let lastGainClarity: number | undefined;
  if (notes.length > 0) {
    const prev = core(session, notes.slice(0, -1));
    lastGainXp = now.xp - prev.xp;
    lastGainClarity = now.clarity - prev.clarity;
  }

  return {
    clarity: now.clarity,
    clarityGains: buildGains(notes, now.m.returnCount),
    xp: now.xp,
    level: now.level,
    levelName: now.cur.name,
    levelEmoji: now.cur.emoji,
    xpIntoLevel: now.xpIntoLevel,
    xpForLevel: now.xpForLevel,
    streak: now.m.currentStreak,
    streakOngoing: now.m.streakOngoing,
    returnCount: now.m.returnCount,
    lastGainXp,
    lastGainClarity,
  };
}
