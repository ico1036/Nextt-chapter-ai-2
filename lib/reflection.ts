// ─────────────────────────────────────────────────────────────
// Deterministic reflections — always available, the source of truth.
// (lib/ai.ts can optionally rewrite these with Claude using the
//  product's Reflection prompts, but the app never depends on it.)
//
// Follows the spec's rules:
//  • acknowledge the small movement already made
//  • name one pattern from the note
//  • reflect mood lightly, never exaggerate
//  • propose ONE smaller next action (≤15 min, observe/ask/one-line)
//  • never guilt-trip a low-energy day
// ─────────────────────────────────────────────────────────────

import { microActionAt } from "./note";
import type {
  DailyNote,
  MoodTag,
  NoteReflection,
  WeeklyReflection,
} from "./types";

function clean(s?: string): string {
  return (s ?? "").trim().replace(/\s+/g, " ");
}
function clip(s: string, n = 34): string {
  return s.length <= n ? s : s.slice(0, n).trim() + "…";
}

// Per-mood opening + how to shape the next action.
const MOOD_RESPONSE: Record<
  MoodTag,
  { open: string; shrink: boolean }
> = {
  confident: {
    open: "오늘은 작은 자신감이 생긴 날이에요. 들뜨지 않고 이 결을 그대로 이어가면 돼요.",
    shrink: false,
  },
  hopeful: {
    open: "오늘은 가능성이 살짝 느껴진 날이에요. 그 감각을 한 걸음 더 선명하게 만들어볼까요.",
    shrink: false,
  },
  stuck_but_moved: {
    open: "막막함이 완전히 사라지진 않았어도, 오늘 당신은 그걸 안고 한 걸음 나갔어요. 그게 중요해요.",
    shrink: false,
  },
  anxious: {
    open: "불안한 마음은 자연스러운 거예요. 그럴수록 내일 할 일은 더 작게 잡는 게 좋아요.",
    shrink: true,
  },
  tired: {
    open: "오늘은 많이 하지 못한 날로 보여요. 그렇다고 흐름이 끊긴 건 아니에요. 지금 필요한 건 다시 크게가 아니라, 부담 없는 한 걸음이에요.",
    shrink: true,
  },
};

// ── Daily reflection ─────────────────────────────────────────
export function buildDailyReflection(note: DailyNote): NoteReflection {
  const action = clean(note.todayAction);
  const voice = clean(note.customerVoice);
  const insight = clean(note.insight);
  const next = clean(note.nextStep);
  const mood = note.moodTag;

  const lines: string[] = [];

  // 1) acknowledge the movement
  if (action) {
    lines.push(
      `오늘은 “${clip(action)}”을(를) 실제로 해봤어요. 생각만 한 게 아니라 움직였다는 게 핵심이에요.`,
    );
  } else if (mood === "tired") {
    lines.push(
      "오늘은 행동보다 마음을 들여다본 날이에요. 멈추지 않고 기록을 남긴 것 자체가 흐름이 살아 있다는 신호예요.",
    );
  } else {
    lines.push(
      "오늘 기록을 남긴 것 자체가 움직임이에요. 작게라도 자신을 놓치지 않았어요.",
    );
  }

  // 2) one pattern from voice/insight
  if (voice) {
    lines.push(
      `“${clip(voice)}” 같은 말은, 당신의 방향이 막연한 아이디어가 아니라 실제 문제와 닿아 있다는 신호예요.`,
    );
  } else if (insight) {
    lines.push(`“${clip(insight)}” — 이 발견이 다음 방향을 더 또렷하게 해줘요.`);
  }

  // 3) mood reflection (light)
  if (mood && MOOD_RESPONSE[mood]) {
    lines.push(MOOD_RESPONSE[mood].open);
  }

  const feedback = lines.slice(0, 3).join(" ");

  // 4) the smaller next action
  const shrink = mood ? MOOD_RESPONSE[mood]?.shrink : false;
  let nextAction: string;
  if (next && !shrink) {
    nextAction = `내일은 “${clip(next, 40)}”, 딱 이거 하나만 해도 충분해요.`;
  } else if (next && shrink) {
    nextAction = `내일은 “${clip(next, 40)}”를 절반 크기로 줄여보세요. 완성이 아니라 시작만 해도 돼요.`;
  } else if (voice) {
    nextAction = `오늘 들은 어려움을 한 문장으로 정리해보세요. 예: “${clip(voice, 30)}”.`;
  } else {
    nextAction = microActionAt(0);
  }

  return { feedback, nextAction };
}

// ── Weekly reflection ────────────────────────────────────────
const MOOD_FLOW_NOTE: Partial<Record<MoodTag, string>> = {
  anxious: "불안은 있었지만, 흐름은 끊기지 않았어요.",
  tired: "피곤함이 있었고, 그래서 더 작은 행동이 필요해 보여요.",
  hopeful: "작게나마 가능성이 느껴진 순간들이 있었어요.",
  confident: "작은 자신감이 조금씩 쌓인 한 주였어요.",
  stuck_but_moved: "막막함 속에서도 한 걸음씩 나간 한 주였어요.",
};

export function buildWeeklyReflection(
  notes: DailyNote[],
  direction?: string,
): WeeklyReflection {
  const recent = notes.slice(-7);
  const count = recent.length;

  const actions = recent.map((n) => clean(n.todayAction)).filter(Boolean);
  const voices = recent.map((n) => clean(n.customerVoice)).filter(Boolean);
  const insights = recent.map((n) => clean(n.insight)).filter(Boolean);
  const moods = recent.map((n) => n.moodTag).filter(Boolean) as MoodTag[];

  // dominant mood
  const moodCounts: Partial<Record<MoodTag, number>> = {};
  for (const m of moods) moodCounts[m] = (moodCounts[m] ?? 0) + 1;
  const dominantMood = (Object.entries(moodCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? undefined) as MoodTag | undefined;

  // flow line scales with engagement (spec: 4+ / 2-3 / 1 / 0)
  let flow: string;
  if (count >= 4) {
    flow =
      "이번 주는 작은 움직임이 반복되며 흐름이 생기기 시작한 주였어요. 아직 완성된 건 없어도, 막연한 아이디어가 실제 사람과 문제에 닿기 시작했어요.";
  } else if (count >= 2) {
    flow =
      "이번 주는 크게 나아갔다기보다, 흐름을 잃지 않고 붙잡고 있던 주에 가까워요. 작지만 반복이 있었다는 게 중요해요.";
  } else {
    flow =
      "이번 주는 다시 들어오기 위해 멈춰 선 주에 가까웠어요. 기록을 한 번이라도 남긴 건, 흐름이 아직 살아 있다는 신호예요.";
  }
  if (direction) {
    flow += ` (지금 향하는 방향: ${direction})`;
  }

  // movements (2-3)
  const movements: string[] = [];
  if (actions.length) {
    for (const a of actions.slice(0, 3)) movements.push(clip(a, 40));
  }
  if (movements.length < 2 && voices.length) {
    movements.push("사람들의 실제 어려움을 직접 들어봤어요.");
  }
  if (movements.length === 0) {
    movements.push("완전히 놓지 않고 기록을 남겼어요.");
    movements.push("지금 내 상태를 확인하려 잠시 멈춰본 시간이 있었어요.");
  }

  // patterns (1-2)
  const patterns: string[] = [];
  if (voices.length) {
    const uniq = Array.from(new Set(voices.map((v) => clip(v, 40))));
    for (const v of uniq.slice(0, 2)) patterns.push(v);
  }
  if (patterns.length === 0 && insights.length) {
    patterns.push(clip(insights[insights.length - 1], 44));
  }
  if (patterns.length === 0) {
    patterns.push(
      "에너지가 낮을 때는 생각이 커질수록 더 멈추게 될 가능성이 있어요.",
    );
  }

  const moodPattern =
    (dominantMood && MOOD_FLOW_NOTE[dominantMood]) ??
    "감정 기복은 있었지만, 다시 돌아오는 힘이 보였어요.";

  // keep / reduce (spec examples)
  const keepDoing = voices.length
    ? "사람들이 실제로 말하는 문제를 직접 듣는 것"
    : "아주 짧게라도 기록을 남기는 것";
  const reduce =
    count <= 1
      ? "한 번에 방향을 완성하려는 조급함"
      : "소개문이나 계획을 한 번에 끝내려는 압박";

  // smallest focus action
  let focusAction: string;
  if (voices.length) {
    focusAction =
      "이번 주에 가장 자주 나온 문제 1개를 “내가 도울 수 있는 가장 구체적인 상황”으로 한 줄 적어보세요.";
  } else if (count >= 2) {
    focusAction = "지인 1명에게 같은 질문을 한 번 더 해보세요.";
  } else {
    focusAction =
      "다음 주에는 도와주고 싶은 사람 한 유형만 적어보세요. 설명은 아직 없어도 괜찮아요.";
  }

  return {
    flow,
    movements: movements.slice(0, 3),
    patterns: patterns.slice(0, 2),
    moodPattern,
    keepDoing,
    reduce,
    focusAction,
    noteCount: count,
  };
}
